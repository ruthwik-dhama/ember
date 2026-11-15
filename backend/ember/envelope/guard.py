# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Envelope Guard: how far a condition is from the nearest real tested condition. Owner: Sibi.

Every threshold used here is written down in envelope/README.md so each badge can be explained.
Contract: check(conditions) -> {badge, distance, nearest, outside_axes}.
"""
from __future__ import annotations

from typing import Optional, Sequence

import numpy as np

from ..data_io import load_tested_conditions

D_GREEN = 0.1          # normalized distance below which a condition counts as "measured"
FLOW_EPS_CM_S = 0.1    # log(flow + eps) so quiescent (0 cm/s) tests are representable
AXES = ["o2_frac", "pressure", "flow"]

# PLACEHOLDER: Mission has no flow field yet, so rank/gap map assume a typical cabin vent speed.
# Replace with Mission.flow_cm_s (Kishan) or a calibration.csv value when one exists.
DEFAULT_FLOW_CM_S = 10.0

# Gap map default axes: O2 mole fraction and flow speed (cm/s).
GAP_O2_RANGE = (0.15, 0.45)
GAP_FLOW_RANGE = (0.0, 30.0)
GAP_N = 13


def _get(obj, key, default=None):
    """Read a field from a dict, dataclass or pydantic model."""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)


def _conditions(c) -> dict:
    """Normalize a mission / SimConfig / dict into the four condition keys the guard uses."""
    flow = _get(c, "flow_cm_s")
    return {
        "o2_frac": float(_get(c, "o2_frac")),
        "pressure_kpa": float(_get(c, "pressure_kpa")),
        "flow_cm_s": float(DEFAULT_FLOW_CM_S if flow is None else flow),
        "g": float(_get(c, "g")),
    }


class EnvelopeGuard:
    def __init__(self, rows: Optional[Sequence[dict]] = None):
        self.rows = list(rows) if rows is not None else load_tested_conditions()
        if not self.rows:
            raise ValueError("EnvelopeGuard needs at least one tested condition row")
        self.X = np.array([self._norm(r) for r in self.rows])
        self.lo, self.hi = self.X.min(axis=0), self.X.max(axis=0)
        self.span = np.where(self.hi > self.lo, self.hi - self.lo, 1.0)
        self.tested_g = {float(r["g"]) for r in self.rows}

    @staticmethod
    def _norm(c) -> np.ndarray:
        return np.array([
            float(c["o2_frac"]),
            np.log(float(c["pressure_kpa"])),
            np.log(float(c["flow_cm_s"]) + FLOW_EPS_CM_S),
        ])

    def _distances(self, c: dict) -> np.ndarray:
        return np.linalg.norm((self.X - self._norm(c)) / self.span, axis=1)

    def check(self, c) -> dict:
        c = _conditions(c)
        x = self._norm(c)
        d = self._distances(c)
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
            badge = "yellow"  # includes every partial-g condition (0 < g < 1) by rule
        return {"badge": badge, "distance": float(d[i]), "nearest": self.rows[i]["test_id"],
                "outside_axes": outside}

    def distance_to(self, mission, row: dict) -> float:
        """Normalized distance from a mission (or any condition) to one tested row. Used by rank()."""
        c = _conditions(mission)
        return float(np.linalg.norm((self._norm(row) - self._norm(c)) / self.span))

    def gap_map(self, pressure_kpa: float, g: float,
                o2_range=GAP_O2_RANGE, flow_range=GAP_FLOW_RANGE, n: int = GAP_N) -> dict:
        """2D grid (O2 x flow) of badges at the mission's pressure and g.

        Red cells show where future experiments (LUCI, FM2) are needed.
        cells[i][j] is the badge at o2_values[i], flow_values[j].
        """
        o2s = np.linspace(o2_range[0], o2_range[1], n)
        flows = np.linspace(flow_range[0], flow_range[1], n)
        cells, nearest = [], []
        counts = {"green": 0, "yellow": 0, "red": 0}
        for o2 in o2s:
            row_b, row_n = [], []
            for u in flows:
                r = self.check({"o2_frac": o2, "pressure_kpa": pressure_kpa, "flow_cm_s": u, "g": g})
                row_b.append(r["badge"])
                row_n.append(r["nearest"])
                counts[r["badge"]] += 1
            cells.append(row_b)
            nearest.append(row_n)
        return {
            "pressure_kpa": float(pressure_kpa),
            "g": float(g),
            "o2_values": [round(float(v), 4) for v in o2s],
            "flow_values": [round(float(v), 3) for v in flows],
            "cells": cells,
            "nearest": nearest,
            "counts": counts,
        }
