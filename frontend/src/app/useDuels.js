// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Runs the two duels the Insights report shows, one after the other, as soon as a project starts: the mission's
// Red vs. Blue duel, then the liquid-fuel (Ghost Flame) demo. Owner: Kishan.
import { useCallback, useEffect, useRef } from "react";
import useDuelStream from "../planet/useDuelStream.js";

// Ghost Flame demo: heptane droplet inside the FLEX cool-flame range (14-25% O2, 50.7-101.3 kPa), CO2 suppression.
const LIQUID_DEMO = {
  o2_frac: 0.21, pressure_kpa: 101.3, suppressant: "co2",
  fires: [{ material: "n-heptane", phase: "liquid", x: 3, y: 2, z: 0.1, droplet_d_mm: 3.0 }],
};
const ROUNDS = 3;  // backend report.DUEL_ROUNDS; a cached duel's replay doesn't send it
const BUDGET = 60; // run_duel's Red and Blue simulation budgets per round

const finished = (s) => s.status === "done" || s.status === "error";

// Share of one duel done: rounds are equal parts, and each round is Red's search then Blue's.
function fraction(s) {
  if (finished(s)) return 1;
  if (s.status !== "running" || !s.round) return 0;
  let inRound = 0;
  if (s.blue) inRound = s.blue.done ? 1 : 0.5 + 0.5 * Math.min((s.blue.evals || 0) / BUDGET, 1);
  else if (s.red) inRound = s.red.done ? 0.5 : 0.5 * Math.min((s.red.evals || 0) / BUDGET, 1);
  return Math.min((s.round - 1 + inRound) / (s.rounds || ROUNDS), 1);
}

export default function useDuels() {
  const [duel, startDuel] = useDuelStream();
  const [ghost, startGhost, clearGhost] = useDuelStream();
  const queued = useRef(null);

  // `base` is the same SimConfig the backend report builds, so the report reuses this duel from the cache.
  const start = useCallback((mission) => {
    const base = { g: mission.g, o2_frac: mission.o2_frac, pressure_kpa: mission.pressure_kpa, vent_on: mission.vent_on };
    queued.current = { ...base, ...LIQUID_DEMO };
    clearGhost();
    startDuel(base, "Mission duel started");
  }, [startDuel, clearGhost]);

  useEffect(() => {
    if (!finished(duel) || !queued.current) return;
    const cfg = queued.current;
    queued.current = null;
    startGhost(cfg, "Liquid-fuel demo (Ghost Flame) started");
  }, [duel.status, startGhost]); // eslint-disable-line react-hooks/exhaustive-deps

  const onGhost = ghost.status === "running";
  const current = onGhost ? ghost : duel;
  const stage = `${onGhost ? "Liquid-fuel demo" : "Mission duel"}${current.round ? ` · round ${current.round} of ${current.rounds || ROUNDS}` : ""}`;
  return {
    duel, ghost, start,
    active: ghost.status !== "idle" ? ghost : duel,
    done: duel.status !== "idle" && finished(duel) && finished(ghost),
    progress: (fraction(duel) + fraction(ghost)) / 2,
    stage,
  };
}
