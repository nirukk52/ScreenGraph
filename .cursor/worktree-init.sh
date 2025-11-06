#!/usr/bin/env bash

# PURPOSE: Initialize Cursor Worktree environment with deterministic, non-conflicting ports.
# - Computes ports per worktree using the port coordinator
# - Exports BACKEND_PORT / FRONTEND_PORT / ENCORE_DASHBOARD_PORT / APPIUM_PORT
# - Sets VITE_BACKEND_BASE_URL for the frontend to use generated Encore client
# This script is idempotent and safe to run multiple times.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."

# Prefer backend copy; fallback to frontend copy to keep backend/frontend isolation.
if [ -f "$REPO_ROOT/backend/scripts/port-coordinator.mjs" ]; then
  COORD="$REPO_ROOT/backend/scripts/port-coordinator.mjs"
elif [ -f "$REPO_ROOT/frontend/scripts/port-coordinator.mjs" ]; then
  COORD="$REPO_ROOT/frontend/scripts/port-coordinator.mjs"
else
  echo "[cursor:worktree-init] ERROR: port-coordinator.mjs not found in backend/ or frontend/scripts/" >&2
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


