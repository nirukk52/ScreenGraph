#!/usr/bin/env bash

# PURPOSE: Start Encore backend dev with deterministic ports for this worktree.
# Run from repo root: ./scripts/dev-backend.sh

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

BACKEND_PORT="${BACKEND_PORT:-4000}"
ENCORE_DASHBOARD_PORT="${ENCORE_DASHBOARD_PORT:-9400}"

echo "[dev] backend=$BACKEND_PORT dashboard=$ENCORE_DASHBOARD_PORT"

cd backend
encore run --port="$BACKEND_PORT"

