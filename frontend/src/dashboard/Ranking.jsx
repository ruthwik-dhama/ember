// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Ranking: investigations ranked for the current mission, filterable by fire-safety pillar.
// Owner: Kishan (built by Sibi with his OK). Data: GET /api/rank?pillar= and GET /api/mission.
import React, { useEffect, useState } from "react";
import { getMission, rank } from "../api.js";

const PILLARS = [null, "prevention", "detection", "suppression"];
const HABITAT = { spacecraft: "Spacecraft", iss: "ISS", moon_base: "Moon base", mars_base: "Mars base", rover: "Pressurized rover" };

export default function Ranking() {
  const [pillar, setPillar] = useState(null);
  const [rows, setRows] = useState(null);
  const [mission, setMissionState] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => { getMission().then((d) => setMissionState(d.mission)).catch(() => {}); }, []);
  useEffect(() => {
    setRows(null);
    rank(pillar ?? undefined).then(setRows).catch((e) => setErr(e.message));
  }, [pillar]);

  const max = rows?.length ? Math.max(...rows.map((r) => r.score), 0.0001) : 1;

  return (
    <section className="screen">
      <h2>Ranking</h2>
      <p className="lede">
        Which PSI investigations matter most for
        {mission ? <> your <b>{HABITAT[mission.habitat] ?? mission.habitat}</b> ({(mission.o2_frac * 100).toFixed(1)}% O₂, {mission.pressure_kpa} kPa, {mission.g} g)</> : " your mission"}.
        {" "}Score = how close the investigation's real tested conditions are to the mission, plus a bonus when its fuel phase matches your materials
        (and, under detection, when dust matters for your habitat). Change the mission on screen 1.
      </p>

      <div style={{ marginBottom: 14 }}>
        {PILLARS.map((p) => (
          <button key={p ?? "all"} className={`btn ${pillar === p ? "on" : ""}`} style={{ marginRight: 6 }} onClick={() => setPillar(p)}>
            {p ?? "All pillars"}
          </button>
        ))}
      </div>

      {err && <p className="muted">Backend not reachable: {err}</p>}
      {!rows && !err && <p className="muted">Ranking…</p>}
      {rows && rows.length === 0 && <p className="muted">No investigations in this pillar.</p>}
      {rows && rows.length > 0 && (
        <table className="dash-table">
          <thead><tr><th style={{ width: 36 }}>#</th><th style={{ width: 90 }}>Investigation</th><th style={{ width: 150 }}>Score</th><th>Why</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td className="muted">{i + 1}</td>
                <td><b>{r.id}</b></td>
                <td>
                  <div className="small">{r.score.toFixed(2)}</div>
                  <div style={{ background: "var(--line)", borderRadius: 3 }}>
                    <div className="bar" style={{ width: `${Math.max(2, (100 * r.score) / max)}%`, opacity: r.score > 0 ? 1 : 0.3 }} />
                  </div>
                </td>
                <td className="small">{r.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
