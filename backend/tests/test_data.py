# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Data-file checks. Owner: Sibi.

Setup: reads the real files in data/. These guard the scientific honesty rules: every row and
every witness fact carries a real citation, and statuses come from a fixed vocabulary.
Placeholder citations in other lanes' rows are reported, not failed, until Checkpoint 2.
"""
import re

import pytest

from ember.data_io import DATA_DIR, load_calibration, load_investigations, load_tested_conditions, load_witness_doc

SIBI_INVESTIGATIONS = {"SAME", "SAME-R", "DAFT", "ACME"}
PLACEHOLDER = re.compile(r"X{4,}")
INV_KEYS = {"id", "name", "objective", "hardware", "fuel", "conditions", "varied", "held_constant",
            "sensors", "pillars", "key_findings", "sources"}


def test_tested_conditions_rows_are_physical():
    for r in load_tested_conditions():
        assert 0.0 < r["o2_frac"] <= 1.0, r["test_id"]
        assert r["pressure_kpa"] > 0.0, r["test_id"]
        assert r["flow_cm_s"] >= 0.0, r["test_id"]
        assert r["g"] in (0.0, 0.165, 0.38, 1.0), r["test_id"]
        assert r["citation"].strip(), r["test_id"]


def test_test_ids_are_unique():
    ids = [r["test_id"] for r in load_tested_conditions()]
    assert len(ids) == len(set(ids))


def test_data_lane_rows_have_real_citations():
    rows = [r for r in load_tested_conditions() if r["investigation"] in SIBI_INVESTIGATIONS]
    assert rows, "data lane has no condition rows"
    bad = [r["test_id"] for r in rows if PLACEHOLDER.search(r["citation"])]
    assert not bad, f"placeholder citations: {bad}"


def test_calibration_status_vocabulary_and_sources():
    for name, row in load_calibration().items():
        assert row["status"] in ("measured", "fitted", "assumed"), name
        assert row["source"].strip(), name


@pytest.mark.parametrize("inv_id", ["SAME", "DAFT", "ACME"])
def test_data_lane_investigations_are_filled(inv_id):
    inv = next(i for i in load_investigations() if i["id"] == inv_id)
    assert INV_KEYS <= set(inv)
    assert inv["fuel"]["names"] and inv["sensors"] and inv["key_findings"] and inv["sources"]


@pytest.mark.parametrize("inv_id", ["SAME", "DAFT", "ACME", "FLEX"])
def test_every_witness_fact_is_cited(inv_id):
    facts = [ln for ln in load_witness_doc(inv_id).splitlines() if ln.startswith("- ")]
    assert 5 <= len(facts) <= 16, f"{inv_id}: {len(facts)} facts"
    uncited = [f for f in facts if not re.search(r"\[[^\]]+\]\s*$", f)]
    assert not uncited, uncited


def test_every_investigation_with_a_witness_doc_exists():
    ids = {i["id"] for i in load_investigations()}
    for path in (DATA_DIR / "witness_docs").glob("*.md"):
        assert path.stem in ids, path.name
