# WebDriver/Appium Setup Review

**Last Updated:** November 4, 2025  
**Status:** Active Development

---

## Overview

ScreenGraph uses **WebDriverIO** as the client library to communicate with **Appium** for mobile test automation. The setup supports local Android device/emulator automation through a combination of configuration files, development scripts, and adapter implementations.

---

## Architecture Components

### 1. **WebDriverIO Client** (`webdriverio` package)
- **Version:** `^9.20.0`
- **Purpose:** Node.js client library that implements the W3C WebDriver protocol for browser and mobile automation
- **Role in Project:** Primary SDK for establishing and managing Appium sessions

### 2. **Appium Server** (`appium` package)
- **Version:** `^2.4.0`
- **Purpose:** Cross-platform test automation framework that acts as HTTP server accepting WebDriver commands
- **Role in Project:** Translates WebDriver commands into platform-specific UI automation calls
- **Driver:** UiAutomator2 (`appium-uiautomator2-driver@^2.20.0`) for Android automation

### 3. **WDIO Services & Test Framework**
- **@wdio/appium-service:** `^9.20.0` - Automatically starts/stops Appium server during test runs
- **@wdio/cli:** `^9.20.0` - Command-line interface for running WebDriverIO
- **@wdio/local-runner:** `^9.20.0` - Executes tests locally
- **@wdio/mocha-framework:** `^9.20.0` - Mocha test framework integration
- **@wdio/spec-reporter:** `^9.20.0` - Console test reporter

---

## Configuration Files

### 1. `backend/wdio.conf.js` (301 lines)
**Purpose:** Complete WebDriverIO configuration template with extensive hook examples

**Key Configuration:**
- **Runner:** `local`
- **Port:** `4723`
- **Max Instances:** `10`
- **Framework:** `mocha`
- **Services:** `['appium', 'visual']`
- **Capabilities:**
  ```javascript
  {
    platformName: 'Android',
    browserName: 'Chrome',
    'appium:deviceName': 'Android GoogleAPI Emulator',
    'appium:platformVersion': '12.0',
    'appium:automationName': 'UiAutomator2'
  }
  ```

**Status:** Full-featured template with hooks (mostly commented out)

---

### 2. `backend/wdio.appium.conf.js` (51 lines)
**Purpose:** Minimal production configuration that keeps Appium server alive for ScreenGraph agent

**Key Features:**
- **Minimal capabilities** (not actually used by agent, just required by WDIO)
- **Appium Service Configuration:**
  - **Log Path:** `./.logs` (local troubleshooting)
  - **Command:** `appium` (from node_modules)
  - **Security:** `allowInsecure: "adb_shell"` (required for agent ADB commands)
  - **Server:** `127.0.0.1:4723`
  - **Base Path:** `/`
- **Dummy Spec:** `./tests/_appium-server.spec.js` (holds process open)
- **Timeout:** `600000ms` (10 minutes - keeps server alive)

**Status:** Production-ready, actively used for local development

---

## Development Scripts

### 1. `backend/scripts/dev-android-appium.sh` (180 lines)
**Purpose:** All-in-one local dev setup script for Android + Appium + session pre-warming

**Capabilities:**
- ✅ Ensures Android device/emulator is online
- ✅ Auto-launches AVD if no device found
- ✅ Waits for Android boot completion (`sys.boot_completed`)
- ✅ Installs UiAutomator2 driver if missing
- ✅ Kills process on port 4723 if occupied
- ✅ Starts Appium server with correct flags
- ✅ Pre-warms a UiAutomator2 session to avoid first-run timeout
- ✅ Logs Appium output to `$TMPDIR/appium.log`
- ✅ Writes PID to `$TMPDIR/appium.pid` for cleanup

**Configuration:**
```bash
APP_ADDR="127.0.0.1"
APP_PORT="4723"
APP_BASE_PATH="/"
LOG_LEVEL="info"
```

**Pre-warming Capabilities:**
```json
{
  "platformName": "Android",
  "appium:deviceName": "<serial>",
  "appium:platformVersion": "<detected>",
  "appium:automationName": "UiAutomator2",
  "appium:noReset": true,
  "appium:fullReset": false,
  "appium:autoGrantPermissions": true,
  "appium:ignoreHiddenApiPolicyError": true,
  "appium:disableWindowAnimation": true
}
```

**Usage:**
```bash
cd backend && bash scripts/dev-android-appium.sh
```

**Cleanup:**
```bash
kill $(cat $TMPDIR/appium.pid)
# or
pkill -f 'appium.*4723'
```

**Status:** Production-ready, recommended for local development

---

### 2. NPM Scripts (`backend/package.json`)

```json
{
  "appium": "bash scripts/start-appium-service.sh",
  "appium:standalone": "bunx appium --allow-insecure=adb_shell --address 127.0.0.1 --port 4723",
  "wdio": "wdio run ./wdio.conf.js"
}
```

**Usage:**
- `bun run appium` → Runs `start-appium-service.sh` (if exists)
- `bun run appium:standalone` → Bare Appium server (no WDIO wrapper)
- `bun run wdio` → Runs full WDIO test suite with `wdio.conf.js`

---

## Adapter Implementation

### `backend/agent/adapters/appium/webdriverio/session.adapter.ts`

**Purpose:** WebDriverIO-based implementation of `SessionPort` interface

**Class:** `WebDriverIOSessionAdapter implements SessionPort`

**Responsibilities:**
- Creates and manages WebDriverIO remote sessions
- Maps WebDriverIO exceptions to domain errors (`DeviceOfflineError`, `TimeoutError`)
- Maintains session context (`SessionContext | null`)
- Implements bounded timeout logic (default 10s, max 30s)
- Extracts hostname/port from Appium server URL

**Key Methods:**

#### `ensureDevice(config: DeviceConfiguration): Promise<DeviceRuntimeContext>`
- Creates new WebDriverIO session if none exists
- Reuses existing session if available
- **Capabilities:**
  ```typescript
  {
    platformName: config.platformName,
    "appium:deviceName": config.deviceName,
    "appium:platformVersion": config.platformVersion,
    "appium:automationName": "UiAutomator2",
    "appium:noReset": true,
    "appium:fullReset": false,
    "appium:autoGrantPermissions": true,
    "appium:ignoreHiddenApiPolicyError": true,
    "appium:disableWindowAnimation": true,
  }
  ```
- **Connection Retry:** 5 attempts with configurable timeout
- **Error Handling:**
  - `ECONNREFUSED` / `ECONNRESET` → `DeviceOfflineError`
  - Timeout errors → `TimeoutError` with detailed troubleshooting hints
  - Includes enhanced logging with full error details (name, message, stack, cause)

#### `closeSession(): Promise<void>`
- Closes active WebDriverIO session
- Cleans up driver resources
- Nullifies context

#### `getContext(): SessionContext | null`
- Returns current session context (driver + capabilities + ID)

**Integration:**
- Used by `EnsureDevice` node in agent orchestration
- Configured with Appium server URL from `DeviceConfiguration`
- Logs via Encore structured logging (`encore.dev/log`)

**Status:** Production-ready, actively used in agent flows

---

## Connection Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Development Setup                                         │
│    bash scripts/dev-android-appium.sh                        │
│    ├─ Check Android device/emulator online                  │
│    ├─ Start Appium server (127.0.0.1:4723)                  │
│    └─ Pre-warm UiAutomator2 session                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Agent Orchestration (via Encore backend)                 │
│    RunJob → Worker → AgentMachine → EnsureDevice Node       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Session Adapter                                           │
│    WebDriverIOSessionAdapter.ensureDevice()                  │
│    └─ remote({ hostname, port, capabilities })              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. WebDriverIO Client (webdriverio@^9.20.0)                 │
│    POST http://127.0.0.1:4723/session                        │
│    └─ W3C WebDriver Protocol request                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Appium Server (appium@^2.4.0)                            │
│    Receives WebDriver command                                │
│    └─ Routes to UiAutomator2 driver                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. UiAutomator2 Driver (appium-uiautomator2-driver@^2.20.0) │
│    Translates to Android automation calls                   │
│    └─ Communicates via ADB with device/emulator             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Android Device/Emulator                                   │
│    UI automation actions executed                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### `allowInsecure: "adb_shell"`
- **Required for:** Agent flows that execute ADB shell commands
- **Risk:** Allows arbitrary shell command execution on device
- **Mitigation:** Only used in local development environment (127.0.0.1)
- **Production:** Should be evaluated for cloud deployment scenarios

---

## Current Status

### ✅ Working
- Local Android device/emulator connection
- WebDriverIO session creation and management
- Appium server auto-start via WDIO service
- Session pre-warming for timeout avoidance
- Domain error mapping (offline, timeout)
- Structured logging integration

### ⚠️ Known Issues
- **First-run timeouts:** Mitigated by pre-warming script
- **Port conflicts:** Script auto-kills process on 4723
- **Device offline detection:** Enhanced error messages added

### 🔄 In Progress
- Integration with full agent orchestration flow
- Production deployment configuration
- Remote device/cloud provider support

### 📋 Future Work
- iOS support (requires XCUITest driver)
- Cloud provider integration (BrowserStack, Sauce Labs)
- Multi-device parallel execution
- Session pool management
- Retry strategies for transient failures

---

## Troubleshooting Guide

### Issue: `ECONNREFUSED` on session creation
**Solution:** Ensure Appium server is running:
```bash
curl http://127.0.0.1:4723/status
# or
bun run appium:standalone
```

### Issue: Timeout on first session
**Solution:** Use pre-warming script:
```bash
bash scripts/dev-android-appium.sh
```

### Issue: No Android device found
**Solution:** Check ADB devices:
```bash
adb devices
adb start-server
# or launch emulator via Android Studio AVD Manager
```

### Issue: Port 4723 already in use
**Solution:** Kill existing Appium process:
```bash
lsof -ti tcp:4723 | xargs kill -9
# or use the PID file
kill $(cat $TMPDIR/appium.pid)
```

### Issue: UiAutomator2 driver not installed
**Solution:** Install manually:
```bash
bunx appium driver install uiautomator2
bunx appium driver list --installed
```

---

## Development Workflow

### Option 1: Quick Start (Recommended)
```bash
# Terminal 1: Start Appium with device/emulator check
cd backend && bash scripts/dev-android-appium.sh

# Terminal 2: Run Encore backend
cd backend && encore run

# Agent will connect to existing Appium server
```

### Option 2: WDIO Service (Automatic)
```bash
# Terminal 1: WDIO starts Appium automatically
cd backend && bun run wdio

# Terminal 2: Run Encore backend
cd backend && encore run
```

### Option 3: Standalone Appium
```bash
# Terminal 1: Bare Appium server
cd backend && bun run appium:standalone

# Terminal 2: Run Encore backend
cd backend && encore run
```

---

## Dependencies Summary

### Production Dependencies
```json
{
  "webdriverio": "^9.20.0"        // WebDriver client
}
```

### Development Dependencies
```json
{
  "@wdio/appium-service": "^9.20.0",      // Auto-start Appium
  "@wdio/cli": "^9.20.0",                  // CLI runner
  "@wdio/local-runner": "^9.20.0",         // Local execution
  "@wdio/mocha-framework": "^9.20.0",      // Test framework
  "@wdio/spec-reporter": "^9.20.0",        // Console reporter
  "appium": "^2.4.0",                      // Appium server
  "appium-uiautomator2-driver": "^2.20.0" // Android driver
}
```

---

## File Structure

```
backend/
├── wdio.conf.js                          # Full WDIO config template (301 lines)
├── wdio.appium.conf.js                   # Production minimal config (51 lines)
├── scripts/
│   └── dev-android-appium.sh             # Dev setup script (180 lines)
├── tests/
│   └── _appium-server.spec.js            # Dummy spec to hold server open
├── agent/
│   └── adapters/
│       └── appium/
│           └── webdriverio/
│               ├── session.adapter.ts    # SessionPort implementation
│               └── session-context.ts    # Session context types
└── package.json                          # Dependencies + scripts
```

---

## References

- **WebDriverIO Docs:** https://webdriver.io/docs/gettingstarted
- **Appium Docs:** https://appium.io/docs/en/latest/
- **UiAutomator2 Driver:** https://github.com/appium/appium-uiautomator2-driver
- **W3C WebDriver:** https://www.w3.org/TR/webdriver/

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2025-11-04 | Initial review document created | AI Assistant |

---

**End of Review**



