// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Provenance badge. Owner: Sibi. status: green (measured) | yellow (interpolated) | red (extrapolated).
import React from "react";

export default function Badge({ status, source, nearest }) {
  const icon = { green: "🟢", yellow: "🟡", red: "🔴" }[status] ?? "⚪";
  return (
    <span className="badge" title={`Source: ${source ?? "?"}\nNearest test: ${nearest ?? "?"}`}>
      {icon}
    </span>
  );
}
