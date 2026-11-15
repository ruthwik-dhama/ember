# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Per-material parameters. Owner: Ruthwik. ALL VALUES ARE PLACEHOLDERS until filled from BASS/BASS-II/FLEX (set source + status)."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class Material:
    name: str
    phase: Literal["solid", "liquid"]
    v0: float           # mm/s, reference spread rate
    smoke_yield: float  # -, smoke source per unit burning area
    r_cap: float        # m, max fire radius
    source: str
    status: Literal["measured", "fitted", "assumed"] = "assumed"


MATERIALS = {
    "cotton": Material("cotton", "solid", 0.0, 0.0, 0.3, "TODO: BASS/BASS-II"),
    "pmma": Material("pmma", "solid", 0.0, 0.0, 0.3, "TODO: BASS/BASS-II"),
    "n-heptane": Material("n-heptane", "liquid", 0.0, 0.0, 0.1, "TODO: FLEX"),
    "methanol": Material("methanol", "liquid", 0.0, 0.0, 0.1, "TODO: FLEX"),
}
