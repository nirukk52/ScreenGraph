# BUG-010: Run Page Regressions - Graph Events & Screenshots Not Visible

> **Line Limit:** 150 lines max (enforced)  
> **Priority**: P1  
> **Status**: ✅ RESOLVED (2025-11-08)

---

## Summary
The `/run` page has three critical regressions preventing proper visualization of agent activity:
1. **Graph events not visible** - Timeline events are not rendering
2. **Screenshots not visible** - Discovered screenshot gallery is empty  
3. **Stop node not called** - Run completion indicator never fires

**Evidence**: `.playwright-mcp/drift-detection-with-screenshot.png`

---

## Severity / Impact
- **Severity**: High
- **Impact**: Complete loss of run visualization - users cannot verify agent behavior. Affects all users attempting drift detection. No workaround available.

---

## Environment
- **Backend**: `encore run` (local) - Port 4000
- **Frontend**: `localhost:5173`
- **Browser/OS**: All browsers, all OS
- **Package**: `com.jetbrains.kotlinconf` (from `.env`)

---

## Steps to Reproduce
1. Start services: `bun run dev`
2. Ensure Appium/device running
3. Navigate to `http://localhost:5173`
4. Click "Detect My First Drift" button
5. Wait for navigation to `/run/{runId}` page
6. **Observe**: Page loads but timeline empty, no screenshots, no stop node

---

## Expected Result
- Timeline events appear in real-time (SSE updates)
- Screenshot gallery populates with captured screens
- Stop node fires when agent completes exploration
- Run state transitions visible in UI

---

## Actual Result
- Run Timeline heading visible ✅
- Cancel Run button present ✅
- **BUT**: No timeline events render
- **BUT**: Screenshot gallery remains empty
- **BUT**: Stop node never appears

---

## Root Cause ✅ IDENTIFIED

### Issue #1: Graph Projector Cursor Limit Exceeded
**Cause:** `CURSOR_LIMIT=50` but 75 cursors exist; recent runs (position 51-75) never processed  
**Impact:** Graph events and screenshots missing for all recent runs  
**Fix:** Increased `CURSOR_LIMIT` from 50 → 200 in `backend/graph/projector.ts`

### Issue #2: Stop Node DB Query Blocking Execution
**Cause:** Commit `b043afc` added DB query to Stop node that hangs/fails during execution  
**Impact:** XState machine fails before Stop can complete, no terminal events emitted  
**Fix:** Removed DB query from `backend/agent/nodes/terminal/Stop/node.ts`  
**Breaking Commit:** `b043afc` (Nov 7, 5:50 PM)  
**Regression Window:** Between run `01K9G8YXY6MG7J7875A5AM9Z4H` (success at 5:03 PM) and `01K9GDQF9JQFM8A4Q5WGMARPAT` (failed at 6:26 PM)

**See:** `RCA.md` for complete technical analysis

---

## Proposed Fix
1. **Investigate**: Check browser DevTools Network/Console tabs
2. **Verify**: Backend logs show event publications
3. **Test**: SSE endpoints directly with curl
4. **Fix**: Address root cause (SSE connection, event publishing, or rendering)
5. **Test**: Add automated tests for event/screenshot rendering

**Suggested Test Additions** (`frontend/tests/e2e/run-page.spec.ts`):
- Wait for graph events: `waitForGraphEvent(page, "agent.event.screenshot_captured")`
- Verify screenshot count: `expect(countDiscoveredScreenshots(page)).toBeGreaterThan(0)`
- Check stop node: `waitForStopNode(page, { timeout: 120000 })`

---

## Attachments / Logs
- **Evidence**: `.playwright-mcp/drift-detection-with-screenshot.png`
- **Investigation Guide**: `.playwright-mcp/BUG-010-INVESTIGATION.md`
- **Test Helpers**: `frontend/tests/e2e/helpers.ts`

---

## Owner / Priority
- **Reported by**: Founder (via Playwright analysis)
- **Assigned to**: Next available frontend/fullstack engineer
- **Priority**: P1 (High impact, core feature broken)

---

## Related Items
- **Testing Infrastructure**: FR-020 (Run Page Regression Harness)
- **Testing Guide**: `.claude-skills/webapp-testing_skill/SKILL.md`
- **Original Report**: Request `f0164999-3a34-4705-bd7c-e426eff61c6f`

---

## Notes
- Current E2E tests only verify page load, not event rendering
- Test package: `com.jetbrains.kotlinconf` (defined in `.env`)
- Manual reproduction required with Appium/device services running
- See investigation guide for detailed diagnostic steps
