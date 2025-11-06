#!/usr/bin/env bash

# PURPOSE: Start Encore backend dev with deterministic ports for this worktree.
# Run from repo root: ./scripts/dev-backend.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."
cd "$REPO_ROOT"

# Resolve ports and export env into this shell
eval "$(bun ./scripts/port-coordinator.mjs --no-summary)"

echo "[dev] backend=$BACKEND_PORT dashboard=$ENCORE_DASHBOARD_PORT"

cd backend
encore run --port="$BACKEND_PORT"

