#!/usr/bin/env bash
# Purpose: Check latest run events to diagnose hanging issues
# Usage: ./check-latest-run.sh

set -euo pipefail

echo "🔍 Checking latest run..."
echo ""

# Get latest run ID
LATEST_RUN=$(psql "${DATABASE_URL:-postgresql://localhost:5432/screengraph}" -t -c "
  SELECT run_id FROM runs ORDER BY created_at DESC LIMIT 1;
" | xargs)

if [ -z "$LATEST_RUN" ]; then
  echo "❌ No runs found in database"
  exit 1
fi

echo "📋 Latest Run: $LATEST_RUN"
echo ""

# Get run status
echo "📊 Run Status:"
psql "${DATABASE_URL:-postgresql://localhost:5432/screengraph}" -c "
  SELECT run_id, status, created_at, updated_at 
  FROM runs 
  WHERE run_id = '$LATEST_RUN';
"
echo ""

# Get events for this run
echo "📜 Run Events (last 10):"
psql "${DATABASE_URL:-postgresql://localhost:5432/screengraph}" -c "
  SELECT seq, kind, node_name, created_at
  FROM run_events
  WHERE run_id = '$LATEST_RUN'
  ORDER BY seq DESC
  LIMIT 10;
"
echo ""

# Check for EnsureDevice events specifically
echo "🔧 EnsureDevice Lifecycle Events:"
psql "${DATABASE_URL:-postgresql://localhost:5432/screengraph}" -c "
  SELECT seq, kind, payload::json->>'deviceId' as device_id, created_at
  FROM run_events
  WHERE run_id = '$LATEST_RUN'
    AND (kind LIKE '%device%' OR kind LIKE '%appium%')
  ORDER BY seq;
"

echo ""
echo "✅ Diagnostic complete"

