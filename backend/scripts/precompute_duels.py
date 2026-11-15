# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Precompute every Red/Blue duel the demo can trigger, so a fresh clone runs the demo instantly.

Run from backend/:  EMBER_OFFLINE=1 python -m scripts.precompute_duels
Goes through the real API (TestClient), so cache keys match exactly what the screens request:
- Habitat screen "Run duel" at each gravity preset          -> POST /api/duel/run {g}
- Habitat screen "Liquid-fuel demo (Ghost Flame)" per preset -> POST /api/duel/run {g, ...LIQUID_DEMO}
- Insights report for each Mission setup preset               -> POST /api/mission, GET /api/report
Results land in ember/agents/cache/duel_<run_id>.json (committed for the demo; see .gitignore).
Keep LIQUID_DEMO and MISSION_PRESETS in sync with AgentsPanel.jsx and MissionSetup.jsx.
"""
from __future__ import annotations

import time

from fastapi.testclient import TestClient

from ember.api import app, state

GRAVITY = {"iss": 0.0, "moon": 0.165, "mars": 0.38, "earth": 1.0}  # HabitatScreen.jsx
LIQUID_DEMO = {"o2_frac": 0.21, "pressure_kpa": 101.3, "suppressant": "co2",  # AgentsPanel.jsx
               "fires": [{"material": "n-heptane", "phase": "liquid", "x": 3, "y": 2, "z": 0.1, "droplet_d_mm": 3.0}]}
MISSION_PRESETS = {  # MissionSetup.jsx (spacecraft = iss and rover = moon_base give the same duel)
    "iss": {"g": 0.0, "o2_frac": 0.21, "pressure_kpa": 101.3},
    "moon_base": {"g": 0.165, "o2_frac": 0.3, "pressure_kpa": 70.3},
    "mars_base": {"g": 0.38, "o2_frac": 0.3, "pressure_kpa": 70.3},
}


def main():
    c = TestClient(app)
    saved = state["mission"]
    jobs = [(f"duel {name}", "post", "/api/duel/run", {"g": g}) for name, g in GRAVITY.items()]
    jobs += [(f"ghost-flame demo {name}", "post", "/api/duel/run", {"g": g, **LIQUID_DEMO}) for name, g in GRAVITY.items()]
    try:
        for label, method, path, body in jobs:
            t = time.time()
            r = c.post(path, json=body)
            r.raise_for_status()
            print(f"{label:28s} {time.time() - t:6.1f}s  run_id={r.json()['run_id']}", flush=True)
        for habitat, preset in MISSION_PRESETS.items():
            c.post("/api/mission", json={"habitat": habitat, **preset}).raise_for_status()
            t = time.time()
            c.get("/api/report").raise_for_status()
            print(f"report {habitat:21s} {time.time() - t:6.1f}s", flush=True)
    finally:
        state["mission"] = saved


if __name__ == "__main__":
    main()
