// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// App shell. Owner: Kishan (UI redesign by Kartavya, Landfall-style). Flow: loader -> setup (steps 1-3) over the planet ->
// "Start project" -> live view (agents on the planet, Ask EMBER, Insights button). No router: it's one stage.
import React, { useCallback, useEffect, useState } from "react";
import { getMission } from "../api.js";
import Loader from "../planet/Loader.jsx";
import PlanetScene from "../planet/PlanetScene.jsx";
import useDuelStream from "../planet/useDuelStream.js";
import SetupPanel from "./SetupPanel.jsx";
import LiveHUD from "./LiveHUD.jsx";

export default function App() {
  const [mission, setMission] = useState(null);
  const [ready, setReady] = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);
  const [phase, setPhase] = useState("setup"); // setup | live
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState("planet"); // planet | zooming | room
  const [duel, startDuel] = useDuelStream();

  // The backend owns the mission; re-read it when the user moves between steps so the planet follows.
  useEffect(() => {
    getMission().then((d) => setMission(d.mission)).catch(() => {}).finally(() => setReady(true));
  }, [step, phase]);
  const onDone = useCallback(() => setLoaderDone(true), []);

  useEffect(() => {
    if (focus !== "zooming") return;
    const t = setTimeout(() => setFocus("room"), 1000);
    return () => clearTimeout(t);
  }, [focus]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setFocus((f) => (f === "room" || f === "zooming" ? "planet" : f)); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={"app" + (phase === "setup" ? " app--setup" : "")}>
      <PlanetScene mission={mission} focus={focus} agents={duel} canEnter={phase === "live"} onEnter={() => setFocus("zooming")} />
      {phase === "setup" ? (
        <SetupPanel step={step} setStep={setStep} onMissionSaved={setMission} onStart={() => { setPhase("live"); setFocus("planet"); }} />
      ) : (
        <LiveHUD mission={mission} duel={duel} startDuel={startDuel} focus={focus} onEnter={() => setFocus("zooming")}
          onBackToPlanet={() => setFocus("planet")} onEditMission={() => { setPhase("setup"); setStep(0); setFocus("planet"); }} />
      )}
      {!loaderDone && <Loader ready={ready} onDone={onDone} />}
    </div>
  );
}
