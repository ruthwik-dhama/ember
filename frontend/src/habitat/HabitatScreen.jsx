// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Habitat simulation screen. Owner: Kartavya (layout), panels from Kartavya / Ruthwik / Sibi.
import React, { useEffect, useMemo, useState } from "react";
import { simulate } from "../api.js";
import Badge from "../components/Badge.jsx";
import HabitatView from "./HabitatView.jsx";
import AgentsPanel from "../panels/agents/AgentsPanel.jsx";
import GravityPanel from "../panels/gravity/GravityPanel.jsx";
import GapMap from "../panels/data/GapMap.jsx";

const GRAVITY = { iss: 0, moon: 0.165, mars: 0.38, earth: 1 }; // mirrors config.py GRAVITY_PRESETS
const DEMO_SCENE = {
  fires: [{ material: "cotton", phase: "solid", x: 3, y: 2, z: 0.5 }],
  detectors: [{ id: "ceil", x: 3, y: 2, z: 2.4 }],
};

export default function HabitatScreen() {
  const [r, setR] = useState(null);
  const [scene, setScene] = useState(DEMO_SCENE);
  const [g, setG] = useState("moon");
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [err, setErr] = useState(null);

  const tMax = r?.frames?.length ? r.frames[r.frames.length - 1].t_s : 0;
  const show = (res) => { setR(res); setT(0); setPlaying(true); setErr(null); };
  const run = (sc = scene) => simulate({ ...sc, g: GRAVITY[g] }).then(show).catch((e) => setErr(String(e)));
  // Move the first fire to the clicked floor point (z stays near the floor) and re-run.
  const placeFire = (x, y) => {
    const sc = { ...scene, fires: [{ ...scene.fires[0], x, y, z: 0.1 }, ...scene.fires.slice(1)] };
    setScene(sc);
    run(sc);
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT((v) => (v + 2 >= tMax ? (setPlaying(false), tMax) : v + 2)), 100);
    return () => clearInterval(id);
  }, [playing, tMax]);

  const alarmed = useMemo(() => new Set((r?.alarms || []).filter((a) => a.t_s <= t).map((a) => a.detector_id)), [r, t]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <HabitatView frames={r?.frames} t={t} detectors={scene.detectors} fires={scene.fires} alarmed={alarmed} onPlaceFire={placeFire} />
      {r && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
          <input type="range" min={0} max={tMax} step={2} value={t} aria-label="Timeline"
            onChange={(e) => { setPlaying(false); setT(Number(e.target.value)); }} style={{ flex: 1 }} />
          <span>{t.toFixed(0)} / {tMax.toFixed(0)} s</span>
        </div>
      )}
      <div>
        {Object.keys(GRAVITY).map((k) => (
          <button key={k} className={k === g ? "primary" : ""} onClick={() => setG(k)}>
            {k} ({GRAVITY[k]} g)
          </button>
        ))}{" "}
        {/* only 0 g and 1 g have PSI data: anything between is interpolated (yellow) by rule */}
        <Badge status={GRAVITY[g] > 0 && GRAVITY[g] < 1 ? "yellow" : "green"} source="gravity preset"
          nearest={GRAVITY[g] > 0 && GRAVITY[g] < 1 ? "interpolated between 0 g and 1 g" : "tested gravity"} />{" "}
        <button className="primary" onClick={() => run()}>Run simulation</button> <small>or click the floor to place the fire</small>
        {err && <p>{err}</p>}
        {r && (
          <p>
            {r.stub && <b>STUB DATA · </b>}
            detected: {String(r.detected)} · delay: {r.delay_s == null ? "-" : Math.round(r.delay_s * 10) / 10} s · frames: {r.frames.length}{" "}
            {r.envelope && <Badge status={r.envelope.badge} source="Envelope Guard" nearest={r.envelope.nearest} />}
          </p>
        )}
      </div>
      <AgentsPanel onDuel={(res, nextScene) => { setScene(nextScene); show(res); }} gravity={GRAVITY[g]} />
      <GravityPanel />
      <GapMap />
    </div>
  );
}
