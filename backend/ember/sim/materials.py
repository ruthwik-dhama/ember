# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Per-material parameters. Owner: Ruthwik.

Values live in data/calibration.csv as material.<name>.{v0, smoke_yield, r_cap}; source/status come from there.
To add a material: add its three rows to calibration.csv and its name + phase to PHASES.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from ..data_io import load_calibration

PHASES = {"cotton": "solid", "pmma": "solid", "n-heptane": "liquid", "methanol": "liquid"}


@dataclass(frozen=True)
class Material:
    name: str
    phase: Literal["solid", "liquid"]
    v0: float           # mm/s, reference spread rate at X_ref and favourable flow
    smoke_yield: float  # -, smoke source per m2 of burning area per second (x engine.smoke_scale)
    r_cap: float        # m, max fire radius
    source: str
    status: str         # worst status among the three rows: measured < fitted < assumed


_RANK = {"measured": 0, "fitted": 1, "assumed": 2}


def get_material(name: str) -> Material:
    if name not in PHASES:
        raise KeyError(f"unknown material {name!r}; known: {sorted(PHASES)}")
    cal = load_calibration()
    rows = [cal[f"material.{name}.{k}"] for k in ("v0", "smoke_yield", "r_cap")]
    status = max((r["status"] for r in rows), key=_RANK.__getitem__)
    return Material(name, PHASES[name], rows[0]["value"], rows[1]["value"], rows[2]["value"], rows[0]["source"], status)


MATERIALS = {name: get_material(name) for name in PHASES}
