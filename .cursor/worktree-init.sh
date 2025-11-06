#!/usr/bin/env bash

# PURPOSE: Initialize Cursor Worktree environment with deterministic, non-conflicting ports.
# - Computes ports per worktree using the port coordinator
# - Exports BACKEND_PORT / FRONTEND_PORT / ENCORE_DASHBOARD_PORT / APPIUM_PORT
# - Sets VITE_BACKEND_BASE_URL for the frontend to use generated Encore client
# This script is idempotent and safe to run multiple times.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."

# Port coordinator is at repo root scripts/ (worktree-level concern)
COORD="$REPO_ROOT/scripts/port-coordinator.mjs"
if [ ! -f "$COORD" ]; then
  echo "[cursor:worktree-init] ERROR: port-coordinator.mjs not found at $COORD" >&2
  exit 1
fi

# Run coordinator and export env for this shell.
# The coordinator respects CURSOR_WORKTREE_NAME/WORKTREE_NAME if provided by Cursor.
eval "$(bun "$COORD" --no-summary)"

echo "[cursor:worktree-init] ✓ Ports assigned for worktree: ${WORKTREE_NAME:-unknown}"
echo "[cursor:worktree-init]    backend=$BACKEND_PORT frontend=$FRONTEND_PORT dashboard=${ENCORE_DASHBOARD_PORT:-9400} appium=$APPIUM_PORT"
echo "[cursor:worktree-init]    VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL"

# Optionally persist a snapshot for debugging/visibility (non-authoritative).
# This file is safe to delete; authoritative registry lives at ~/.screengraph/ports.json
ENV_SNAPSHOT="$SCRIPT_DIR/worktree.env"
cat > "$ENV_SNAPSHOT" <<EOF
WORKTREE_NAME=${WORKTREE_NAME:-}
CURSOR_WORKTREE_NAME=${CURSOR_WORKTREE_NAME:-}
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
ENCORE_DASHBOARD_PORT=${ENCORE_DASHBOARD_PORT:-}
APPIUM_PORT=$APPIUM_PORT
VITE_BACKEND_BASE_URL=$VITE_BACKEND_BASE_URL
EOF

echo "[cursor:worktree-init] Wrote snapshot: $ENV_SNAPSHOT"


