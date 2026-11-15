// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Experiment explorer + side-by-side compare. Owner: Kishan (built by Sibi with his OK; data: Sibi).
// Cards from /api/investigations; pick two cards to compare via /api/compare.
import React, { useEffect, useState } from "react";
import { compare, listInvestigations } from "../api.js";

const FIELD_LABELS = {
  hardware: "Hardware", "fuel.phase": "Fuel phase", "conditions.g": "Gravity (g)", pillars: "Pillars", sensors: "Sensors",
};

function fmt(v) {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length === 2 && v.every((x) => typeof x === "number") ? `${v[0]} – ${v[1]}` : v.join(", ");
  return String(v);
}

function conditionsLine(c = {}) {
  const parts = [];
  if (c.o2_frac != null) parts.push(`O₂ ${fmt(c.o2_frac)}`);
  if (c.pressure_atm != null) parts.push(`${fmt(c.pressure_atm)} atm`);
  if (c.flow_cm_s != null) parts.push(`flow ${fmt(c.flow_cm_s)} cm/s`);
  if (c.g != null) parts.push(`${fmt(c.g)} g`);
  return parts.join(" · ");
}

function List({ title, items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div className="small muted">{title}</div>
      <ul className="small" style={{ margin: "2px 0 0", paddingLeft: 18 }}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}

function Card({ inv, open, onToggle, picked, onPick, pickDisabled }) {
  const empty = !inv.objective || inv.key_findings?.length === 0;
  return (
    <article className="card" style={picked ? { borderColor: "var(--accent)" } : undefined}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <h3>{inv.id}</h3>
        <span className="small" title={inv.verified ? "Every field checked against the cited sources" : "Not yet checked against the sources"}>
          {inv.verified ? "✅ verified" : "⚪ unverified"}
        </span>
      </div>
      <div className="small muted" style={{ marginBottom: 6 }}>{inv.name}</div>
      <div>
        {inv.pillars.map((p) => <span key={p} className="chip on">{p}</span>)}
        <span className="chip">{inv.fuel?.phase}</span>
      </div>
      {empty ? (
        <p className="small muted">No summary data yet.</p>
      ) : (
        <>
          <p className="small" style={{ margin: "6px 0" }}>{inv.objective}</p>
          <div className="small muted">{conditionsLine(inv.conditions)}</div>
          {inv.fuel?.names?.length > 0 && <div className="small muted">Fuels: {inv.fuel.names.join(", ")}</div>}
        </>
      )}
      {open && !empty && (
        <div>
          <List title="Hardware" items={[inv.hardware]} />
          <List title="Varied" items={inv.varied} />
          <List title="Held constant" items={inv.held_constant} />
          <List title="Sensors" items={inv.sensors} />
          <List title="Key findings" items={inv.key_findings} />
          <List title="Sources" items={inv.sources} />
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {!empty && <button className="btn small" onClick={onToggle}>{open ? "Less" : "Details"}</button>}
        <button className={`btn small ${picked ? "on" : ""}`} onClick={onPick} disabled={!picked && pickDisabled}>
          {picked ? "✓ Comparing" : "Compare"}
        </button>
      </div>
    </article>
  );
}

function CompareTable({ a, b, result }) {
  const rows = [...result.same.map((r) => ({ ...r, same: true })), ...result.different.map((r) => ({ ...r, same: false }))];
  return (
    <div className="card section">
      <h3>{a} vs {b}</h3>
      <table className="dash-table">
        <thead><tr><th style={{ width: 130 }}>Field</th><th>{a}</th><th>{b}</th><th style={{ width: 90 }}></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.field}>
              <td>{FIELD_LABELS[r.field] ?? r.field}</td>
              <td className="small">{fmt(r.a)}</td>
              <td className="small">{fmt(r.b)}</td>
              <td className="small">{r.same ? <span className="muted">same</span> : <b style={{ color: "var(--accent)" }}>different</b>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Explorer() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState(null);
  const [open, setOpen] = useState({});
  const [picked, setPicked] = useState([]);
  const [cmp, setCmp] = useState(null);
  const [pillar, setPillar] = useState(null);

  useEffect(() => { listInvestigations().then(setItems).catch((e) => setErr(String(e))); }, []);

  useEffect(() => {
    setCmp(null);
    if (picked.length !== 2) return;
    compare(picked[0], picked[1]).then(setCmp).catch((e) => setCmp({ error: e.message }));
  }, [picked]);

  const togglePick = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-2)));

  if (err) return <section className="screen"><h2>Experiment explorer</h2><p className="muted">Backend not reachable: {err}</p></section>;
  if (!items) return <section className="screen"><h2>Experiment explorer</h2><p className="muted">Loading…</p></section>;

  const shown = pillar ? items.filter((i) => i.pillars.includes(pillar)) : items;
  const nVerified = items.filter((i) => i.verified).length;

  return (
    <section className="screen">
      <h2>Experiment explorer</h2>
      <p className="lede">
        {items.length} NASA PSI combustion investigations, {nVerified} with summaries verified against their sources.
        Pick two cards to compare them side by side.
      </p>

      <div className="section" style={{ margin: "0 0 14px" }}>
        {[null, "prevention", "detection", "suppression"].map((p) => (
          <button key={p ?? "all"} className={`btn ${pillar === p ? "on" : ""}`} style={{ marginRight: 6 }} onClick={() => setPillar(p)}>
            {p ?? "All"}
          </button>
        ))}
      </div>

      {picked.length === 2 && cmp && (cmp.error
        ? <p className="small" style={{ color: "var(--accent)" }}>Compare failed: {cmp.error}</p>
        : <CompareTable a={picked[0]} b={picked[1]} result={cmp} />)}
      {picked.length === 1 && <p className="small muted">Comparing {picked[0]}: pick one more card.</p>}

      <div className="cards">
        {shown.map((inv) => (
          <Card
            key={inv.id}
            inv={inv}
            open={!!open[inv.id]}
            onToggle={() => setOpen({ ...open, [inv.id]: !open[inv.id] })}
            picked={picked.includes(inv.id)}
            onPick={() => togglePick(inv.id)}
            pickDisabled={false}
          />
        ))}
      </div>
    </section>
  );
}
