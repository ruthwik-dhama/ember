// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// After "Start project": the duel and the Ghost Flame demo start on their own; the agents feed, Ask EMBER and
// the Insights button (locked behind a progress bar until both finish) sit around the planet.
import React, { useEffect, useRef, useState } from "react";
import AgentFeed from "../planet/AgentFeed.jsx";
import AskEmber from "../dashboard/AskEmber.jsx";
import HabitatScreen from "../habitat/HabitatScreen.jsx";
import InsightsOverlay from "./InsightsOverlay.jsx";
import { duelProgress } from "../planet/useDuelStream.js";

// Ghost Flame demo: heptane droplet inside the FLEX cool-flame range (14-25% O2, 50.7-101.3 kPa), CO2 suppression.
const LIQUID_DEMO = {
  o2_frac: 0.21, pressure_kpa: 101.3, suppressant: "co2",
  fires: [{ material: "n-heptane", phase: "liquid", x: 3, y: 2, z: 0.1, droplet_d_mm: 3.0 }],
};

export default function LiveHUD({ mission, duel, startDuel, focus, onEnter, onBackToPlanet, onEditMission }) {
  const [insights, setInsights] = useState(false);
  const [askOpen, setAskOpen] = useState(true);
  const started = useRef(false);
  const inRoom = focus === "room";

  // Run both as soon as the live view opens: the mission's Red vs Blue duel, then the liquid-fuel Ghost Flame demo.
  useEffect(() => {
    if (started.current || !mission) return;
    started.current = true;
    const base = { g: mission.g, o2_frac: mission.o2_frac, pressure_kpa: mission.pressure_kpa, vent_on: mission.vent_on };
    startDuel([
      { label: "Red vs Blue duel", weight: 3, cfg: base },
      { label: "Ghost Flame demo (liquid fuel)", weight: 1, cfg: { ...base, ...LIQUID_DEMO } },
    ]);
  }, [mission, startDuel]);

  const done = duel.status === "done";
  const failed = duel.status === "error";
  const pct = Math.round(100 * duelProgress(duel));
  const ready = done || failed; // after a failure the report still opens, with whatever finished

  return (
    <>
      <div className="hud">
        <header className="hud__top">
          <span className="brand-chip"><span className="brand">Ember</span></span>
          <button className="btn" onClick={onEditMission}>Edit mission</button>
          <span className="grow" />
          <div className={"insights-gate" + (ready ? " insights-gate--ready" : "")} style={{ "--pct": `${ready ? 100 : pct}%` }}>
            <button className="primary cta" disabled={!ready} onClick={() => setInsights(true)}
              title={ready ? "Open the insights report" : "Available when the agents finish"}>
              Insights / Report
            </button>
            {!ready && (
              <div className="insights-gate__status" role="progressbar" aria-label="Agents working"
                aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                <span className="insights-gate__track"><span className="insights-gate__fill" /></span>
                <span className="insights-gate__label">
                  {duel.steps[duel.step]?.label ?? "Starting"} · {pct}%
                </span>
              </div>
            )}
            {failed && <span className="insights-gate__label insights-gate__label--error">Run stopped: {duel.error}</span>}
          </div>
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
          {/* A button as well as the clickable dome: the dome is small and the planet turns. */}
          <button className="btn" onClick={onEnter}>Go inside the habitat</button>
          <span className="hud__hint">Drag to turn the planet</span>
        </div>
      </div>

      {(focus === "zooming" || inRoom) && (
        <div className={"overlay room" + (inRoom ? " room--in" : "")} role="dialog" aria-label="Habitat room">
          <div className="overlay__bar">
            <b>Inside the habitat</b>
            <button className="btn" onClick={onBackToPlanet}>Back to planet</button>
          </div>
          <div className="overlay__body">{inRoom && <HabitatScreen duel={duel.runs[0]} mission={mission} />}</div>
        </div>
      )}
      {insights && <InsightsOverlay duelRun={duel.runs[0]} demoRun={duel.runs[1]} onClose={() => setInsights(false)} />}
    </>
  );
}
