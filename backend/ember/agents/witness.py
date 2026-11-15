# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Witness agents: one per investigation, retrieving only from data/witness_docs/<ID>.md. Owner: Sibi.

Rules (README > Scientific honesty):
- A witness only speaks from its own file. Every fact in the file ends in a [citation]; lines without one
  are never loaded, so an uncited claim can't reach an answer.
- Retrieval is keyword search (TF-IDF overlap), no embeddings. It works offline.
- Optional phrasing by Claude rewrites the retrieved facts into prose. Every sentence it returns must cite
  a retrieved fact as [n]; uncited sentences are dropped, and if nothing survives the offline answer is used.
  Phrased answers are cached in data/llm_cache/witness.json, so the demo works without network.

Public API:
    ask(question, investigation_id=None) -> [{witness, answer, citations, facts, score, mode}, ...]
    ask_ember(question) -> {question, answers, mode}          # what POST /api/ask should return
    evaluate(questions=None) -> {n, witness_accuracy, fact_recall, citation_rate, rows}
"""
from __future__ import annotations

import hashlib
import json
import math
import os
import re
from dataclasses import dataclass
from functools import lru_cache
from typing import Dict, List, Optional

from ..data_io import DATA_DIR

WITNESS_DIR = DATA_DIR / "witness_docs"
CACHE_PATH = DATA_DIR / "llm_cache" / "witness.json"
EVAL_PATH = DATA_DIR / "witness_eval.json"

TOP_FACTS = 3          # facts each witness returns
TOP_WITNESSES = 3      # witnesses ask() returns when no investigation is named
MIN_SCORE = 1.0        # below this a fact isn't relevant enough to cite
NAME_BOOST = 4.0       # added when the question names the investigation

LLM_MODEL = "claude-opus-5-5"

FACT_RE = re.compile(r"^\s*-\s+(?P<text>.+?)\s*\[(?P<cite>[^\[\]]+)\]\s*$")
TOKEN_RE = re.compile(r"[a-z0-9]+(?:\.[0-9]+)?")
STOP = set("""a an and are as at be by can did do does for from has have how in into is it its of on or
that the their them then there these this those to was were what when where which who why will with would
about after all also any been between both but each more most much not only other our out over same such than
under up very we you your experiment experiments test tests tested investigation""".split())
SYNONYMS = {"o2": "oxygen", "oxyg": "oxygen", "co2": "carbon", "detector": "detect", "detection": "detect",
            "detected": "detect", "extinguish": "extinction", "extinguished": "extinction",
            "flammable": "flammability", "particle": "particl", "particulate": "particl", "size": "diamet",
            "sizes": "diamet", "diameter": "diamet", "diameters": "diamet", "dust": "dust", "dusty": "dust",
            "ventilation": "flow", "airflow": "flow", "velocity": "flow", "ages": "aging", "aged": "aging",
            "age": "aging", "background": "background", "clean": "background", "cleaner": "background",
            "bigger": "grow", "larger": "grow", "grew": "grow", "growth": "grow", "increase": "grow",
            "increased": "grow", "travel": "transport", "travels": "transport", "move": "transport",
            "big": "diamet", "tiny": "diamet"}

# Names a question may use for each witness. Uppercase-only aliases are matched case-sensitively,
# so the English word "same" doesn't summon the SAME witness.
ALIASES = {
    "SAME": ["SAME", "SAME-R", "SAME-2", "smoke aerosol"],
    "DAFT": ["DAFT", "p-trak", "ptrak", "dust and aerosol"],
    "ACME": ["ACME", "BRE", "burning rate emulator", "CFI-G", "E-FIELD", "s-Flame", "gaseous flame"],
    "FLEX": ["FLEX", "FLEX-2", "droplet", "cool flame"],
}


@dataclass(frozen=True)
class Fact:
    witness: str
    text: str
    citation: str
    tokens: frozenset


def _stem(tok: str) -> str:
    if tok in SYNONYMS:
        return SYNONYMS[tok]
    for suf in ("ing", "ed", "es", "s"):
        if len(tok) > len(suf) + 3 and tok.endswith(suf) and not tok.endswith("ss"):
            tok = tok[: -len(suf)]
            break
    return SYNONYMS.get(tok, tok)


def tokenize(text: str) -> List[str]:
    return [_stem(t) for t in TOKEN_RE.findall(text.lower()) if t not in STOP]


def parse_facts(witness: str, markdown: str) -> List[Fact]:
    """Facts are '- text [citation]' bullet lines. Anything without a trailing citation is dropped."""
    facts = []
    for line in markdown.splitlines():
        m = FACT_RE.match(line)
        if m:
            facts.append(Fact(witness, m["text"], m["cite"].strip(), frozenset(tokenize(m["text"]))))
    return facts


@lru_cache(maxsize=None)
def load_witnesses() -> Dict[str, List[Fact]]:
    return {p.stem: parse_facts(p.stem, p.read_text(encoding="utf-8")) for p in sorted(WITNESS_DIR.glob("*.md"))}


@lru_cache(maxsize=None)
def _idf() -> Dict[str, float]:
    facts = [f for fs in load_witnesses().values() for f in fs]
    df: Dict[str, int] = {}
    for f in facts:
        for t in f.tokens:
            df[t] = df.get(t, 0) + 1
    n = len(facts)
    return {t: math.log(1 + n / c) for t, c in df.items()}


def _named(question: str, witness: str) -> bool:
    for alias in ALIASES.get(witness, [witness]):
        if alias.isupper():  # acronyms like SAME, BRE, CFI-G: exact case, whole word
            if re.search(rf"(?<![A-Za-z]){re.escape(alias)}(?![A-Za-z])", question):
                return True
        elif alias.lower() in question.lower():
            return True
    return False


def retrieve(question: str, witness: str, k: int = TOP_FACTS) -> List[tuple]:
    """[(score, Fact), ...] best first, only facts with keyword overlap above MIN_SCORE."""
    q = set(tokenize(question))
    idf = _idf()
    boost = NAME_BOOST if _named(question, witness) else 0.0
    scored = []
    for f in load_witnesses().get(witness, []):
        overlap = sum(idf.get(t, 0.0) for t in q & f.tokens)
        if overlap > 0 and overlap + boost >= MIN_SCORE:
            scored.append((overlap + boost, f))
    scored.sort(key=lambda sf: -sf[0])
    return scored[:k]


def _offline_answer(facts: List[Fact]) -> str:
    return " ".join(f"{f.text} [{i}]" for i, f in enumerate(facts, 1))


# ---- optional Claude phrasing (cached) ---------------------------------------------------------------
def _cache_key(witness: str, question: str, facts: List[Fact]) -> str:
    blob = json.dumps([LLM_MODEL, witness, question.strip().lower(), [f.text for f in facts]])
    return hashlib.sha256(blob.encode()).hexdigest()[:24]


def _read_cache() -> dict:
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _write_cache(key: str, value: str) -> None:
    cache = _read_cache()
    cache[key] = value
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(cache, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def keep_cited_sentences(text: str, n_facts: int) -> str:
    """Drop any sentence that doesn't cite at least one valid [n]. Citation-only fragments are dropped too."""
    kept = []
    for sent in re.split(r"(?<=[.!?\]])\s+", text.strip()):
        refs = [int(r) for r in re.findall(r"\[(\d+)\]", sent)]
        if refs and all(1 <= r <= n_facts for r in refs) and re.sub(r"\[\d+\]", "", sent).strip(" .,;"):
            kept.append(sent)
    return " ".join(kept)


def _live_llm_enabled() -> bool:
    return bool(os.environ.get("ANTHROPIC_API_KEY")) and os.environ.get("EMBER_OFFLINE") != "1"


def _phrase_with_claude(witness: str, question: str, facts: List[Fact]) -> Optional[str]:
    try:
        import anthropic
    except ImportError:
        return None
    numbered = "\n".join(f"[{i}] {f.text}" for i, f in enumerate(facts, 1))
    system = (f"You are the {witness} witness in a NASA fire-safety dashboard. Answer the question in 1 to 3 "
              "short sentences using ONLY the numbered facts provided. End every sentence with the number of "
              "the fact it comes from, like [1]. Do not add numbers, claims or context that are not in the "
              "facts. If the facts do not answer the question, say what they do cover, with citations.")
    try:
        client = anthropic.Anthropic()
        resp = client.beta.messages.create(
            model=LLM_MODEL,
            max_tokens=2000,
            system=system,
            output_config={"effort": "low"},
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            messages=[{"role": "user", "content": f"Facts:\n{numbered}\n\nQuestion: {question}"}],
        )
    except (anthropic.APIError, TypeError):  # TypeError: an older SDK without fallbacks/output_config
        return None
    if resp.stop_reason == "refusal":
        return None
    text = "".join(b.text for b in resp.content if b.type == "text")
    return keep_cited_sentences(text, len(facts)) or None


def _answer(witness: str, question: str, facts: List[Fact]) -> tuple:
    key = _cache_key(witness, question, facts)
    cached = _read_cache().get(key)
    if cached:
        return cached, "cached"
    if _live_llm_enabled():
        phrased = _phrase_with_claude(witness, question, facts)
        if phrased:
            _write_cache(key, phrased)
            return phrased, "live"
    return _offline_answer(facts), "offline"


# ---- public API ----------------------------------------------------------------------------------------
def ask(question: str, investigation_id: str = None) -> list:
    """Returns [{witness, answer, citations: [{n, source, fact}], facts, score, mode}, ...], best witness first.

    With investigation_id, only that witness answers. Empty list means no witness has cited data on it.
    """
    witnesses = [investigation_id] if investigation_id else list(load_witnesses())
    results = []
    for w in witnesses:
        hits = retrieve(question, w)
        if not hits:
            continue
        facts = [f for _, f in hits]
        answer, mode = _answer(w, question, facts)
        results.append({
            "witness": w,
            "answer": answer,
            "citations": [{"n": i, "source": f.citation, "fact": f.text} for i, f in enumerate(facts, 1)],
            "facts": [f.text for f in facts],
            "score": round(hits[0][0], 3),
            "mode": mode,
        })
    results.sort(key=lambda r: -r["score"])
    return results if investigation_id else results[:TOP_WITNESSES]


def ask_ember(question: str) -> dict:
    """Response body for POST /api/ask."""
    answers = ask(question)
    return {
        "question": question,
        "answers": answers,
        "mode": answers[0]["mode"] if answers else "offline",
        "note": None if answers else "No witness has cited PSI data on this question.",
    }


def evaluate(questions: Optional[list] = None) -> dict:
    """Witness accuracy on data/witness_eval.json (offline retrieval, no LLM).

    witness_accuracy: top witness is the expected one. fact_recall: expected fact text is among the cited facts.
    citation_rate: share of answers where every fact carries a citation (1.0 by construction; reported for the deck).
    """
    if questions is None:
        questions = json.loads(EVAL_PATH.read_text(encoding="utf-8"))["questions"]
    rows = []
    for q in questions:
        hits = ask(q["question"])
        top = hits[0] if hits else None
        cited = [c for h in hits for c in h["citations"]]
        rows.append({
            "id": q["id"],
            "witness_ok": bool(top) and top["witness"] == q["expected_witness"],
            "fact_ok": any(q["expected_fact_contains"].lower() in c["fact"].lower() for c in cited),
            "all_cited": bool(cited) and all(c["source"] for c in cited),
        })
    n = len(rows)
    return {
        "n": n,
        "witness_accuracy": sum(r["witness_ok"] for r in rows) / n,
        "fact_recall": sum(r["fact_ok"] for r in rows) / n,
        "citation_rate": sum(r["all_cited"] for r in rows) / n,
        "rows": rows,
    }
