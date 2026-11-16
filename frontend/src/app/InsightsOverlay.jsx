// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// The one place for everything else: the insights report, both duels' results and the gravity comparison.
import React from "react";
import Report from "../dashboard/Report.jsx";
import AgentsPanel from "../panels/agents/AgentsPanel.jsx";
import GravityPanel from "../panels/gravity/GravityPanel.jsx";

export default function InsightsOverlay({ run, ghostRun, onClose }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Insights and report">
      <div className="overlay__bar">
        <b>Insights / Report</b>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      <div className="overlay__body">
        <Report />
        <section className="section">
          <h2>Red vs. Blue duel: your mission</h2>
          <AgentsPanel run={run} />
        </section>
        <section className="section">
          <h2>Liquid-fuel demo (Ghost Flame)</h2>
          <p className="small muted">A heptane droplet fire inside FLEX&rsquo;s tested cool-flame range, put out with CO&#8322;.
            Shows whether a camera could report the fire out while a cool flame keeps burning.</p>
          <AgentsPanel run={ghostRun} />
        </section>
        <section className="section"><h3>Gravity comparison</h3><GravityPanel /></section>
      </div>
    </div>
  );
}
