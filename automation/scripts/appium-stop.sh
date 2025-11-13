#!/usr/bin/env bash
# Purpose: Stop Appium server gracefully
# Usage: ./appium-stop.sh [--force]

set -euo pipefail

FORCE=false
if [[ "${1:-}" == "--force" ]]; then
  FORCE=true
fi

echo "🔍 Searching for Appium processes..."

# Find Appium processes
PIDS=$(pgrep -f "appium.*--port" || true)

if [[ -z "$PIDS" ]]; then
  echo "✅ No Appium processes found"
  exit 0
fi

echo "📋 Found Appium process(es): $PIDS"

if [[ "$FORCE" == "true" ]]; then
  echo "💀 Force killing Appium processes..."
  echo "$PIDS" | xargs kill -9 2>/dev/null || true
  echo "✅ Appium processes force-killed"
else
  echo "🛑 Stopping Appium gracefully (SIGTERM)..."
  echo "$PIDS" | xargs kill -TERM 2>/dev/null || true
  
  # Wait up to 5 seconds for graceful shutdown
  for i in {1..5}; do
    REMAINING=$(pgrep -f "appium.*--port" || true)
    if [[ -z "$REMAINING" ]]; then
      echo "✅ Appium stopped gracefully"
      exit 0
    fi
    echo "⏳ Waiting for graceful shutdown... ($i/5)"
    sleep 1
  done
  
  # Force kill if still running
  REMAINING=$(pgrep -f "appium.*--port" || true)
  if [[ -n "$REMAINING" ]]; then
    echo "⚠️  Graceful shutdown timeout, force killing..."
    echo "$REMAINING" | xargs kill -9 2>/dev/null || true
    echo "✅ Appium processes force-killed"
  fi
fi

