// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// After "Start project": agents feed, Ask EMBER, duel buttons and the Insights button around the planet.
import React, { useState } from "react";
import AgentFeed from "../planet/AgentFeed.jsx";
import AskEmber from "../dashboard/AskEmber.jsx";
import HabitatScreen from "../habitat/HabitatScreen.jsx";
import InsightsOverlay from "./InsightsOverlay.jsx";
import Brand from "./Brand.jsx";

// Ghost Flame demo: heptane droplet inside the FLEX cool-flame range (14-25% O2, 50.7-101.3 kPa), CO2 suppression.
const LIQUID_DEMO = {
  o2_frac: 0.21, pressure_kpa: 101.3, suppressant: "co2",
  fires: [{ material: "n-heptane", phase: "liquid", x: 3, y: 2, z: 0.1, droplet_d_mm: 3.0 }],
};

export default function LiveHUD({ mission, duel, startDuel, focus, onBackToPlanet, onEditMission }) {
  const [insights, setInsights] = useState(false);
  const [askOpen, setAskOpen] = useState(true);
  const running = duel.status === "running";
  const base = mission ? { g: mission.g, o2_frac: mission.o2_frac, pressure_kpa: mission.pressure_kpa, vent_on: mission.vent_on } : {};
  const inRoom = focus === "room";

  return (
    <>
      <div className="hud">
        <header className="hud__top">
          <Brand />
          <button className="btn" onClick={onEditMission}>← Mission</button>
          <span className="grow" />
          <button className="primary cta" onClick={() => setInsights(true)}>Insights / Report</button>
        </header>

        <aside className="panel hud__feed" aria-label="Agents">
          <h2>Agents</h2>
          <AgentFeed duel={duel} />
        </aside>

        <aside className={"panel hud__ask" + (askOpen ? "" : " hud__ask--closed")} aria-label="Ask EMBER">
          <button className="btn hud__ask-toggle" onClick={() => setAskOpen((o) => !o)}>{askOpen ? "Hide" : "Ask EMBER"}</button>
          {askOpen && <AskEmber />}
        </aside>

        <div className="hud__bar">
          <button className="primary" disabled={running} onClick={() => startDuel(base)}>{running ? "Agents working…" : "Run duel"}</button>
          <button className="btn" disabled={running} onClick={() => startDuel({ ...base, ...LIQUID_DEMO })}>Liquid-fuel demo (Ghost Flame)</button>
          <span className="muted small hud__hint">Drag to turn the planet · click the dome to enter · W A S D steers the ship</span>
        </div>
      </div>

      {(focus === "zooming" || inRoom) && (
        <div className={"overlay room" + (inRoom ? " room--in" : "")} role="dialog" aria-label="Habitat room">
          <div className="overlay__bar">
            <b>Habitat room</b>
            <button className="btn" onClick={onBackToPlanet}>Back to planet</button>
          </div>
          <div className="overlay__body">{inRoom && <HabitatScreen duel={duel.run} mission={mission} />}</div>
        </div>
      )}
      {insights && <InsightsOverlay run={duel.run} onClose={() => setInsights(false)} />}
    </>
  );
}
