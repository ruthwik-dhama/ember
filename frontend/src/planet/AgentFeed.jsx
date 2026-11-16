// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// What the agents are doing right now, as a scrolling feed.
import React, { useEffect, useRef } from "react";

const LABEL = { red: "Red", blue: "Blue", ghost: "Ghost Flame", system: "" };

function Live({ duel }) {
  if (duel.status !== "running") return null;
  const { red, blue } = duel;
  if (blue && !blue.done) return <p className="feed__live feed__live--blue">Blue is placing detectors… {blue.evals} sims tried</p>;
  if (red && !red.done) return <p className="feed__live feed__live--red">Red is hunting for a blind spot… {red.evals} sims tried</p>;
  return <p className="feed__live">Working…</p>;
}

export default function AgentFeed({ duel }) {
  const end = useRef();
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [duel.log.length]);
  return (
    <div className="feed" aria-live="polite">
      {duel.status === "idle" && <p className="muted small">Nothing running yet. Run a duel and each move by Red and Blue shows up here as it happens.</p>}
      {duel.log.map((e) => (
        <p key={e.id} className={"feed__item feed__item--" + e.agent}>
          <b>{LABEL[e.agent]}</b> {e.text}
        </p>
      ))}
      <Live duel={duel} />
      {duel.status === "error" && <p className="feed__item feed__item--red">Duel failed: {duel.error}</p>}
      <span ref={end} />
    </div>
  );
}
