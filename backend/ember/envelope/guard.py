# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Envelope Guard: how far a condition is from the nearest real tested condition. Owner: Sibi.

Reference implementation from the design doc. Document the thresholds in envelope/README.md.
"""
from __future__ import annotations

import numpy as np

from ..data_io import load_tested_conditions

D_GREEN = 0.1
AXES = ["o2_frac", "pressure", "flow"]


class EnvelopeGuard:
    def __init__(self, rows=None):
        self.rows = rows if rows is not None else load_tested_conditions()
        self.X = np.array([self._norm(r) for r in self.rows])
        self.lo, self.hi = self.X.min(axis=0), self.X.max(axis=0)
        self.tested_g = {r["g"] for r in self.rows}

    @staticmethod
    def _norm(c):
        return np.array([c["o2_frac"], np.log(c["pressure_kpa"]), np.log(c["flow_cm_s"] + 0.1)])

    def check(self, c: dict) -> dict:
        x = self._norm(c)
        span = np.where(self.hi > self.lo, self.hi - self.lo, 1.0)
        d = np.linalg.norm((self.X - x) / span, axis=1)
        i = int(d.argmin())
        outside = [n for n, v, lo, hi in zip(AXES, x, self.lo, self.hi) if v < lo or v > hi]
        g = c["g"]
        if g < min(self.tested_g) or g > max(self.tested_g):
            outside.append("g")
        if outside:
            badge = "red"
        elif g in self.tested_g and d[i] < D_GREEN:
            badge = "green"
        else:
            badge = "yellow"
        return {"badge": badge, "distance": float(d[i]), "nearest": self.rows[i]["test_id"], "outside_axes": outside}

    def gap_map(self, pressure_kpa: float, g: float):
        """2D grid (O2 x flow) of badges at the mission's pressure and g. Red cells = where LUCI/FM2 are needed."""
        raise NotImplementedError("data lane (Sibi)")
