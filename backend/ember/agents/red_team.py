# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Red Team ("The Arsonist"): finds the hardest-to-detect, most harmful fire. Owner: Kartavya."""
from __future__ import annotations

import json
import os
from dataclasses import replace
from pathlib import Path
from typing import List, Optional

import numpy as np

from ..config import ROOM_M, FireSpec, SimConfig
from ..sim.engine import simulate
from ..sim.materials import PHASES

T_MAX = 300.0
LLM_MODEL = "claude-sonnet-5-5"
SEED_CACHE = Path(__file__).parent / "cache" / "red_seeds.json"
MATERIALS = sorted(PHASES)
# Fallback seeds (offline mode, no cache): corners/floor fires are the classic hard-to-detect spots.
FALLBACK_SEEDS = [
    {"material": "cotton", "x": 0.5, "y": 0.5, "z": 0.2},
    {"material": "pmma", "x": 5.5, "y": 3.5, "z": 0.3},
    {"material": "n-heptane", "x": 3.0, "y": 2.0, "z": 0.1, "droplet_d_mm": 3.0},
]


def red_objective(result: dict) -> float:
    """Higher = worse fire. Undetected fires get a tiebreak so search still has a gradient."""
    if result["detected"]:
        return result["delay_s"]
    return T_MAX + 0.01 * result["fire_area_cm2"] + 0.001 * result["smoke_escaped"]


def validate_scenario(scenario: dict, room=ROOM_M) -> bool:
    """Material exists in sim/materials.py, coordinates inside the room, fuel phase matches material."""
    try:
        m = scenario["material"]
        if m not in PHASES:
            return False
        if scenario.get("phase", PHASES[m]) != PHASES[m]:
            return False
        if not all(0.0 <= float(scenario[k]) <= L for k, L in zip("xyz", room)):
            return False
        d = scenario.get("droplet_d_mm")
        return PHASES[m] != "liquid" or (d is not None and float(d) > 0)
    except (KeyError, TypeError, ValueError):
        return False


def _fire(s: dict) -> FireSpec:
    return FireSpec(material=s["material"], phase=PHASES[s["material"]], x=float(s["x"]), y=float(s["y"]),
                    z=float(s["z"]), t_ignite_s=float(s.get("t_ignite_s", 0.0)),
                    droplet_d_mm=float(s["droplet_d_mm"]) if PHASES[s["material"]] == "liquid" else None)


def to_cfg(base_cfg: SimConfig, scenario: dict) -> SimConfig:
    return replace(base_cfg, fires=[_fire(scenario)])


# Search vector: [x, y, z, material index, droplet_d_mm, t_ignite_s], bounds below.
_LO = np.array([0.0, 0.0, 0.0, -0.49, 1.5, 0.0])
_HI = np.array([ROOM_M[0], ROOM_M[1], ROOM_M[2], len(MATERIALS) - 0.51, 5.0, 30.0])


def encode(s: dict) -> np.ndarray:
    return np.array([s["x"], s["y"], s["z"], MATERIALS.index(s["material"]), s.get("droplet_d_mm", 3.0),
                     s.get("t_ignite_s", 0.0)], dtype=float)


def decode(x) -> dict:
    x = np.clip(x, _LO, _HI)
    return {"material": MATERIALS[int(round(x[3]))], "x": float(x[0]), "y": float(x[1]), "z": float(x[2]),
            "droplet_d_mm": float(x[4]), "t_ignite_s": float(x[5])}


def seed_scenarios(base_cfg: SimConfig, cache_path: Optional[Path] = None) -> List[dict]:
    """LLM seeds, cached. Offline (no key / API error) -> cache file -> hand-written fallbacks."""
    cache_path = Path(cache_path or SEED_CACHE)
    key = f"o2={base_cfg.o2_frac:.2f};g={base_cfg.g:.3f}"
    try:
        cache = json.loads(cache_path.read_text())
    except (OSError, ValueError):
        cache = {}
    seeds = cache.get(key)
    if seeds is None and os.environ.get("ANTHROPIC_API_KEY"):
        try:
            import anthropic
            msg = anthropic.Anthropic().messages.create(
                model=LLM_MODEL, max_tokens=1000,
                messages=[{"role": "user", "content": (
                    f"Habitat {ROOM_M[0]}x{ROOM_M[1]}x{ROOM_M[2]} m (x,y,z; z up), O2 {base_cfg.o2_frac:.0%}, "
                    f"gravity {base_cfg.g} g. Propose 5 fire scenarios hardest for smoke detectors to catch. "
                    f"Reply with ONLY a JSON list of objects: material (one of {MATERIALS}), x, y, z in metres, "
                    "droplet_d_mm (liquid fuels only, 1.5-5).")}])
            seeds = json.loads(msg.content[0].text)
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            cache[key] = seeds
            cache_path.write_text(json.dumps(cache, indent=1))
        except Exception:  # offline mode must never break the duel
            seeds = None
    return [s for s in (seeds or []) if isinstance(s, dict) and validate_scenario(s)] or FALLBACK_SEEDS


def why_dangerous(scenario: dict, result: dict, cfg: SimConfig) -> str:
    where = "high" if scenario["z"] > 1.5 else "low" if scenario["z"] < 0.8 else "mid-height"
    outcome = (f"detected only after {result['delay_s']:.0f} s" if result["detected"]
               else f"never detected in {cfg.t_max_s:.0f} s")
    return (f"{scenario['material']} fire at ({scenario['x']:.1f}, {scenario['y']:.1f}, {scenario['z']:.1f}) m, "
            f"{where} in the room at {cfg.o2_frac:.0%} O2 and {cfg.g} g: {outcome}.")


def run_red(base_cfg: SimConfig, budget: int, seed: int, llm_cache=None, top_k: int = 5) -> dict:
    """LLM seeds (cached) -> CMA-ES over scenarios maximizing red_objective(simulate(cfg, frames=False)).

    Returns {"worst": {...}, "top": [...], "evals": n_simulations} where each entry is {scenario, score, result, why}.
    """
    import cma

    seeds = seed_scenarios(base_cfg, llm_cache)
    seen = []  # (score, scenario, result)

    def evaluate(s: dict) -> float:
        r = simulate(to_cfg(base_cfg, s), frames=False)
        score = red_objective(r)
        seen.append((score, s, r))
        return score

    # Material is categorical, so try every one at both ends of the room (vent flow carries smoke toward the
    # return wall, so upstream and downstream fires behave very differently), then refine the best seed's
    # position/size with CMA-ES. Squeezing a categorical into a continuous axis stalled the search.
    seeds = seeds + [{"material": m, "x": x, "y": y, "z": z, "droplet_d_mm": 3.0}
                     for m in MATERIALS for x, y, z in ((0.5, 0.5, 0.2), (ROOM_M[0] - 0.5, ROOM_M[1] - 0.5, 0.3))]
    seeds = seeds[:max(1, budget // 4)]
    best_seed = max(seeds, key=evaluate)
    es = cma.CMAEvolutionStrategy(encode(best_seed), 0.3, {"seed": seed, "maxfevals": max(budget - len(seeds), 1),
                                                           "bounds": [_LO.tolist(), _HI.tolist()],
                                                           "CMA_stds": [*(_HI - _LO)[:3], 0.02, *(_HI - _LO)[4:]],  # axes differ in units; material stays put
                                                           "popsize": 6, "verbose": -9})
    while not es.stop():
        xs = es.ask()
        es.tell(xs, [-evaluate(decode(x)) for x in xs])

    ranked, picked = [], set()
    for score, s, r in sorted(seen, key=lambda t: -t[0]):
        k = (s["material"], round(s["x"], 1), round(s["y"], 1), round(s["z"], 1))
        if k in picked:
            continue
        picked.add(k)
        ranked.append({"scenario": s, "score": score, "result": r, "why": why_dangerous(s, r, base_cfg)})
        if len(ranked) == top_k:
            break
    return {"worst": ranked[0], "top": ranked, "evals": len(seen)}


def fixed_red(cfg: SimConfig, top_k: int = 5) -> dict:
    """Red's role when the request already names the fire (e.g. the liquid-fuel Ghost Flame demo): no search."""
    f = cfg.fires[0]
    s = {"material": f.material, "x": f.x, "y": f.y, "z": f.z, "t_ignite_s": f.t_ignite_s}
    if f.droplet_d_mm:
        s["droplet_d_mm"] = f.droplet_d_mm
    r = simulate(cfg, frames=False)
    entry = {"scenario": s, "score": red_objective(r), "result": r, "why": why_dangerous(s, r, cfg)}
    return {"worst": entry, "top": [entry]}
