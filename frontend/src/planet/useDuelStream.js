// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Runs a live duel and folds the event stream into the state the planet and the feed draw from.
import { useCallback, useEffect, useReducer, useRef } from "react";
import { streamDuel } from "../api.js";

const INITIAL = { status: "idle", log: [], red: null, blue: null, ghost: null, round: 0, rounds: 0, run: null, error: null };
let nextId = 1;
const entry = (agent, text) => ({ id: nextId++, agent, text });
const delay = (s) => (s == null ? "never detected" : `${Math.round(s)} s`);

function reduce(s, e) {
  switch (e.type) {
    case "reset": return { ...INITIAL, status: "running", log: [entry("system", "Duel started")] };
    case "round_start":
      return { ...s, round: e.round, rounds: e.rounds ?? s.rounds, red: null, blue: null, ghost: null,
               log: [...s.log, entry("system", `Round ${e.round}`)] };
    case "red_step": return { ...s, red: { evals: e.evals, score: e.score, scenario: e.scenario, done: false } };
    case "red_done":
      return { ...s, red: { ...(s.red || {}), scenario: e.scenario, score: e.score, done: true },
               log: [...s.log, entry("red", e.why)] };
    case "blue_step":
      return { ...s, blue: { evals: e.evals, score: e.score, detectors: e.detectors, suppressant: e.suppressant, done: false } };
    case "blue_done":
      return { ...s, blue: { ...(s.blue || {}), detectors: e.detectors, suppressant: e.suppressant, done: true },
               log: [...s.log, entry("blue", `${e.detectors.length} two-moment detectors, vents off at ${Math.round(e.vent_off_at_s)} s, suppressant: ${e.suppressant}`)] };
    case "ghost":
      return { ...s, ghost: e,
               log: [...s.log, entry("ghost", e.applicable
                 ? (e.false_all_clear ? "Camera could report 'out' while a cool flame still burns (false all-clear)" : "No cool-flame risk in this regime")
                 : e.note)] };
    case "round_done":
      return { ...s, log: [...s.log, entry("system", `Time to alarm: ${delay(e.before_delay_s)} → ${delay(e.after_delay_s)}`)] };
    case "done": return { ...s, status: "done", run: e.run };
    case "error": return { ...s, status: "error", error: e.message };
    case "fail": return { ...s, status: "error", error: e.message };
    default: return s;
  }
}

export default function useDuelStream() {
  const [state, dispatch] = useReducer(reduce, INITIAL);
  const abort = useRef(null);
  useEffect(() => () => abort.current?.abort(), []);
  const start = useCallback((cfg) => {
    abort.current?.abort();
    const ctl = new AbortController();
    abort.current = ctl;
    dispatch({ type: "reset" });
    streamDuel(cfg, dispatch, ctl.signal).catch((err) => {
      if (err.name !== "AbortError") dispatch({ type: "fail", message: String(err.message || err) });
    });
  }, []);
  return [state, start];
}
