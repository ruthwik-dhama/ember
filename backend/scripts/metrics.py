# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Writes deck_numbers.json (repo root). Owner: Kishan. Run from backend/: python -m scripts.metrics

No number goes on a slide unless it comes from this file. Every entry: {value, badge, calibration_status}.
"""
from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "deck_numbers.json"
METRICS = [
    "red_vs_random_median_s",          # same sim budget, median over 5+ seeds
    "baseline_mean_delay_s", "baseline_worst_case_delay_s",
    "blue_mean_delay_s", "blue_worst_case_delay_s",  # same scenario set for both layouts
    "gravity_delay_s_0g", "gravity_delay_s_moon", "gravity_delay_s_mars", "gravity_delay_s_1g",
    "dust_false_alarm_rate_single", "dust_false_alarm_rate_two_moment",
    "false_all_clear_rate",            # liquid fuels only
    "badge_coverage_green_pct", "badge_coverage_yellow_pct", "badge_coverage_red_pct",
    "witness_accuracy", "witness_citation_rate",
]


def main():
    numbers = {m: {"value": None, "badge": None, "calibration_status": None} for m in METRICS}
    OUT.write_text(json.dumps(numbers, indent=2) + "\n")
    print(f"wrote {OUT} ({len(numbers)} metrics, all placeholders)")


if __name__ == "__main__":
    main()
