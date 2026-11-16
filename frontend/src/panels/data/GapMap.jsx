// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Gap map: Envelope Guard badge for every O2 x flow cell at the mission's pressure and g. Owner: Sibi.
// Red cells are conditions no PSI experiment has tested: where future experiments (LUCI, FM2) are needed.
// Usage: <GapMap /> fetches GET /api/gap_map itself; <GapMap data={report.data_gaps} /> renders given data.
import React, { useEffect, useState } from "react";
import { gapMap } from "../../api.js";

const COLORS = {
  green: { bg: "#3f8f63", label: "Measured" },
  yellow: { bg: "#e3c376", label: "Interpolated" },
  red: { bg: "#c96a55", label: "Extrapolated" },
};

const pct = (o2) => `${Math.round(o2 * 1000) / 10}%`;

export default function GapMap({ data, refreshKey }) {
  const [gm, setGm] = useState(data ?? null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (data) { setGm(data); return; }
    let live = true;
    gapMap()
      .then((d) => live && (setGm(d), setError(null)))
      .catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, [data, refreshKey]);

  if (error) return <section className="placeholder"><h2>Data gap map</h2><p>Unavailable: {error}</p></section>;
  if (!gm) return <section className="placeholder"><h2>Data gap map</h2><p>Loading…</p></section>;

  const rows = gm.o2_values.map((o2, i) => ({ o2, cells: gm.cells[i], nearest: gm.nearest?.[i] ?? [] })).reverse();
  const total = Object.values(gm.counts).reduce((a, b) => a + b, 0) || 1;

  return (
    <section style={{ marginTop: 24 }}>
      <h3>Data gap map</h3>
      <p style={{ color: "var(--muted)", margin: "0 0 12px", fontSize: 13 }}>
        How much real PSI data backs each O₂ × airflow condition at {gm.pressure_kpa} kPa and {gm.g} g.
        {gm.g > 0 && gm.g < 1 && " Partial gravity has no PSI data, so nothing here can be green."}
        {" "}Red cells are conditions no PSI experiment has tested: where future experiments (LUCI, FM2) are needed.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", fontSize: 11 }}>
          <tbody>
            {rows.map((r) => (
              <tr key={r.o2}>
                <th style={{ textAlign: "right", paddingRight: 6, color: "var(--muted)", fontWeight: 400, whiteSpace: "nowrap" }}>
                  {pct(r.o2)}
                </th>
                {r.cells.map((b, j) => (
                  <td
                    key={j}
                    title={`O₂ ${pct(r.o2)}, flow ${gm.flow_values[j]} cm/s: ${COLORS[b]?.label ?? b}\nNearest test: ${r.nearest[j] ?? "?"}`}
                    style={{ width: 26, height: 20, background: COLORS[b]?.bg ?? "var(--paper-3)", border: "1px solid var(--bg)", cursor: "help" }}
                  />
                ))}
              </tr>
            ))}
            <tr>
              <th />
              {gm.flow_values.map((u, j) => (
                <th key={j} style={{ color: "var(--muted)", fontWeight: 400, paddingTop: 4 }}>
                  {j % 3 === 0 ? Math.round(u) : ""}
                </th>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 10px" }}>
        Rows: O₂ mole fraction · Columns: airflow (cm/s) · Hover a cell for the nearest real test.
      </p>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
        {["green", "yellow", "red"].map((b) => (
          <span key={b}>
            <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: COLORS[b].bg, marginRight: 6, verticalAlign: -1 }} />
            {COLORS[b].label}: {gm.counts[b] ?? 0} ({Math.round((100 * (gm.counts[b] ?? 0)) / total)}%)
          </span>
        ))}
      </div>
    </section>
  );
}
