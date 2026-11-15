# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Compare and relevance ranking. Owner: Kishan."""
from __future__ import annotations

from ..data_io import load_tested_conditions

COMPARE_KEYS = ["hardware", "fuel.phase", "conditions.g", "pillars", "sensors"]
HABITAT_BONUS = 0.2


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
    rows = [r for r in all_rows if r["investigation"] == inv_id]
    if not rows:
        return None, None
    distances = [guard.distance_to(mission, r) for r in rows]
    i = min(range(len(rows)), key=lambda k: distances[k])
    return distances[i], rows[i]["test_id"]


def _why(inv: dict, distance, nearest, overall_badge: str, habitat_bonus: float) -> str:
    phase = inv["fuel"]["phase"]
    pillars = ", ".join(inv.get("pillars", [])) or "unclassified"
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
        habitat_bonus = HABITAT_BONUS if inv["fuel"]["phase"] in mission.fuel_phases else 0.0
        score = (1.0 / (1.0 + distance) if distance is not None else 0.0) + habitat_bonus
        out.append({
            "id": inv["id"],
            "score": round(score, 4),
            "why": _why(inv, distance, nearest, overall_badge, habitat_bonus),
        })
    return sorted(out, key=lambda r: r["score"], reverse=True)
