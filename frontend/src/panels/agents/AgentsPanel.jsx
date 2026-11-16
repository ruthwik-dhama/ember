// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Red ranked list + duel rounds for a finished duel run. Owner: Kartavya. The duel itself now runs live from the
// planet view (planet/useDuelStream.js); this panel only presents the result (used in the Insights overlay).
import React from "react";
import Badge from "../../components/Badge.jsx";

const fmt = (d) => (d == null ? "never detected" : `${Math.round(d * 10) / 10} s`);

export default function AgentsPanel({ run }) {
  if (!run) return <p className="muted small">No duel yet. Run one from the planet view.</p>;
  const last = run.rounds[run.rounds.length - 1];
  return (
    <section>
      <h3>Red: most dangerous fires</h3>
      <ol>
        {last.red.top.map((t, i) => (
          <li key={i}>{t.why} <Badge status={last.envelope.badge} source="Envelope Guard" nearest={last.envelope.nearest} /></li>
        ))}
      </ol>
      <h3>Duel rounds</h3>
      <table className="dash-table">
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
    </section>
  );
}
