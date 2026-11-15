# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Data-lane deck numbers. Owner: Sibi.

Setup: real data files, offline witnesses (no API key). Checks the shape metrics.py expects and that the
numbers are derived from calibration.csv and the eval set, never typed by hand.
"""
import pytest

from ember.data_io import load_calibration
from ember.envelope.metrics import STATUS_TO_BADGE, badge_coverage, deck_metrics

KEYS = {"badge_coverage_green_pct", "badge_coverage_yellow_pct", "badge_coverage_red_pct",
        "witness_accuracy", "witness_citation_rate"}


@pytest.fixture(autouse=True)
def offline(monkeypatch):
    monkeypatch.setenv("EMBER_OFFLINE", "1")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)


def test_coverage_matches_calibration_statuses():
    cov = badge_coverage()
    statuses = [r["status"] for r in load_calibration().values()]
    assert cov["n"] == len(statuses)
    for status, badge in STATUS_TO_BADGE.items():
        assert cov["counts"][badge] == statuses.count(status)
    assert sum(cov[b] for b in ("green", "yellow", "red")) == pytest.approx(100.0, abs=0.2)


def test_deck_metrics_shape_for_metrics_py():
    out = deck_metrics()
    assert set(out) == KEYS
    for name, e in out.items():
        assert {"value", "badge", "calibration_status"} <= set(e), name
        assert e["value"] is not None and e["note"], name


def test_witness_numbers_come_from_eval():
    out = deck_metrics()
    assert 0.0 <= out["witness_accuracy"]["value"] <= 1.0
    assert out["witness_citation_rate"]["value"] == 1.0
