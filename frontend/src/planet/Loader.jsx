// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Drafting-sheet loader like the Landfall template: cream sheet with a grid, a wireframe globe with a teal orbit,
// a model-progress counter, then an "Enter the planet" button that opens an iris onto the scene.
import React, { useEffect, useState } from "react";
import Brand from "../app/Brand.jsx";

const IRIS_MS = 900;
const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function Loader({ ready, onDone }) {
  const [pct, setPct] = useState(0);
  const [iris, setIris] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setPct((p) => (reduced() ? (ready ? 100 : 90) : Math.min(ready ? 100 : 92, p + 2 + Math.random() * 3))), 60);
    return () => clearInterval(id);
  }, [ready]);
  const done = pct >= 100;
  const enter = () => { setIris(true); setTimeout(onDone, reduced() ? 0 : IRIS_MS); };

  return (
    <div className={"loader" + (iris ? " loader--iris" : "")} role="status" aria-label="Loading EMBER">
      <i className="loader__corner loader__corner--tl" /><i className="loader__corner loader__corner--tr" />
      <i className="loader__corner loader__corner--bl" /><i className="loader__corner loader__corner--br" />
      <div className="loader__name"><Brand /><span>Fire safety for the Moon and Mars</span></div>
      <div className="loader__meta"><b>Sheet 01 — A tiny planet</b><span>Scale 1 : 200 000</span><span>0.165 g · 30% O₂ · 70.3 kPa</span></div>

      <svg className="loader__globe" viewBox="-80 -64 160 128" fill="none" strokeLinecap="round" overflow="visible">
        <g stroke="#141619">
          <circle r="50" strokeWidth="2" />
          <g strokeWidth="1" opacity="0.55">
            <line x1="-47" y1="-17" x2="40" y2="-47" /><line x1="-50" y1="3" x2="49" y2="-33" />
            <line x1="-45" y1="24" x2="50" y2="-8" /><line x1="-30" y1="42" x2="47" y2="17" />
          </g>
          <g className="loader__spin" strokeWidth="1" opacity="0.4"><ellipse rx="18" ry="50" /><ellipse rx="36" ry="50" /></g>
          <line x1="0" y1="-60" x2="0" y2="60" strokeWidth="1" strokeDasharray="12 6 2 6" opacity="0.5" />
          <line x1="-60" y1="0" x2="60" y2="0" strokeWidth="1" strokeDasharray="12 6 2 6" opacity="0.5" />
        </g>
        <ellipse id="orbit" rx="68" ry="16" transform="rotate(-14)" stroke="#17806D" strokeWidth="1.3" strokeDasharray="4 6" />
        <circle r="2.4" fill="#17806D"><animateMotion dur="7s" repeatCount="indefinite" rotate="0"><mpath href="#orbit" /></animateMotion></circle>
        <g stroke="#141619" strokeWidth="1" opacity="0.6"><line x1="-50" y1="62" x2="-20" y2="62" /><line x1="20" y1="62" x2="50" y2="62" /></g>
        <text y="64.5" textAnchor="middle" fontSize="5" fill="#141619" stroke="none">Ø 6 m</text>
      </svg>

      <div className="loader__cta">
        {done ? <button className="primary cta" onClick={enter} autoFocus>Enter the planet</button>
              : <span className="muted small">Drag to turn the model once inside</span>}
      </div>
      <div className="loader__count"><span>{done ? "Model ready" : "Drafting the model"}</span><b>{Math.floor(pct)}<i>%</i></b></div>
    </div>
  );
}
