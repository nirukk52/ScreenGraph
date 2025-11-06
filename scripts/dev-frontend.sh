#!/usr/bin/env bash

# PURPOSE: Start Vite frontend dev with deterministic ports and backend base URL for this worktree.
# Run from repo root: ./scripts/dev-frontend.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."
cd "$REPO_ROOT"

# Resolve ports and export env into this shell
eval "$(bun ./scripts/port-coordinator.mjs --no-summary)"

echo "[dev] frontend=$FRONTEND_PORT backend=$VITE_BACKEND_BASE_URL"

cd frontend
# Prefer config picking up FRONTEND_PORT; also pass explicit --port as backup
vite dev --port "$FRONTEND_PORT"

