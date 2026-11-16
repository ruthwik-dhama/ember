// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// EMBER wordmark with a small ringed-planet mark (the Landfall template has the same pairing).
import React from "react";

export function BrandMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="-12 -12 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle r="5.5" /><ellipse rx="10.5" ry="3.6" transform="rotate(-20)" stroke="var(--teal)" />
    </svg>
  );
}

export default function Brand() {
  return <span className="brand"><BrandMark />EMBER</span>;
}
