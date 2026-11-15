# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Data-lane deck numbers: badge coverage and witness accuracy. Owner: Sibi.

Kishan's scripts/metrics.py merges these into deck_numbers.json:

    from ember.envelope.metrics import deck_metrics
    numbers.update(deck_metrics())

Every entry has the deck_numbers shape {value, badge, calibration_status} plus a "note" saying how it was
computed, so a slide footnote can quote it. All of it runs offline (no API calls).
"""
from __future__ import annotations

from ..data_io import load_calibration

STATUS_TO_BADGE = {"measured": "green", "fitted": "yellow", "assumed": "red"}


def badge_coverage() -> dict:
    """Share of simulator constants in calibration.csv by badge (README honesty rule 1: badges come from status).

    Returns {"green": pct, "yellow": pct, "red": pct, "counts": {...}, "n": total}, percentages rounded to 0.1.
    """
    counts = {"green": 0, "yellow": 0, "red": 0}
    for row in load_calibration().values():
        counts[STATUS_TO_BADGE[row["status"]]] += 1
    n = sum(counts.values())
    pct = {b: round(100.0 * c / n, 1) if n else 0.0 for b, c in counts.items()}
    return {**pct, "counts": counts, "n": n}


def deck_metrics() -> dict:
    """The five data-lane entries of deck_numbers.json."""
    from ..agents.witness import evaluate  # local import: keeps envelope importable without the witness data

    cov = badge_coverage()
    c, n = cov["counts"], cov["n"]
    cov_note = (f"calibration.csv: {c['green']} measured, {c['yellow']} fitted, {c['red']} assumed "
                f"of {n} constants (measured=green, fitted=yellow, assumed=red)")

    ev = evaluate()
    ev_note = (f"offline keyword retrieval on data/witness_eval.json ({ev['n']} questions); "
               f"no-retrieval LLM baseline not run")

    def entry(value, note):
        # These are counts over our own files, so the number itself is exact (not a physics estimate).
        return {"value": value, "badge": "green", "calibration_status": "measured", "note": note}

    return {
        "badge_coverage_green_pct": entry(cov["green"], cov_note),
        "badge_coverage_yellow_pct": entry(cov["yellow"], cov_note),
        "badge_coverage_red_pct": entry(cov["red"], cov_note),
        "witness_accuracy": entry(round(ev["witness_accuracy"], 3),
                                  f"top witness is the expected one; {ev_note}; "
                                  f"expected-fact recall {ev['fact_recall']:.2f}"),
        "witness_citation_rate": entry(round(ev["citation_rate"], 3),
                                       f"share of answers where every fact carries a citation; {ev_note}"),
    }
