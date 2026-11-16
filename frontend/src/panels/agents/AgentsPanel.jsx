// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Red ranked list + duel rounds. Owner: Kartavya. Calls POST /api/duel/run (Kishan wires it to agents.blue_team.run_duel).
import React, { useState } from "react";
import { runDuel } from "../../api.js";
import Badge from "../../components/Badge.jsx";

const fmt = (d) => (d == null ? "never detected" : `${Math.round(d * 10) / 10} s`);

// Ghost Flame demo: heptane droplet inside the FLEX cool-flame range (14-25% O2, 50.7-101.3 kPa), CO2 suppression.
const LIQUID_DEMO = {
  o2_frac: 0.21, pressure_kpa: 101.3, suppressant: "co2",
  fires: [{ material: "n-heptane", phase: "liquid", x: 3, y: 2, z: 0.1, droplet_d_mm: 3.0 }],
};

export default function AgentsPanel({ onDuel, gravity = 0.165 }) {
  const [run, setRun] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const start = async (cfg = {}) => {
    setBusy(true); setErr(null);
    try {
      const res = await runDuel({ g: gravity, ...cfg });
      setRun(res);
      const last = res.rounds[res.rounds.length - 1];
      const s = last.red.worst.scenario;
      onDuel?.({ ...last.after, envelope: last.envelope }, {
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
      <button className="primary" onClick={() => start()} disabled={busy}>{busy ? "Running…" : "Run duel"}</button>{" "}
      <button onClick={() => start(LIQUID_DEMO)} disabled={busy}>Liquid-fuel demo (Ghost Flame)</button>
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
