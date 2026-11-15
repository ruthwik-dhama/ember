# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""FastAPI app + orchestrator. Owner: Kishan. Run from backend/: uvicorn ember.api:app --reload --port 8000

Routes that aren't built yet return HTTP 501 naming the lane that owns them.
"""
from __future__ import annotations

from dataclasses import asdict
from typing import Optional

from fastapi import FastAPI, HTTPException

from .agents.witness import ask_ember
from .config import GRAVITY_PRESETS, ROOM_M, Mission, SimConfig
from .data_io import load_investigations
from .envelope.guard import EnvelopeGuard
from .rank import compare, rank
from .report import build_report
from .sim.engine import simulate

app = FastAPI(title="EMBER")
guard = EnvelopeGuard()
state = {"mission": Mission()}


def todo(lane: str):
    raise HTTPException(status_code=501, detail=f"not built yet ({lane})")


@app.get("/api/health")
def health():
    return {"ok": True, "room_m": ROOM_M, "gravity_presets": GRAVITY_PRESETS}


@app.post("/api/mission")
def api_mission(m: Mission):
    state["mission"] = m
    return asdict(m)


@app.get("/api/investigations")
def api_investigations():
    return load_investigations()


@app.get("/api/investigations/{inv_id}")
def api_investigation(inv_id: str):
    for inv in load_investigations():
        if inv["id"] == inv_id:
            return inv
    raise HTTPException(status_code=404, detail=f"unknown investigation {inv_id}")


@app.get("/api/compare")
def api_compare(a: str, b: str):
    return compare(api_investigation(a), api_investigation(b))


@app.get("/api/rank")
def api_rank(pillar: Optional[str] = None):
    return rank(state["mission"], load_investigations(), guard, pillar)


@app.post("/api/simulate")
def api_simulate(cfg: SimConfig):
    result = simulate(cfg)
    result["envelope"] = guard.check(result["conditions"])
    return result


@app.post("/api/duel/run")
def api_duel_run(cfg: SimConfig):
    todo("Kartavya: agents/blue_team.run_duel")


@app.get("/api/duel/{run_id}")
def api_duel(run_id: str):
    todo("Kishan + Kartavya")


@app.post("/api/ask")
def api_ask(body: dict):
    return ask_ember(body["question"])


@app.get("/api/gap_map")
def api_gap_map():
    m = state["mission"]
    return guard.gap_map(m.pressure_kpa, m.g)


@app.get("/api/report")
def api_report():
    return build_report(state["mission"])
