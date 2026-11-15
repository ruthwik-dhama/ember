# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Witness agents: one per investigation, retrieve only from data/witness_docs/<ID>.md. Owner: Sibi.

Every claim must carry a citation; uncited claims are dropped. Keyword search first, embeddings optional.
"""
from __future__ import annotations


def ask(question: str, investigation_id: str = None) -> list:
    """Returns [{witness, answer, citations: [...]}, ...]."""
    raise NotImplementedError("data lane (Sibi)")
