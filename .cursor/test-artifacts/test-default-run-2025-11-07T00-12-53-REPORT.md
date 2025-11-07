# Test Default Run - Results

**Date**: 2025-11-07T00:12:53Z  
**Duration**: 43 seconds (from button click to screenshot)  
**Worktree**: Px8w6  
**Ports**: Backend=4008, Frontend=5181  

---

## ❌ Test Status: FAILED

**Failure Reason**: Frontend connected to WRONG backend (port 4002 instead of 4008)

---

## Critical Issue: Port Isolation Violation

### 🔴 Problem

The frontend (worktree Px8w6, port 5181) connected to backend port **4002** (LqKPe worktree) instead of its own backend port **4008**.

### Network Evidence

```
[GET] http://localhost:4000/health → FAILED (ERR_CONNECTION_REFUSED)
[GET] http://localhost:4002/health → 200 OK ✓
[POST] http://localhost:4002/run → 200 OK ✓
```

### Console Evidence

```
[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED @ http://localhost:4000/health:0
[LOG] Found Encore backend at http://localhost:4002 @ http://localhost:5181/src/lib/getEncoreClient.ts:17
```

### Expected Behavior

Frontend should connect to:
```
http://localhost:4008/health → 200 OK
http://localhost:4008/run → 200 OK
```

### Actual Behavior

Frontend connected to another worktree's backend (4002), creating cross-worktree interference.

---

## Run Information

- **Run ID**: `01K9DTG2A3S9Y5J39ZNTGQYNWR`
- **Run Status**: Stalled (running on wrong backend)
- **Backend**: Port 4002 (LqKPe worktree) ← WRONG
- **Expected Backend**: Port 4008 (Px8w6 worktree) ← CORRECT
- **Duration**: 15+ seconds (stalled at 22 events)
- **Last Event**: `agent.node.finished` (EnsureDevice, step 7)

---

## Screenshots Discovered

- **Count**: 0
- **Reason**: Run created on wrong backend (4002) which may not have Appium/device configured
- **Error**: `DeviceOfflineError` repeated multiple times

---

## Graph Visualization

- **Nodes Rendered**: 0
- **Status**: "Waiting for screens to be discovered..."
- **Reason**: Device offline errors prevent screenshot capture

---

## Console Analysis

### Errors (2)
1. `Failed to load resource: the server responded with a status of 404 (Not Found) @ http://localhost:5181/favicon.png`
2. `Failed to load resource: net::ERR_CONNECTION_REFUSED @ http://localhost:4000/health`

### Warnings (0)

### WebSocket Connection
- ✅ WebSocket connected successfully (status: opened)
- ✅ Stream established to `/run/01K9DTG2A3S9Y5J39ZNTGQYNWR/stream`
- ⚠️ Connected to WRONG backend (port 4002)

#### Key Console Logs:
```
[vite] connected.
[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED @ http://localhost:4000/health:0
[LOG] Found Encore backend at http://localhost:4002 @ http://localhost:5181/src/lib/getEncoreClient.ts:17
[LOG] [Graph Stream] Starting connection for runId: 01K9DTG2A3S9Y5J39ZNTGQYNWR
[LOG] [Graph Stream] Creating stream for runId: 01K9DTG2A3S9Y5J39ZNTGQYNWR
[LOG] [Graph Stream] Stream created, socket state: 0
[LOG] [Graph Stream] Starting to read from stream...
[LOG] [Graph Stream] Connection established
[LOG] [Graph Stream] WebSocket opened
[LOG] [Graph Stream] Stream ended (no more events)
[LOG] [Graph Stream] WebSocket closed {code: 1005, reason: , wasClean: false}
```

---

## Network Requests

- **Total Requests**: 76
- **Failed Requests**: 2
  - `/favicon.png` → 404 (cosmetic)
  - `http://localhost:4000/health` → Connection refused (expected - main tree port)

### Key Endpoints
- ❌ `GET http://localhost:4000/health` → Connection refused
- ✅ `GET http://localhost:4002/health` → 200 OK (WRONG backend)
- ✅ `POST http://localhost:4002/run` → 200 OK (WRONG backend)

---

## Run Events Timeline (22 total)

### Last Events (most recent first):
1. **#21** - `agent.node.finished` (EnsureDevice, step 7) - 2025-11-07T00:12:25.302Z
2. **#20** - `agent.node.started` (EnsureDevice, step 7) - 2025-11-07T00:12:25.302Z
3. **#19** - `agent.node.finished` (EnsureDevice, step 6) - 2025-11-07T00:12:21.850Z
4. **#18** - `agent.node.started` (EnsureDevice, step 6) - 2025-11-07T00:12:21.850Z
5. **#17** - `agent.node.finished` (EnsureDevice, step 5) - 2025-11-07T00:12:19.339Z

### Key Errors:
- **#14, #10, #6**: `agent.app.launch_failed` - `DeviceOfflineError`
- **Correlation IDs**: Multiple ProvisionApp attempts failing

### Pattern:
- EnsureDevice: Multiple retries (steps 1, 5, 6, 7) - all succeed
- ProvisionApp: Multiple attempts (steps 2, 3, 4) - all fail with DeviceOfflineError
- No Perceive or screenshot events (device unavailable)

---

## Visual Proof

![Test Results](.cursor/test-artifacts/test-default-run-2025-11-07T00-12-53.png)

Screenshot shows:
- Run timeline with 22 events
- "Waiting for screens to be discovered..." message
- Multiple `DeviceOfflineError` events
- No graph visualization (0 screens)

---

## Root Cause Analysis

### Issue 1: Frontend Port Discovery Logic

**File**: `frontend/src/lib/getEncoreClient.ts`

The frontend's backend discovery logic:
1. Tries `http://localhost:4000/health` (main tree port) → Fails
2. Falls back to scanning other ports
3. Finds `http://localhost:4002/health` → Succeeds (wrong worktree!)
4. Never tries `http://localhost:4008/health` (correct worktree)

**Expected Behavior**:
Frontend should use `VITE_BACKEND_BASE_URL` environment variable set by `./scripts/dev-frontend.sh`

**Actual Behavior**:
Frontend ignores environment variable and scans for any available backend

### Issue 2: Environment Variable Not Passed

The `./scripts/dev-frontend.sh` should set:
```bash
export VITE_BACKEND_BASE_URL=http://localhost:4008
```

But frontend client code doesn't use it, causing cross-worktree connections.

### Issue 3: Device Offline

Once connected to port 4002, the run fails because:
- Port 4002 backend (LqKPe worktree) may not have device/Appium configured
- Even if configured, it's using different Appium port (4725 vs 4731)
- Result: `DeviceOfflineError` on all ProvisionApp attempts

---

## Success Criteria (Unmet)

- [x] Backend running (port 4008)
- [x] Frontend running (port 5181)
- [x] Page loads without critical errors
- [x] "Detect My First Drift" button clickable
- [✓] Run creation succeeds (POST /run → 200) - but wrong backend!
- [✓] Navigation to /run/{id} succeeds
- [✓] WebSocket stream connects - but to wrong backend!
- [❌] **Frontend connects to CORRECT backend (4008)** ← FAILED
- [❌] At least 1 screenshot discovered (0 found)
- [❌] At least 1 graph node rendered (0 found)
- [x] No critical console errors
- [❌] Device available for screenshot capture

**Failed Criteria**: 4/11 (36% pass rate)

---

## Recommendations

### 1. Fix Frontend Backend Discovery (CRITICAL)

**Problem**: Frontend scans for any backend instead of using worktree-assigned port

**Solution**: Modify `frontend/src/lib/getEncoreClient.ts`:

```typescript
// BEFORE (broken):
async function findBackend() {
  const ports = [4000, 4001, 4002, 4003]; // Scans all ports
  for (const port of ports) {
    try {
      await fetch(`http://localhost:${port}/health`);
      return `http://localhost:${port}`;
    } catch {}
  }
}

// AFTER (correct):
function getBackendUrl() {
  // Use environment variable set by dev-frontend.sh
  const envUrl = import.meta.env.VITE_BACKEND_BASE_URL;
  if (envUrl) {
    console.log(`[Frontend] Using backend from env: ${envUrl}`);
    return envUrl;
  }
  
  // Fallback to default (main tree only)
  console.warn('[Frontend] No VITE_BACKEND_BASE_URL set, using default');
  return 'http://localhost:4000';
}
```

### 2. Verify Environment Variables Pass to Vite

**Problem**: `./scripts/dev-frontend.sh` may not be passing `VITE_BACKEND_BASE_URL` to Vite dev server

**Solution**: Update `./scripts/dev-frontend.sh`:

```bash
# Export env vars BEFORE starting Vite
eval "$(bun ./scripts/port-coordinator.mjs --no-summary)"
export VITE_BACKEND_BASE_URL="http://localhost:${BACKEND_PORT}"

echo "Starting frontend with VITE_BACKEND_BASE_URL=${VITE_BACKEND_BASE_URL}"

cd frontend
bun run dev --port ${FRONTEND_PORT}
```

### 3. Add Port Validation at Startup

**Problem**: No validation that frontend is using correct backend

**Solution**: Add startup check in `frontend/src/lib/getEncoreClient.ts`:

```typescript
import { FRONTEND_PORT, BACKEND_PORT } from './config';

// Verify we're using the correct backend for this worktree
const expectedBackend = `http://localhost:${BACKEND_PORT}`;
const actualBackend = getBackendUrl();

if (actualBackend !== expectedBackend) {
  console.error(`[Frontend] Backend mismatch!`);
  console.error(`  Expected: ${expectedBackend}`);
  console.error(`  Actual: ${actualBackend}`);
  console.error(`  This frontend is connecting to the WRONG backend!`);
  throw new Error('Port isolation violation detected');
}
```

### 4. Start Appium for This Worktree

**Problem**: Device offline errors indicate no Appium server

**Solution**: Start Appium on correct port:

```bash
# Terminal 3: Appium
appium --port 4731
```

Or use automated script (if exists):
```bash
./scripts/dev-appium.sh
```

### 5. Document Worktree Testing Requirements

**Problem**: No clear documentation on what services are needed

**Solution**: Add to `CLAUDE.md`:

```markdown
## Testing a Worktree

Before running @test-default-run, ensure ALL services are started:

1. Backend: `./scripts/dev-backend.sh` (auto-assigns port)
2. Frontend: `./scripts/dev-frontend.sh` (auto-assigns port)
3. Appium: `appium --port $(bun ./scripts/port-coordinator.mjs --json | jq -r '.ports.appium')`
4. Device: Connect Android/iOS device or emulator

Verify isolation:
- Frontend MUST connect to same backend (check console for "Found Encore backend at...")
- If ports mismatch, restart frontend after verifying VITE_BACKEND_BASE_URL
```

---

## Next Steps

### Immediate (Fix Test Failure)

1. **Fix frontend backend discovery** (see Recommendation #1)
2. **Verify environment variable passing** (see Recommendation #2)
3. **Restart frontend** with corrected code
4. **Start Appium** on port 4731
5. **Re-run test**: `@test-default-run`

### Short-term (Prevent Regression)

1. Add port validation checks at frontend startup
2. Create automated worktree testing script
3. Document testing requirements in CLAUDE.md
4. Add integration test for port isolation

### Long-term (Improve Multi-Worktree DX)

1. Centralize port configuration (single source of truth)
2. Add visual indicator in frontend showing which backend it's connected to
3. Create health check endpoint that returns backend port
4. Implement automatic port conflict resolution

---

## Conclusion

The test revealed a **critical port isolation bug**: the frontend connected to the wrong backend (port 4002 instead of 4008), violating worktree isolation principles.

While the core infrastructure (port coordinator, service startup scripts) works correctly, the frontend's backend discovery logic bypasses the assigned ports and scans for any available backend, causing cross-worktree interference.

**Impact**: High - Breaks multi-agent development model, causes unpredictable behavior when multiple worktrees are active.

**Priority**: P0 - Must fix before multi-agent testing can proceed.

---

**Test Execution Summary**:
- Services started: ✅
- Port isolation verified (backend): ✅
- Port isolation verified (frontend): ❌ FAILED
- Run created: ✅ (wrong backend)
- Screenshots discovered: ❌ (device offline)
- Test passed: ❌

**Overall Result**: FAILED (port isolation violation)

