// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Mission setup: habitat, gravity, O2, pressure, materials, ventilation. Owner: Kishan (built by Sibi with his OK).
// POSTs to /api/mission; every other screen (ranking, report, gap map) reads the mission from the backend.
import React, { useEffect, useState } from "react";
import { getMission, setMission } from "../api.js";
import Badge from "../components/Badge.jsx";

// Presets. Moon base / rover atmosphere is the README's planned >= 30% O2 at <= 10.2 psi (70.3 kPa).
// The README gives no Mars base atmosphere, so Mars reuses the Moon base atmosphere; edit it with the sliders.
const PRESETS = {
  spacecraft: { label: "Spacecraft", g: 0.0, o2_frac: 0.21, pressure_kpa: 101.3 },
  iss: { label: "Space station (ISS)", g: 0.0, o2_frac: 0.21, pressure_kpa: 101.3 },
  moon_base: { label: "Moon base", g: 0.165, o2_frac: 0.3, pressure_kpa: 70.3 },
  mars_base: { label: "Mars base", g: 0.38, o2_frac: 0.3, pressure_kpa: 70.3, note: "atmosphere assumed same as Moon base" },
  rover: { label: "Pressurized rover", g: 0.165, o2_frac: 0.3, pressure_kpa: 70.3 },
};
const KPA_PER_PSI = 6.89476;

// Same rule as the Envelope Guard: only 0 g and 1 g have PSI data.
const gravityBadge = (g) => (g === 0 || g === 1 ? "green" : g > 0 && g < 1 ? "yellow" : "red");

export default function MissionSetup() {
  const [m, setM] = useState(null);
  const [materials, setMaterials] = useState({});
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMission()
      .then((d) => { setM(d.mission); setMaterials(d.materials); })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <section className="screen"><h2>Mission setup</h2><p className="muted">Backend not reachable: {error}</p></section>;
  if (!m) return <section className="screen"><h2>Mission setup</h2><p className="muted">Loading…</p></section>;

  const update = (patch) => { setM({ ...m, ...patch }); setStatus(null); };
  const choosePreset = (key) => {
    const { g, o2_frac, pressure_kpa } = PRESETS[key];
    update({ habitat: key, g, o2_frac, pressure_kpa });
  };
  const toggleMaterial = (name) => {
    const next = m.materials.includes(name) ? m.materials.filter((x) => x !== name) : [...m.materials, name];
    update({ materials: next });
  };
  const fuelPhases = [...new Set(m.materials.map((x) => materials[x]).filter(Boolean))];
  const o2pp = (m.o2_frac * m.pressure_kpa) / KPA_PER_PSI;

  async function save() {
    setStatus("saving");
    try {
      const saved = await setMission({ ...m, fuel_phases: fuelPhases });
      setM(saved);
      setStatus("saved");
    } catch (e) {
      setStatus(`error: ${e.message}`);
    }
  }

  return (
    <section className="screen">
      <h2>Mission setup</h2>
      <p className="lede">Pick a habitat, then adjust. Ranking, the insights report and the data gap map all use this mission.</p>

      <div className="section">
        <div className="small muted" style={{ marginBottom: 6 }}>Habitat</div>
        {Object.entries(PRESETS).map(([key, p]) => (
          <button key={key} className={`btn ${m.habitat === key ? "on" : ""}`} style={{ margin: "0 6px 6px 0" }} onClick={() => choosePreset(key)}>
            {p.label}
          </button>
        ))}
        {PRESETS[m.habitat]?.note && <p className="small muted" style={{ margin: "4px 0 0" }}>Note: {PRESETS[m.habitat].note}.</p>}
      </div>

      <div className="card section" style={{ maxWidth: 640 }}>
        <div className="field">
          <label>Gravity (Earth g) <Badge status={gravityBadge(m.g)} source="Envelope Guard rule: PSI has only 0 g and 1 g data" nearest="0 g ISS or 1 g ground tests" /></label>
          <input type="range" min="0" max="1" step="0.005" value={m.g} onChange={(e) => update({ g: Number(e.target.value) })} />
          <span>{m.g.toFixed(3)}</span>
        </div>
        <div className="field">
          <label>O₂ mole fraction</label>
          <input type="range" min="0.15" max="0.45" step="0.005" value={m.o2_frac} onChange={(e) => update({ o2_frac: Number(e.target.value) })} />
          <span>{(m.o2_frac * 100).toFixed(1)}%</span>
        </div>
        <div className="field">
          <label>Total pressure</label>
          <input type="range" min="40" max="110" step="0.1" value={m.pressure_kpa} onChange={(e) => update({ pressure_kpa: Number(e.target.value) })} />
          <span>{m.pressure_kpa.toFixed(1)} kPa</span>
        </div>
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          O₂ partial pressure ≈ {o2pp.toFixed(2)} psi (Earth sea level ≈ 3.07 psi). Flammability tracks the O₂ <i>fraction</i> much more than its partial pressure.
        </p>
      </div>

      <div className="section">
        <div className="small muted" style={{ marginBottom: 6 }}>Materials on board</div>
        {Object.entries(materials).map(([name, phase]) => (
          <label key={name} className={`chip ${m.materials.includes(name) ? "on" : ""}`} style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={m.materials.includes(name)} onChange={() => toggleMaterial(name)} style={{ marginRight: 4 }} />
            {name} <span className="muted">({phase})</span>
          </label>
        ))}
        <p className="small muted" style={{ margin: "4px 0 0" }}>
          Fuel phases: {fuelPhases.join(", ") || "none"}. Investigations with a matching fuel phase get a ranking bonus.
        </p>
      </div>

      <div className="section">
        <label style={{ cursor: "pointer" }}>
          <input type="checkbox" checked={m.vent_on} onChange={(e) => update({ vent_on: e.target.checked })} style={{ marginRight: 6 }} />
          Ventilation on
        </label>
      </div>

      <button className="primary" onClick={save} disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Save mission"}
      </button>
      {status === "saved" && <span className="small muted" style={{ marginLeft: 10 }}>Saved. Other screens now use this mission.</span>}
      {status?.startsWith("error") && <span className="small" style={{ marginLeft: 10, color: "var(--accent)" }}>{status}</span>}
    </section>
  );
}
