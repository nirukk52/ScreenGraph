# BUG-015: E2E Run Navigation Timeout

> **Line Limit:** 150 lines max (enforced)  
> **Priority**: P1  
> **Status**: 🔴 ACTIVE (2025-11-10)

---

## Summary

E2E tests and manual browser testing fail when clicking "Detect My First Drift" button. The `startRun` API call appears to hang, preventing navigation to the `/run/{runId}` page. This blocks all run-page E2E test execution, including validation of BUG-014 fix.

**Impact:** Cannot run automated E2E tests for run page flows. BUG-014 fix validated via code review only.

---

## Severity / Impact

- **Severity**: High
- **Impact**: Blocks all E2E test automation for run page. Prevents validation of:
  - BUG-014 stale screenshot fix
  - Run page smoke tests
  - Screenshot discovery tests
  - Any new run-page features

---

## Environment

- **Backend**: `encore run` (local) - Port 4000, Status: ✅ Running
- **Frontend**: `localhost:5173` via Vite dev server - Status: ✅ Running
- **Appium**: Port 4723 with `--allow-insecure=uiautomator2:adb_shell` - Status: ✅ Running
- **Browser/OS**: Playwright Chromium on macOS 14.6
- **Test Package**: `com.jetbrains.kotlinconf` (from `.env`)

---

## Steps to Reproduce

### Via Playwright E2E Test:
1. Start services: `task backend:dev` + `cd frontend && bun run dev`
2. Start Appium: `bash backend/scripts/start-appium.sh`
3. Run E2E test: `cd frontend && HEADLESS=false bun run playwright test --grep "BUG-014"`
4. **Observe**: Test clicks button, waits for navigation, times out after 30s

### Via Manual Browser Testing:
1. Navigate to `http://localhost:5173`
2. Click "Detect My First Drift" button
3. **Observe**: Button shows "Starting..." but navigation never occurs
4. Check browser DevTools Network tab → `POST /run` request status

---

## Expected Result

- `POST /run` API call completes within 5 seconds
- Backend creates run record and publishes job to PubSub
- Frontend receives `runId` in response
- Browser navigates to `/run/{runId}` page
- Run page loads with timeline heading

---

## Actual Result

- Playwright test fails:
  ```
  Error: page.waitForURL: Test timeout of 30000ms exceeded.
  waiting for navigation until "domcontentloaded"
  ```
- Button click triggers `startRun` API call
- Navigation never occurs (stuck on landing page)
- No error message surfaced to user
- Backend and Appium logs show no obvious failures

---

## Root Cause

**Status:** Under Investigation

### Hypothesis 1: Worker Subscription Not Active
The PubSub worker may not be subscribed/leasing jobs:
```typescript
// Backend worker subscription
import "../agent/orchestrator/subscription";
```
**Issue:** Run gets created as `queued` but never transitions to `running` because no worker leases it.

### Hypothesis 2: Frontend API Client Timeout
The Encore-generated client may have a timeout configuration issue:
```typescript
// frontend/src/lib/api.ts
export async function startRun(params: run.StartRunRequest): Promise<run.StartRunResponse> {
  const client = await getEncoreClient();
  return client.run.start(params); // May timeout before backend responds
}
```

### Hypothesis 3: Backend Database Hang
The `POST /run` endpoint creates a database record:
```typescript
// backend/run/start.ts
const run = await db.queryRow<Run>`
  INSERT INTO runs (...) VALUES (...) RETURNING *
`;
```
**Issue:** Transaction may be hanging or slow.

### Hypothesis 4: CORS or Network Issue
Although backend health check passes, there may be a CORS/network issue specific to the `POST /run` endpoint.

---

## Proposed Fix

### Phase 1: Diagnostic (Priority)
1. **Check backend logs during test run:**
   ```bash
   task backend:logs  # or tail encore process
   ```
2. **Test `POST /run` directly with curl:**
   ```bash
   curl -X POST http://localhost:4000/run \
     -H "Content-Type: application/json" \
     -d '{"apkPath":"/path/to/app.apk","appiumServerUrl":"http://127.0.0.1:4723/","packageName":"com.jetbrains.kotlinconf","appActivity":".*","maxSteps":10}'
   ```
3. **Check browser DevTools Network tab during manual test**
4. **Inspect database for hanging transactions:**
   ```sql
   SELECT * FROM runs ORDER BY created_at DESC LIMIT 5;
   ```

### Phase 2: Fix (Based on Diagnosis)
- If worker issue: Ensure subscription loaded in dev server
- If timeout issue: Increase Encore client timeout
- If DB issue: Add transaction logging/debugging
- If CORS issue: Verify `encore.app` CORS config

### Phase 3: Testing
1. Re-run E2E tests: `cd frontend && HEADLESS=false bun run playwright test`
2. Validate BUG-014 fix can be tested
3. Add health check for worker subscription status

---

## Attachments / Logs

### Playwright Test Output:
```
Error: page.waitForURL: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "domcontentloaded"
============================================================

  173 | await page.waitForURL(/\/run\/[a-f0-9-]+/i, { 
```

### Services Status:
```bash
$ lsof -i tcp:4000  # Backend ✅
COMMAND   PID USER   FD TYPE DEVICE SIZE/OFF NODE NAME
encore  89258 ...   25u IPv4 ...      0t0  TCP localhost:terabase (LISTEN)

$ lsof -i tcp:4723  # Appium ✅
COMMAND   PID USER   FD TYPE DEVICE SIZE/OFF NODE NAME
node    44695 ...   16u IPv4 ...      0t0  TCP *:4723 (LISTEN)
```

---

## Owner / Priority

- **Reported by**: AI Agent (during BUG-014 E2E test creation)
- **Assigned to**: Backend + Infra team
- **Priority**: P1 (Blocks E2E test automation)

---

## Related Items

- **Blocks**: BUG-014 E2E test validation
- **Blocks**: All run-page E2E tests (`frontend/tests/e2e/run-page.spec.ts`)
- **Related**: BUG-011 (Appium stall) - Similar symptom, different root cause
- **Related**: BUG-010 (Run page regressions) - Fixed, but validation blocked by this issue

---

## Notes

### Why This Wasn't Caught Earlier:
- BUG-010 and BUG-011 focused on issues AFTER reaching the run page
- E2E tests historically tested page load, not the full run creation flow
- BUG-014 fix required navigation between runs, exposing this issue

### Workarounds:
- ✅ BUG-014 fix validated via code review and Svelte 5 patterns
- ✅ Manual testing possible if issue is test-environment specific
- ⚠️ No workaround for automated E2E validation

### Next Actions:
1. Reproduce in headed browser with DevTools open
2. Capture network request/response for `POST /run`
3. Check Encore logs for run creation
4. Debug with `@infra_vibe` tools if needed
