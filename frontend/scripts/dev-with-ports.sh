#!/usr/bin/env bash

# PURPOSE: Start Vite dev with deterministic ports and backend base URL for this worktree.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

# Resolve ports and export env into this shell
eval "$(bun ./scripts/port-coordinator.mjs --no-summary)"

echo "[dev] frontend=$FRONTEND_PORT backend=$VITE_BACKEND_BASE_URL"

# Prefer config picking up FRONTEND_PORT; also pass explicit --port as backup
vite dev --port "$FRONTEND_PORT"


