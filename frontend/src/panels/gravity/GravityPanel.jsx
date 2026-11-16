// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Gravity comparison: the same fire at ISS / Moon / Mars / Earth gravity. Owner: Ruthwik.
// Calls the existing POST /api/simulate once per gravity level (backend twin: sim/sweeps.py gravity_sweep).
// Badges come from the Envelope Guard on each result: every 0 < g < 1 result is yellow by rule (no partial-g PSI data).
import React, { useState } from "react";
import { simulate } from "../../api.js";
import Badge from "../../components/Badge.jsx";

const LEVELS = [
  { key: "iss", label: "ISS", g: 0 },
  { key: "moon", label: "Moon", g: 0.165 },
  { key: "mars", label: "Mars", g: 0.38 },
  { key: "earth", label: "Earth", g: 1 },
]; // mirrors config.py GRAVITY_PRESETS

const DEFAULT_SCENE = {
  fires: [{ material: "pmma", phase: "solid", x: 3, y: 2, z: 0.5 }], // PMMA: spread fitted to BASS-II (cotton is still a placeholder)
  detectors: [{ id: "ceil", x: 3, y: 2, z: 2.4 }],
};

const T_MAX_S = 300; // SimConfig.t_max_s default

const s = {
  panel: { border: "1px solid var(--line)", borderRadius: 8, padding: 16 },
  head: { display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "space-between" },
  h3: { margin: 0, fontSize: 17 },
  muted: { color: "var(--muted)", fontSize: 13, margin: "6px 0 12px" },
  row: { display: "grid", gridTemplateColumns: "88px 1fr 150px", gap: 10, alignItems: "center", margin: "8px 0" },
  track: { height: 18, background: "rgba(20,22,25,0.07)", borderRadius: 4, overflow: "hidden" },
  bar: { height: "100%", background: "var(--accent)", borderRadius: 4 },
  never: { height: "100%", width: "100%", borderRadius: 4,
           background: "repeating-linear-gradient(45deg, rgba(20,22,25,0.22) 0 6px, rgba(20,22,25,0.07) 6px 12px)" },
  value: { fontVariantNumeric: "tabular-nums", fontSize: 14 },
  toggle: (on) => ({ background: "none", color: on ? "var(--fg)" : "var(--muted)", border: `1px solid ${on ? "var(--accent)" : "var(--line)"}`,
                     borderRadius: 6, padding: "6px 10px", cursor: "pointer" }),
};

export default function GravityPanel({ scene = DEFAULT_SCENE }) {
  const [ventOn, setVentOn] = useState(true);
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const run = async () => {
    setBusy(true); setErr(null);
    try {
      const out = [];
      for (const lv of LEVELS) { // sequential: keeps memory and server load down (each response carries voxel frames)
        const r = await simulate({ ...scene, g: lv.g, vent_on: ventOn });
        out.push({ ...lv, detected: r.detected, delay: r.delay_s, spread: r.spread_rate_mm_s,
                   envelope: r.envelope, calib: r.fires?.[0]?.calibration_status, stub: r.stub });
      }
      setRows(out);
    } catch (e) {
      setErr(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={s.panel} aria-label="Gravity comparison">
      <div style={s.head}>
        <h3 style={s.h3}>Gravity comparison</h3>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button style={s.toggle(ventOn)} onClick={() => setVentOn(true)} aria-pressed={ventOn}>Vents on</button>
          <button style={s.toggle(!ventOn)} onClick={() => setVentOn(false)} aria-pressed={!ventOn}>Vents off</button>
          <button className="primary" onClick={run} disabled={busy}>{busy ? "Running…" : "Compare gravity"}</button>
        </div>
      </div>
      <p style={s.muted}>
        Same fire and ceiling detector at four gravity levels: time from ignition to first alarm. Badges come from the
        Envelope Guard (hover for the nearest tested condition). PSI only has 0 g and 1 g data, so Moon and Mars are
        always at least 🟡. With vents off at 0 g there is no flow to feed the flame: BASS-II saw no spread below 0.6 cm/s.
      </p>
      {err && <p role="alert">{err}</p>}
      {rows?.some((r) => r.stub) && <p><b>STUB DATA</b>: the engine is a placeholder.</p>}
      {rows && rows.map((r) => (
        <div key={r.key} style={s.row}>
          <span>{r.label} <span style={{ color: "var(--muted)", fontSize: 12 }}>{r.g} g</span></span>
          <div style={s.track} title={r.detected ? `${r.delay} s to first alarm` : `not detected within ${T_MAX_S} s`}>
            {r.detected
              ? <div style={{ ...s.bar, width: `${Math.max(2, (100 * r.delay) / T_MAX_S)}%` }} />
              : <div style={s.never} />}
          </div>
          <span style={s.value}>
            {r.detected ? `${r.delay.toFixed(1)} s` : `none in ${T_MAX_S} s`}{" "}
            <Badge status={r.envelope?.badge} source={`Envelope Guard; material calibration: ${r.calib ?? "?"}`}
                   nearest={r.envelope?.nearest} />
            <br />
            <span style={{ color: "var(--muted)", fontSize: 12 }}>spread {r.spread?.toFixed(2) ?? "-"} mm/s</span>
          </span>
        </div>
      ))}
      {!rows && !busy && <p style={s.muted}>Press “Compare gravity” to run the four simulations.</p>}
    </section>
  );
}
