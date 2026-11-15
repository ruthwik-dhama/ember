# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Blue Team ("The Fire Marshal"): detector positions, vent shutdown timing, suppressant. Owner: Kartavya.

Objective: minimize Red's worst-case detection delay while keeping dust false alarms low.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, replace
from pathlib import Path

import numpy as np

from ..config import ROOM_M, Detector, DustEvent, SimConfig
from ..sim.engine import simulate
from .ghost_flame import ghost_flame_check, ghost_params
from .red_team import red_objective, run_red, to_cfg

SUPPRESSANTS = ["none", "co2", "he"]
N_DETECTORS = 2
DUST_FALSE_ALARM_PENALTY = 100.0  # s-equivalent added when a dust-only puff trips an alarm
DUEL_CACHE = Path(__file__).parent / "cache"
_LO = np.array([0.0, 0.0, 0.0] * N_DETECTORS + [0.0, -0.49])
_HI = np.array(list(ROOM_M) * N_DETECTORS + [120.0, len(SUPPRESSANTS) - 0.51])


def default_cfg(base_cfg: SimConfig) -> SimConfig:
    """Round-1 layout: one ceiling detector at the room centre, so Blue has something to beat."""
    if base_cfg.detectors:
        return base_cfg
    return replace(base_cfg, detectors=[Detector("ceil", ROOM_M[0] / 2, ROOM_M[1] / 2, ROOM_M[2] - 0.1)])


def apply_blue(cfg: SimConfig, x) -> SimConfig:
    x = np.clip(x, _LO, _HI)
    dets = [Detector(f"b{i}", *map(float, x[3 * i:3 * i + 3]), kind="two_moment") for i in range(N_DETECTORS)]
    return replace(cfg, detectors=dets, vent_off_at_s=float(x[-2]), suppressant=SUPPRESSANTS[int(round(x[-1]))])


def _score(cfg: SimConfig) -> float:
    """Lower is better: Red's detection delay (or undetected tiebreak) + dust false-alarm penalty."""
    s = red_objective(simulate(cfg, frames=False))
    dust_only = replace(cfg, fires=[], dust=[DustEvent(t_s=5.0, mass_mg=50.0)])
    return s + (DUST_FALSE_ALARM_PENALTY if simulate(dust_only, frames=False)["detected"] else 0.0)


def run_blue(red_worst: dict, base_cfg: SimConfig, budget: int, seed: int) -> dict:
    """CMA-ES over detector positions, vent shutoff time, suppressant against Red's worst scenario."""
    import cma

    red_cfg = to_cfg(base_cfg, red_worst["scenario"])
    centre = [ROOM_M[0] / 2, ROOM_M[1] / 2, ROOM_M[2] - 0.1] * N_DETECTORS + [60.0, 1.0]
    es = cma.CMAEvolutionStrategy(centre, 0.3, {"seed": seed, "maxfevals": budget, "popsize": 6, "verbose": -9,
                                                "bounds": [_LO.tolist(), _HI.tolist()],
                                                "CMA_stds": list(_HI - _LO)})
    best_x, best = None, float("inf")
    while not es.stop():
        xs = es.ask()
        scores = [_score(apply_blue(red_cfg, x)) for x in xs]
        for x, s in zip(xs, scores):
            if s < best:
                best_x, best = x, s
        es.tell(xs, scores)
    cfg = apply_blue(red_cfg, best_x)
    return {"cfg": cfg, "score": best, "detectors": [asdict(d) for d in cfg.detectors],
            "vent_off_at_s": cfg.vent_off_at_s, "suppressant": cfg.suppressant}


def _plain(obj):
    """JSON round-trip so numpy scalars and dataclasses become plain data."""
    return json.loads(json.dumps(obj, default=lambda o: asdict(o) if hasattr(o, "__dataclass_fields__") else float(o)))


def run_duel(base_cfg: SimConfig, rounds: int, seed: int, red_budget: int = 60, blue_budget: int = 60) -> dict:
    """Red -> simulate -> Blue -> simulate -> Envelope Guard / Ghost Flame -> score, per round.

    Each round Red attacks the layout Blue left behind. Only the last round carries voxel frames.
    Witness citations are attached by Sibi's /api/ask path, not here.
    """
    from ..envelope.guard import EnvelopeGuard

    # Deterministic id = precomputed duel: the same inputs return the cached run (report/API call this often).
    run_id = hashlib.sha1(json.dumps([asdict(base_cfg), rounds, seed, red_budget, blue_budget],
                                     sort_keys=True).encode()).hexdigest()[:12]
    try:
        return load_duel(run_id)
    except KeyError:
        pass
    guard = EnvelopeGuard()
    cfg = default_cfg(base_cfg)
    out = []
    for n in range(rounds):
        red = run_red(cfg, red_budget, seed + n)
        before = red["worst"]["result"]
        blue = run_blue(red["worst"], cfg, blue_budget, seed + n)
        after = simulate(blue["cfg"], frames=(n == rounds - 1))
        fire = blue["cfg"].fires[0]
        ghost = (ghost_flame_check(fire, after["conditions"], ghost_params()) if blue["cfg"].suppressant != "none"
                 else {"applicable": False, "note": "no suppressant released"})
        out.append(_plain({"round": n + 1, "red": {"top": [{k: v for k, v in t.items() if k != "result"} for t in red["top"]],
                                                   "worst": {k: v for k, v in red["worst"].items() if k != "result"}},
                           "before": {k: v for k, v in before.items() if k != "frames"},
                           "blue": {k: v for k, v in blue.items() if k != "cfg"},
                           "after": after, "ghost": ghost, "envelope": guard.check(after["conditions"])}))
        cfg = replace(blue["cfg"], fires=[])  # next round Red searches against Blue's layout
    last = out[-1]
    badge = last["envelope"]["badge"]
    run = {"run_id": run_id, "rounds": out,
           # Consumed by report/build_report. Every number carries the Envelope Guard badge.
           "top_risks": [{"why": t["why"], "scenario": t["scenario"], "badge": badge} for t in last["red"]["top"]],
           "recommended_fixes": [{"text": f"Round {r['round']}: {len(r['blue']['detectors'])} two-moment detectors, "
                                          f"vents off at {r['blue']['vent_off_at_s']:.0f} s, suppressant "
                                          f"{r['blue']['suppressant']}: worst-case delay "
                                          f"{r['before']['delay_s'] or 'never detected'} -> "
                                          f"{r['after']['delay_s'] or 'never detected'} s",
                                  "badge": r["envelope"]["badge"], "ghost_flame": r["ghost"]} for r in out]}
    save_duel(run)
    return run


def save_duel(run: dict) -> None:
    DUEL_CACHE.mkdir(parents=True, exist_ok=True)
    (DUEL_CACHE / f"duel_{run['run_id']}.json").write_text(json.dumps(run))


def load_duel(run_id: str) -> dict:
    if not run_id.isalnum():  # run_id comes from the URL; never let it build a path
        raise KeyError(run_id)
    try:
        return json.loads((DUEL_CACHE / f"duel_{run_id}.json").read_text())
    except OSError:
        raise KeyError(run_id)
