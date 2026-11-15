# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Ghost Flame Auditor. Owner: Kartavya. Runs after every Blue suppression of a LIQUID fuel fire.

FLEX: large heptane droplets kept burning as invisible cool flames after the visible flame went out;
two-stage burning wasn't seen below ~2.4 mm. Parameters (critical_d_mm, cool_flame_fuels,
cool_flame_envelope, source) come from Ruthwik's FLEX extraction.
"""
from __future__ import annotations

from ..data_io import cal, load_calibration


def ghost_params() -> dict:
    """FLEX cool-flame regime from data/calibration.csv (ghost.* rows, Ruthwik's FLEX extraction)."""
    return {"cool_flame_fuels": ["n-heptane"], "critical_d_mm": cal("ghost.critical_d_mm"),
            "cool_flame_envelope": {"o2_frac": (cal("ghost.o2_min"), cal("ghost.o2_max")),
                                    "pressure_kpa": (cal("ghost.p_min_kpa"), cal("ghost.p_max_kpa"))},
            "source": load_calibration()["ghost.critical_d_mm"]["source"]}


def in_range(conditions: dict, envelope: dict) -> bool:
    """envelope = {axis: (lo, hi)}, e.g. {"o2_frac": (0.1, 0.4)}."""
    return all(lo <= conditions[k] <= hi for k, (lo, hi) in envelope.items())


def ghost_flame_check(fire, conditions: dict, p: dict) -> dict:
    if fire.phase != "liquid":
        return {"applicable": False, "note": "No cool-flame data for solids"}
    in_regime = (fire.material in p["cool_flame_fuels"]
                 and (fire.droplet_d_mm or 0.0) >= p["critical_d_mm"]
                 and in_range(conditions, p["cool_flame_envelope"]))
    return {"applicable": True, "false_all_clear": in_regime, "vapor_cloud_risk": in_regime,
            "citation": p["source"]}
