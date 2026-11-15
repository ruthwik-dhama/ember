# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Compare and relevance ranking. Owner: Kishan."""
from __future__ import annotations

COMPARE_KEYS = ["hardware", "fuel.phase", "conditions.g", "pillars", "sensors"]


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


def rank(mission, investigations, guard, pillar=None) -> list:
    """Score = 1/(1 + nearest tested-condition distance) + habitat bonus; returns [{id, score, why}] sorted."""
    raise NotImplementedError("dashboard lane (Kishan)")
