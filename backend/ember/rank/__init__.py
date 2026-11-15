# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Compare and relevance ranking. Owner: Kishan."""
from __future__ import annotations

from ..data_io import load_tested_conditions
from ..envelope.guard import DEFAULT_FLOW_CM_S

COMPARE_KEYS = ["hardware", "fuel.phase", "conditions.g", "pillars", "sensors"]
HABITAT_BONUS = 0.2
# Habitats where regolith dust comes in through the airlock, so dust/false-alarm data (DAFT) matters more.
DUST_HABITATS = {"moon_base", "mars_base", "rover"}
DUST_BONUS = 0.2
ATM_TO_KPA = 101.325


def get_path(d: dict, path: str):
    for k in path.split("."):
        d = d.get(k) if isinstance(d, dict) else None
    return d


def compare(a: dict, b: dict) -> dict:
    same, diff = [], []
    for k in COMPARE_KEYS:
        va, vb = get_path(a, k), get_path(b, k)
        (same if va == vb else diff).append({"field": k, "a": va, "b": vb})
    return {"same": same, "different": diff}


def _nearest_in_investigation(mission, inv_id: str, all_rows: list, guard):
    """(distance, nearest test_id) to this investigation's closest tested row, or (None, None) if it has none yet."""
    # Rows are labelled by flight (SAME-R, BASS-II, FLEX-2); investigations.json groups them under the base id.
    rows = [r for r in all_rows if r["investigation"] == inv_id or r["investigation"].startswith(inv_id + "-")]
    if not rows:
        return None, None
    distances = [guard.distance_to(mission, r) for r in rows]
    i = min(range(len(rows)), key=lambda k: distances[k])
    return distances[i], rows[i]["test_id"]


def _mid(v):
    """Scalar, or the midpoint of a [lo, hi] range; None if missing."""
    if isinstance(v, (list, tuple)):
        return (float(v[0]) + float(v[-1])) / 2 if v else None
    return None if v is None else float(v)


def _summary_distance(mission, inv: dict, guard):
    """Distance to the investigation's summary conditions (investigations.json), for investigations with no
    combustion rows in tested_conditions.csv (e.g. DAFT, which measured dust, not fire). None if incomplete."""
    c = inv.get("conditions") or {}
    o2, p_atm, g = _mid(c.get("o2_frac")), _mid(c.get("pressure_atm")), _mid(c.get("g"))
    if None in (o2, p_atm, g):
        return None
    flow = _mid(c.get("flow_cm_s"))
    row = {"o2_frac": o2, "pressure_kpa": p_atm * ATM_TO_KPA,
           "flow_cm_s": DEFAULT_FLOW_CM_S if flow is None else flow, "g": g}
    return guard.distance_to(mission, row)


def _why(inv: dict, distance, nearest, overall_badge: str, habitat_bonus: float, dust_bonus: float = 0.0) -> str:
    phase = inv["fuel"]["phase"]
    pillars = ", ".join(inv.get("pillars", [])) or "unclassified"
    if phase == "dust":
        note = " Regolith dust enters through the airlock in this habitat." if dust_bonus else ""
        where = f" Its test conditions are {distance:.2f} from the mission." if distance is not None else ""
        return (f"{inv['name']}: measured background dust, not fire; the false-alarm reference a smoke detector "
                f"must not alarm on (pillar: {pillars}).{where}{note}")
    if distance is None:
        return (f"{inv['name']}: no tested conditions logged for this investigation yet "
                f"(pillar: {pillars}, fuel: {phase}). Mission's overall envelope is {overall_badge}.")
    bonus_note = " — fuel phase matches the mission" if habitat_bonus else ""
    return (f"{inv['name']} ({pillars}, {phase} fuel): nearest tested condition is "
            f"{nearest} at normalized distance {distance:.2f}{bonus_note}.")


def rank(mission, investigations, guard, pillar=None) -> list:
    """Score = 1/(1 + nearest tested-condition distance) + habitat bonus; returns [{id, score, why}] sorted."""
    overall_badge = guard.check(mission)["badge"]
    all_rows = load_tested_conditions()

    out = []
    for inv in investigations:
        if pillar and pillar not in inv.get("pillars", []):
            continue
        distance, nearest = _nearest_in_investigation(mission, inv["id"], all_rows, guard)
        if distance is None:
            distance = _summary_distance(mission, inv, guard)
        habitat_bonus = HABITAT_BONUS if inv["fuel"]["phase"] in mission.fuel_phases else 0.0
        dust_bonus = DUST_BONUS if inv["fuel"]["phase"] == "dust" and mission.habitat in DUST_HABITATS else 0.0
        score = (1.0 / (1.0 + distance) if distance is not None else 0.0) + habitat_bonus + dust_bonus
        out.append({
            "id": inv["id"],
            "score": round(score, 4),
            "why": _why(inv, distance, nearest, overall_badge, habitat_bonus, dust_bonus),
        })
    return sorted(out, key=lambda r: r["score"], reverse=True)
