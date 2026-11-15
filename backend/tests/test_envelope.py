# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Envelope Guard tests. Owner: Sibi.

Setup: a small synthetic set of tested rows (not the real CSV), so these tests don't break as
real data is added. One test also loads the real CSV to check the loader and contract shape.
"""
import pytest

from ember.config import Mission
from ember.envelope.guard import D_GREEN, EnvelopeGuard

ROWS = [
    {"test_id": "A", "o2_frac": 0.21, "pressure_kpa": 101.3, "flow_cm_s": 0.0, "g": 0.0},
    {"test_id": "B", "o2_frac": 0.40, "pressure_kpa": 101.3, "flow_cm_s": 8.0, "g": 0.0},
    {"test_id": "C", "o2_frac": 0.21, "pressure_kpa": 70.9, "flow_cm_s": 20.0, "g": 1.0},
    {"test_id": "D", "o2_frac": 0.30, "pressure_kpa": 303.9, "flow_cm_s": 0.0, "g": 1.0},
]


@pytest.fixture
def guard():
    return EnvelopeGuard(ROWS)


def cond(o2=0.21, p=101.3, u=0.0, g=0.0):
    return {"o2_frac": o2, "pressure_kpa": p, "flow_cm_s": u, "g": g}


def test_exact_tested_row_is_green(guard):
    r = guard.check(cond())
    assert r == {"badge": "green", "distance": pytest.approx(0.0), "nearest": "A", "outside_axes": []}


def test_partial_g_is_never_green(guard):
    # Same O2/pressure/flow as a tested row, but lunar g: yellow by rule.
    r = guard.check(cond(g=0.165))
    assert r["badge"] == "yellow" and r["distance"] < D_GREEN


def test_inside_ranges_but_far_from_rows_is_yellow(guard):
    assert guard.check(cond(o2=0.30, p=150.0, u=4.0, g=0.0))["badge"] == "yellow"


def test_outside_o2_range_is_red(guard):
    r = guard.check(cond(o2=0.60))
    assert r["badge"] == "red" and r["outside_axes"] == ["o2_frac"]


def test_outside_g_range_is_red():
    zero_g_only = EnvelopeGuard([ROWS[0], ROWS[1]])
    r = zero_g_only.check(cond(g=0.38))
    assert r["badge"] == "red" and "g" in r["outside_axes"]


def test_accepts_mission_objects(guard):
    # Mission has no flow field yet; guard falls back to DEFAULT_FLOW_CM_S.
    r = guard.check(Mission())
    assert set(r) == {"badge", "distance", "nearest", "outside_axes"}
    assert guard.distance_to(Mission(), ROWS[0]) >= 0.0


def test_distance_to_matches_check(guard):
    c = cond(o2=0.25, u=3.0)
    best = min(guard.distance_to(c, row) for row in ROWS)
    assert best == pytest.approx(guard.check(c)["distance"])


def test_gap_map_shape_and_counts(guard):
    gm = guard.gap_map(pressure_kpa=101.3, g=0.0, n=5)
    assert len(gm["o2_values"]) == len(gm["flow_values"]) == 5
    assert len(gm["cells"]) == 5 and all(len(row) == 5 for row in gm["cells"])
    assert sum(gm["counts"].values()) == 25
    assert {b for row in gm["cells"] for b in row} <= {"green", "yellow", "red"}
    assert gm["counts"]["red"] > 0  # default grid reaches past the tested O2 / flow ranges


def test_real_csv_loads():
    r = EnvelopeGuard().check(cond())
    assert r["badge"] in ("green", "yellow", "red")
