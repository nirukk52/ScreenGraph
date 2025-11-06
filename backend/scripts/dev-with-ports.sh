#!/usr/bin/env bash

# PURPOSE: Start Encore dev with deterministic ports for this worktree.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

# Resolve ports and export env into this shell
eval "$(bun ./scripts/port-coordinator.mjs --no-summary)"

echo "[dev] backend=$BACKEND_PORT dashboard=$ENCORE_DASHBOARD_PORT"

encore run


