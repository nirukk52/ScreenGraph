# Quickstart: Auto-Managed Appium Lifecycle

**Feature**: 001-automate-appium-lifecycle  
**Phase**: 1 (Design & Contracts)  
**Date**: 2025-11-12

## Purpose

Guide for developers implementing and testing the auto-managed Appium lifecycle feature.

---

## Development Workflow

### 1. Load Backend Vibe

```bash
# Say to Claude:
"Load backend_vibe and implement auto-managed Appium lifecycle"
```

**Why**: Provides Encore.ts patterns, agent architecture guidance, and relevant MCP tools for backend development.

---

### 2. Implementation Approach (TDD)

Follow RED-GREEN-REFACTOR cycle for each component:

#### **Component 1: Device Prerequisite Check**

**RED** ❌ — Write failing test:
```typescript
// backend/agent/nodes/setup/EnsureDevice/device-check.test.ts
it("should detect offline device", async () => {
  const result = await checkDevicePrerequisites("emulator-5554", "com.app");
  expect(result.deviceOnline).toBe(false);
  expect(result.errors).toContainEqual({
    check: "device_online",
    message: expect.stringContaining("offline")
  });
});
```

**GREEN** ✅ — Implement minimal code:
```typescript
// backend/agent/nodes/setup/EnsureDevice/device-check.ts
export async function checkDevicePrerequisites(...) {
  // Run adb commands, parse output, return DevicePrerequisite
}
```

**REFACTOR** 🧹 — Improve while tests stay green

---

#### **Component 2: Appium Health Check**

**RED** ❌ — Write failing test:
```typescript
it("should return healthy when /status returns ready:true", async () => {
  mockFetch.mockResolvedValue({ json: async () => ({ value: { ready: true } }) });
  const result = await checkAppiumHealth(4723);
  expect(result.healthy).toBe(true);
});
```

**GREEN** ✅ — Implement:
```typescript
export async function checkAppiumHealth(port: number) {
  const response = await fetch(`http://localhost:${port}/status`);
  const data = await response.json();
  return { healthy: data.value?.ready === true };
}
```

**REFACTOR** 🧹 — Add timeout handling, retries

---

#### **Component 3: Appium Lifecycle Manager**

**RED** ❌ — Write failing integration test:
```typescript
it("should start Appium if not running", async () => {
  const manager = new AppiumLifecycleManager(4723);
  const result = await manager.ensureReady();
  expect(result.state).toBe("ready");
  expect(result.appiumPid).toBeGreaterThan(0);
});
```

**GREEN** ✅ — Implement:
```typescript
export class AppiumLifecycleManager {
  async ensureReady() {
    // Check health → start if needed → poll until ready
  }
}
```

**REFACTOR** 🧹 — Extract event emission, error handling

---

### 3. Integration with EnsureDevice Node

Modify `backend/agent/nodes/setup/EnsureDevice/node.ts`:

```typescript
export async function ensureDevice(input, sessionPort, generateId) {
  const logger = log.with({...});
  
  // NEW: Pre-flight Appium lifecycle
  const lifecycle = new AppiumLifecycleManager(APPIUM_PORT);
  const events: LifecycleEvent[] = [];
  
  try {
    // 1. Check device prerequisites
    const prereq = await checkDevicePrerequisites(input.deviceConfiguration);
    events.push(createDeviceCheckEvent(prereq));
    
    if (!prereq.deviceOnline) {
      throw new Error(prereq.errors[0].message);
    }
    
    // 2. Ensure Appium ready
    const lifecycleResult = await lifecycle.ensureReady();
    events.push(...lifecycleResult.events);
    
    if (lifecycleResult.state !== "ready") {
      throw new Error("Appium lifecycle failed");
    }
    
    // 3. Proceed with existing session logic
    const ctx = await sessionPort.ensureDevice(input.deviceConfiguration);
    
    return { output: {...}, events };
  } catch (error) {
    return { output: { ...FAILURE }, events };
  }
}
```

---

## Testing Approach

### Unit Tests

**Location**: `backend/agent/nodes/setup/EnsureDevice/*.test.ts`

Test individual functions in isolation:
- `checkDevicePrerequisites()` → Mock `child_process.exec`
- `checkAppiumHealth()` → Mock `fetch`
- `startAppium()` → Mock `child_process.spawn`

**Run**:
```bash
cd backend && encore test agent/nodes/setup/EnsureDevice
```

---

### Integration Tests

**Location**: `tests/integration/ensure-device-lifecycle.test.ts`

Test full lifecycle flow (requires real Appium):
1. Import `../agent/orchestrator/subscription` (starts worker)
2. Call `ensureDevice()` with test config
3. Verify lifecycle events emitted
4. Verify Appium process started
5. Cleanup (kill Appium)

**Prerequisites**:
- Appium binaries installed (`npm install -g appium`)
- Device/emulator connected (`adb devices`)
- Test app installed

**Run**:
```bash
cd backend && encore test tests/integration/ensure-device-lifecycle.test.ts
```

---

### E2E Tests

**Location**: `frontend/tests/e2e/run-page.spec.ts`

Test user-facing behavior:
1. Ensure Appium NOT running initially
2. Click "Detect Drift" button
3. Verify run starts without errors
4. Verify lifecycle events appear in UI timeline:
   - "Device check passed"
   - "Appium starting..."
   - "Appium ready"
5. Verify screenshots captured

**Run**:
```bash
cd frontend && bun run test:e2e:headed
```

---

## Local Testing

### Scenario 1: Appium Not Running

```bash
# Terminal 1: Ensure Appium stopped
task qa:appium:stop

# Terminal 2: Start run
cd backend && encore run

# Terminal 3: Trigger run via frontend
cd frontend && bun run dev
# Click "Detect Drift"

# Expected: Appium starts automatically, run proceeds
```

---

### Scenario 2: Appium Already Running

```bash
# Terminal 1: Start Appium manually
appium --port 4723

# Terminal 2: Start run
cd backend && encore run

# Terminal 3: Trigger run via frontend
cd frontend && bun run dev
# Click "Detect Drift"

# Expected: Appium reused (health check passes), run proceeds immediately (< 5s)
```

---

### Scenario 3: Device Offline

```bash
# Terminal 1: Disconnect device or stop emulator
adb kill-server

# Terminal 2: Start run
cd backend && encore run

# Terminal 3: Trigger run via frontend
cd frontend && bun run dev
# Click "Detect Drift"

# Expected: Run fails within 10s with clear error in UI:
# "Device emulator-5554 is offline. Connect device and enable USB debugging."
```

---

## Verifying Lifecycle Events in UI

1. Start a run (with or without Appium)
2. Navigate to run page: `/run/{runId}`
3. Check timeline for lifecycle events:

**Expected Events**:
```
✅ Device check passed (1.2s)
✅ Appium health check (0.3s)
⏳ Appium starting... (8.4s)
✅ Appium ready (15.7s total)
```

**UI Display**:
- Each event shows phase name, duration, timestamp
- Success events show green checkmark
- Failed events show red X with error message
- Starting events show spinner animation

---

## Manual Appium Management

### Stop Appium

```bash
# Using Task command (recommended)
task qa:appium:stop

# Or manually
lsof -ti :4723 | xargs kill -9
```

**When to use**:
- After development session ends
- Before running tests that expect Appium stopped
- When Appium becomes unresponsive

---

### Check Appium Status

```bash
# Check if Appium process running
lsof -i :4723

# Check Appium health
curl http://localhost:4723/status
```

---

## Troubleshooting

### Issue: "Appium not found"

**Symptoms**: Run fails with "Appium binaries not found" error

**Solution**:
```bash
# Install Appium globally
npm install -g appium

# Verify installation
which appium
appium --version
```

---

### Issue: "Device offline"

**Symptoms**: Device check fails with "Device offline or unauthorized"

**Solution**:
1. Check device connection: `adb devices`
2. Enable USB debugging on device
3. Accept authorization prompt on device screen
4. Restart ADB: `adb kill-server && adb start-server`

---

### Issue: "Port already in use"

**Symptoms**: Appium start fails with "Address already in use"

**Solution**:
```bash
# Find process on port 4723
lsof -ti :4723

# Kill process
lsof -ti :4723 | xargs kill -9

# Start run again
```

---

### Issue: "Appium health check timeout"

**Symptoms**: Run stalls at "Checking Appium health..."

**Solution**:
1. Check Appium logs: `tail -f ~/.appium/logs/appium.log`
2. Verify Appium port in `.env`: `APPIUM_PORT=4723`
3. Test health endpoint manually: `curl http://localhost:4723/status`
4. Restart Appium: `task qa:appium:stop` then start run again

---

## Next Steps

After implementation:
1. Update `README.md` — Remove manual Appium start instructions
2. Update `vibes/backend_vibe.json` — Reflect automatic lifecycle
3. Update `CLAUDE.md` — Document new Appium behavior
4. Run smoke tests: `task qa:smoke:all`
5. Run integration tests: `task backend:test`
6. Run E2E tests: `task qa:e2e`

---

## Related Documentation

- [Spec](./spec.md) — Feature requirements and user stories
- [Plan](./plan.md) — Implementation plan and technical context
- [Research](./research.md) — Technical decisions and alternatives
- [Data Model](./data-model.md) — Entity definitions and state machines
- [Contracts](./contracts/lifecycle-events.schema.json) — Event schemas

