# BUG-011: appium-shell-stall

> **Line Limit:** 250 lines max (enforced)  
> **Purpose:** Core bug documentation and implementation details

---

## Summary
Drift detection runs never finish when Appium starts without `allowInsecure=adb_shell`. The agent captures a screenshot, but the run remains `running`, the frontend shows the stale frame, and there is no failure surfaced to engineers or QA.

---

## Severity / Impact
- **Severity**: High
- **Impact**: Automated backend tests and manual drift detection rely on Appium. Misconfiguration silently stalls runs, masking failure signals and blocking verification.

---

## Environment
- **Backend**: encore run (local)
- **Frontend**: localhost:5173
- **Browser/OS**: Chrome 130 on macOS 14.6
- **Package Versions**: Appium 2.x (without `allowInsecure=adb_shell`)

---

## Steps to Reproduce
1. Start Appium without insecure shell (`appium --port 4723`).
2. Run `task backend:test` or click “Detect My First Drift” in the UI.
3. Observe Vitest logs: `ProvisionApp.signature.failed` with `adb_shell not enabled`.
4. Frontend displays a screenshot forever; Encore reports run status `running`.

---

## Expected Result
- Backend run transitions to `failed` with an actionable `stop_reason`.
- Frontend surfaces an error state to the user when the agent cannot proceed.

---

## Actual Result
- `mobile: shell` command fails; Encore logs a warning but leaves the run in `running`.
- UI shows the last captured screenshot indefinitely with no error banner.
- Engineers receive no signal that Appium is misconfigured.

---

## Root Cause
Initial finding: the agent treats signature verification failure as recoverable, so the orchestration never emits a terminal event. The frontend only sees `status: "running"`, leaving the stale frame onscreen.

---

## Proposed Fix
1. Update `ProvisionApp` handling to propagate the signature failure as a terminal `run.stop_reason`.
2. Add backend telemetry/metrics for `adb_shell` capability errors.
3. Frontend: detect runs that remain `running` past timeout and surface an explicit error banner.
4. Document Appium startup requirements and add a CLI guard to `task qa:appium:start`.

---

## Attachments / Logs
- Vitest snippet: `WebDriverError: Potentially insecure feature 'adb_shell' has not been enabled.`
- Encore log lines from `ProvisionApp.signature.failed`.
- Screenshot of frontend showing single frozen frame.

---

## Owner / Priority
- **Reported by**: QA (Founder request)
- **Assigned to**: Backend + QA pair
- **Priority**: P1

---

## Related Items
- **Discovered in**: Drift detection regression testing
- **Blocks**: Automated backend smoke tests that depend on Appium
- **Related**: FR-019 (Appium auto-start hardening)

---

## Notes
- Tests `agent/tests/metrics.test.ts` and `backend/run/start.integration.test.ts` fail with timeout when this occurs.
- Issue confirmed multiple times on 2025-11-10; screenshot persisted on frontend even after Appium shutdown.

---

## Update 2025-11-11: Appium Instrumentation Crash

**New Symptom**: UiAutomator2 instrumentation process crashes mid-execution, affecting BOTH frontend E2E and backend tests.

**Error**:
```
WebDriverError: 'GET /screenshot' cannot be proxied to UiAutomator2 server because 
the instrumentation process is not running (probably crashed).
```

**Impact**:
- ❌ Backend `encore test`: `agent/tests/metrics.test.ts` fails (Perceive hangs on screenshot capture)
- ❌ Backend `encore test`: `run/start.integration.test.ts` fails (run status → "failed")
- ❌ Frontend E2E: `run-validation.spec.ts` fails (API never returns, navigation timeout)

**Root Cause**: Appium UiAutomator2 server loses connection to device instrumentation during execution, leaving all Appium calls hanging or erroring.

**Temporary Workaround**:
- Restart Appium + emulator between test runs
- Reduce concurrent test sessions (run tests serially, not parallel)

**Permanent Fix Needed**:
1. Investigate emulator stability (logcat for crash signals)
2. Add Appium health checks before/during tests
3. Implement automatic session recovery when instrumentation dies
4. Consider switching to more stable Appium driver or device setup









