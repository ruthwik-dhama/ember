# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Physics engine: smoke/dust transport + detectors. Owner: Ruthwik.

STUB. simulate() returns deterministic PLACEHOLDER data in the real contract shape so the API,
agents, 3D habitat and metrics can be built against it. Replace the body with the reduced-order
model (3D advection-diffusion with g^(1/3) buoyancy, flame spread, detectors); keep the return
shape and set IS_STUB = False (that switches on the behaviour tests in tests/test_core.py).
"""
from __future__ import annotations

import math

from ..config import AIRLOCK_M, ROOM_M, SimConfig

IS_STUB = True
DX_M = 0.25  # placeholder grid spacing
RESULT_KEYS = ("detected", "delay_s", "alarms", "conditions", "frames",
               "fire_area_cm2", "smoke_escaped", "spread_rate_mm_s")
_STUB_DELAY_S = 60.0
_STUB_VENT_CM_S = 10.0


def grid_shape():
    return tuple(int(round(L / DX_M)) for L in ROOM_M)


def _ijk(x, y, z):
    n = grid_shape()
    return tuple(min(max(int(v / DX_M), 0), m - 1) for v, m in zip((x, y, z), n))


def _puff(center, radius_m, conc, smoke_frac):
    """Sparse voxels of a sphere around center: [[i, j, k, concentration, smokeFrac], ...]."""
    ci, cj, ck = _ijk(*center)
    r = int(radius_m / DX_M)
    ni, nj, nk = grid_shape()
    out = []
    for i in range(max(ci - r, 0), min(ci + r + 1, ni)):
        for j in range(max(cj - r, 0), min(cj + r + 1, nj)):
            for k in range(max(ck - r, 0), min(ck + r + 1, nk)):
                d = math.dist((i, j, k), (ci, cj, ck))
                if d <= r:
                    out.append([i, j, k, round(conc * (1 - d / (r + 1)), 3), smoke_frac])
    return out


def simulate(cfg: SimConfig, frames: bool = True) -> dict:
    """Run one scenario. frames=False is the fast mode for Red/Blue/metrics (no voxel frames)."""
    flow = _STUB_VENT_CM_S if cfg.vent_on else 0.0
    detected = bool(cfg.fires and cfg.detectors)
    delay = (min(f.t_ignite_s for f in cfg.fires) + _STUB_DELAY_S) if detected else None
    if delay is not None and delay > cfg.t_max_s:
        detected, delay = False, None
    alarms = [{"detector_id": cfg.detectors[0].id, "t_s": delay, "reason": "stub"}] if detected else []

    out_frames = []
    if frames:
        t, t_end = 0.0, min(cfg.t_max_s, 90.0)
        while t <= t_end:
            vox = []
            for f in cfg.fires:
                age = t - f.t_ignite_s
                if age >= 0:
                    vox += _puff((f.x, f.y, f.z), min(0.25 + 0.02 * age, 1.0), 1.0, 1.0)
            for d in cfg.dust:
                if 0 <= t - d.t_s <= 20:
                    vox += _puff(AIRLOCK_M, 0.5, 0.5, 0.0)
            out_frames.append({"t_s": t, "voxels": vox})
            t += 2.0

    return {
        "stub": IS_STUB,
        "detected": detected,
        "delay_s": delay,
        "alarms": alarms,
        "conditions": {"o2_frac": cfg.o2_frac, "pressure_kpa": cfg.pressure_kpa, "flow_cm_s": flow, "g": cfg.g},
        "frames": out_frames,
        "fire_area_cm2": 100.0 * len(cfg.fires),
        "smoke_escaped": 0.0,
        "spread_rate_mm_s": 0.0,
    }
