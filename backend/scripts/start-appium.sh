#!/usr/bin/env bash

# PURPOSE: Ensure an Appium server is running with the ScreenGraph-required flags.
# - Starts (or restarts) Appium on 127.0.0.1:${APPIUM_PORT:-4723}
# - Forces --allow-insecure=uiautomator2:adb_shell so UiAutomator2 shell commands work
# - Waits until the /status endpoint responds successfully

set -euo pipefail

APP_HOST="${APPIUM_HOST:-127.0.0.1}"
APP_PORT="${APPIUM_PORT:-4723}"
BASE_PATH="${APPIUM_BASE_PATH:-/}"
LOG_FILE="${TMPDIR:-/tmp}/appium-backend-tests.log"
PID_FILE="${TMPDIR:-/tmp}/appium-backend-tests.pid"
ALLOW_INSECURE_VALUE="uiautomator2:adb_shell"

log() {
  printf "[start-appium] %s\n" "$*" >&2
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "ERROR: '$1' command is required but not available in PATH."
    exit 1
  fi
}

find_listen_pid() {
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:"$APP_PORT" -s TCP:LISTEN 2>/dev/null | head -n1 || true
  else
    # Fallback: best effort using netstat if available
    if command -v netstat >/dev/null 2>&1; then
      netstat -anp tcp 2>/dev/null | awk -v port="$APP_PORT" '$4 ~ ":"port"$" && $6 == "LISTEN" {print $7}' | cut -d/ -f1 | head -n1
    else
      echo ""
    fi
  fi
}

stop_existing_server() {
  local pid
  pid="$(find_listen_pid)"
  if [[ -n "${pid:-}" ]]; then
    log "An existing process (pid: $pid) is listening on port $APP_PORT. Terminating it..."
    kill "$pid" >/dev/null 2>&1 || true
    sleep 1
    if kill -0 "$pid" >/dev/null 2>&1; then
      log "Process $pid did not exit gracefully; sending SIGKILL."
      kill -9 "$pid" >/dev/null 2>&1 || true
      sleep 1
    fi
  fi
}

determine_appium_command() {
  if command -v appium >/dev/null 2>&1; then
    printf "appium"
  elif command -v bunx >/dev/null 2>&1; then
    printf "bunx appium"
  else
    log "ERROR: Neither 'appium' nor 'bunx' is available. Install Appium globally or via Bun."
    exit 1
  fi
}

start_server() {
  local appium_cmd
  appium_cmd="$(determine_appium_command)"

  log "Starting Appium with required flags on ${APP_HOST}:${APP_PORT}${BASE_PATH}"
  log "Logs: ${LOG_FILE}"

  nohup ${appium_cmd} \
    --address "${APP_HOST}" \
    --port "${APP_PORT}" \
    --base-path "${BASE_PATH}" \
    --allow-insecure="${ALLOW_INSECURE_VALUE}" \
    --log-level info \
    >"${LOG_FILE}" 2>&1 &

  local new_pid=$!
  echo "${new_pid}" > "${PID_FILE}"
  log "Appium PID: ${new_pid}"
}

wait_for_ready() {
  local status_url
  status_url="http://${APP_HOST}:${APP_PORT}${BASE_PATH%/}/status"

  log "Waiting for Appium to become ready at ${status_url}..."
  for attempt in $(seq 1 60); do
    if curl -sSf "${status_url}" >/dev/null 2>&1; then
      log "Appium server is ready."
      return 0
    fi

    # If process died, surface logs
    if ! kill -0 "$(cat "${PID_FILE}" 2>/dev/null || echo 0)" >/dev/null 2>&1; then
      log "ERROR: Appium process exited prematurely."
      log "Last 20 log lines:"
      tail -n 20 "${LOG_FILE}" 2>/dev/null || true
      exit 1
    fi

    sleep 1
  done

  log "ERROR: Appium did not respond within 60 seconds."
  log "Check the log at ${LOG_FILE}"
  exit 1
}

already_ready() {
  local status_url
  status_url="http://${APP_HOST}:${APP_PORT}${BASE_PATH%/}/status"
  curl -sf "${status_url}" >/dev/null 2>&1
}

ensure_flags_present() {
  local pid command_line
  pid="$(find_listen_pid)"
  if [[ -z "${pid:-}" ]]; then
    return 1
  fi

  command_line="$(ps -p "${pid}" -o command= 2>/dev/null || true)"
  if [[ "${command_line}" == *"--allow-insecure=${ALLOW_INSECURE_VALUE}"* ]] || [[ "${command_line}" == *"--allow-insecure ${ALLOW_INSECURE_VALUE}"* ]]; then
    log "Appium already running with required flags (pid ${pid})."
    echo "${pid}" > "${PID_FILE}"
    return 0
  fi

  log "Appium is running (pid ${pid}) but without required '--allow-insecure=${ALLOW_INSECURE_VALUE}' flag."
  return 1
}

main() {
  require_cmd curl

  if ensure_flags_present && already_ready; then
    log "Appium status endpoint reachable; nothing to do."
    exit 0
  fi

  stop_existing_server
  start_server
  wait_for_ready
}

main "$@"


