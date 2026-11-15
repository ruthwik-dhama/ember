// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Habitat simulation screen. Owner: Kartavya (layout), panels from Kartavya / Ruthwik / Sibi.
import React, { useState } from "react";
import { simulate } from "../api.js";
import Badge from "../components/Badge.jsx";
import HabitatView from "./HabitatView.jsx";
import AgentsPanel from "../panels/agents/AgentsPanel.jsx";
import GravityPanel from "../panels/gravity/GravityPanel.jsx";
import GapMap from "../panels/data/GapMap.jsx";

const DEMO_CFG = {
  fires: [{ material: "cotton", phase: "solid", x: 3, y: 2, z: 0.5 }],
  detectors: [{ id: "ceil", x: 3, y: 2, z: 2.4 }],
};

export default function HabitatScreen() {
  const [r, setR] = useState(null);
  const [err, setErr] = useState(null);
  const run = () => simulate(DEMO_CFG).then(setR).catch((e) => setErr(String(e)));
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <HabitatView />
      <div>
        <button className="primary" onClick={run}>Run simulation</button>
        {err && <p>{err}</p>}
        {r && (
          <p>
            {r.stub && <b>STUB DATA · </b>}
            detected: {String(r.detected)} · delay: {r.delay_s ?? "-"} s · frames: {r.frames.length}{" "}
            <Badge status={r.envelope.badge} source="Envelope Guard" nearest={r.envelope.nearest} />
          </p>
        )}
      </div>
      <AgentsPanel />
      <GravityPanel />
      <GapMap />
    </div>
  );
}
