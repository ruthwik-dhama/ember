# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Red vs random search, for deck_numbers.json (Kishan's metrics.py calls red_vs_random). Owner: Kartavya.

Fairness: for each seed, random search gets exactly as many simulations as Red used (run_red reports "evals"),
and both are scored with red_objective (higher = worse fire). Headline = median over seeds.
"""
from __future__ import annotations

import statistics
from typing import Sequence

import numpy as np

from ..config import SimConfig
from ..sim.engine import simulate
from .red_team import _HI, _LO, decode, red_objective, run_red, to_cfg


def random_search(base_cfg: SimConfig, evals: int, seed: int) -> float:
    rng = np.random.default_rng(seed)
    return max(red_objective(simulate(to_cfg(base_cfg, decode(rng.uniform(_LO, _HI))), frames=False))
               for _ in range(evals))


def red_vs_random(base_cfg: SimConfig, budget: int = 60, seeds: Sequence[int] = range(5)) -> dict:
    red, rand = [], []
    for sd in seeds:
        r = run_red(base_cfg, budget, sd)
        red.append(r["worst"]["score"])
        rand.append(random_search(base_cfg, r["evals"], sd))
    return {"red_median": statistics.median(red), "random_median": statistics.median(rand),
            "red_scores": red, "random_scores": rand, "budget": budget, "seeds": list(seeds),
            "red_wins": sum(a > b + 0.5 for a, b in zip(red, rand))}
