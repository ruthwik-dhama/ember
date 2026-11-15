// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Habitat simulation + Ask EMBER on one page. Owner: Kishan (app shell). Panels keep their owners:
// HabitatScreen = Kartavya (with Ruthwik / Sibi panels), AskEmber = Kishan (witnesses: Sibi).
// Wide screens: simulation left, chat right (sticky, so questions stay in view while scrolling the habitat).
// Narrow screens (< 1000 px): chat stacks under the simulation.
import React from "react";
import HabitatScreen from "../habitat/HabitatScreen.jsx";
import AskEmber from "../dashboard/AskEmber.jsx";

export default function SimulateAndAsk() {
  return (
    <div className="simulate-ask">
      <section className="simulate-ask__sim" aria-label="Habitat simulation">
        <HabitatScreen />
      </section>
      <aside className="simulate-ask__ask" aria-label="Ask EMBER">
        <AskEmber />
      </aside>
    </div>
  );
}
