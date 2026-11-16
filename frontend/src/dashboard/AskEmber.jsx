// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Ask EMBER: chat with clickable citations. Owner: Kishan (witnesses: Sibi).
// POST /api/ask -> {question, answers: [{witness, answer, citations: [{n, source, fact}]}], note}.
// The backend ranks up to three witnesses; only the best match (answers[0]) is shown.
// The [n] markers inside `answer` match citations[n-1]; clicking one jumps to that citation and highlights it.
import React, { useRef, useState } from "react";
import { ask } from "../api.js";

const CITE_RE = /\[(\d+)\]/g;

function citeId(exchangeIdx, answerIdx, n) {
  return `cite-${exchangeIdx}-${answerIdx}-${n}`;
}

function AnswerText({ text, exchangeIdx, answerIdx }) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(CITE_RE)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const n = m[1];
    parts.push(
      <button
        key={`${m.index}`}
        className="cite-marker"
        onClick={() => {
          const el = document.getElementById(citeId(exchangeIdx, answerIdx, n));
          if (!el) return;
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          el.classList.add("cite-flash");
          setTimeout(() => el.classList.remove("cite-flash"), 1200);
        }}
        title={`Jump to citation ${n}`}
      >
        [{n}]
      </button>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <p style={{ margin: "4px 0" }}>{parts}</p>;
}

function Answer({ a, exchangeIdx, answerIdx }) {
  return (
    <div style={{ marginTop: answerIdx > 0 ? 12 : 0 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>
        Witness: <b style={{ color: "var(--fg)" }}>{a.witness}</b>
        {a.mode && a.mode !== "offline" && <span> &middot; {a.mode}</span>}
      </div>
      <AnswerText text={a.answer} exchangeIdx={exchangeIdx} answerIdx={answerIdx} />
      <ol style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: 12.5, color: "var(--muted)" }}>
        {a.citations.map((c) => (
          <li key={c.n} id={citeId(exchangeIdx, answerIdx, c.n)} style={{ marginBottom: 2 }}>
            {c.fact} <i>[{c.source}]</i>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function AskEmber() {
  const [question, setQuestion] = useState("");
  const [exchanges, setExchanges] = useState([]); // [{question, answers, note}, ...]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const listRef = useRef(null);

  async function submit(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    try {
      const body = await ask(q);
      setExchanges((prev) => [...prev, body]);
      setQuestion("");
      requestAnimationFrame(() => listRef.current?.scrollTo(0, listRef.current.scrollHeight));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2 style={{ fontSize: 17, margin: "0 0 4px" }}>Ask EMBER</h2>
      <p style={{ color: "var(--muted)", margin: "0 0 12px", fontSize: 13 }}>
        Answers come only from witness agents citing real PSI data. Click a <code>[n]</code> marker to see its source.
      </p>

      <div ref={listRef} style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
        {exchanges.map((ex, i) => (
          <div key={i} style={{ borderTop: i > 0 ? "1px solid var(--line)" : "none", paddingTop: i > 0 ? 10 : 0 }}>
            <p style={{ margin: "0 0 6px", fontWeight: 600 }}>{ex.question}</p>
            {ex.answers.length === 0 ? (
              <p style={{ color: "var(--muted)", fontStyle: "italic" }}>{ex.note}</p>
            ) : (
              <Answer a={ex.answers[0]} exchangeIdx={i} answerIdx={0} />
            )}
          </div>
        ))}
        {exchanges.length === 0 && !loading && (
          <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
            Try: "How big are smoke particles in microgravity?"
          </p>
        )}
      </div>

      {error && <p style={{ color: "var(--accent)" }}>Backend not reachable: {error}</p>}

      <form onSubmit={submit} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about a PSI investigation..."
          style={{ flex: 1, background: "var(--bg)", color: "var(--fg)", border: "1px solid var(--line)",
                   borderRadius: 6, padding: "8px 10px" }}
        />
        <button type="submit" className="primary" disabled={loading || !question.trim()}>
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>
    </section>
  );
}
