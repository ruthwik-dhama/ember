// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// App shell. Owner: Kishan (UI redesign by Kartavya, Landfall-style). Flow: loader -> setup (steps 1-3) over the planet ->
// "Start project" -> live view, where both duels start on their own (agents on the planet, Ask EMBER, Insights button).
// No router: it's one stage.
import React, { useCallback, useEffect, useState } from "react";
import { getMission } from "../api.js";
import Loader from "../planet/Loader.jsx";
import PlanetScene from "../planet/PlanetScene.jsx";
import SetupPanel from "./SetupPanel.jsx";
import LiveHUD from "./LiveHUD.jsx";
import useDuels from "./useDuels.js";
import { skyLight } from "../planet/dayNight.js";

export default function App() {
  const [mission, setMission] = useState(null);
  const [ready, setReady] = useState(false);
  const [loaderDone, setLoaderDone] = useState(false);
  const [phase, setPhase] = useState("setup"); // setup | live
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState("planet"); // planet | zooming | room
  const [mode, setMode] = useState("auto"); // auto (local clock) | day | night
  const duels = useDuels();
  const startDuels = duels.start;

  // The backend owns the mission; re-read it when the user moves between steps so the planet follows.
  useEffect(() => {
    getMission().then((d) => setMission(d.mission)).catch(() => {}).finally(() => setReady(true));
  }, [step, phase]);
  const onDone = useCallback(() => setLoaderDone(true), []);
  // Read the saved mission at the moment of starting, so the duels use exactly what the report will read.
  const startProject = useCallback(() => {
    setPhase("live");
    setFocus("planet");
    getMission().then((d) => { setMission(d.mission); startDuels(d.mission); }).catch(() => {});
  }, [startDuels]);

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
      <PlanetScene mode={mode} mission={mission} focus={focus} agents={duels.active} canEnter={phase === "live"} onEnter={() => setFocus("zooming")} />
      {phase === "setup" ? (
        <SetupPanel step={step} setStep={setStep} onMissionSaved={setMission} onStart={startProject} />
      ) : (
        <LiveHUD mission={mission} duels={duels} focus={focus} onEnter={() => setFocus("zooming")}
          onBackToPlanet={() => setFocus("planet")} onEditMission={() => { setPhase("setup"); setStep(0); setFocus("planet"); }} />
      )}
      <div className="toolbar">
        <button onClick={() => setMode((m) => (skyLight(m).isDay ? "night" : "day"))} aria-label="Toggle day and night" title="Day / night">
          {skyLight(mode).isDay ? "☾" : "☀"}
        </button>
      </div>
      {!loaderDone && <Loader ready={ready} onDone={onDone} />}
    </div>
  );
}
