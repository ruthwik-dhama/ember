// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// The one place for everything else: the insights report, both agent runs and the gravity comparison.
import React from "react";
import Report from "../dashboard/Report.jsx";
import AgentsPanel from "../panels/agents/AgentsPanel.jsx";
import GravityPanel from "../panels/gravity/GravityPanel.jsx";

export default function InsightsOverlay({ duelRun, demoRun, onClose }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Insights and report">
      <div className="overlay__bar">
        <b>Insights / Report</b>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      <div className="overlay__body">
        <Report />
        <section className="section">
          <h2>Red vs Blue duel</h2>
          <p className="muted small">The mission's own atmosphere and gravity. Red searches for the fire that is hardest to
            detect; Blue places detectors and chooses ventilation and suppressant to catch it.</p>
          <AgentsPanel run={duelRun} />
        </section>
        <section className="section">
          <h2>Ghost Flame demo (liquid fuel)</h2>
          <p className="muted small">A 3 mm n-heptane droplet at 21% O₂ and 1 atm, put out with CO₂. These are the conditions
            where FLEX saw droplets keep burning as invisible cool flames, so the auditor checks whether a camera-only
            "fire out" can be trusted. It makes no cool-flame claim outside that range, including at Moon-base oxygen.</p>
          <AgentsPanel run={demoRun} />
        </section>
        <section className="section"><h3>Gravity comparison</h3><GravityPanel /></section>
      </div>
    </div>
  );
}
