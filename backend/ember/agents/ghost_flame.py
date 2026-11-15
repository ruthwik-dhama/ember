# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Ghost Flame Auditor. Owner: Kartavya. Runs after every Blue suppression of a LIQUID fuel fire.

FLEX: large heptane droplets kept burning as invisible cool flames after the visible flame went out;
two-stage burning wasn't seen below ~2.4 mm. Parameters (critical_d_mm, cool_flame_fuels,
cool_flame_envelope, source) come from Ruthwik's FLEX extraction.
"""
from __future__ import annotations


def ghost_params() -> dict:
    """FLEX regime (README 5.3). PLACEHOLDER until Ruthwik's FLEX rows land in calibration.csv."""
    return {"cool_flame_fuels": ["n-heptane"], "critical_d_mm": 2.4,
            "cool_flame_envelope": {"o2_frac": (0.1, 0.4), "pressure_kpa": (70.9, 303.9)},
            "source": "FLEX: Nayagam et al., doi:10.1007/s12217-014-9372-2"}


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
