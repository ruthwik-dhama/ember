// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// API client. Owner: Kishan. Other lanes: ask Kishan to add calls here rather than calling fetch directly.
async function req(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

export const health = () => req("GET", "/api/health");
export const getMission = () => req("GET", "/api/mission");
export const setMission = (mission) => req("POST", "/api/mission", mission);
export const listInvestigations = () => req("GET", "/api/investigations");
export const getInvestigation = (id) => req("GET", `/api/investigations/${id}`);
export const compare = (a, b) => req("GET", `/api/compare?a=${a}&b=${b}`);
export const rank = (pillar) => req("GET", `/api/rank${pillar ? `?pillar=${pillar}` : ""}`);
export const simulate = (cfg) => req("POST", "/api/simulate", cfg);
export const runDuel = (cfg) => req("POST", "/api/duel/run", cfg);
export const getDuel = (runId) => req("GET", `/api/duel/${runId}`);
export const ask = (question) => req("POST", "/api/ask", { question });
export const gapMap = () => req("GET", "/api/gap_map");
export const report = () => req("GET", "/api/report");

// Live duel: POST /api/duel/stream returns newline-delimited JSON events (see backend agents/blue_team.iter_duel).
// EventSource is GET-only, so read the response body as a stream. Resolves when the stream ends.
export async function streamDuel(cfg, onEvent, signal) {
  const res = await fetch("/api/duel/stream", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cfg), signal,
  });
  if (!res.ok || !res.body) throw new Error(`POST /api/duel/stream -> ${res.status}: ${await res.text()}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line) onEvent(JSON.parse(line));
    }
  }
}
