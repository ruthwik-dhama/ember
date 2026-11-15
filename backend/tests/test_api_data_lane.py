# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""API tests for the data lane routes (/api/ask, /api/gap_map). Owner: Sibi.

Setup: offline witnesses (no API key, cache redirected to a temp file); default Moon base mission unless a
test posts its own.
"""
import pytest
from fastapi.testclient import TestClient

from ember.agents import witness as W
from ember.api import app, state
from ember.config import Mission


@pytest.fixture
def client(monkeypatch, tmp_path):
    monkeypatch.setenv("EMBER_OFFLINE", "1")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setattr(W, "CACHE_PATH", tmp_path / "witness.json")
    saved = state["mission"]
    yield TestClient(app)
    state["mission"] = saved


def test_ask_returns_cited_answers(client):
    r = client.post("/api/ask", json={"question": "How clean is the ISS cabin air?"})
    assert r.status_code == 200
    body = r.json()
    top = body["answers"][0]
    assert top["witness"] == "DAFT"
    assert top["citations"] and all(c["source"] for c in top["citations"])
    assert "[1]" in top["answer"]


def test_ask_off_topic_returns_note_not_answer(client):
    body = client.post("/api/ask", json={"question": "What is the best pizza topping?"}).json()
    assert body["answers"] == [] and body["note"]


def test_gap_map_grid_follows_mission(client):
    gm = client.get("/api/gap_map").json()
    n = len(gm["o2_values"])
    assert len(gm["cells"]) == n and all(len(row) == len(gm["flow_values"]) for row in gm["cells"])
    assert gm["g"] == pytest.approx(Mission().g)
    assert sum(gm["counts"].values()) == n * len(gm["flow_values"])

    client.post("/api/mission", json={"habitat": "iss", "g": 0.0, "o2_frac": 0.21, "pressure_kpa": 101.3})
    iss = client.get("/api/gap_map").json()
    assert iss["g"] == 0.0 and iss["pressure_kpa"] == pytest.approx(101.3)
    assert iss["counts"]["green"] > 0  # ISS conditions sit on real SAME tested rows
