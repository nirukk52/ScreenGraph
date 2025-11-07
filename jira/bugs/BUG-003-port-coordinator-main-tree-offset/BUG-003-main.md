## BUG-003 — Port Coordinator Assigns Offset to Main Tree

### Summary
The port coordinator (`backend/scripts/port-coordinator.mjs`) uses hash-based offset calculation for ALL worktrees including the main tree ("ScreenGraph"), when according to founder rules the main tree should use default base ports (4000, 5173, 9400). This causes confusion and deviates from documented architecture.

### Severity / Impact
- **Severity**: ⚠️ **ESCALATED TO CRITICAL** (was Low)
- **Original Impact** (Low Severity): 
  - Main tree uses non-standard ports (4007, 5180, 9407) instead of defaults
  - Deviates from founder rules documentation
  - Causes confusion when developers expect default ports on main tree
  - Skills and commands must always call port coordinator instead of using known defaults
  - No functional breakage, but architectural inconsistency

- **🚨 NEW CRITICAL IMPACT** (Discovered 2025-11-07):
  - **Frontend connects to WRONG backend** (port 4002 instead of 4008)
  - **Breaks worktree isolation completely**
  - **Multi-agent development is broken**
  - Frontend ignores `VITE_BACKEND_BASE_URL` environment variable
  - Frontend scans for ANY available backend and connects to first one found
  - Causes cross-worktree interference and unpredictable behavior
  - **Test failure**: 0 screenshots, DeviceOfflineError (wrong backend has different device config)

### Environment
- **Backend**: Local development (encore run)
- **Frontend**: Local development (bun run dev)
- **Tree**: Main tree "ScreenGraph"
- **File**: `backend/scripts/port-coordinator.mjs`

### Steps to Reproduce
1. Navigate to main tree (not a worktree)
2. Run: `basename $(git rev-parse --show-toplevel)` → Returns "ScreenGraph"
3. Run: `bun backend/scripts/port-coordinator.mjs --json`
4. Observe assigned ports

### Expected Result
```json
{
  "worktree": "ScreenGraph",
  "ports": {
    "backend": 4000,
    "frontend": 5173,
    "dashboard": 9400,
    "appium": 4723
  }
}
```

Main tree should use **base ports** as documented in founder rules:
- Backend: 4000
- Frontend: 5173
- Dashboard: 9400
- Appium: 4723

### Actual Result
```json
{
  "worktree": "ScreenGraph",
  "ports": {
    "backend": 4007,
    "frontend": 5180,
    "dashboard": 9407,
    "appium": 4730
  }
}
```

Main tree receives **offset ports** calculated via hash:
- Backend: 4007 (offset +7)
- Frontend: 5180 (offset +7)
- Dashboard: 9407 (offset +7)
- Appium: 4730 (offset +7)

### Suspected Root Cause
**File**: `backend/scripts/port-coordinator.mjs` lines 93-102

The port coordinator does not special-case the main tree:

```javascript
// Line 93-102
const offsetSeed = hashString(worktree);  // Hashes "ScreenGraph" to a number
const assigned = {};

for (const [name, cfg] of Object.entries(SERVICES)) {
  const envName = cfg.env;
  const override = process.env[envName] ? Number(process.env[envName]) : null;
  const width = cfg.width;
  const offset = offsetSeed % width;  // Calculates offset (7 for "ScreenGraph")
  const base = cfg.base;
  const preferred = override ?? (registry.worktrees[worktree][name] ?? base + offset);  // Uses base + offset
  let port = await pickPort(base, width, preferred);
  // ...
}
```

**Issue**: Line 100 calculates offset for ALL worktrees, including main. There is no check for `if (worktree === "ScreenGraph")` to use base ports.

### Founder Rules Reference
From `.cursor/rules/founder_rules.mdc` Section II:

> ### 📍 Port Reservation Policy
> 
> | Environment | Backend | Frontend | Dashboard | Appium |
> |----|---|----|-----|-----|
> | **Main Tree** | **4000** | **5173** | **9400** | **4723** |
> | Worktree 1-20 | 4001-4009 | 5174-5183 | 9401-9409 | 4724-4733 |
> 
> **Main tree ports are RESERVED** — worktrees use port coordinator for automatic assignment.

### Attachments / Logs

**Port Coordinator Detection**:
```bash
$ basename $(git rev-parse --show-toplevel)
ScreenGraph

$ bun backend/scripts/port-coordinator.mjs --json
{
  "worktree": "ScreenGraph",
  "ports": {
    "backend": 4007,
    "frontend": 5180,
    "dashboard": 9407,
    "appium": 4730
  }
}
```

**Hash Calculation**:
```javascript
hashString("ScreenGraph") % 10 = 7  // For services with width 10
hashString("ScreenGraph") % 11 = 7  // For frontend (width 11)
```

### Proposed Fix / Next Steps

**Option 1: Special-case main tree (Recommended)**
```javascript
// Line 87-104 in port-coordinator.mjs
async function resolvePorts() {
  const worktree = detectWorktreeName();
  const registry = loadRegistry();
  const now = new Date().toISOString();
  if (!registry.worktrees[worktree]) registry.worktrees[worktree] = {};

  const assigned = {};
  
  // MAIN TREE USES BASE PORTS (no offset)
  const isMainTree = worktree === "ScreenGraph";

  for (const [name, cfg] of Object.entries(SERVICES)) {
    const envName = cfg.env;
    const override = process.env[envName] ? Number(process.env[envName]) : null;
    const width = cfg.width;
    const base = cfg.base;
    
    let preferred;
    if (isMainTree) {
      // Main tree: use base ports
      preferred = override ?? (registry.worktrees[worktree][name] ?? base);
    } else {
      // Worktrees: use hash-based offset
      const offsetSeed = hashString(worktree);
      const offset = offsetSeed % width;
      preferred = override ?? (registry.worktrees[worktree][name] ?? base + offset);
    }
    
    let port = await pickPort(base, width, preferred);
    // ... rest of logic
  }
}
```

**Option 2: Document current behavior as intentional**
- Update founder rules to reflect that ALL trees get hash-based offsets
- Rationale: Prevents conflicts if default ports are already in use
- Con: Deviates from standard "main = defaults" convention

**Testing Plan**:
1. Apply fix (Option 1)
2. Delete `~/.screengraph/ports.json` (clear registry)
3. Run `bun backend/scripts/port-coordinator.mjs --json` on main tree
4. Verify output shows base ports (4000, 5173, 9400, 4723)
5. Create a worktree and verify it still gets offset ports
6. Run full test suite to ensure no port conflicts

### Owner / Requestor
- **Reported by**: AI Assistant (Claude) during skill creation
- **Discovered while**: Creating `cursor-chrome-window-mastery` skill
- **Suggested Owner**: Backend team / Founder
- **Priority**: P3 (Low priority - architectural consistency, not functional bug)

---

### Notes

**Related Files**:
- `backend/scripts/port-coordinator.mjs` (fix needed)
- `.cursor/rules/founder_rules.mdc` (documents expected behavior)
- `.claude-skills/cursor-chrome-window-mastery/SKILL.md` (updated to reflect actual behavior)
- `.cursor/commands/test-default-run` (uses port coordinator)

**Workaround**: 
Skills and commands now call port coordinator before any browser testing to get actual ports, so functionality is not blocked. The discrepancy is documented in the skill.

**Decision Needed**: 
Should main tree use base ports (per founder rules) or is the current hash-based approach preferred for safety?

**Founder Input Requested**:
- Is the current behavior (hash for all trees) intentional?
- Should we apply Option 1 fix to align with documented rules?
- Or should we update founder rules to match current implementation?

---

## 🚨 CRITICAL UPDATE (2025-11-07): Frontend Port Isolation Violation

### Test Execution Results

**Command**: `@test-default-run` executed on worktree Px8w6  
**Expected**: Frontend (port 5181) → Backend (port 4008)  
**Actual**: Frontend (port 5181) → Backend (port 4002) ❌

### Evidence from Browser Test

**Console Logs**:
```
[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED @ http://localhost:4000/health
[LOG] Found Encore backend at http://localhost:4002
```

**Network Requests**:
```
GET  http://localhost:4000/health → ERR_CONNECTION_REFUSED
GET  http://localhost:4002/health → 200 OK (WRONG BACKEND!)
POST http://localhost:4002/run    → 200 OK (WRONG BACKEND!)
```

### Root Cause: Frontend Backend Discovery

**File**: `frontend/src/lib/getEncoreClient.ts`

The frontend's backend discovery logic:
1. ❌ Ignores `VITE_BACKEND_BASE_URL` environment variable set by `./scripts/dev-frontend.sh`
2. ❌ Scans ports [4000, 4001, 4002, 4003, ...] for ANY available backend
3. ❌ Connects to FIRST backend that responds (port 4002 from another worktree)
4. ❌ Never tries the correct backend (port 4008 assigned to this worktree)

### Impact on Test

**Run ID**: `01K9DTG2A3S9Y5J39ZNTGQYNWR`  
**Created on**: Backend port 4002 (LqKPe worktree) instead of 4008 (Px8w6 worktree)  
**Result**: Run failed with `DeviceOfflineError` because:
- Port 4002 backend has different Appium configuration (port 4725)
- Current worktree's Appium should be on port 4731
- Cross-worktree connection caused device unavailability
- **0 screenshots discovered** (run couldn't proceed)
- **22 events received** (stalled at EnsureDevice retries)

### Critical Severity Justification

This is **not** the original low-severity port offset issue. This is a **P0 critical bug** because:

1. **Breaks multi-agent development**: Frontend from one worktree connects to backend from another
2. **Unpredictable behavior**: Which backend is used depends on random startup order
3. **Data corruption risk**: Runs created on wrong backend, artifacts stored in wrong location
4. **Debugging nightmare**: Logs, events, and state split across multiple backends
5. **Port isolation completely violated**: The entire worktree isolation system is bypassed

### Required Fix (URGENT - P0)

**File**: `frontend/src/lib/getEncoreClient.ts`

**Current (Broken)**:
```typescript
async function findBackend() {
  const ports = [4000, 4001, 4002, 4003, 4004, 4005];
  for (const port of ports) {
    try {
      const response = await fetch(`http://localhost:${port}/health`);
      if (response.ok) {
        console.log(`Found Encore backend at http://localhost:${port}`);
        return `http://localhost:${port}`;
      }
    } catch {}
  }
  throw new Error('No backend found');
}
```

**Required (Fixed)**:
```typescript
function getBackendUrl() {
  // ALWAYS use environment variable set by dev-frontend.sh
  const envUrl = import.meta.env.VITE_BACKEND_BASE_URL;
  
  if (envUrl) {
    console.log(`[Frontend] Using backend from env: ${envUrl}`);
    return envUrl;
  }
  
  // Fallback ONLY for main tree without port coordinator
  console.warn('[Frontend] No VITE_BACKEND_BASE_URL, using default');
  return 'http://localhost:4000';
}
```

**Verification Needed**:
Also verify `./scripts/dev-frontend.sh` exports environment variable BEFORE starting Vite:
```bash
eval "$(bun ./scripts/port-coordinator.mjs --no-summary)"
export VITE_BACKEND_BASE_URL="http://localhost:${BACKEND_PORT}"

echo "Starting frontend with backend: ${VITE_BACKEND_BASE_URL}"
cd frontend
bun run dev --port ${FRONTEND_PORT}
```

### Test Report

**Full Report**: `.cursor/test-artifacts/test-default-run-2025-11-07T00-12-53-REPORT.md`  
**Screenshot**: `.cursor/test-artifacts/test-default-run-2025-11-07T00-12-53.png`

**Test Status**: ❌ FAILED (4/11 criteria passed - 36% pass rate)

**Key Failures**:
- Frontend connected to wrong backend (port 4002 instead of 4008)
- 0 screenshots discovered (device offline on wrong backend)
- Multi-agent development broken (cross-worktree interference)

### Recommended Priority Change

- **Original**: P3 (Low - architectural inconsistency)
- **Updated**: P0 (Critical - breaks core functionality)
- **Reason**: Frontend port discovery violates worktree isolation entirely

### Next Steps (URGENT)

1. ✅ Fix `frontend/src/lib/getEncoreClient.ts` to use `VITE_BACKEND_BASE_URL`
2. ✅ Verify `./scripts/dev-frontend.sh` exports environment variable correctly
3. ✅ Add port validation check at frontend startup (detect mismatches early)
4. ✅ Re-run `@test-default-run` to verify fix
5. ✅ Add integration test for port isolation
6. 🔄 Original port offset issue (main tree) can remain P3 after critical fix

---

