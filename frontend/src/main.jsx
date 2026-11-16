// AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App.jsx";
import "@fontsource/instrument-serif/400.css";
import "@fontsource-variable/instrument-sans";
import "./app/app.css";

createRoot(document.getElementById("root")).render(<App />);
