#!/usr/bin/env bash

# PURPOSE: Start Appium server standalone (without WDIO test runner)
#          for ScreenGraph agent to connect to http://127.0.0.1:4723

set -euo pipefail

APP_ADDR="127.0.0.1"
APP_PORT="4723"
APP_BASE_PATH="/"
LOG_LEVEL="info"
LOG_FILE="${TMPDIR:-/tmp}/appium-service.log"
PID_FILE="${TMPDIR:-/tmp}/appium-service.pid"

log() { printf "[%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

# Kill any process on the desired port (best-effort)
if command -v lsof >/dev/null 2>&1; then
  if lsof -ti tcp:"$APP_PORT" >/dev/null 2>&1; then
    log "Port $APP_PORT in use; attempting to free it."
    lsof -ti tcp:"$APP_PORT" | xargs -r kill -9 || true
    sleep 1
  fi
fi

log "Starting Appium Service at http://$APP_ADDR:$APP_PORT$APP_BASE_PATH (log: $LOG_FILE)"

# Start Appium with required flags
bunx appium \
  --address "$APP_ADDR" \
  --port "$APP_PORT" \
  --base-path "$APP_BASE_PATH" \
  --log-level "$LOG_LEVEL" \
  --allow-insecure=adb_shell \
  >"$LOG_FILE" 2>&1 &

echo $! >"$PID_FILE"

# Wait until Appium responds
url="http://$APP_ADDR:$APP_PORT/status"
for i in {1..60}; do
  if curl -sSf "$url" >/dev/null 2>&1; then
    log "Appium Service is ready at http://$APP_ADDR:$APP_PORT$APP_BASE_PATH"
    log "PID: $(cat "$PID_FILE")"
    log "Logs: $LOG_FILE"
    log "To stop: kill \$(cat $PID_FILE)  # or pkill -f 'appium.*$APP_PORT'"
    exit 0
  fi
  sleep 0.5
done

log "ERROR: Appium did not become ready in time. Check logs: $LOG_FILE"
exit 1
