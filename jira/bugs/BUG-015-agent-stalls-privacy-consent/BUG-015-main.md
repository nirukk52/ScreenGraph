# BUG-015: agent-stalls-privacy-consent

> **Line Limit:** 150 lines max (enforced)
> **Purpose:** Core bug documentation and implementation details

---

## Summary
Encore agent runs stall on the KotlinConf APK because the privacy-consent dialog is never dismissed. Automation loops at `Perceive`/`WaitIdle`, runs stay in `running`, and backend metrics/E2E tests time out. Immediate impact: regression suites and headed Playwright runs never complete.

---

## Severity / Impact
- **Severity**: High
- **Impact**: Blocks backend metrics test (`encore test agent/tests/metrics.test.ts`) and `/run` E2E smoke; QA cannot reliably verify discoveries; front-end appears healthy despite backend failure.

---

## Environment
- **Backend**: encore test (local via `task backend:test`)
- **Frontend**: localhost:5173 (SvelteKit dev UI)
- **Browser/OS**: Playwright Chromium headed on macOS 14
- **Package Versions**: KotlinConf APK shipped with repo (`kotlinconf.apk`), Appium 2.19.0, UiAutomator2 driver 2.45.1

---

## Steps to Reproduce
1. Ensure emulator/device is clean (privacy consent not yet accepted); start Appium with required insecure flag.
2. Run `task backend:test` or `encore test agent/tests/metrics.test.ts`.
3. Observe logs: run stays `running`, last node `LaunchOrAttach`; UI screenshot shows privacy notice.

---

## Expected Result
Agent automation should accept/dismiss privacy consent and advance to discover at least one screen, emitting metrics and completing the run.

---

## Actual Result
UiAutomator session takes screenshot of consent dialog but no action occurs; run never progresses, so status stays `running`/`failed`, and tests time out after 60 seconds.

---

## Root Cause
Agent action pipeline lacks logic to interact with the KotlinConf privacy dialog. WaitIdle perceives the screen but no node triggers an input action, leaving the app on the consent page indefinitely.

---

## Proposed Fix
1. Add deterministic dismissal in the automation flow (e.g., dedicated node or policy hook to tap “Accept” when dialog detected).
2. Seed emulator before tests or add resume logic so repeated runs don’t open consent.
3. Re-run `task backend:test` and `task qa:e2e:headed` to confirm runs complete and metrics/events persist.

---

## Attachments / Logs
- Encore log: run `01K9PM0Q7PJHYYE23F2NY9R64Z` stuck at `LaunchOrAttach`.
- Playwright screenshot `test-results/run-page--.../test-failed-1.png` showing consent dialog.

---

## Owner / Priority
- **Reported by**: QA automation (backend session 2025-11-10)
- **Assigned to**: Backend Vibe (Agent/Automation)
- **Priority**: P1

---

## Related Items
- **Discovered in**: `task backend:test` regression run / BUG-014 investigation
- **Blocks**: BUG-014 run-page-stale-event-history resolution, Playwright `/run` smoke
- **Related**: BUG-011 appium-shell-stall

---

## Notes
- Work around: manually accept dialog before running tests (not scalable).
- Consider adding Appium script in preflight to wipe + accept consent once per emulator boot.

