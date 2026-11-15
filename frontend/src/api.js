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
