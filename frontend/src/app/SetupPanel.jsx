// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Before "Start project": 1 Mission setup, 2 Experiment explorer, 3 Ranking, as steps beside the planet.
import React from "react";
import MissionSetup from "../dashboard/MissionSetup.jsx";
import Explorer from "../dashboard/Explorer.jsx";
import Ranking from "../dashboard/Ranking.jsx";

const STEPS = ["Mission setup", "Experiment explorer", "Ranking"];

export default function SetupPanel({ step, setStep, onStart, onMissionSaved }) {
  return (
    <aside className="panel setup" aria-label="Project setup">
      <header className="setup__head">
        <span className="brand">Ember</span>
        <span className="small">Fire safety for the Moon and Mars</span>
      </header>
      <ol className="steps">
        {STEPS.map((name, i) => (
          <li key={name}>
            <button className={i === step ? "on" : i < step ? "done" : ""} onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}>
              <span>0{i + 1}</span>{name}
            </button>
          </li>
        ))}
      </ol>
      <div className="setup__body">
        {step === 0 && <MissionSetup onSaved={onMissionSaved} />}
        {step === 1 && <Explorer />}
        {step === 2 && <Ranking />}
      </div>
      <footer className="setup__foot">
        <button className="btn" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
        {step < STEPS.length - 1
          ? <button className="primary" onClick={() => setStep(step + 1)}>Next</button>
          : <button className="primary cta" onClick={onStart}>Start project</button>}
      </footer>
    </aside>
  );
}
