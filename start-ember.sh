#!/usr/bin/env bash
# AI-assisted: drafted with Claude (Anthropic); see README "Use of AI".
# Starts the EMBER backend (:8000) and frontend (:5173) and opens the app. Ctrl-C stops both.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -x backend/.venv/bin/python ] || [ ! -d frontend/node_modules ]; then
  echo "One-time setup first (from the repo root):"
  echo "  python3 -m venv backend/.venv"
  echo "  backend/.venv/bin/pip install -r backend/requirements.txt"
  echo "  (cd frontend && npm install)"
  exit 1
fi

(cd backend && exec .venv/bin/python -m uvicorn ember.api:app --reload --port 8000) &
BACK=$!
(cd frontend && exec npm run dev) &
FRONT=$!
trap 'kill $BACK $FRONT 2>/dev/null; exit 0' INT TERM

sleep 4
if command -v open >/dev/null; then open http://localhost:5173; elif command -v xdg-open >/dev/null; then xdg-open http://localhost:5173; fi
echo "EMBER running at http://localhost:5173 (Ctrl-C to stop)"
wait
