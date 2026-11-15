# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Flame spread and gravity scaling. Owner: Ruthwik. Coefficients come from data/calibration.csv (BASS/BASS-II fit)."""
from __future__ import annotations


def buoyant_velocity(g_rel: float, u_b_earth: float) -> float:
    """u_b(g) = u_b(1g) * g^(1/3). Moon ~0.55x, Mars ~0.72x Earth."""
    return u_b_earth * max(g_rel, 0.0) ** (1.0 / 3.0)


def effective_flow(u_forced: float, g_rel: float, u_b_earth: float) -> float:
    """Flow a flame sees: sqrt(forced^2 + buoyant^2)."""
    ub = buoyant_velocity(g_rel, u_b_earth)
    return (u_forced ** 2 + ub ** 2) ** 0.5


def spread_rate(v0: float, x_o2: float, u_eff: float, p: dict) -> float:
    """v_f = v0 (X_O2/X_ref)^a * [u/(u+u_q)] * [1/(1+(u/u_bo)^n)].

    Low-flow branch (u_q): oxygen-starvation quenching (the ventilation dilemma). High-flow branch (u_bo): blowoff.
    p keys: x_ref, a, u_q, u_bo, n.
    """
    o2_term = (x_o2 / p["x_ref"]) ** p["a"]
    quench = u_eff / (u_eff + p["u_q"]) if (u_eff + p["u_q"]) > 0 else 0.0
    blowoff = 1.0 / (1.0 + (u_eff / p["u_bo"]) ** p["n"])
    return v0 * o2_term * quench * blowoff
