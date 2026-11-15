# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Physics-lane deck numbers: gravity comparison and dust false-alarm rates. Owner: Ruthwik.

Kishan's scripts/metrics.py merges these into deck_numbers.json:

    from ember.sim.metrics import physics_metrics
    numbers.update(physics_metrics())

Every entry has the deck_numbers shape {value, badge, calibration_status} plus a "note" for slide footnotes.
Runs offline in a few seconds. The scenarios are fixed and documented here so the numbers are reproducible.
"""
from __future__ import annotations

from dataclasses import replace

from ..config import AIRLOCK_M, Detector, DustEvent, FireSpec, SimConfig
from ..data_io import load_calibration
from ..envelope.guard import EnvelopeGuard
from .engine import simulate
from .materials import get_material
from .sweeps import gravity_sweep

# Gravity comparison scenario: Moon-base atmosphere (SimConfig defaults: 30% O2, 70.3 kPa), vents on,
# one PMMA fire mid-floor (PMMA spread is fitted to BASS-II), one ceiling detector straight above it.
GRAVITY_SCENE = SimConfig(fires=[FireSpec("pmma", "solid", 3.0, 2.0, 0.5)],
                          detectors=[Detector("ceil", 3.0, 2.0, 2.4)])
GRAVITY_KEYS = {"iss": "gravity_delay_s_0g", "moon": "gravity_delay_s_moon",
                "mars": "gravity_delay_s_mars", "earth": "gravity_delay_s_1g"}

# Dust false-alarm scenario: dust-only puffs at the airlock (no fire), the same events for both detector kinds,
# detectors on a fixed grid downstream of the airlock. Rate = alarmed (event, detector) pairs / all pairs.
DUST_MASSES_MG = (10, 25, 50, 100)
DUST_DETECTORS = [(x, y, z) for x in (1.0, 2.0, 3.0) for y in (1.0, 2.0, 3.0) for z in (1.0, 2.4)]

_RANK = {"measured": 0, "fitted": 1, "assumed": 2}
_ENGINE_CONSTANTS = ("engine.vent_speed", "engine.diffusivity", "engine.w_b_earth", "engine.smoke_scale",
                     "detector.single.threshold")


def _worst_status(names) -> str:
    cal = load_calibration()
    return max((cal[n]["status"] for n in names), key=_RANK.__getitem__)


def gravity_metrics() -> dict:
    """gravity_delay_s_{0g,moon,mars,1g}: seconds from ignition to first alarm, same fire at each gravity level.

    value is None when the fire isn't detected within t_max (the note says so). badge comes from the Envelope
    Guard on that run's conditions (partial g is always at least yellow). calibration_status is the worst status
    among the material and the transport/detector constants the result depends on.
    """
    guard = EnvelopeGuard()
    sweep = gravity_sweep(GRAVITY_SCENE)
    status = _worst_status([*(_ENGINE_CONSTANTS), "material.pmma.v0", "flame.o2_exponent"])
    out = {}
    for name, key in GRAVITY_KEYS.items():
        r = sweep[name]
        badge = guard.check(replace(GRAVITY_SCENE, g=r["g"]))["badge"]
        when = (f"first alarm at {r['delay_s']:.1f} s" if r["detected"]
                else f"not detected within {GRAVITY_SCENE.t_max_s:.0f} s")
        out[key] = {
            "value": r["delay_s"],
            "badge": badge,
            "calibration_status": status,
            "note": (f"{name} ({r['g']} g): {when}. PMMA fire mid-floor, ceiling detector above it, vents on, "
                     f"{GRAVITY_SCENE.o2_frac:.0%} O2, {GRAVITY_SCENE.pressure_kpa} kPa. PMMA spread fitted to "
                     f"BASS-II; vent speed, mixing and detector threshold are assumed"),
        }
    return out


def dust_false_alarm_metrics() -> dict:
    """dust_false_alarm_rate_{single,two_moment}: share of (dust event, detector) pairs that alarm with no fire."""
    events = [DustEvent(t_s=5.0, mass_mg=m) for m in DUST_MASSES_MG]
    status = _worst_status(["dust.conc_per_mg", "dust.d_nm", "detector.single.threshold",
                            "detector.two_moment.threshold", "detector.two_moment.size_cut_nm",
                            "engine.vent_speed", "engine.diffusivity"])
    out = {}
    for kind in ("single", "two_moment"):
        hits = n = 0
        for ev in events:
            dets = [Detector(f"d{i}", *p, kind=kind) for i, p in enumerate(DUST_DETECTORS)]
            r = simulate(SimConfig(fires=[], dust=[ev], detectors=dets), frames=False)
            alarmed = {a["detector_id"] for a in r["alarms"]}
            hits += len(alarmed)
            n += len(dets)
        out[f"dust_false_alarm_rate_{kind}"] = {
            "value": round(hits / n, 3),
            "badge": "red" if status == "assumed" else "yellow",
            "calibration_status": status,
            "note": (f"{hits}/{n} detector-event pairs alarmed with no fire: {len(events)} dust-only puffs "
                     f"({', '.join(map(str, DUST_MASSES_MG))} mg) at the airlock {AIRLOCK_M} m, {len(DUST_DETECTORS)} "
                     f"{kind} detectors on a fixed grid. Dust load and detector thresholds are assumed until DAFT/SAME"),
        }
    return out


def physics_metrics() -> dict:
    """All physics-lane entries of deck_numbers.json."""
    return {**gravity_metrics(), **dust_false_alarm_metrics()}
