# Research: Auto-Managed Appium Lifecycle

**Feature**: 001-automate-appium-lifecycle  
**Phase**: 0 (Outline & Research)  
**Date**: 2025-11-12

## Purpose

Resolve technical unknowns identified in the implementation plan before proceeding to Phase 1 design.

---

## 1. Appium Health Check API

**Question**: What endpoint/method does Appium expose for health checks?

**Decision**: Use Appium's `/status` endpoint via HTTP GET

**Rationale**:
- Appium 2.x exposes a W3C WebDriver-compliant `/status` endpoint at `http://localhost:{port}/status`
- Returns JSON with `{ value: { ready: boolean, message: string } }`
- Non-blocking health check (< 100ms response time)
- Standard across all Appium versions

**Implementation**:
```typescript
const response = await fetch(`http://localhost:${APPIUM_PORT}/status`);
const data = await response.json();
const isHealthy = data.value?.ready === true;
```

**Alternatives Considered**:
- Creating a WebDriver session (rejected: too slow, ~2-5s overhead)
- TCP socket check (rejected: doesn't verify Appium is actually ready)
- Process PID check (rejected: doesn't verify server is responding)

---

## 2. Process Management

**Question**: How to reliably start/stop Appium programmatically from Node.js?

**Decision**: Use `child_process.spawn` with explicit PID tracking and signal handling

**Rationale**:
- `spawn()` provides non-blocking process management with stdio streams
- PID tracking enables targeted termination of specific Appium instances
- SIGTERM followed by SIGKILL (after timeout) ensures graceful shutdown
- Detached processes survive parent crashes (important for reuse across runs)

**Implementation Approach**:
```typescript
import { spawn } from "child_process";

// Start Appium
const appiumProcess = spawn("appium", [], {
  detached: false, // Keep attached for lifecycle management
  stdio: ["ignore", "pipe", "pipe"], // Capture stdout/stderr for logging
});

// Track PID
const appiumPid = appiumProcess.pid;

// Graceful stop
process.kill(appiumPid, "SIGTERM");
setTimeout(() => {
  try { process.kill(appiumPid, "SIGKILL"); } catch {}
}, 5000); // 5s grace period
```

**Alternatives Considered**:
- `exec()` (rejected: no stream handling, blocks on large output)
- `pm2` or process managers (rejected: adds external dependency)
- Docker container (rejected: too heavyweight for dev workflow)

**Edge Cases**:
- Zombie processes: Check for existing PID before spawn
- Port already bound: Kill stale process using `lsof -ti :${port}` then `kill -9`
- Appium not in PATH: Detect and provide clear error with installation guidance

---

## 3. Existing Device Check Logic

**Question**: What device validation already exists in `EnsureDevice` node?

**Findings from Code Review**:

**Current Flow** (`backend/agent/nodes/setup/EnsureDevice/node.ts`):
1. Receives `DeviceConfiguration` input (device ID, package, activity)
2. Calls `sessionPort.ensureDevice(config)` which delegates to WebDriverIO adapter
3. Returns `DeviceRuntimeContext` with session ID on success
4. Returns FAILURE with `errorId` and `humanReadableFailureSummary` on error

**Integration Points**:
- **BEFORE session creation**: Add Appium lifecycle check
  - Check device prerequisites (ADB, package)
  - Verify or start Appium
  - Only then call `sessionPort.ensureDevice()`
  
- **Error Handling**: Already has typed errors (`DeviceOfflineError`, `TimeoutError`)
  - Can extend with `AppiumUnhealthyError`, `AppiumStartFailedError`

- **Events**: Currently returns empty events array (`events: []`)
  - Can add lifecycle events here before returning

**Decision**: Implement lifecycle logic as a **pre-flight step** within `ensureDevice()` function before calling `sessionPort.ensureDevice()`. This keeps the node interface unchanged while adding lifecycle management.

---

## 4. Run Event Schema

**Question**: How are run events currently structured and emitted?

**Findings from Code Review** (`backend/agent/domain/events.ts`):

**Current Event Structure**:
```typescript
interface AgentEvent<T extends EventKind> {
  kind: T;
  payload: Record<string, unknown>;
  sequence: number;
  ts: string; // ISO timestamp
}

// Existing kinds:
// - "agent.node.started"
// - "agent.node.finished"
// - "agent.run.started"
// - "agent.run.finished"
```

**Emission Pattern**:
- Nodes return events array: `{ output, events: [...] }`
- Worker persists events via `orchestrator.persistRunEvents()`
- Events published to `run_events` table with monotonic sequence
- Frontend subscribes to events via `run.stream` endpoint

**Decision**: Add new event kinds for Appium lifecycle:
- `agent.appium.device_check` — Device prerequisite validation result
- `agent.appium.health_check` — Appium health status
- `agent.appium.starting` — Appium spawn initiated
- `agent.appium.ready` — Appium ready for session creation
- `agent.appium.failed` — Lifecycle step failed

**Payload Schema** (consistent across events):
```typescript
{
  phase: "device_check" | "health_check" | "starting" | "ready" | "failed",
  durationMs: number,
  success: boolean,
  error?: string,
  details?: Record<string, unknown>
}
```

---

## 5. Appium Port Configuration

**Question**: Where is Appium port configured? Is it environment-driven?

**Findings from Code Review** (`backend/config/env.ts`):

**Current Configuration**:
```typescript
APPIUM_PORT: port({
  default: 4723, // Standard Appium port
  desc: "Port for the local Appium service",
})
```

**Decision**: Use existing `APPIUM_PORT` from environment config

**Usage**:
```typescript
import { APPIUM_PORT } from "../../../../config/env";

const healthCheckUrl = `http://localhost:${APPIUM_PORT}/status`;
const appiumProcess = spawn("appium", ["--port", String(APPIUM_PORT)]);
```

**Environment File** (`.env`):
```
APPIUM_PORT=4723
```

**Rationale**:
- Already configured and used by existing WebDriverIO adapter
- Follows project convention for environment-driven config
- Easy to override for testing or CI

---

## Summary

All Phase 0 research complete. Key decisions:
1. **Health Check**: `/status` endpoint (< 100ms)
2. **Process Management**: `spawn()` with PID tracking, SIGTERM → SIGKILL
3. **Integration**: Pre-flight step in `ensureDevice()` function
4. **Events**: 5 new event kinds following existing pattern
5. **Configuration**: Use existing `APPIUM_PORT` from env config

**Next**: Proceed to Phase 1 (Design & Contracts)

