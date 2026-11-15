# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Red/Blue/Ghost Flame tests. Tiny budgets keep these fast; LLM is off (no key -> fallback seeds)."""
import pytest

from ember.agents.blue_team import load_duel, run_duel
from ember.agents.ghost_flame import ghost_flame_check, ghost_params
from ember.agents.red_team import run_red, to_cfg, validate_scenario
from ember.config import Detector, FireSpec, SimConfig


@pytest.fixture(autouse=True)
def offline(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)


def test_validate_scenario():
    ok = {"material": "cotton", "x": 1, "y": 1, "z": 1}
    assert validate_scenario(ok)
    assert not validate_scenario({**ok, "material": "unobtainium"})
    assert not validate_scenario({**ok, "z": 9})
    assert not validate_scenario({**ok, "phase": "liquid"})
    assert not validate_scenario({"material": "n-heptane", "x": 1, "y": 1, "z": 1})  # liquid needs a droplet size


def test_run_red_returns_valid_worst_scenario():
    cfg = SimConfig(detectors=[Detector("c", 3, 2, 2.4)])
    red = run_red(cfg, budget=30, seed=1)
    assert validate_scenario(red["worst"]["scenario"]) and red["worst"]["why"]
    assert red["top"][0]["score"] >= red["top"][-1]["score"]


def test_ghost_flame_liquid_in_regime_vs_small_droplet():
    fire = FireSpec("n-heptane", "liquid", 1, 1, 0.1, droplet_d_mm=3.0)
    cond = {"o2_frac": 0.21, "pressure_kpa": 101.3}  # inside the FLEX cool-flame envelope
    assert ghost_flame_check(fire, cond, ghost_params())["false_all_clear"] is True
    fire.droplet_d_mm = 1.5
    assert ghost_flame_check(fire, cond, ghost_params())["false_all_clear"] is False
    fire.droplet_d_mm = 3.0  # Moon base 30% O2 is outside the tested cool-flame range: not claimed
    assert ghost_flame_check(fire, {**cond, "o2_frac": 0.30}, ghost_params())["false_all_clear"] is False


def test_duel_shape_and_cache_roundtrip():
    run = run_duel(SimConfig(), rounds=1, seed=3, red_budget=20, blue_budget=20)
    r = run["rounds"][0]
    assert {"red", "before", "blue", "after", "ghost", "envelope"} <= set(r)
    assert r["after"]["frames"] is not None
    assert load_duel(run["run_id"])["run_id"] == run["run_id"]
    with pytest.raises(KeyError):
        load_duel("../etc")


def test_api_duel_run_and_fetch():
    from fastapi.testclient import TestClient
    from ember.api import app
    c = TestClient(app)
    run = c.post("/api/duel/run", json={}).json()
    assert run["rounds"] and c.get(f"/api/duel/{run['run_id']}").json()["run_id"] == run["run_id"]
    assert c.get("/api/duel/nope").status_code == 404


def test_liquid_fuel_duel_reports_ghost_flame_false_all_clear():
    # Setup: named heptane fire (3 mm droplet) at 21% O2 / 101.3 kPa, inside FLEX's cool-flame range, CO2 kept.
    from ember.config import FireSpec
    cfg = SimConfig(o2_frac=0.21, pressure_kpa=101.3, suppressant="co2",
                    fires=[FireSpec("n-heptane", "liquid", 3.0, 2.0, 0.1, droplet_d_mm=3.0)])
    r = run_duel(cfg, rounds=1, seed=0, blue_budget=20)["rounds"][0]
    assert r["red"]["worst"]["scenario"]["material"] == "n-heptane" and r["blue"]["suppressant"] == "co2"
    assert r["ghost"]["applicable"] and r["ghost"]["false_all_clear"] and r["ghost"]["citation"]
