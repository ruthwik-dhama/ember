// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Provenance badge. Owner: Sibi. status: green (measured) | yellow (interpolated) | red (extrapolated).
import React from "react";

export default function Badge({ status, source, nearest }) {
  const word = { green: "Measured", yellow: "Interpolated", red: "Extrapolated" }[status] ?? "Unknown";
  return (
    <span className={"badge badge--" + (status ?? "none")} title={`${word}\nSource: ${source ?? "?"}\nNearest test: ${nearest ?? "?"}`}>
      {word}
    </span>
  );
}
