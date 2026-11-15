# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Flame spread and gravity scaling. Owner: Ruthwik. Coefficients come from data/calibration.csv.

Fitted to BASS-II ISS opposed-flow spread over 0.64 cm black PMMA rods (Link et al. 2018, Sci. Rep. 8:120,
Table S1; X_O2 17-18.9 %, forced flow 0.7-7.6 cm/s). See data/calibration.csv for values and uncertainties.
"""
from __future__ import annotations

from typing import Optional


def buoyant_velocity(g_rel: float, u_b_earth: float) -> float:
    """u_b(g) = u_b(1g) * g^(1/3). Moon ~0.55x, Mars ~0.72x Earth."""
    return u_b_earth * max(g_rel, 0.0) ** (1.0 / 3.0)


def effective_flow(u_forced: float, g_rel: float, u_b_earth: float) -> float:
    """Flow a flame sees: sqrt(forced^2 + buoyant^2)."""
    ub = buoyant_velocity(g_rel, u_b_earth)
    return (u_forced ** 2 + ub ** 2) ** 0.5


def spread_rate(v0: float, x_o2: float, u_eff: float, p: dict, u_forced: Optional[float] = None) -> float:
    """v_f = v0 (X_O2/X_ref)^a * [u_eff/(u_eff+u_q)] * [1/(1+(u_forced/u_bo)^n)], and 0 below u_ext.

    - Quench branch uses u_eff (forced + buoyant): oxygen supply. BASS-II saw no spread below u_ext = 0.6 cm/s
      in microgravity; on Earth the ~30 cm/s buoyant flow prevents low-flow extinction.
    - Blowoff branch uses the FORCED flow only. BASS-II 1 g spread barely changes with forced flow below the
      buoyant flow, so buoyancy is not treated as a blowoff flow. If u_forced is None, u_eff is used.
    p keys: x_ref, a, u_q, u_bo, n, optional u_ext. Flows in cm/s.
    """
    if u_eff < p.get("u_ext", 0.0):
        return 0.0
    u_bo_flow = u_eff if u_forced is None else u_forced
    o2_term = (x_o2 / p["x_ref"]) ** p["a"]
    quench = u_eff / (u_eff + p["u_q"]) if (u_eff + p["u_q"]) > 0 else 0.0
    blowoff = 1.0 / (1.0 + (u_bo_flow / p["u_bo"]) ** p["n"])
    return v0 * o2_term * quench * blowoff
