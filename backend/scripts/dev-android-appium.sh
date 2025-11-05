#!/usr/bin/env bash

# PURPOSE: Local dev helper to ensure an Android device is online, start Appium (127.0.0.1:4723),
#          and pre-warm a UiAutomator2 session so ScreenGraph's EnsureDevice step avoids timeouts.

set -euo pipefail

APP_ADDR="127.0.0.1"
APP_PORT="4723"
APP_BASE_PATH="/"
LOG_LEVEL="info"
LOG_FILE="${TMPDIR:-/tmp}/appium.log"
PID_FILE="${TMPDIR:-/tmp}/appium.pid"
ADB_TIMEOUT=5  # Timeout for ADB commands in seconds

log() { printf "[%s] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2; }

log_verbose() { 
  if [ "${VERBOSE:-0}" = "1" ]; then
    printf "[%s] [DEBUG] %s\n" "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >&2; 
  fi
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "ERROR: Missing required command: $1";
    exit 1;
  fi
}

# Ensure ADB server is running
ensure_adb_server() {
  log_verbose "Ensuring ADB server is running..."
  
  # Check if ADB server is already running
  if pgrep -f 'adb.*fork-server' >/dev/null 2>&1; then
    log_verbose "ADB server already running"
    return 0
  fi
  
  # Start ADB server with timeout
  log_verbose "Starting ADB server..."
  if timeout 5 adb start-server >/dev/null 2>&1; then
    log_verbose "ADB server started"
    return 0
  else
    log "WARN: ADB server start timed out, but continuing..."
    return 0  # Don't fail, ADB might still work
  fi
}

# Check if device is actually responsive (not just listed)
is_device_responsive() {
  local serial="$1"
  local max_attempts="${2:-3}"  # Default 3 attempts
  
  log_verbose "Testing device responsiveness: $serial"
  
  for attempt in $(seq 1 $max_attempts); do
    # Try to get a simple property with timeout
    if timeout 10 adb -s "$serial" shell getprop ro.build.version.sdk >/dev/null 2>&1; then
      log_verbose "Device $serial is responsive (attempt $attempt/$max_attempts)"
      return 0
    fi
    
    if [ $attempt -lt $max_attempts ]; then
      log_verbose "Device $serial not responsive yet, retrying... ($attempt/$max_attempts)"
      sleep 2
    fi
  done
  
  log_verbose "Device $serial is not responsive after $max_attempts attempts"
  return 1
}

# Get list of online and authorized devices (excluding offline/unauthorized)
get_online_devices() {
  local devices
  # Only get devices with status "device" (online and authorized)
  # Filter out "offline", "unauthorized", "no permissions", etc.
  devices=$(timeout 3 adb devices 2>/dev/null | awk 'NR>1 && $2=="device"{print $1}' || true)
  echo "$devices"
}

# Get list of problematic devices for diagnostics
get_offline_devices() {
  local devices
  devices=$(timeout 3 adb devices 2>/dev/null | awk 'NR>1 && $2!="device" && $1!=""{printf "%s (%s)\n", $1, $2}' || true)
  echo "$devices"
}

# Wait for device to finish booting with improved logging
wait_for_boot_completed() {
  local serial="$1"
  local max_attempts=45  # 90 seconds total (45 * 2s)
  
  log "Waiting for device to finish booting ($serial)..."
  
  # First ensure device is reachable
  if ! adb -s "$serial" wait-for-device 2>&1 | head -1; then
    log "WARN: Device wait returned with error, but continuing..."
  fi
  
  # Poll boot completion property
  for i in $(seq 1 $max_attempts); do
    log_verbose "Boot check attempt $i/$max_attempts"
    
    # Use timeout to prevent hanging
    local boot_status
    boot_status=$(timeout "$ADB_TIMEOUT" adb -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || echo "0")
    
    if [ "$boot_status" = "1" ]; then
      log "Device boot completed successfully."
      return 0
    fi
    
    # Log progress every 10 attempts
    if [ $((i % 10)) -eq 0 ]; then
      log "Still waiting for boot completion... ($i/${max_attempts} attempts)"
    fi
    
    sleep 2
  done
  
  log "WARN: Timeout waiting for boot completion after ${max_attempts} attempts."
  log "WARN: Device may still be booting. Continuing anyway..."
  return 0  # Don't fail, just warn
}

# Ensure at least one Android device is online and responsive
ensure_device_online() {
  log "Checking Android device/emulator status..."
  
  # Ensure ADB server is running (don't restart if already running)
  ensure_adb_server
  
  # Get list of devices
  local devices
  devices=$(get_online_devices)
  
  # Check for problematic devices
  local offline_devices
  offline_devices=$(get_offline_devices)
  
  if [ -n "$offline_devices" ]; then
    log "WARN: Found problematic device(s):"
    while IFS= read -r line; do
      if [ -n "$line" ]; then
        log "  - $line"
      fi
    done <<< "$offline_devices"
    log ""
    log "Possible solutions:"
    log "  1. If 'offline': Kill the stuck emulator and restart"
    log "     - Close Android Studio Emulator"
    log "     - Run: pkill -9 emulator && adb kill-server && adb start-server"
    log "  2. If 'unauthorized': Check device for USB debugging prompt"
    log "  3. Try: adb kill-server && adb start-server"
    log ""
  fi
  
  if [ -n "$devices" ]; then
    # Found at least one device, verify it's responsive
    local device_count
    device_count=$(echo "$devices" | wc -l | tr -d ' ')
    log "Found $device_count online device(s)"
    
    # Try each device until we find a responsive one
    for serial in $devices; do
      log "Checking device: $serial"
      
      # Try responsiveness check with retries (but don't fail if it times out)
      if is_device_responsive "$serial" 2; then
        log "Device $serial is online and responsive."
        wait_for_boot_completed "$serial"
        echo "$serial"
        return 0
      else
        log "WARN: Device $serial responsiveness check timed out."
        log "WARN: Continuing anyway - Appium may still be able to connect..."
        # Use the device anyway - Appium might still work
        echo "$serial"
        return 0
      fi
    done
    
    # If we get here, something unexpected happened
    log "ERROR: Unexpected error checking devices."
    return 1
  fi
  
  # No online devices, check if we should try launching emulator
  if [ -n "$offline_devices" ]; then
    log "ERROR: Only offline/unauthorized devices found. Cannot auto-launch emulator."
    log "ERROR: Please fix the existing device issues first."
    log "ERROR: Run: pkill -9 emulator && adb kill-server && adb start-server"
    return 1
  fi
  
  # No devices at all, try launching an emulator
  log "No devices found. Attempting to launch emulator..."
  
  if ! command -v emulator >/dev/null 2>&1; then
    log "ERROR: No device online and 'emulator' command not found."
    log "ERROR: Options:"
    log "ERROR:   1. Connect a physical Android device via USB"
    log "ERROR:   2. Install Android SDK and create an AVD"
    log "ERROR:   3. Start an emulator from Android Studio"
    return 1
  fi
  
  # Get first available AVD
  local avd
  avd=$(emulator -list-avds 2>/dev/null | head -n1 || true)
  
  if [ -z "$avd" ]; then
    log "ERROR: No AVDs found. Create one in Android Studio (Tools > AVD Manager)."
    return 1
  fi
  
  log "Launching AVD: $avd"
  log "This may take 1-2 minutes..."
  
  # Launch emulator in background
  nohup emulator @"$avd" -netdelay none -netspeed full >/dev/null 2>&1 &
  local emulator_pid=$!
  log_verbose "Emulator process PID: $emulator_pid"
  
  # Wait for device to appear (with timeout)
  log "Waiting for emulator to appear..."
  local wait_attempts=60  # 60 seconds
  for i in $(seq 1 $wait_attempts); do
    devices=$(get_online_devices)
    if [ -n "$devices" ]; then
      local serial
      serial=$(echo "$devices" | head -n1)
      log "Emulator appeared as: $serial"
      
      if is_device_responsive "$serial"; then
        wait_for_boot_completed "$serial"
        echo "$serial"
        return 0
      fi
    fi
    
    if [ $((i % 10)) -eq 0 ]; then
      log "Still waiting for emulator... ($i/${wait_attempts} seconds)"
    fi
    
    sleep 1
  done
  
  log "ERROR: Emulator did not come online within ${wait_attempts} seconds."
  log "ERROR: Check Android Studio logs or try launching manually."
  return 1
}

# Ensure Appium UiAutomator2 driver is installed
ensure_appium_driver() {
  log "Checking Appium UiAutomator2 driver..."
  
  # Check if driver is already installed
  local driver_list
  driver_list=$(bunx appium driver list --installed 2>&1 || true)
  
  if echo "$driver_list" | grep -qi "uiautomator2"; then
    log "Appium driver 'uiautomator2' is already installed."
    return 0
  fi
  
  log "Installing Appium driver: uiautomator2"
  
  # Try to install - capture output to check for "already installed" message
  local install_output
  install_output=$(bunx appium driver install uiautomator2 2>&1 || true)
  
  # Check if it succeeded or was already installed
  if echo "$install_output" | grep -qi "successfully installed"; then
    log "Driver installed successfully."
    return 0
  elif echo "$install_output" | grep -qi "already installed"; then
    log "Driver was already installed."
    return 0
  fi
  
  # Verify installation by checking list again
  driver_list=$(bunx appium driver list --installed 2>&1 || true)
  if echo "$driver_list" | grep -qi "uiautomator2"; then
    log "Driver installation verified."
    return 0
  fi
  
  # If we get here, something went wrong
  log "ERROR: Failed to install uiautomator2 driver."
  log "ERROR: Output: $install_output"
  log "ERROR: Try manually: bunx appium driver install uiautomator2"
  exit 1
}

# Kill any process using the target port
free_port() {
  if ! command -v lsof >/dev/null 2>&1; then
    log_verbose "lsof not available, skipping port check"
    return 0
  fi
  
  if lsof -ti tcp:"$APP_PORT" >/dev/null 2>&1; then
    log "Port $APP_PORT is in use. Killing existing process..."
    lsof -ti tcp:"$APP_PORT" | xargs kill -9 2>/dev/null || true
    sleep 1
    
    # Verify port is free
    if lsof -ti tcp:"$APP_PORT" >/dev/null 2>&1; then
      log "ERROR: Could not free port $APP_PORT"
      exit 1
    fi
    log "Port $APP_PORT freed successfully."
  else
    log_verbose "Port $APP_PORT is available."
  fi
}

# Start Appium server
start_appium() {
  free_port
  
  log "Starting Appium server at http://$APP_ADDR:$APP_PORT$APP_BASE_PATH"
  log "Logs: $LOG_FILE"
  
  # Start Appium in background
  nohup bunx appium \
    --address "$APP_ADDR" \
    --port "$APP_PORT" \
    --base-path "$APP_BASE_PATH" \
    --log-level "$LOG_LEVEL" \
    --allow-insecure adb_shell \
    >"$LOG_FILE" 2>&1 &
  
  local appium_pid=$!
  echo $appium_pid >"$PID_FILE"
  log "Appium PID: $appium_pid"
  
  # Wait for Appium to be ready
  log "Waiting for Appium to become ready..."
  local url="http://$APP_ADDR:$APP_PORT/status"
  local max_attempts=60
  
  for i in $(seq 1 $max_attempts); do
    if curl -sSf "$url" >/dev/null 2>&1; then
      log "Appium server is ready!"
      return 0
    fi
    
    # Check if process died
    if ! kill -0 $appium_pid 2>/dev/null; then
      log "ERROR: Appium process died unexpectedly."
      log "ERROR: Last 20 lines of log:"
      tail -n 20 "$LOG_FILE" || true
      exit 1
    fi
    
    if [ $((i % 10)) -eq 0 ]; then
      log "Still waiting for Appium... ($i/${max_attempts} seconds)"
    fi
    
    sleep 1
  done
  
  log "ERROR: Appium did not become ready within ${max_attempts} seconds."
  log "ERROR: Check logs: $LOG_FILE"
  tail -n 50 "$LOG_FILE" || true
  exit 1
}

# Pre-warm a session to avoid first-run timeout
prewarm_session() {
  local serial="$1"
  
  log "Pre-warming UiAutomator2 session for device: $serial"
  
  # Get platform version
  local platformVersion
  platformVersion=$(timeout "$ADB_TIMEOUT" adb -s "$serial" shell getprop ro.build.version.release 2>/dev/null | tr -d '\r' || echo "")
  
  if [ -z "$platformVersion" ]; then
    log "WARN: Could not detect platform version. Using empty string."
    platformVersion=""
  else
    log_verbose "Detected Android version: $platformVersion"
  fi
  
  # Build capabilities payload
  local payload
  payload=$(cat <<EOF
{
  "capabilities": {
    "alwaysMatch": {
      "platformName": "Android",
      "appium:deviceName": "$serial",
      "appium:platformVersion": "$platformVersion",
      "appium:automationName": "UiAutomator2",
      "appium:noReset": true,
      "appium:fullReset": false,
      "appium:autoGrantPermissions": true,
      "appium:ignoreHiddenApiPolicyError": true,
      "appium:disableWindowAnimation": true
    },
    "firstMatch": [{}]
  }
}
EOF
)
  
  log "Sending pre-warm session request..."
  local response
  if response=$(curl -sS -X POST "http://$APP_ADDR:$APP_PORT/session" \
    -H 'Content-Type: application/json' \
    -d "$payload" 2>&1); then
    log "Pre-warm session created successfully."
    log_verbose "Response: $response"
    return 0
  else
    log "WARN: Pre-warm session failed. This is usually fine."
    log_verbose "Error: $response"
    return 0  # Don't fail the script
  fi
}

# Cleanup function for graceful exit
cleanup() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    log "Script failed with exit code: $exit_code"
    log "Check logs for details: $LOG_FILE"
  fi
}

trap cleanup EXIT

# Main execution
main() {
  log "==================== ScreenGraph Appium Setup ===================="
  log "Starting Appium setup for local Android development"
  log ""
  
  # Check required commands
  require_cmd adb
  require_cmd bunx
  require_cmd curl
  
  # Step 1: Ensure device is online
  log "[1/4] Checking device availability..."
  local serial
  set +e  # Temporarily disable exit on error to capture function output
  serial=$(ensure_device_online)
  local exit_code=$?
  set -e  # Re-enable exit on error
  
  if [ $exit_code -ne 0 ]; then
    log "ERROR: Failed to ensure device is online."
    exit 1
  fi
  
  log "✓ Device ready: $serial"
  log ""
  
  # Step 2: Ensure driver is installed
  log "[2/4] Checking Appium driver..."
  ensure_appium_driver
  log "✓ Driver ready"
  log ""
  
  # Step 3: Start Appium server
  log "[3/4] Starting Appium server..."
  start_appium
  log "✓ Appium server running"
  log ""
  
  # Step 4: Pre-warm session
  log "[4/4] Pre-warming session..."
  prewarm_session "$serial" || true
  log "✓ Session pre-warmed"
  log ""
  
  # Success summary
  log "==================== Setup Complete ===================="
  log "✓ Device: $serial"
  log "✓ Appium: http://$APP_ADDR:$APP_PORT$APP_BASE_PATH"
  log "✓ PID: $(cat "$PID_FILE" 2>/dev/null || echo 'N/A')"
  log "✓ Logs: $LOG_FILE"
  log ""
  log "To stop Appium:"
  log "  kill \$(cat $PID_FILE)"
  log "  # or: pkill -f 'appium.*$APP_PORT'"
  log ""
  log "Ready for: cd backend && encore run"
  log "============================================================"
}

# Enable verbose logging if VERBOSE=1 environment variable is set
if [ "${1:-}" = "-v" ] || [ "${1:-}" = "--verbose" ]; then
  VERBOSE=1
  shift || true
fi

main "$@"
