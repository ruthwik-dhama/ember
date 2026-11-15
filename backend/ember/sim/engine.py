# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Physics engine: reduced-order smoke/dust transport + flame growth + detectors. Owner: Ruthwik.

Not CFD. Each term traces to one investigation, and every constant comes from data/calibration.csv.

  smoke, dust on a 3D grid:  dc/dt + (u_vent x^ + w_b(g) z^) . grad c = D lap c + S_fire + S_dust
    - u_vent: uniform flow from inlet wall (x=0, clean air) to return wall (x=L, outflow = smoke_escaped)
    - w_b(g) = w_b_earth * g^(1/3), applied to SMOKE only (hot); dust is not buoyant. Ceiling is no-flux,
      so smoke pools there.
    - D: effective mixing diffusivity (SAME: transport is mixing-dominated in microgravity)
  fire: radius grows at v_f = spread_rate(v0, X_O2, u_eff) (flame.py), u_eff = sqrt(u_vent^2 + u_b(g)^2) (blowoff uses vent flow only),
    capped at r_cap; smoke source = smoke_yield * area * smoke_scale.
  detectors: single alarms on total concentration; two_moment also needs estimated size < size_cut,
    where smoke size grows with age d0 (1 + t/tau)^(1/3) (t = time since first ignition) and dust ~ microns.
  suppression: suppressant released response_s after the first alarm; fire stops if diluted O2 < FLEX limit.
"""
from __future__ import annotations

import math

import numpy as np

from ..config import AIRLOCK_M, ROOM_M, SimConfig
from ..data_io import cal
from .flame import buoyant_velocity, spread_rate
from .materials import get_material
from .suppression import diluted_o2, extinguished

IS_STUB = False
RESULT_KEYS = ("detected", "delay_s", "alarms", "conditions", "frames",
               "fire_area_cm2", "smoke_escaped", "spread_rate_mm_s")


def grid_shape(dx: float = None):
    dx = dx or cal("engine.dx_m")
    return tuple(max(int(round(L / dx)), 1) for L in ROOM_M)


def _ijk(pos, shape, dx):
    return tuple(min(max(int(v / dx), 0), n - 1) for v, n in zip(pos, shape))


def _diffusive_div(c, D, dx):
    """div(-D grad c) with no-flux walls on every face."""
    out = np.zeros_like(c)
    for ax in range(3):
        flux = -D * np.diff(c, axis=ax) / dx           # interior faces
        pad = [(0, 0)] * 3
        pad[ax] = (1, 1)
        flux = np.pad(flux, pad)                        # zero flux at walls
        out += np.diff(flux, axis=ax) / dx
    return out


def _advect_x(c, u, dx):
    """Upwind, u >= 0. Inflow at x=0 is clean air; returns (divergence, outflow rate per m2 summed)."""
    flux = np.zeros((c.shape[0] + 1,) + c.shape[1:])
    flux[1:] = u * c
    return np.diff(flux, axis=0) / dx, flux[-1].sum()


def _advect_z_up(c, w, dx):
    """Upwind, w >= 0. No flux through floor or ceiling, so smoke accumulates under the ceiling."""
    flux = np.zeros(c.shape[:2] + (c.shape[2] + 1,))
    flux[:, :, 1:-1] = w * c[:, :, :-1]
    return np.diff(flux, axis=2) / dx


def _p_flame():
    return {"x_ref": cal("flame.x_ref"), "a": cal("flame.o2_exponent"), "u_q": cal("flame.u_q"),
            "u_bo": cal("flame.u_bo"), "n": cal("flame.n"), "u_ext": cal("flame.u_ext")}


def simulate(cfg: SimConfig, frames: bool = True) -> dict:
    """Run one scenario.

    frames=False is the fast mode for Red/Blue/metrics: no voxel frames, and the run stops at the first
    alarm (undetected runs still go to t_max so fire_area_cm2 / smoke_escaped are final).
    """
    dx = cal("engine.dx_m")
    shape = grid_shape(dx)
    vol = dx ** 3
    D = cal("engine.diffusivity")
    u_vent = cal("engine.vent_speed") if cfg.vent_on else 0.0
    w_b = buoyant_velocity(cfg.g, cal("engine.w_b_earth"))
    u_b_flame = buoyant_velocity(cfg.g, cal("engine.u_b_earth"))  # cm/s
    p_flame = _p_flame()
    smoke_scale = cal("engine.smoke_scale")
    r0 = cal("flame.r0_m")

    # Stable explicit step: diffusion dt <= dx^2/(6D), CFL |u| dt/dx <= 1 (with margin).
    limits = [0.5]
    if D > 0:
        limits.append(0.9 * dx * dx / (6 * D))
    if u_vent + w_b > 0:
        limits.append(0.9 * dx / (u_vent + w_b))
    dt = min(limits)

    smoke = np.zeros(shape)
    dust = np.zeros(shape)

    fires = []
    for f in cfg.fires:
        m = get_material(f.material)
        fires.append({"spec": f, "mat": m, "ijk": _ijk((f.x, f.y, f.z), shape, dx), "r": 0.0,
                      "v_mm_s": 0.0, "out_at": None})
    det_ijk = [_ijk((d.x, d.y, d.z), shape, dx) for d in cfg.detectors]
    airlock = _ijk(AIRLOCK_M, shape, dx)
    dust_pending = sorted(cfg.dust, key=lambda e: e.t_s)

    thr = {"single": cal("detector.single.threshold"), "two_moment": cal("detector.two_moment.threshold")}
    size_cut, d0, tau, d_dust = (cal("detector.two_moment.size_cut_nm"), cal("smoke.d0_nm"),
                                 cal("smoke.tau_s"), cal("dust.d_nm"))
    t_first_ignite = min((f.t_ignite_s for f in cfg.fires), default=None)

    frame_dt, frame_min = cal("engine.frame_dt_s"), cal("engine.frame_min_conc")
    out_frames, next_frame = [], 0.0
    alarms, alarmed = [], set()
    escaped = 0.0
    x_o2 = cfg.o2_frac
    suppress_at = None
    t = 0.0

    while t <= cfg.t_max_s + 1e-9:
        vent_now = u_vent if (cfg.vent_off_at_s is None or t < cfg.vent_off_at_s) else 0.0

        # Suppression: flood after the first alarm + response time.
        if suppress_at is not None and t >= suppress_at and cfg.suppressant != "none":
            x_o2 = diluted_o2(cfg.o2_frac)
            suppress_at = None
            for fr in fires:
                if fr["out_at"] is None and fr["r"] > 0 and extinguished(x_o2, cfg.suppressant, fr["mat"].name):
                    fr["out_at"] = t

        # Fires grow and emit smoke.
        for fr in fires:
            f, m = fr["spec"], fr["mat"]
            if t < f.t_ignite_s or fr["out_at"] is not None:
                continue
            if fr["r"] == 0.0:
                fr["r"] = r0
            u_forced = vent_now * 100.0  # cm/s
            u_eff = math.hypot(u_forced, u_b_flame)
            fr["v_mm_s"] = spread_rate(m.v0, x_o2, u_eff, p_flame, u_forced=u_forced)
            fr["r"] = min(fr["r"] + fr["v_mm_s"] / 1000.0 * dt, m.r_cap)
            rate = m.smoke_yield * math.pi * fr["r"] ** 2 * smoke_scale  # amount / s
            smoke[fr["ijk"]] += rate * dt / vol

        # Dust puffs at the airlock.
        while dust_pending and dust_pending[0].t_s <= t:
            ev = dust_pending.pop(0)
            dust[airlock] += ev.mass_mg * cal("dust.conc_per_mg") / vol

        # Transport.
        adv_s, out_s = _advect_x(smoke, vent_now, dx) if vent_now > 0 else (0.0, 0.0)
        adv_d, _ = _advect_x(dust, vent_now, dx) if vent_now > 0 else (0.0, 0.0)
        smoke = smoke - dt * (adv_s + (_advect_z_up(smoke, w_b, dx) if w_b > 0 else 0.0) + _diffusive_div(smoke, D, dx))
        dust = dust - dt * (adv_d + _diffusive_div(dust, D, dx))
        np.clip(smoke, 0.0, None, out=smoke)
        np.clip(dust, 0.0, None, out=dust)
        escaped += out_s * dx * dx * dt

        # Detectors.
        age = (t - t_first_ignite) if (t_first_ignite is not None and t >= t_first_ignite) else 0.0
        d_smoke = d0 * (1.0 + age / tau) ** (1.0 / 3.0)
        for det, ijk in zip(cfg.detectors, det_ijk):
            if det.id in alarmed:
                continue
            s, du = smoke[ijk], dust[ijk]
            total = s + du
            if total <= thr[det.kind]:
                continue
            if det.kind == "two_moment":
                frac = s / total
                d_est = frac * d_smoke + (1.0 - frac) * d_dust
                if d_est >= size_cut:
                    continue
                reason = f"two-moment: size ~{d_est:.0f} nm < {size_cut:.0f} nm cut"
            else:
                reason = "single: concentration over threshold"
            alarmed.add(det.id)
            alarms.append({"detector_id": det.id, "t_s": round(t, 2), "reason": reason})
            if len(alarms) == 1:
                suppress_at = t + cal("suppress.response_s")

        # Frames.
        if frames and t >= next_frame - 1e-9:
            total = smoke + dust
            idx = np.argwhere(total > frame_min)
            vox = [[int(i), int(j), int(k), round(float(total[i, j, k]), 3),
                    round(float(smoke[i, j, k] / total[i, j, k]), 3)] for i, j, k in idx]
            out_frames.append({"t_s": round(t, 2), "voxels": vox})
            next_frame += frame_dt

        if not frames and alarms:
            break
        t += dt

    detected = bool(alarms)
    area_cm2 = sum(math.pi * fr["r"] ** 2 for fr in fires) * 1e4
    return {
        "stub": IS_STUB,
        "detected": detected,
        "delay_s": alarms[0]["t_s"] - (t_first_ignite or 0.0) if detected else None,
        "alarms": alarms,
        "conditions": {"o2_frac": cfg.o2_frac, "pressure_kpa": cfg.pressure_kpa,
                       "flow_cm_s": u_vent * 100.0, "g": cfg.g},
        "frames": out_frames,
        "fire_area_cm2": area_cm2,
        "smoke_escaped": escaped,
        "spread_rate_mm_s": max((fr["v_mm_s"] for fr in fires), default=0.0),
        "fires": [{"material": fr["mat"].name, "phase": fr["mat"].phase, "radius_m": fr["r"],
                   "area_cm2": math.pi * fr["r"] ** 2 * 1e4, "extinguished_at_s": fr["out_at"],
                   "calibration_status": fr["mat"].status} for fr in fires],
        "dt_s": dt,
    }
