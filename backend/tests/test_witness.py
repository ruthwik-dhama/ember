# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
"""Witness agent tests. Owner: Sibi.

Setup: offline only (EMBER_OFFLINE=1, no API key, cache redirected to a temp file), so CI never calls the
network. Facts come from the real data/witness_docs files except where a test builds its own markdown.
"""
import pytest

from ember.agents import witness as W


@pytest.fixture(autouse=True)
def offline(monkeypatch, tmp_path):
    monkeypatch.setenv("EMBER_OFFLINE", "1")
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setattr(W, "CACHE_PATH", tmp_path / "witness.json")


def test_uncited_lines_are_never_loaded():
    md = "# X\n- Cited claim about smoke. [NTRS 1]\n- Uncited claim about smoke.\nplain text [NTRS 2]\n"
    facts = W.parse_facts("X", md)
    assert [f.text for f in facts] == ["Cited claim about smoke."]
    assert facts[0].citation == "NTRS 1"


def test_every_returned_fact_has_a_citation():
    for hit in W.ask("How big are smoke particles in microgravity?"):
        assert hit["citations"] and all(c["source"] for c in hit["citations"])
        assert len(hit["citations"]) == len(hit["facts"])
        for c in hit["citations"]:
            assert f"[{c['n']}]" in hit["answer"]


def test_best_witness_answers_first():
    assert W.ask("How clean is ISS cabin air?")[0]["witness"] == "DAFT"
    assert W.ask("Do BRE flames self-extinguish in low oxygen?")[0]["witness"] == "ACME"


def test_named_investigation_only_asks_that_witness():
    hits = W.ask("What particle sizes were measured?", investigation_id="SAME")
    assert [h["witness"] for h in hits] == ["SAME"]


def test_off_topic_question_gets_no_answer():
    body = W.ask_ember("What is the best pizza topping?")
    assert body["answers"] == [] and body["note"]


def test_english_word_same_does_not_summon_same_witness():
    assert not W._named("Is the oxygen level the same as on Earth?", "SAME")
    assert W._named("What did SAME-R measure?", "SAME")


def test_llm_sentences_without_valid_citations_are_dropped():
    text = "Smoke was small [1]. Detectors may struggle. Dust is big [2]. Made-up claim [7]. [1]"
    assert W.keep_cited_sentences(text, n_facts=2) == "Smoke was small [1]. Dust is big [2]."


def test_offline_mode_without_key():
    hit = W.ask("Does the P-Trak work in microgravity?")[0]
    assert hit["mode"] == "offline"


def test_cached_phrasing_is_used_offline():
    q = "How clean is ISS cabin air?"
    facts = [f for _, f in W.retrieve(q, "DAFT")]
    W._write_cache(W._cache_key("DAFT", q, facts), "Cabin air is very clean [1].")
    hit = W.ask(q, investigation_id="DAFT")[0]
    assert hit["mode"] == "cached" and hit["answer"] == "Cabin air is very clean [1]."


def test_eval_set_accuracy():
    # 15 questions in data/witness_eval.json; offline keyword retrieval.
    r = W.evaluate()
    assert r["n"] >= 15
    assert r["witness_accuracy"] >= 0.9
    assert r["fact_recall"] >= 0.8
    assert r["citation_rate"] == 1.0
