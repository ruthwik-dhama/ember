# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Writes deck_numbers.json (repo root). Owner: Kishan. Run from backend/: python -m scripts.metrics

No number goes on a slide unless it comes from this file. Every entry: {value, badge, calibration_status}.
Each metric's badge comes from the Envelope Guard on the conditions it was computed at (partial-g rows get
yellow by the guard's own rule); calibration_status is pulled from data/calibration.csv where one constant
dominates the metric, else a reasoned default ("fitted" for reduced-order-physics outputs, "measured" for
direct empirical results like the witness eval or a plain tally).
"""
from __future__ import annotations

import json
import statistics
from pathlib import Path

import numpy as np

from ember.agents.blue_team import default_cfg, run_duel
from ember.agents.compare import red_vs_random
from ember.agents.ghost_flame import ghost_flame_check, ghost_params
from ember.config import FireSpec, Mission, SimConfig
from ember.data_io import load_calibration
from ember.envelope.guard import EnvelopeGuard
from ember.envelope.metrics import deck_metrics
from ember.sim.metrics import physics_metrics

OUT = Path(__file__).resolve().parents[2] / "deck_numbers.json"

SEEDS = [1, 2, 3, 4, 5]              # "5+ seeds" fairness rule. Not 0: cma treats seed=0 as "random seed"
RED_BLUE_BUDGET = 60                 # matches blue_team.run_duel's own default: same budget everywhere
T_MAX = 300.0                        # red_team.T_MAX; undetected trials count as this for mean/worst-case
PHYSICS_STATUS = "fitted"  # reduced-order model calibrated to PSI data; see README > Physics in one paragraph


def entry(value, badge: str, calibration_status: str) -> dict:
    return {"value": value, "badge": badge, "calibration_status": calibration_status}


def cal_status(name: str) -> str:
    return load_calibration()[name]["status"]


def _mission_cfg() -> SimConfig:
    """Representative scenario for the duel/gravity metrics: default Moon-base mission, default duel layout."""
    m = Mission()
    return default_cfg(SimConfig(o2_frac=m.o2_frac, pressure_kpa=m.pressure_kpa, g=m.g, vent_on=m.vent_on))


def metric_red_vs_random(guard: EnvelopeGuard) -> dict:
    """Kartavya's agents/compare.py: random search gets exactly as many evals as Red actually used per seed."""
    cfg = _mission_cfg()
    result = red_vs_random(cfg, budget=RED_BLUE_BUDGET, seeds=SEEDS)
    # Positive = Red's CMA-ES search finds meaningfully more dangerous fires than random search, same budget.
    delta = result["red_median"] - result["random_median"]
    return {"red_vs_random_median_s": entry(round(delta, 1), guard.check(cfg)["badge"], PHYSICS_STATUS)}


def metric_duel(guard: EnvelopeGuard) -> dict:
    """Baseline (before Blue) vs. Blue detection delay, median and worst-case over 5 seeds."""
    cfg = _mission_cfg()
    badge = guard.check(cfg)["badge"]

    before_delays, after_delays = [], []
    for seed in SEEDS:
        run = run_duel(cfg, rounds=1, seed=seed, red_budget=RED_BLUE_BUDGET, blue_budget=RED_BLUE_BUDGET)
        r = run["rounds"][0]
        before_delays.append(r["before"]["delay_s"] if r["before"]["delay_s"] is not None else T_MAX)
        after_delays.append(r["after"]["delay_s"] if r["after"]["delay_s"] is not None else T_MAX)

    return {
        "baseline_mean_delay_s": entry(round(statistics.mean(before_delays), 1), badge, PHYSICS_STATUS),
        "baseline_worst_case_delay_s": entry(round(max(before_delays), 1), badge, PHYSICS_STATUS),
        "blue_mean_delay_s": entry(round(statistics.mean(after_delays), 1), badge, PHYSICS_STATUS),
        "blue_worst_case_delay_s": entry(round(max(after_delays), 1), badge, PHYSICS_STATUS),
    }


def metric_ghost_flame() -> dict:
    """False all-clear rate: across n-heptane droplet suppressions spanning FLEX's measured O2/pressure range
    plus a bit beyond it, how often would camera-only confirmation miss a continuing cool flame."""
    params = ghost_params()
    droplets_mm = np.linspace(1.5, 5.0, 10)
    o2_fracs = np.linspace(0.10, 0.45, 8)  # FLEX tested 0.10-0.40; the top of this range is extrapolation
    trials, false_all_clear = 0, 0
    for d in droplets_mm:
        for o2 in o2_fracs:
            fire = FireSpec("n-heptane", "liquid", 3.0, 2.0, 0.1, droplet_d_mm=float(d))
            r = ghost_flame_check(fire, {"o2_frac": float(o2), "pressure_kpa": 101.3}, params)
            trials += 1
            false_all_clear += r["false_all_clear"]
    # Sweep deliberately spans tested and extrapolated conditions, so this is reported yellow, not green.
    return {"false_all_clear_rate": entry(round(false_all_clear / trials, 2), "yellow", cal_status("ghost.critical_d_mm"))}


def main():
    guard = EnvelopeGuard()
    numbers = {}
    numbers.update(metric_red_vs_random(guard))
    numbers.update(metric_duel(guard))
    numbers.update(metric_ghost_flame())
    numbers.update(physics_metrics())  # gravity + dust false-alarms (Ruthwik: sim/metrics.py)
    numbers.update(deck_metrics())     # badge coverage + witness eval (Sibi: envelope/metrics.py)
    OUT.write_text(json.dumps(numbers, indent=2) + "\n")
    print(f"wrote {OUT} ({len(numbers)} metrics)")


if __name__ == "__main__":
    main()
