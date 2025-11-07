#!/usr/bin/env bash

# PURPOSE: Start Vite frontend (main tree only).
# Lightweight model: Services run ONLY on main tree with default ports.
# Run from repo root: ./scripts/dev-frontend.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."
cd "$REPO_ROOT"

# Verify we're on main tree
WORKTREE_NAME=$(basename $(git rev-parse --show-toplevel))

if [ "$WORKTREE_NAME" != "ScreenGraph" ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🚫 ERROR: Cannot start frontend in worktree"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Detected worktree: $WORKTREE_NAME"
    echo ""
    echo "Worktrees are for CODE EDITING only."
    echo "Services should run on the MAIN TREE."
    echo ""
    echo "To test your changes:"
    echo "  1. Commit your code in this worktree"
    echo "  2. cd ~/ScreenGraph/Code/ScreenGraph"
    echo "  3. git checkout $(git rev-parse --abbrev-ref HEAD)"
    echo "  4. ./scripts/dev-frontend.sh"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
fi

# Load environment (main tree uses .env only)
if [ ! -f .env ]; then
  echo "[dev] ERROR: .env file is missing. Copy .env.example to .env first." >&2
  exit 1
fi

set -a
source .env
set +a

echo "[dev] Starting frontend on main tree"
echo "      Frontend: http://localhost:${FRONTEND_PORT:-5173}"
echo "      Backend:  ${VITE_BACKEND_BASE_URL:-http://localhost:4000}"
echo ""

cd frontend
# Call vite directly to avoid circular dependency with package.json "dev" script
bunx --bun vite dev --port "${FRONTEND_PORT:-5173}"

