# 🚨 FOUNDER ACTION REQUIRED: Port Isolation Violated

**Date**: 2025-11-07  
**Severity**: P0 (Critical - Blocks Multi-Agent Development)  
**Time to Fix**: ~2 hours  
**Decision Needed**: Yes

---

## 🎯 Executive Summary

**What Broke**: End-to-end test (`@test-default-run`) revealed that the frontend connects to the WRONG backend, completely breaking worktree isolation.

**Impact**: 
- Multi-agent development is **broken**
- Frontend from worktree Px8w6 (port 5181) connected to backend from worktree LqKPe (port 4002)
- Should have connected to its own backend (port 4008)
- Run failed: 0 screenshots, DeviceOfflineError, cross-worktree interference

**Root Cause**: `frontend/src/lib/getEncoreClient.ts` scans for ANY available backend instead of using the assigned port from environment variable.

---

## 🔥 Critical Issue (P0)

### What Happened

```
Expected: Frontend (Px8w6:5181) → Backend (Px8w6:4008)
Actual:   Frontend (Px8w6:5181) → Backend (LqKPe:4002) ❌
```

### Evidence

**Console Log**:
```
[ERROR] Connection refused @ http://localhost:4000/health
[LOG] Found Encore backend at http://localhost:4002  ← WRONG!
```

**Network Traffic**:
```
POST http://localhost:4002/run → 200 OK  ← Created run on WRONG backend!
```

### Why This Is Critical

1. **Multi-agent development broken**: Worktrees interfere with each other
2. **Unpredictable behavior**: Which backend is used depends on startup order
3. **Data corruption risk**: Runs/artifacts created in wrong database
4. **Debugging nightmare**: State split across multiple backends
5. **Violates core architecture**: Port isolation system completely bypassed

---

## 🛠️ Required Fix

### File: `frontend/src/lib/getEncoreClient.ts`

**Current (Broken)**:
```typescript
// Scans ALL ports and connects to first available backend
async function findBackend() {
  const ports = [4000, 4001, 4002, 4003, 4004, 4005];
  for (const port of ports) {
    try {
      await fetch(`http://localhost:${port}/health`);
      return `http://localhost:${port}`; // ❌ Returns ANY backend
    } catch {}
  }
}
```

**Required (Fixed)**:
```typescript
// Uses ONLY the assigned backend from environment variable
function getBackendUrl() {
  const envUrl = import.meta.env.VITE_BACKEND_BASE_URL;
  
  if (envUrl) {
    console.log(`[Frontend] Using backend: ${envUrl}`);
    return envUrl; // ✅ Returns CORRECT backend
  }
  
  // Fallback for main tree only
  return 'http://localhost:4000';
}
```

### File: `./scripts/dev-frontend.sh`

**Verify it exports env var BEFORE Vite starts**:
```bash
eval "$(bun ./scripts/port-coordinator.mjs --no-summary)"
export VITE_BACKEND_BASE_URL="http://localhost:${BACKEND_PORT}"
cd frontend
bun run dev --port ${FRONTEND_PORT}
```

---

## 📋 Founder Action Items

### 1. Decision Required (5 minutes)

**Question**: Approve the fix approach?

**Proposed Approach**:
- Frontend MUST use `VITE_BACKEND_BASE_URL` (no port scanning)
- Only fallback to 4000 if env var missing (main tree only)
- Add validation to detect mismatches at startup

**Alternative**: Keep port scanning but make it smarter (NOT recommended - adds complexity)

**Recommendation**: ✅ Approve proposed approach (simple, predictable, secure)

---

### 2. Immediate Actions (2 hours)

**Priority Order**:

#### Step 1: Fix Frontend Backend Discovery (30 min)
- [ ] Update `frontend/src/lib/getEncoreClient.ts`
- [ ] Remove port scanning logic
- [ ] Use `import.meta.env.VITE_BACKEND_BASE_URL` exclusively
- [ ] Add console logging for debugging

#### Step 2: Verify Environment Variable Passing (15 min)
- [ ] Check `./scripts/dev-frontend.sh` exports `VITE_BACKEND_BASE_URL`
- [ ] Ensure export happens BEFORE `bun run dev`
- [ ] Test that Vite receives the variable

#### Step 3: Add Port Validation (30 min)
- [ ] Add startup check in frontend
- [ ] Detect when backend URL doesn't match expected port
- [ ] Throw error with clear message if mismatch detected

#### Step 4: Test the Fix (30 min)
- [ ] Restart frontend on worktree Px8w6
- [ ] Verify console shows correct backend (4008)
- [ ] Re-run `@test-default-run`
- [ ] Confirm frontend connects to correct backend
- [ ] Verify run completes successfully

#### Step 5: Prevent Regression (15 min)
- [ ] Add integration test for port isolation
- [ ] Document the fix in CLAUDE.md
- [ ] Update founder rules if needed

---

### 3. Original Issue (Low Priority - P3)

**Separate Issue**: Main tree gets offset ports (4007) instead of base ports (4000)

**Status**: Can defer until critical fix is complete

**Action**: Keep as P3, address after critical fix verified

---

## 🎯 Success Criteria

After fix is applied:

- [x] Frontend connects to CORRECT backend (matches assigned port)
- [x] Console shows: `[Frontend] Using backend: http://localhost:4008`
- [x] `@test-default-run` passes (screenshots discovered, graph populated)
- [x] No cross-worktree interference
- [x] Multi-agent development works

---

## 📊 Test Results (Before Fix)

**Test**: `@test-default-run` on worktree Px8w6  
**Status**: ❌ FAILED  
**Pass Rate**: 4/11 criteria (36%)  

**Failures**:
- Frontend connected to port 4002 (should be 4008)
- 0 screenshots discovered (device offline on wrong backend)
- Cross-worktree interference detected

**Evidence**:
- Full Report: `.cursor/test-artifacts/test-default-run-2025-11-07T00-12-53-REPORT.md`
- Screenshot: `.cursor/test-artifacts/test-default-run-2025-11-07T00-12-53.png`

---

## 💡 Why This Wasn't Caught Earlier

1. Port coordinator was tested in isolation (works correctly)
2. Backend services were tested independently (work correctly)
3. **Missing**: End-to-end test with multiple worktrees running simultaneously
4. **Missing**: Integration test verifying frontend→backend port matching

**Lesson**: Need automated tests for worktree isolation

---

## 🚀 After Fix: Next Steps

1. **Run full regression test** with multiple worktrees active
2. **Document worktree testing procedures** in CLAUDE.md
3. **Add CI check** for port isolation (if applicable)
4. **Create integration test** that verifies frontend connects to correct backend
5. **Address original P3 issue** (main tree port offset) at lower priority

---

## 🤝 Support Needed

**From Founder**:
- [ ] Decision: Approve fix approach (5 min)
- [ ] Review: Final implementation before deployment (10 min)
- [ ] Verify: Test passes after fix (5 min)

**From Backend Team**:
- Implement the fix (already specified above)

**From QA**:
- Re-run `@test-default-run` after fix
- Verify multi-worktree scenario works

---

## 📞 Contact

**Issue Owner**: Worktree Px8w6 (AI Agent)  
**Discovered By**: `@test-default-run` command  
**Reported**: 2025-11-07  
**Blocking**: Multi-agent development, E2E testing

---

## ⚡ TL;DR for Founder

**Problem**: Frontend connects to wrong backend (port 4002 instead of 4008)  
**Impact**: Multi-agent development broken  
**Fix**: Make frontend use `VITE_BACKEND_BASE_URL` env var (no port scanning)  
**Time**: 2 hours  
**Decision**: Approve fix approach? ✅ Yes / ❌ No / 🤔 Need discussion

**Recommendation**: **APPROVE AND IMPLEMENT IMMEDIATELY** (P0 blocker)

