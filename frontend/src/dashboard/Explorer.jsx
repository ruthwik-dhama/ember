// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
// Experiment explorer + compare. Owner: Kishan (data: Sibi). Wired to /api/investigations as a working example.
import React, { useEffect, useState } from "react";
import { listInvestigations } from "../api.js";
import Placeholder from "../components/Placeholder.jsx";

export default function Explorer() {
  const [items, setItems] = useState(null);
  const [err, setErr] = useState(null);
  useEffect(() => { listInvestigations().then(setItems).catch((e) => setErr(String(e))); }, []);
  return (
    <Placeholder title="Experiment explorer" owner="Kishan (data: Sibi)">
      {err && <p>Backend not reachable: {err}</p>}
      {items && (
        <ul>
          {items.map((inv) => (
            <li key={inv.id}><b>{inv.id}</b> · {inv.name} · {inv.fuel.phase} · {inv.pillars.join(", ")}{!inv.verified && " (unverified)"}</li>
          ))}
        </ul>
      )}
    </Placeholder>
  );
}
