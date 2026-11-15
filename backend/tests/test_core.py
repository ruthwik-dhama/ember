# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Core tests. Each test states its setup. If real data contradicts one, that's a finding to discuss, not a bug to hide.

Contract tests run now. Behaviour tests switch on automatically when sim/engine.py sets IS_STUB = False.
"""
from dataclasses import replace

import pytest
from fastapi.testclient import TestClient

from ember.agents.ghost_flame import ghost_flame_check
from ember.agents.red_team import T_MAX, red_objective
from ember.api import app
from ember.config import Detector, DustEvent, FireSpec, SimConfig
from ember.sim import engine
from ember.sim.engine import RESULT_KEYS, simulate
from ember.sim.flame import buoyant_velocity, effective_flow

needs_engine = pytest.mark.skipif(engine.IS_STUB, reason="enable when the physics engine lands (Ruthwik)")


def fire(material="cotton", phase="solid", **kw):
    return FireSpec(material=material, phase=phase, x=3.0, y=2.0, z=0.5, **kw)


def ceiling_det(kind="single"):
    return Detector(id="ceil", x=3.0, y=2.0, z=2.4, kind=kind)


# ---- contract tests (run now) ----------------------------------------------
def test_config_defaults_are_moon_base():
    c = SimConfig()
    assert (c.o2_frac, c.pressure_kpa, c.g) == (0.30, 70.3, 0.165)


def test_simulate_returns_contract_keys():
    r = simulate(SimConfig(fires=[fire()], detectors=[ceiling_det()]))
    assert set(RESULT_KEYS) <= set(r)
    assert set(r["conditions"]) == {"o2_frac", "pressure_kpa", "flow_cm_s", "g"}
    assert all(len(v) == 5 for fr in r["frames"] for v in fr["voxels"])


def test_no_fire_is_not_detected():
    r = simulate(SimConfig(detectors=[ceiling_det()]))
    assert r["detected"] is False and r["delay_s"] is None


def test_api_health_and_simulate():
    c = TestClient(app)
    assert c.get("/api/health").json()["ok"]
    body = {"fires": [{"material": "cotton", "phase": "solid", "x": 3, "y": 2, "z": 0.5}],
            "detectors": [{"id": "d1", "x": 3, "y": 2, "z": 2.4}]}
    r = c.post("/api/simulate", json=body).json()
    assert set(RESULT_KEYS) <= set(r) and r["envelope"]["badge"] in ("green", "yellow", "red")


def test_api_rank_and_report_return_data():
    c = TestClient(app)

    ranked = c.get("/api/rank").json()
    assert ranked and all({"id", "score", "why"} <= set(row) for row in ranked)
    assert ranked == sorted(ranked, key=lambda row: row["score"], reverse=True)

    filtered = c.get("/api/rank", params={"pillar": "suppression"}).json()
    assert filtered and all("suppression" in row["why"] for row in filtered)
    assert len(filtered) < len(ranked)

    report = c.get("/api/report").json()
    assert report["top_investigations"] == ranked
    for section in ("top_risks", "recommended_fixes"):  # duel agents are built: lists of badged items
        assert report[section] and all(item["badge"] in ("green", "yellow", "red") for item in report[section])
    assert set(report["data_gaps"]) >= {"cells", "counts", "o2_values", "flow_values"}
    assert report["earth_applications"]


def test_gravity_scaling():
    assert buoyant_velocity(0.0, 1.0) == 0.0
    assert buoyant_velocity(0.165, 1.0) == pytest.approx(0.548, abs=0.005)
    assert buoyant_velocity(0.38, 1.0) == pytest.approx(0.724, abs=0.005)
    assert effective_flow(3.0, 0.0, 1.0) == pytest.approx(3.0)


def test_red_objective_tiebreak_for_undetected():
    small = {"detected": False, "fire_area_cm2": 10.0, "smoke_escaped": 0.0}
    big = {"detected": False, "fire_area_cm2": 500.0, "smoke_escaped": 0.0}
    assert T_MAX < red_objective(small) < red_objective(big)


def test_ghost_flame_not_applicable_to_solids():
    assert ghost_flame_check(fire("cotton"), {}, {})["applicable"] is False


# ---- behaviour tests (need the real engine) --------------------------------
@needs_engine
def test_more_oxygen_spreads_faster():
    base = SimConfig(o2_frac=0.21, g=0.0, fires=[fire()], detectors=[ceiling_det()])
    rich = replace(base, o2_frac=0.30)
    assert simulate(rich)["fire_area_cm2"] > simulate(base)["fire_area_cm2"]


@needs_engine
def test_lower_g_detects_later_with_ceiling_detector_and_vents_off():
    # Setup matters: with strong vent flow and a detector at the return, 0 g can detect sooner.
    cfg = SimConfig(vent_on=False, fires=[fire()], detectors=[ceiling_det()])
    assert simulate(replace(cfg, g=0.165))["delay_s"] > simulate(replace(cfg, g=1.0))["delay_s"]


@needs_engine
def test_two_moment_rejects_dust():
    cfg = SimConfig(dust=[DustEvent(t_s=5, mass_mg=50)], detectors=[Detector("d1", 1, 1, 2, kind="two_moment")])
    assert simulate(cfg)["detected"] is False


@needs_engine
def test_single_detector_false_alarms_on_dust_near_airlock():
    # Setup: dust-only puff, detector 0.5 m downstream of the airlock. Single can't tell dust from smoke.
    cfg = SimConfig(dust=[DustEvent(t_s=5, mass_mg=50)], detectors=[Detector("d1", 1.0, 2.0, 1.0)])
    assert simulate(cfg, frames=False)["detected"] is True
    cfg.detectors[0].kind = "two_moment"
    assert simulate(cfg, frames=False)["detected"] is False


@needs_engine
def test_gravity_sweep_order_vents_off_ceiling_detector():
    # Setup: vents off, ceiling detector straight above a cotton fire. Partial-g values are interpolated (yellow).
    from ember.sim.sweeps import gravity_sweep
    s = gravity_sweep(SimConfig(vent_on=False, fires=[fire()], detectors=[ceiling_det()]))
    assert s["earth"]["delay_s"] < s["mars"]["delay_s"] < s["moon"]["delay_s"]
    assert s["moon"]["partial_g"] and not s["earth"]["partial_g"]


def test_flex_limits_are_per_fuel_and_droplet_scale():
    # FLEX (Dietrich et al. 2014): CO2 LOI 0.17 heptane, 0.14 methanol; solids fall back to the generic value.
    from ember.sim.suppression import extinguished, limiting_o2
    assert limiting_o2("co2", "n-heptane") == 0.17 and limiting_o2("co2", "methanol") == 0.14
    assert extinguished(0.16, "co2", "n-heptane") and not extinguished(0.18, "co2", "n-heptane")
    assert not extinguished(0.10, "none", "n-heptane")


def test_ghost_flame_params_feed_the_auditor():
    from ember.sim.suppression import ghost_flame_params
    p = ghost_flame_params()
    big = fire("n-heptane", "liquid", droplet_d_mm=3.0)
    small = fire("n-heptane", "liquid", droplet_d_mm=1.5)
    cond = {"o2_frac": 0.21, "pressure_kpa": 101.3}
    assert ghost_flame_check(big, cond, p)["false_all_clear"] is True
    assert ghost_flame_check(small, cond, p)["false_all_clear"] is False


def test_no_flame_spread_below_bass_ii_cutoff():
    # BASS-II: no spread below 0.6 cm/s in microgravity.
    from ember.data_io import cal
    from ember.sim.engine import _p_flame
    from ember.sim.flame import spread_rate
    assert spread_rate(1.0, 0.21, 0.5, _p_flame()) == 0.0
    assert spread_rate(1.0, 0.21, cal("flame.u_ext") + 1.0, _p_flame()) > 0.0
