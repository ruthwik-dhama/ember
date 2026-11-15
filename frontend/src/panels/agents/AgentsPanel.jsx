// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Red ranked list + duel rounds. Owner: Kartavya. Calls POST /api/duel/run (Kishan wires it to agents.blue_team.run_duel).
import React, { useState } from "react";
import { runDuel } from "../../api.js";
import Badge from "../../components/Badge.jsx";

const fmt = (d) => (d == null ? "never detected" : `${d} s`);

export default function AgentsPanel({ onDuel, gravity = 0.165 }) {
  const [run, setRun] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const start = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await runDuel({ g: gravity });
      setRun(res);
      const last = res.rounds[res.rounds.length - 1];
      const s = last.red.worst.scenario;
      onDuel?.(last.after, {
        fires: [{ material: s.material, phase: s.droplet_d_mm && ["n-heptane", "methanol"].includes(s.material) ? "liquid" : "solid",
                  x: s.x, y: s.y, z: s.z, t_ignite_s: s.t_ignite_s, droplet_d_mm: s.droplet_d_mm }],
        detectors: last.blue.detectors,
      });
    } catch (e) {
      setErr(String(e)); // 501 until /api/duel/run is wired to run_duel
    } finally {
      setBusy(false);
    }
  };

  const last = run?.rounds[run.rounds.length - 1];
  return (
    <section>
      <h3>Red vs Blue duel</h3>
      <button className="primary" onClick={start} disabled={busy}>{busy ? "Running…" : "Run duel"}</button>
      {err && <p>{err}</p>}
      {run && (
        <>
          <h4>Red: most dangerous fires</h4>
          <ol>
            {last.red.top.map((t, i) => (
              <li key={i}>{t.why} <Badge status={last.envelope.badge} source="Envelope Guard" nearest={last.envelope.nearest} /></li>
            ))}
          </ol>
          <h4>Rounds</h4>
          <table>
            <thead><tr><th>Round</th><th>Red: delay</th><th>Blue: delay</th><th>Blue plan</th><th>Ghost Flame</th></tr></thead>
            <tbody>
              {run.rounds.map((r) => (
                <tr key={r.round}>
                  <td>{r.round}</td>
                  <td>{fmt(r.before.delay_s)}</td>
                  <td>{fmt(r.after.delay_s)} <Badge status={r.envelope.badge} source="Envelope Guard" nearest={r.envelope.nearest} /></td>
                  <td>{r.blue.detectors.length} two-moment detectors · vents off {Math.round(r.blue.vent_off_at_s)} s · {r.blue.suppressant}</td>
                  <td>{r.ghost.applicable
                    ? (r.ghost.false_all_clear ? "⚠ camera may report out while a cool flame burns" : "no cool-flame risk")
                    : r.ghost.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}
