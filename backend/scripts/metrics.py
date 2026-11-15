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
from dataclasses import replace
from pathlib import Path

import numpy as np

from ember.agents.blue_team import default_cfg, run_duel
from ember.agents.compare import red_vs_random
from ember.agents.ghost_flame import ghost_flame_check, ghost_params
from ember.config import ROOM_M, Detector, DustEvent, FireSpec, Mission, SimConfig
from ember.data_io import load_calibration
from ember.envelope.guard import EnvelopeGuard
from ember.envelope.metrics import deck_metrics
from ember.sim.engine import simulate
from ember.sim.sweeps import gravity_sweep

OUT = Path(__file__).resolve().parents[2] / "deck_numbers.json"

SEEDS = [0, 1, 2, 3, 4]              # "5+ seeds" fairness rule
RED_BLUE_BUDGET = 60                 # matches blue_team.run_duel's own default: same budget everywhere
T_MAX = 300.0                        # red_team.T_MAX; undetected trials count as this for mean/worst-case
DUST_TRIALS = 20

GRAVITY_KEYS = {"iss": "gravity_delay_s_0g", "moon": "gravity_delay_s_moon",
                "mars": "gravity_delay_s_mars", "earth": "gravity_delay_s_1g"}
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


def metric_gravity(guard: EnvelopeGuard) -> dict:
    """Same fire at every gravity preset. Partial-g (moon, mars) comes back yellow from the guard's own rule:
    PSI has no partial-gravity data, so 0<g<1 can never be green."""
    # Mirrors backend/tests/test_core.py's fire()/ceiling_det() setup for a known-detectable scenario.
    cfg = replace(_mission_cfg(), vent_on=False,
                  fires=[FireSpec("cotton", "solid", 3.0, 2.0, 0.5)],
                  detectors=[Detector("ceil", 3.0, 2.0, 2.4)])
    sweep = gravity_sweep(cfg)
    out = {}
    for name, key in GRAVITY_KEYS.items():
        point = sweep[name]
        conditions = {"o2_frac": cfg.o2_frac, "pressure_kpa": cfg.pressure_kpa,
                      "flow_cm_s": 0.0 if cfg.vent_on else 10.0, "g": point["g"]}
        out[key] = entry(point["delay_s"], guard.check(conditions)["badge"], PHYSICS_STATUS)
    return out


def metric_dust_false_alarms(guard: EnvelopeGuard) -> dict:
    """Pure dust (no fire) near the airlock: how often does each detector kind false-alarm, varying the
    puff mass and the detector's distance from the airlock."""
    cfg = _mission_cfg()
    badge = guard.check(cfg)["badge"]
    rng = np.random.default_rng(7)
    single_hits = two_moment_hits = 0
    for _ in range(DUST_TRIALS):
        mass = float(rng.uniform(20.0, 100.0))
        x = float(rng.uniform(0.5, ROOM_M[0] - 0.5))
        dust_cfg = replace(cfg, fires=[], dust=[DustEvent(t_s=2.0, mass_mg=mass)])
        single_hits += simulate(replace(dust_cfg, detectors=[Detector("d", x, 2.0, 1.0, kind="single")]),
                                 frames=False)["detected"]
        two_moment_hits += simulate(replace(dust_cfg, detectors=[Detector("d", x, 2.0, 1.0, kind="two_moment")]),
                                     frames=False)["detected"]
    status = cal_status("detector.two_moment.size_cut_nm")  # both thresholds are "assumed" pending real DAFT data
    return {
        "dust_false_alarm_rate_single": entry(round(single_hits / DUST_TRIALS, 2), badge, status),
        "dust_false_alarm_rate_two_moment": entry(round(two_moment_hits / DUST_TRIALS, 2), badge, status),
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
    numbers.update(metric_gravity(guard))
    numbers.update(metric_dust_false_alarms(guard))
    numbers.update(metric_ghost_flame())
    numbers.update(deck_metrics())  # badge coverage + witness eval (Sibi: envelope/metrics.py)
    OUT.write_text(json.dumps(numbers, indent=2) + "\n")
    print(f"wrote {OUT} ({len(numbers)} metrics)")


if __name__ == "__main__":
    main()
