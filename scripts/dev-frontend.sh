#!/usr/bin/env bash

# PURPOSE: Start Vite frontend dev with deterministic ports and backend base URL for this worktree.
# Run from repo root: ./scripts/dev-frontend.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."
cd "$REPO_ROOT"

# Ensure env files exist and ports are assigned
bun ./scripts/port-coordinator.mjs --write-env --no-shell --no-summary

if [ ! -f .env ]; then
  echo "[dev] ERROR: .env file is missing. Copy .env.example to .env first." >&2
  exit 1
fi

set -a
source .env
if [ -f .env.local ]; then
  source .env.local
fi
set +a

FRONTEND_PORT="${FRONTEND_PORT:-5173}"
VITE_BACKEND_BASE_URL="${VITE_BACKEND_BASE_URL:-http://localhost:4000}"

echo "[dev] frontend=$FRONTEND_PORT backend=$VITE_BACKEND_BASE_URL"

cd frontend
# Call vite directly to avoid circular dependency with package.json "dev" script
bunx --bun vite dev --port "$FRONTEND_PORT"

