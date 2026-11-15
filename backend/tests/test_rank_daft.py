# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Ranking of investigations that have no combustion rows (DAFT). Owner: Sibi (in Kishan's rank/, with his OK).

Setup: real data files; DAFT has no rows in tested_conditions.csv by design (it measured dust, not fire),
and its investigations.json conditions are O2 0.21, 1 atm, 0 g.
"""
from ember.api import guard
from ember.config import Mission
from ember.data_io import load_investigations, load_tested_conditions
from ember.rank import DUST_BONUS, rank


def _row(ranked, inv_id):
    return next(r for r in ranked if r["id"] == inv_id)


def test_daft_has_no_condition_rows_by_design():
    assert not [r for r in load_tested_conditions() if r["investigation"] == "DAFT"]


def test_daft_no_longer_scores_zero():
    for habitat in ("iss", "moon_base"):
        daft = _row(rank(Mission(habitat=habitat), load_investigations(), guard, pillar="detection"), "DAFT")
        assert daft["score"] > 0
        assert "false-alarm reference" in daft["why"]
        assert "no tested conditions logged" not in daft["why"]


def test_dust_bonus_only_on_dusty_habitats():
    invs = load_investigations()
    moon = _row(rank(Mission(habitat="moon_base"), invs, guard), "DAFT")
    iss = _row(rank(Mission(habitat="iss"), invs, guard), "DAFT")  # same g/O2/pressure, no dust
    assert abs((moon["score"] - iss["score"]) - DUST_BONUS) < 1e-3
    assert "airlock" in moon["why"] and "airlock" not in iss["why"]


def test_flight_suffixed_rows_count_for_their_investigation():
    # Rows are labelled SAME-R, BASS-II, FLEX-2; investigations.json uses SAME, BASS, FLEX.
    ranked = rank(Mission(), load_investigations(), guard)
    for inv_id, suffixed in (("SAME", "SAME-R"), ("BASS", "BASS-II"), ("FLEX", "FLEX-2")):
        rows = [r for r in load_tested_conditions() if r["investigation"] in (inv_id, suffixed)]
        best = min(guard.distance_to(Mission(), r) for r in rows)
        row = _row(ranked, inv_id)
        assert row["score"] > 0 and f"distance {best:.2f}" in row["why"], (inv_id, row["why"])
