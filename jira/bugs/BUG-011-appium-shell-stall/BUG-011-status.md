# BUG-011: appium-shell-stall - Status

> **Line Limit:** 100 lines max (enforced)  
> **Purpose:** Track todos, progress, and current state

---

## Manual Testing Required (Top 5)
1. Backend `task backend:test` completes with misconfigured Appium (should fail fast).
2. Frontend “Detect Any Drift” shows explicit error when Appium cannot execute `mobile: shell`.
3. Backend run terminates with `stop_reason` when `adb_shell` is disabled.
4. Appium start script enforces `allowInsecure=adb_shell`; missing flag is detected.
5. Regression: normal run succeeds when Appium is configured correctly.

---

## Status
**Current:** investigating  
**Priority:** P1  
**Severity:** High

**Started:** 2025-11-10  
**Last Updated:** 2025-11-10  
**Completed:** —

---

## Todos
- [ ] Reproduce bug locally
- [ ] Identify root cause
- [ ] Implement fix
- [ ] Write/update tests
- [ ] Manual verification
- [ ] Update documentation

---

## Progress Summary
Reproduced consistently: runs hang at `running` when Appium lacks `adb_shell`. Need backend change to surface failure and frontend guardrail.

---

## Blockers
- (none)

---

## Recent Updates

### 2025-11-10
Documented failure scenario; Vitest logs confirm signature validation falls back without terminating run.

---

## Help Needed
- (none)

---











