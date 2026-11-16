// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// After "Start project": agents feed, Ask EMBER and the Insights button around the planet. Both duels run on their
// own (app/useDuels.js); Insights / Report opens once they finish, with a progress bar beside it until then.
import React, { useState } from "react";
import AgentFeed from "../planet/AgentFeed.jsx";
import AskEmber from "../dashboard/AskEmber.jsx";
import HabitatScreen from "../habitat/HabitatScreen.jsx";
import InsightsOverlay from "./InsightsOverlay.jsx";

function DuelProgress({ duels }) {
  const pct = Math.round(duels.progress * 100);
  return (
    <div className="duel-progress" role="progressbar" aria-label="Duels running" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className="duel-progress__label"><span>{duels.stage}</span><b>{pct}%</b></div>
      <div className="duel-progress__track"><div className="duel-progress__fill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function LiveHUD({ mission, duels, focus, onEnter, onBackToPlanet, onEditMission }) {
  const [insights, setInsights] = useState(false);
  const [askOpen, setAskOpen] = useState(true);
  const { duel, ghost, active, done } = duels;
  const feed = { ...active, log: [...duel.log, ...ghost.log] };
  const failed = [duel, ghost].filter((d) => d.status === "error");
  const inRoom = focus === "room";

  return (
    <>
      <div className="hud">
        <header className="hud__top">
          <span className="brand-chip"><span className="brand">Ember</span></span>
          <button className="btn" onClick={onEditMission}>Edit mission</button>
          <span className="grow" />
          {!done && <DuelProgress duels={duels} />}
          {done && failed.length > 0 && <span className="duel-note">A duel failed: {failed[0].error}</span>}
          <button className="primary cta" disabled={!done} title={done ? undefined : "Opens when both duels finish"}
            onClick={() => setInsights(true)}>Insights / Report</button>
        </header>

        <aside className="panel hud__feed" aria-label="Agents">
          <h2>Agents</h2>
          <AgentFeed duel={feed} />
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
          <div className="overlay__body">{inRoom && <HabitatScreen duel={duel.run} mission={mission} />}</div>
        </div>
      )}
      {insights && <InsightsOverlay run={duel.run} ghostRun={ghost.run} onClose={() => setInsights(false)} />}
    </>
  );
}
