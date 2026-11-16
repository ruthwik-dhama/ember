// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Drafting-sheet loader: a spinning wireframe globe, then an iris reveal onto the planet.
import React, { useEffect, useState } from "react";

const MIN_MS = 1800;
const IRIS_MS = 900;
const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function Loader({ ready, onDone }) {
  const [minDone, setMinDone] = useState(false);
  const [iris, setIris] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMinDone(true), reduced() ? 300 : MIN_MS); return () => clearTimeout(t); }, []);
  useEffect(() => {
    if (!(ready && minDone)) return;
    setIris(true);
    const t = setTimeout(onDone, reduced() ? 0 : IRIS_MS);
    return () => clearTimeout(t);
  }, [ready, minDone, onDone]);

  return (
    <div className={"loader" + (iris ? " loader--iris" : "")} role="status" aria-label="Loading EMBER">
      <svg className="loader__globe" viewBox="-60 -60 120 120" fill="none" stroke="currentColor" strokeWidth="0.8">
        <circle r="50" />
        <ellipse rx="50" ry="18" />
        <ellipse rx="50" ry="36" />
        <g className="loader__spin">
          <ellipse rx="18" ry="50" />
          <ellipse rx="36" ry="50" />
          <line x1="0" y1="-50" x2="0" y2="50" />
        </g>
      </svg>
      <p className="loader__label">EMBER <span>plotting the landing site…</span></p>
    </div>
  );
}
