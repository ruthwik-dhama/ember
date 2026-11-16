// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Drafting-sheet loader: the planet as a line drawing with sheet notes, a percent counter, then an iris reveal.
import React, { useEffect, useRef, useState } from "react";

const MIN_MS = 2200;
const IRIS_MS = 900;
const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function Loader({ ready, onDone }) {
  const [pct, setPct] = useState(0);
  const [iris, setIris] = useState(false);
  const t0 = useRef(performance.now());

  // Count up over MIN_MS, but hold at 92% until the backend has answered.
  useEffect(() => {
    if (reduced()) { setPct(ready ? 100 : 92); return; }
    // A timer, not requestAnimationFrame: rAF stalls in background tabs and would leave the sheet up.
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0.current) / MIN_MS);
      const eased = 1 - Math.pow(1 - p, 2.2);
      setPct(Math.round(Math.min(ready ? 100 : 92, eased * 100)));
      if (p >= 1 && ready) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [ready]);

  useEffect(() => {
    if (pct < 100) return;
    const hold = setTimeout(() => setIris(true), reduced() ? 0 : 350);
    const done = setTimeout(onDone, reduced() ? 0 : 350 + IRIS_MS);
    return () => { clearTimeout(hold); clearTimeout(done); };
  }, [pct, onDone]);

  return (
    <div className={"loader" + (iris ? " loader--iris" : "")} role="status" aria-label="Loading EMBER">
      <div className="loader__tl"><b>Ember</b><span>Fire safety · Moon and Mars</span></div>
      <div className="loader__tr">
        Sheet 01 — Habitat fire survey
        <span>Scale 1 : 200 000</span>
        <span>89.9° S · Shackleton rim</span>
      </div>
      <svg className="loader__globe" viewBox="-70 -70 140 140" fill="none" stroke="#141619" strokeLinecap="round">
        <line x1="-66" y1="0" x2="66" y2="0" strokeWidth="0.25" strokeDasharray="3 1.5 0.6 1.5" opacity="0.5" />
        <line x1="0" y1="-66" x2="0" y2="66" strokeWidth="0.25" strokeDasharray="3 1.5 0.6 1.5" opacity="0.5" />
        <g transform="rotate(-18)">
          <circle r="50" strokeWidth="0.9" />
          <ellipse rx="50" ry="13" strokeWidth="0.3" />
          <ellipse rx="43.5" ry="11" cy="-25" strokeWidth="0.3" />
          <ellipse rx="43.5" ry="11" cy="25" strokeWidth="0.3" />
          <g className="loader__spin" strokeWidth="0.3">
            <ellipse rx="20" ry="50" />
            <ellipse rx="38" ry="50" />
          </g>
          <ellipse rx="68" ry="20" stroke="#17806d" strokeWidth="0.5" strokeDasharray={`${(pct / 100) * 290} 400`} transform="rotate(-8)" />
          <circle cx="31" cy="-12" r="1.6" fill="#17806d" stroke="none" />
          <circle cx="31" cy="-12" r="3.6" stroke="#17806d" strokeWidth="0.35" />
        </g>
        <g strokeWidth="0.3" opacity="0.7">
          <line x1="-50" y1="62" x2="50" y2="62" />
          <line x1="-50" y1="60" x2="-50" y2="64" /><line x1="50" y1="60" x2="50" y2="64" />
        </g>
        <text x="0" y="60.4" textAnchor="middle" fontSize="3.4" fill="#141619" stroke="#eeebe4" strokeWidth="2.4" paintOrder="stroke"
          fontFamily="inherit">habitat · 6 × 4 × 2.5 m</text>
      </svg>
      <div className="loader__bl">
        <span>{pct < 100 ? "Drafting the model" : "Model ready"}</span>
        <div className="loader__pct">{pct}<i>%</i></div>
      </div>
    </div>
  );
}
