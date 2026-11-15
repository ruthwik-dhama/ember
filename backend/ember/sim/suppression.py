# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""CO2 / He suppression. Owner: Ruthwik.

Thresholds come from FLEX/FLEX-2. Those are DROPLET-SCALE measurements: applying them to flooding a
whole cabin is extrapolation and must be badged yellow or red (README > Scientific honesty rules #4).
"""
from __future__ import annotations

from ..data_io import cal


def diluted_o2(x_o2: float) -> float:
    """O2 mole fraction after the suppressant floods the cabin."""
    return x_o2 * (1.0 - cal("suppress.dilution_frac"))


def extinguished(x_o2_after: float, suppressant: str) -> bool:
    """True if the diluted O2 fraction is below the FLEX limiting-O2 threshold for this suppressant."""
    if suppressant == "none":
        return False
    return x_o2_after < cal(f"suppress.{suppressant}_extinction_frac")
