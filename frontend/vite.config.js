// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// /api/* is proxied to the FastAPI backend on :8000
export default defineConfig({
  plugins: [react()],
  server: { proxy: { "/api": "http://localhost:8000" } },
});
