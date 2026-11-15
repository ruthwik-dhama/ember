# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""CO2 / He suppression and Ghost Flame parameters. Owner: Ruthwik.

Limits come from FLEX (Dietrich et al. 2014, Microgravity Sci. Technol. 26:65-76): the limiting oxygen index
(LOI) of a burning droplet when CO2 or He is dispersed into air at 1 atm. Those are DROPLET-SCALE
measurements: applying them to flooding a whole cabin is extrapolation and must be badged yellow or red
(README > Scientific honesty rules #4). Solids have no FLEX data and use suppress.<agent>_extinction_frac.
"""
from __future__ import annotations

from ..data_io import cal, load_calibration


def diluted_o2(x_o2: float) -> float:
    """O2 mole fraction after the suppressant floods the cabin."""
    return x_o2 * (1.0 - cal("suppress.dilution_frac"))


def limiting_o2(suppressant: str, material: str) -> float:
    """FLEX LOI for this fuel and agent, else the generic (extrapolated) value."""
    rows = load_calibration()
    key = f"suppress.{suppressant}.{material}"
    return rows[key]["value"] if key in rows else cal(f"suppress.{suppressant}_extinction_frac")


def extinguished(x_o2_after: float, suppressant: str, material: str = "") -> bool:
    """True if the diluted O2 fraction is below the limiting O2 for this agent and fuel."""
    if suppressant == "none":
        return False
    return x_o2_after < limiting_o2(suppressant, material)


def ghost_flame_params() -> dict:
    """Parameters for agents/ghost_flame.ghost_flame_check(fire, conditions, p).

    critical_d_mm: NASA Glenn release JR12-009 (2012), no two-stage burning in heptane droplets < 2.4 mm.
    envelope: Nayagam et al. 2014 (FLEX cool-flame paper), O2 14-25 %, 0.5-1.0 atm.
    The 2.4 mm cutoff is measured for n-heptane only, so only n-heptane is listed.
    """
    return {
        "cool_flame_fuels": ["n-heptane"],
        "critical_d_mm": cal("ghost.critical_d_mm"),
        "cool_flame_envelope": {"o2_frac": (cal("ghost.o2_min"), cal("ghost.o2_max")),
                                "pressure_kpa": (cal("ghost.p_min_kpa"), cal("ghost.p_max_kpa"))},
        "source": "NASA Glenn JR12-009 (2012); Nayagam et al. 2014, NTRS 20140006750",
    }
