# Data Model: Auto-Managed Appium Lifecycle

**Feature**: 001-automate-appium-lifecycle  
**Phase**: 1 (Design & Contracts)  
**Date**: 2025-11-12

## Purpose

Define the core entities, states, and transitions for Appium lifecycle management within the agent's `EnsureDevice` node.

---

## 1. AppiumLifecycleState

**Purpose**: Track the current phase of Appium lifecycle management during a run.

### States

| State | Description | Entry Condition | Exit Conditions |
|-------|-------------|----------------|-----------------|
| `idle` | Initial state, no lifecycle activity | Run starts | Device check begins |
| `checking_device` | Validating device prerequisites (ADB, package) | After idle | Device valid → `checking_health`<br>Device invalid → `failed` |
| `checking_health` | Pinging Appium `/status` endpoint | After device check passes | Healthy → `ready`<br>Unhealthy → `starting`<br>Timeout → `failed` |
| `starting` | Spawning Appium process | After unhealthy health check | Started → `ready`<br>Spawn failed → `failed` |
| `ready` | Appium is healthy and accepting connections | After health check passes OR after successful start | Session creation proceeds |
| `failed` | Lifecycle step failed, run cannot proceed | Device offline, spawn failed, or timeout | Terminal state (run fails) |

### State Transitions

```
idle
  ↓
checking_device
  ├─ [device valid] → checking_health
  └─ [device invalid] → failed
  
checking_health
  ├─ [healthy] → ready
  ├─ [unhealthy] → starting
  └─ [timeout] → failed
  
starting
  ├─ [spawn success] → ready
  └─ [spawn failed] → failed
  
ready
  → (session creation proceeds)
  
failed
  → (run fails with error)
```

### Timeout Values

| State | Timeout | Action on Timeout |
|-------|---------|-------------------|
| `checking_device` | 5s | Transition to `failed` with "Device check timeout" |
| `checking_health` | 2s | Transition to `starting` (assume unhealthy) |
| `starting` | 60s | Transition to `failed` with "Appium start timeout" |
| Overall lifecycle | 70s | Hard limit, fail run if exceeded |

### Fields

```typescript
interface AppiumLifecycleState {
  current: "idle" | "checking_device" | "checking_health" | "starting" | "ready" | "failed";
  startedAt: string; // ISO timestamp when lifecycle began
  phaseDurations: {
    deviceCheck?: number; // milliseconds
    healthCheck?: number;
    starting?: number;
  };
  appiumPid?: number; // PID of spawned Appium process (if started)
  error?: {
    phase: string;
    message: string;
    code?: string;
  };
}
```

---

## 2. DevicePrerequisite

**Purpose**: Capture the results of device prerequisite validation before Appium lifecycle.

### Fields

```typescript
interface DevicePrerequisite {
  deviceId: string; // From DeviceConfiguration input
  packageName: string; // From DeviceConfiguration input (e.g., "com.example.app")
  appActivity: string; // From DeviceConfiguration input
  
  adbAvailable: boolean; // Is `adb` command in PATH?
  deviceVisible: boolean; // Is device listed in `adb devices`?
  deviceOnline: boolean; // Is device status "device" (not "offline" or "unauthorized")?
  packageInstalled: boolean; // Is app package installed on device?
  
  validationDurationMs: number;
  validAt: string; // ISO timestamp
  
  errors: Array<{
    check: string; // e.g., "adb_availability", "device_online", "package_installed"
    message: string; // User-friendly error message
  }>;
}
```

### Validation Rules

| Check | Command | Success Criteria | Error Message |
|-------|---------|------------------|---------------|
| ADB Available | `which adb` | Exit code 0 | "ADB not found. Install Android SDK Platform Tools." |
| Device Visible | `adb devices` | Device ID in output | "Device {deviceId} not found. Connect device and enable USB debugging." |
| Device Online | `adb devices` | Status is "device" | "Device {deviceId} is offline or unauthorized. Check device screen for authorization prompt." |
| Package Installed | `adb shell pm list packages \| grep {packageName}` | Package found | "App {packageName} not installed on device. Install the APK first." |

### Example Valid Prerequisite

```json
{
  "deviceId": "emulator-5554",
  "packageName": "com.example.app",
  "appActivity": ".MainActivity",
  "adbAvailable": true,
  "deviceVisible": true,
  "deviceOnline": true,
  "packageInstalled": true,
  "validationDurationMs": 1247,
  "validAt": "2025-11-12T10:30:45.123Z",
  "errors": []
}
```

### Example Invalid Prerequisite

```json
{
  "deviceId": "emulator-5554",
  "packageName": "com.example.app",
  "appActivity": ".MainActivity",
  "adbAvailable": true,
  "deviceVisible": true,
  "deviceOnline": false,
  "packageInstalled": false,
  "validationDurationMs": 892,
  "validAt": "2025-11-12T10:30:45.123Z",
  "errors": [
    {
      "check": "device_online",
      "message": "Device emulator-5554 is offline or unauthorized. Check device screen for authorization prompt."
    },
    {
      "check": "package_installed",
      "message": "App com.example.app not installed on device. Install the APK first."
    }
  ]
}
```

---

## 3. LifecycleEvent (Run Event Extension)

**Purpose**: Emit structured events for each lifecycle phase visible in the UI timeline.

### Event Kinds

| Kind | Phase | Emitted When |
|------|-------|--------------|
| `agent.appium.device_check` | Device validation | After prerequisite check completes |
| `agent.appium.health_check` | Health verification | After `/status` ping completes |
| `agent.appium.starting` | Appium spawn | When spawning Appium process |
| `agent.appium.ready` | Ready confirmation | When Appium is healthy and ready |
| `agent.appium.failed` | Failure | When any lifecycle step fails |

### Base Event Structure

```typescript
interface LifecycleEvent {
  kind: "agent.appium.device_check" 
      | "agent.appium.health_check" 
      | "agent.appium.starting" 
      | "agent.appium.ready" 
      | "agent.appium.failed";
  
  payload: {
    phase: "device_check" | "health_check" | "starting" | "ready" | "failed";
    success: boolean;
    durationMs: number;
    timestamp: string; // ISO timestamp
    
    // Phase-specific details
    devicePrerequisite?: DevicePrerequisite; // For device_check
    appiumPid?: number; // For starting/ready
    healthStatus?: { ready: boolean; message: string }; // For health_check
    
    // Error details (if success: false)
    error?: {
      message: string;
      code?: string;
      retryable?: boolean;
    };
  };
  
  sequence: number; // Monotonic sequence from run_events
  ts: string; // ISO timestamp
}
```

### Event Examples

**Device Check Success**:
```json
{
  "kind": "agent.appium.device_check",
  "payload": {
    "phase": "device_check",
    "success": true,
    "durationMs": 1247,
    "timestamp": "2025-11-12T10:30:45.123Z",
    "devicePrerequisite": {
      "deviceId": "emulator-5554",
      "packageName": "com.example.app",
      "adbAvailable": true,
      "deviceVisible": true,
      "deviceOnline": true,
      "packageInstalled": true,
      "errors": []
    }
  },
  "sequence": 42,
  "ts": "2025-11-12T10:30:45.123Z"
}
```

**Appium Starting**:
```json
{
  "kind": "agent.appium.starting",
  "payload": {
    "phase": "starting",
    "success": true,
    "durationMs": 8432,
    "timestamp": "2025-11-12T10:30:53.555Z",
    "appiumPid": 12345
  },
  "sequence": 44,
  "ts": "2025-11-12T10:30:53.555Z"
}
```

**Appium Ready**:
```json
{
  "kind": "agent.appium.ready",
  "payload": {
    "phase": "ready",
    "success": true,
    "durationMs": 15679,
    "timestamp": "2025-11-12T10:31:00.802Z",
    "appiumPid": 12345,
    "healthStatus": {
      "ready": true,
      "message": "The server is ready to accept new sessions"
    }
  },
  "sequence": 45,
  "ts": "2025-11-12T10:31:00.802Z"
}
```

**Lifecycle Failed**:
```json
{
  "kind": "agent.appium.failed",
  "payload": {
    "phase": "failed",
    "success": false,
    "durationMs": 892,
    "timestamp": "2025-11-12T10:30:46.015Z",
    "error": {
      "message": "Device emulator-5554 is offline or unauthorized. Check device screen for authorization prompt.",
      "code": "DEVICE_OFFLINE",
      "retryable": false
    }
  },
  "sequence": 43,
  "ts": "2025-11-12T10:30:46.015Z"
}
```

---

## Relationships

```
EnsureDevice Node
  ├─ manages → AppiumLifecycleState (current phase)
  ├─ validates → DevicePrerequisite (device checks)
  └─ emits → LifecycleEvent[] (run events for UI)

AppiumLifecycleState
  ├─ tracks → current state (idle → checking → starting → ready → failed)
  └─ measures → phaseDurations (performance metrics)

DevicePrerequisite
  └─ included in → LifecycleEvent (device_check event payload)

LifecycleEvent
  ├─ persisted in → run_events table (PostgreSQL)
  └─ streamed to → Frontend UI (via run.stream endpoint)
```

---

## Validation Rules

### Prerequisite Validation
- **All checks must pass** for lifecycle to proceed
- **Fail fast** on first prerequisite failure (don't continue checking)
- **Clear error messages** for each check failure

### Health Check
- **Max 3 retry attempts** with 500ms delay between retries
- **Consider unhealthy** if any retry fails or times out
- **Transition to starting** if unhealthy (don't fail immediately)

### Appium Starting
- **Kill existing process** if PID found on configured port
- **Wait up to 60s** for Appium to become healthy after spawn
- **Poll /status every 2s** during wait
- **Fail if not ready** within timeout

---

## Next Steps

1. ✅ **DONE**: Data model defined
2. **TODO**: Generate `/contracts/lifecycle-events.schema.json`
3. **TODO**: Generate `quickstart.md`
4. **TODO**: Update agent context

