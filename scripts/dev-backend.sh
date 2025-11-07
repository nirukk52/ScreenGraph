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

echo "Starting backend on port ${BACKEND_PORT:-4000}"

cd backend
encore run --port="${BACKEND_PORT:-4000}"

