// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Runs live duels and folds the event stream into the state the planet, the feed and the progress bar draw from.
// start([cfgA, cfgB]) runs the configs one after another; each finished run is kept in `runs`.
import { useCallback, useEffect, useReducer, useRef } from "react";
import { streamDuel } from "../api.js";

const BUDGET = 60;        // red_budget / blue_budget in agents.blue_team.run_duel
const DEFAULT_ROUNDS = 3; // report.DUEL_ROUNDS; cached replays don't send it

const INITIAL = {
  status: "idle", log: [], red: null, blue: null, ghost: null, round: 0, rounds: 0, error: null,
  runs: [], step: 0, steps: [], within: 0, // within = progress inside the current run, 0..1
};
let nextId = 1;
const entry = (agent, text) => ({ id: nextId++, agent, text });
const delay = (s) => (s == null ? "never detected" : `${Math.round(s)} s`);
const frac = (evals) => Math.min(1, (evals || 0) / BUDGET);

// Where we are inside one round: Red's search is the first half, Blue's the rest.
function withinRun(s, round, stage) {
  const rounds = s.rounds || DEFAULT_ROUNDS;
  return Math.min(1, Math.max(s.within, (round - 1 + stage) / rounds));
}

function reduce(s, e) {
  switch (e.type) {
    case "reset":
      return { ...INITIAL, status: "running", steps: e.steps, log: [entry("system", e.steps[0].label + " started")] };
    case "next_step":
      return { ...s, step: s.step + 1, within: 0, round: 0, rounds: 0, red: null, blue: null, ghost: null,
               log: [...s.log, entry("system", s.steps[s.step + 1].label + " started")] };
    case "round_start":
      return { ...s, round: e.round, rounds: e.rounds ?? s.rounds, red: null, blue: null, ghost: null,
               within: withinRun(s, e.round, 0), log: [...s.log, entry("system", `Round ${e.round}`)] };
    case "red_step":
      return { ...s, red: { evals: e.evals, score: e.score, scenario: e.scenario, done: false },
               within: withinRun(s, e.round ?? s.round, 0.5 * frac(e.evals)) };
    case "red_done":
      return { ...s, red: { ...(s.red || {}), scenario: e.scenario, score: e.score, done: true },
               within: withinRun(s, e.round ?? s.round, 0.5), log: [...s.log, entry("red", e.why)] };
    case "blue_step":
      return { ...s, blue: { evals: e.evals, score: e.score, detectors: e.detectors, suppressant: e.suppressant, done: false },
               within: withinRun(s, e.round ?? s.round, 0.5 + 0.45 * frac(e.evals)) };
    case "blue_done":
      return { ...s, blue: { ...(s.blue || {}), detectors: e.detectors, suppressant: e.suppressant, done: true },
               within: withinRun(s, e.round ?? s.round, 0.95),
               log: [...s.log, entry("blue", `${e.detectors.length} two-moment detectors, vents off at ${Math.round(e.vent_off_at_s)} s, suppressant: ${e.suppressant}`)] };
    case "ghost":
      return { ...s, ghost: e,
               log: [...s.log, entry("ghost", e.applicable
                 ? (e.false_all_clear ? "Camera could report 'out' while a cool flame still burns (false all-clear)" : "No cool-flame risk in this regime")
                 : e.note)] };
    case "round_done":
      return { ...s, within: withinRun(s, e.round ?? s.round, 1),
               log: [...s.log, entry("system", `Time to alarm: ${delay(e.before_delay_s)} to ${delay(e.after_delay_s)}`)] };
    case "done": return { ...s, within: 1, runs: [...s.runs, e.run] };
    case "all_done": return { ...s, status: "done" };
    case "error": return { ...s, status: "error", error: e.message };
    case "fail": return { ...s, status: "error", error: e.message };
    default: return s;
  }
}

// Overall 0..1 across all steps, each weighted by how long it usually takes.
export function duelProgress(d) {
  if (d.status === "done") return 1;
  if (!d.steps.length) return 0;
  const total = d.steps.reduce((a, st) => a + st.weight, 0);
  const before = d.steps.slice(0, d.step).reduce((a, st) => a + st.weight, 0);
  return (before + d.steps[d.step].weight * d.within) / total;
}

export default function useDuelStream() {
  const [state, dispatch] = useReducer(reduce, INITIAL);
  const abort = useRef(null);
  useEffect(() => () => abort.current?.abort(), []);

  // steps: [{label, weight, cfg}, ...], run in order.
  const start = useCallback(async (steps) => {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    dispatch({ type: "reset", steps });
    let failed = false;
    const onEvent = (e) => { if (e.type === "error") failed = true; dispatch(e); };
    try {
      for (let i = 0; i < steps.length; i++) {
        if (i > 0) dispatch({ type: "next_step" });
        await streamDuel(steps[i].cfg, onEvent, ctl.signal);
        if (failed || ctl.signal.aborted) return;
      }
      dispatch({ type: "all_done" });
    } catch (err) {
      if (err.name !== "AbortError") dispatch({ type: "fail", message: String(err.message || err) });
    }
  }, []);

  return [state, start];
}
