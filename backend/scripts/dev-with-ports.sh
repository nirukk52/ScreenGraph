#!/usr/bin/env bash

# PURPOSE: Legacy wrapper - redirects to root scripts/dev-backend.sh
# This file is kept for backward compatibility but will be removed in future.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$SCRIPT_DIR/../.."

echo "[dev] DEPRECATED: Use './scripts/dev-backend.sh' from repo root instead" >&2
exec "$REPO_ROOT/scripts/dev-backend.sh"


