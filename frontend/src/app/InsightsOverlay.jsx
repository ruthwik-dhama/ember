// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// The one place for everything else: the insights report, the duel results and the gravity comparison.
import React from "react";
import Report from "../dashboard/Report.jsx";
import AgentsPanel from "../panels/agents/AgentsPanel.jsx";
import GravityPanel from "../panels/gravity/GravityPanel.jsx";

export default function InsightsOverlay({ run, onClose }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Insights and report">
      <div className="overlay__bar">
        <b>Insights / Report</b>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
      <div className="overlay__body">
        <Report />
        <section className="section"><AgentsPanel run={run} /></section>
        <section className="section"><h3>Gravity comparison</h3><GravityPanel /></section>
      </div>
    </div>
  );
}
