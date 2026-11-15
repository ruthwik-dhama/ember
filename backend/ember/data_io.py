# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""SHARED loaders for everything in data/. Tell the team before changing return shapes.

Every physical constant lives in data/calibration.csv (name, value, unit, source, status).
Code should read constants through load_calibration(), never hard-code them.
"""
from __future__ import annotations

import csv
import json
from functools import lru_cache
from pathlib import Path
from typing import Dict, List

DATA_DIR = Path(__file__).resolve().parents[2] / "data"


@lru_cache(maxsize=None)
def load_calibration() -> Dict[str, dict]:
    """{name: {value: float, unit, source, status}}. status is measured | fitted | assumed."""
    out = {}
    with open(DATA_DIR / "calibration.csv", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            row["value"] = float(row["value"])
            out[row["name"]] = row
    return out


def cal(name: str) -> float:
    """Value of one calibration constant. Raises KeyError if it isn't in calibration.csv."""
    return load_calibration()[name]["value"]


@lru_cache(maxsize=None)
def load_tested_conditions() -> List[dict]:
    """One dict per real test condition (data/tested_conditions.csv), numeric columns as floats."""
    rows = []
    with open(DATA_DIR / "tested_conditions.csv", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            for k in ("o2_frac", "pressure_kpa", "flow_cm_s", "g"):
                row[k] = float(row[k])
            row["verified"] = row["verified"].strip().lower() == "true"
            rows.append(row)
    return rows


@lru_cache(maxsize=None)
def load_investigations() -> List[dict]:
    with open(DATA_DIR / "investigations.json", encoding="utf-8") as f:
        return json.load(f)


def load_witness_doc(investigation_id: str) -> str:
    return (DATA_DIR / "witness_docs" / f"{investigation_id}.md").read_text(encoding="utf-8")
