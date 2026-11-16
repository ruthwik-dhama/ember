# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Insights report: top risks (Red), fixes (Blue), data gaps (gap map), Earth applications. Owner: Kishan.
Every number carries its badge."""
from __future__ import annotations

from dataclasses import asdict

from ..agents.blue_team import run_duel
from ..config import SimConfig
from ..data_io import load_investigations
from ..envelope.guard import EnvelopeGuard
from ..rank import rank

EARTH_APPLICATIONS = [
    "Hospital oxygen therapy wards (high O2, same flammability concerns)",
    "Submarines (sealed atmosphere, long detection lag)",
    "Aircraft cargo holds (smoke detection and suppression trade-offs)",
    "Mines (confined space, the same ventilation dilemma)",
]

DUEL_ROUNDS = 3
DUEL_SEED = 1  # not 0: cma treats seed=0 as "random seed", which made duels non-reproducible


def _unavailable(reason: str) -> dict:
    return {"available": False, "reason": reason}


def _duel_cfg(mission) -> SimConfig:
    return SimConfig(o2_frac=mission.o2_frac, pressure_kpa=mission.pressure_kpa, g=mission.g, vent_on=mission.vent_on)


def _duel_sections(mission):
    """Top risks / fixes come from the Red vs. Blue duel. Not built yet (Kartavya) -> degrade, don't crash."""
    try:
        result = run_duel(_duel_cfg(mission), DUEL_ROUNDS, DUEL_SEED)
    except NotImplementedError as e:
        reason = f"duel agents not built yet ({e})"
        return _unavailable(reason), _unavailable(reason)
    return result.get("top_risks", []), result.get("recommended_fixes", [])


def build_report(mission) -> dict:
    """Assembles the Insights report screen. Sections whose upstream lane isn't built yet report
    {"available": False, "reason": ...} instead of failing, so /api/report always returns something real."""
    guard = EnvelopeGuard()
    top_risks, recommended_fixes = _duel_sections(mission)
    return {
        "mission": asdict(mission),
        "top_investigations": rank(mission, load_investigations(), guard),
        "top_risks": top_risks,
        "recommended_fixes": recommended_fixes,
        "data_gaps": guard.gap_map(mission.pressure_kpa, mission.g),  # Envelope Guard (Sibi): red cells = where LUCI/FM2 are needed
        "earth_applications": EARTH_APPLICATIONS,
    }
