#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

# Load .env if exists
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

echo "Starting frontend on port ${FRONTEND_PORT:-5173}"

cd frontend
bunx --bun vite dev --port "${FRONTEND_PORT:-5173}"

