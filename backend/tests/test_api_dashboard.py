# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""GET /api/mission for the Mission setup screen. Owner: Kishan's api.py (added by Sibi with his OK).

Setup: TestClient against the real app; the mission is restored after each test.
"""
from fastapi.testclient import TestClient

from ember.api import app, state
from ember.sim.materials import PHASES


def test_get_mission_returns_current_mission_and_materials():
    saved = state["mission"]
    try:
        c = TestClient(app)
        c.post("/api/mission", json={"habitat": "iss", "g": 0.0, "o2_frac": 0.21, "pressure_kpa": 101.3})
        body = c.get("/api/mission").json()
        assert body["mission"]["habitat"] == "iss" and body["mission"]["g"] == 0.0
        assert body["materials"] == PHASES
    finally:
        state["mission"] = saved
