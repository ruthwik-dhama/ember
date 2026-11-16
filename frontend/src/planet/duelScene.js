// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Turns a finished duel into what the room view shows: the last round's playback plus Red's fire and Blue's detectors.
const LIQUIDS = ["n-heptane", "methanol"];

export function duelScene(run) {
  const last = run.rounds[run.rounds.length - 1];
  const s = last.red.worst.scenario;
  return {
    result: last.after,
    scene: {
      fires: [{ material: s.material, phase: LIQUIDS.includes(s.material) ? "liquid" : "solid", x: s.x, y: s.y, z: s.z,
                t_ignite_s: s.t_ignite_s, droplet_d_mm: s.droplet_d_mm }],
      detectors: last.blue.detectors,
    },
  };
}
