#!/usr/bin/env bash

# PURPOSE: Initialize Cursor Worktree (lightweight model).
# - Worktrees are for CODE EDITING only
# - Services run ONLY on main tree (default ports)
# - This script just verifies setup and reminds about workflow

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/.."
cd "$REPO_ROOT"

WORKTREE_NAME=$(basename $(git rev-parse --show-toplevel))
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 Worktree Initialized: $WORKTREE_NAME"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Branch: $BRANCH"
echo "Mode: CODE EDITING ONLY"
echo ""
echo "✅ What to do here:"
echo "   - Edit code freely"
echo "   - Commit to $BRANCH"
echo "   - Push when ready"
echo ""
echo "❌ What NOT to do:"
echo "   - Don't run ./scripts/dev-backend.sh (will error)"
echo "   - Don't run ./scripts/dev-frontend.sh (will error)"
echo ""
echo "🧪 To test your changes:"
echo "   1. Commit here: git add . && git commit"
echo "   2. Switch main tree: cd ~/ScreenGraph/Code/ScreenGraph"
echo "   3. Checkout branch: git checkout $BRANCH"
echo "   4. Services auto-reload on main tree"
echo "   5. Test at: http://localhost:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"


