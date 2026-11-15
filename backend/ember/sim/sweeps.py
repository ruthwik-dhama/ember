# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Same fire at ISS / Moon / Mars / Earth gravity. Owner: Ruthwik. Used by the gravity panel and metrics.py.

Partial-g results (0 < g < 1) are always badged yellow: PSI has no partial-gravity combustion data.
"""
from __future__ import annotations

from dataclasses import replace

from ..config import GRAVITY_PRESETS, SimConfig
from .engine import simulate


def gravity_sweep(cfg: SimConfig) -> dict:
    out = {}
    for name, g in GRAVITY_PRESETS.items():
        r = simulate(replace(cfg, g=g), frames=False)
        out[name] = {"g": g, "detected": r["detected"], "delay_s": r["delay_s"],
                     "spread_rate_mm_s": r["spread_rate_mm_s"],
                     "partial_g": 0.0 < g < 1.0}
    return out
