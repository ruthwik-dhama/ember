// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// App shell + routing. Owner: Kishan.
import React, { useState } from "react";
import MissionSetup from "../dashboard/MissionSetup.jsx";
import Explorer from "../dashboard/Explorer.jsx";
import Ranking from "../dashboard/Ranking.jsx";
import AskEmber from "../dashboard/AskEmber.jsx";
import Report from "../dashboard/Report.jsx";
import HabitatScreen from "../habitat/HabitatScreen.jsx";

const SCREENS = [
  ["Mission setup", MissionSetup],
  ["Experiment explorer", Explorer],
  ["Ranking", Ranking],
  ["Habitat simulation", HabitatScreen],
  ["Ask EMBER", AskEmber],
  ["Insights report", Report],
];

export default function App() {
  const [tab, setTab] = useState(0);
  const Screen = SCREENS[tab][1];
  return (
    <div className="app">
      <header>
        <h1>EMBER</h1>
        <nav>
          {SCREENS.map(([name], i) => (
            <button key={name} className={i === tab ? "active" : ""} onClick={() => setTab(i)}>
              {i + 1}. {name}
            </button>
          ))}
        </nav>
      </header>
      <main><Screen /></main>
    </div>
  );
}
