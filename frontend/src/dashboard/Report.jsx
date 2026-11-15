// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Insights report: risks, fixes, data gaps, Earth applications; export. Owner: Kishan (built by Sibi with his OK).
// Data: GET /api/report. Every number carries its Envelope Guard badge.
import React, { useEffect, useState } from "react";
import { report as getReport } from "../api.js";
import Badge from "../components/Badge.jsx";
import GapMap from "../panels/data/GapMap.jsx";

const HABITAT = { spacecraft: "Spacecraft", iss: "ISS", moon_base: "Moon base", mars_base: "Mars base", rover: "Pressurized rover" };

function Unavailable({ section }) {
  return <p className="small muted">Not available yet: {section.reason}</p>;
}

function download(rep) {
  const blob = new Blob([JSON.stringify(rep, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `ember-report-${rep.mission.habitat}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function Report() {
  const [rep, setRep] = useState(null);
  const [err, setErr] = useState(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 3000);
    getReport().then(setRep).catch((e) => setErr(e.message)).finally(() => clearTimeout(t));
    return () => clearTimeout(t);
  }, []);

  if (err) return <section className="screen"><h2>Insights report</h2><p className="muted">Backend not reachable: {err}</p></section>;
  if (!rep) {
    return (
      <section className="screen">
        <h2>Insights report</h2>
        <p className="muted">Building the report…</p>
        {slow && <p className="small muted">Running the Red vs Blue duel for this mission. A new mission takes about a minute the first time; after that it's cached.</p>}
      </section>
    );
  }

  const m = rep.mission;
  const risks = rep.top_risks, fixes = rep.recommended_fixes;
  const top = rep.top_investigations.filter((r) => r.score > 0).slice(0, 3);

  return (
    <section className="screen">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2>Insights report</h2>
          <p className="lede">
            {HABITAT[m.habitat] ?? m.habitat}: {(m.o2_frac * 100).toFixed(1)}% O₂, {m.pressure_kpa} kPa, {m.g} g,
            vents {m.vent_on ? "on" : "off"}, materials {m.materials.join(", ")}.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => download(rep)}>Export JSON</button>
          <button className="btn" onClick={() => window.print()}>Print / PDF</button>
        </div>
      </div>

      <div className="section">
        <h3>Top risks <span className="small muted">(Red team: hardest-to-detect fires)</span></h3>
        {Array.isArray(risks) ? (
          risks.length ? (
            <ol className="small" style={{ paddingLeft: 20 }}>
              {risks.map((r, i) => (
                <li key={i} style={{ marginBottom: 4 }}>
                  {r.why} <Badge status={r.badge} source="Envelope Guard (duel conditions)" nearest="see Habitat screen" />
                </li>
              ))}
            </ol>
          ) : <p className="small muted">The duel found no undetected or slow-to-detect fires.</p>
        ) : <Unavailable section={risks} />}
      </div>

      <div className="section">
        <h3>Recommended fixes <span className="small muted">(Blue team countermeasures)</span></h3>
        {Array.isArray(fixes) ? (
          <ul className="small" style={{ paddingLeft: 20 }}>
            {fixes.map((f, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {f.text.replace(/(\d+\.\d)\d+/g, "$1")} <Badge status={f.badge} source="Envelope Guard (duel conditions)" nearest="see Habitat screen" />
                {f.ghost_flame && (
                  <div className="muted">
                    Ghost Flame check: {f.ghost_flame.applicable === false
                      ? f.ghost_flame.note
                      : f.ghost_flame.false_all_clear ? "⚠️ possible cool flame after suppression (false all-clear risk)" : "no cool-flame risk"}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : <Unavailable section={fixes} />}
      </div>

      <div className="section">
        <h3>Most relevant investigations</h3>
        {top.length ? (
          <ol className="small" style={{ paddingLeft: 20 }}>{top.map((r) => <li key={r.id} style={{ marginBottom: 4 }}><b>{r.id}</b>: {r.why}</li>)}</ol>
        ) : <p className="small muted">No investigation has tested conditions near this mission.</p>}
      </div>

      <div className="section">
        <GapMap data={rep.data_gaps} />
      </div>

      <div className="section">
        <h3>Earth applications</h3>
        <ul className="small" style={{ paddingLeft: 20 }}>{rep.earth_applications.map((e) => <li key={e}>{e}</li>)}</ul>
      </div>
    </section>
  );
}
