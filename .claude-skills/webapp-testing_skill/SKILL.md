---
name: webapp-testing
description: Playwright E2E testing for ScreenGraph. Tests use .env configuration (package name is the main key). Automated tests run in pre-push hook. Use Cursor browser tools for quick manual inspection.
---

# ScreenGraph Web App Testing (Playwright + Cursor Tools)

**Updated 2025-11-08**: FR-020 implemented unified Playwright test suite integrated into pre-push hook. All tests use `.env` file as single source of truth.

---

## 1. Automated E2E Tests (Primary Method)

### Quick Start
```bash
# Headed mode (visual debugging with slowMo)
bun run test:e2e:headed

# CI mode (headless, fast)
bun run test:e2e:ci

# Interactive UI mode
bun run test:e2e:ui

# Run from root or frontend directory
```

### Test Configuration
- **Package Name**: Read from `VITE_PACKAGE_NAME` in `.env` (currently: `com.jetbrains.kotlinconf`)
- **Location**: `frontend/tests/e2e/`
- **Config**: `frontend/playwright.config.ts` (environment-aware)
- **Helpers**: `frontend/tests/e2e/helpers.ts` (reusable utilities)
- **Default Timeout**: 30 seconds (Playwright default, no override)

### Timeout Policy (Standardized 2025-11-09)
All Playwright tests must complete within **30 seconds total**. Individual waits must fit within this budget:

| Operation | Timeout | Notes |
|-----------|---------|-------|
| Test Total | 30s | Playwright default, no `test.setTimeout()` override |
| Page Navigation | 30s | Initial page load via `page.goto()` |
| Element Visibility | 10s | Headings, buttons, basic UI elements |
| Agent Events | 15s | Screenshot capture, graph events (SSE) |
| Image Rendering | 10s | Screenshots in gallery, artifacts |

**Example Breakdown:**
```typescript
test("example", async ({ page }) => {
  // No test.setTimeout() - use 30s default
  await page.goto("/");                              // ~2s
  await page.getByRole("button").click();            // ~1s
  await page.waitForURL(/\/run\/.+/);                // ~3s
  await expect(heading).toBeVisible({ timeout: 10000 }); // max 10s
  await page.waitForSelector('[data-event="..."]', { timeout: 15000 }); // max 15s
  // Total: ~31s max (fits in 30s with fast agent)
});
```

### Current Tests
1. **Landing Page Load** - Verifies frontend health (no agent required)
2. **Run Page Navigation** - Clicks "Detect My First Drift" → verifies Run Timeline heading (no agent required)
3. **Screenshot Discovery** - Full integration test: start run → wait for screenshots → verify images visible (requires agent + Appium)

### Pre-Push Hook Integration
E2E tests run automatically before every push:
```bash
git push  # Runs smoke tests + E2E tests automatically
```

---

## 2. Manual Playwright Testing (For New Tests)

When creating new regression tests, place them in `frontend/tests/e2e/`:

```typescript
import { test, expect } from "@playwright/test";
import { TEST_PACKAGE_NAME, TEST_APP_CONFIG } from "./helpers";

test("my new test", async ({ page }) => {
  await page.goto("/");
  
  // Your test logic here
  // All config comes from .env via helpers
  console.log(`Testing package: ${TEST_PACKAGE_NAME}`);
});
```

**Key Principles:**
- Use `.env` for all configuration (package name, Appium URL, APK path)
- Use `helpers.ts` utilities for common operations
- Write environment-aware tests (work in both headed and headless modes)

---

## 3. Cursor Browser Tools (Quick Inspection)
1. **Start services**  
   ```bash
   .cursor/commands/start-services
   ```
2. **Load environment + ports**  
   ```bash
   cd /Users/priyankalalge/ScreenGraph/Code/ScreenGraph
   source .env 2>/dev/null || true
   export BACKEND_URL=${VITE_BACKEND_BASE_URL:-http://localhost:4000}
   export FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173}
   ```
3. **Health check (optional)**  
   ```bash
   curl -sf "${BACKEND_URL}/health" > /dev/null && echo "✅ Backend up"
   curl -sf "${FRONTEND_URL}" > /dev/null && echo "✅ Frontend up"
   ```
4. Keep a clean workspace: run Playwright scripts from `/tmp` or a disposable directory—never add dependencies to the repo.

---

## 2. Playwright Workflow (Recommended)
_Prerequisites_: Start the `@webapp-testing` flow from the landing page; no pre-existing run ID is required. A device/Appium session should be running so the agent captures screenshots (verify via `qa:appium:start` if unsure).
1. **Create a scratch directory**  
   ```bash
   mkdir -p /tmp/screengraph-playwright && cd /tmp/screengraph-playwright
   bun init -y >/dev/null
   bun add -d playwright@^1.48.0 tsx typescript
   bunx playwright install chromium
   ```
2. **Write a regression script** (`/tmp/screengraph-playwright/run-page-regression.ts`)
   ```typescript
import { chromium } from "playwright";

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
   const RUN_BUTTON_TEXT = "Detect My First Drift";
   const TIMELINE_EVENT = "agent.event.screenshot_captured";

   async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    console.log("▶️ Launching ScreenGraph landing page…");
    await page.goto(FRONTEND_URL, { waitUntil: "networkidle" });

    console.log("▶️ Starting run flow…");
    await page.getByRole("button", { name: RUN_BUTTON_TEXT }).click();
    await page.waitForURL("**/run/**", { waitUntil: "networkidle" });

    console.log("⏱ Verifying timeline events…");
    await page.waitForTimeout(5000); // allow the agent to emit first events
    await page.waitForSelector(`[data-event="${TIMELINE_EVENT}"]`, { timeout: 30000 });

    console.log("🖼 Capturing screenshot gallery…");
    const screenGallery = page.locator("[data-testid=\"discovered-screens\"] img");
    const screenshotCount = await screenGallery.count();
    if (screenshotCount === 0) {
      throw new Error("No screenshots discovered after 45 seconds.");
    }
    await page.screenshot({ path: "/tmp/run-page-full.png", fullPage: true });
    console.log("📸 Saved /tmp/run-page-full.png");

    console.log("✅ ✓ Graph stream rendered");
  } catch (error) {
    console.error("❌ Run page regression script failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
   }

   run().catch(async (error) => {
     console.error("❌ Playwright run failed:", error);
     process.exitCode = 1;
   });
   ```
3. **Execute with Bun or Playwright MCP**
   ```bash
   cd /tmp/screengraph-playwright
   FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173} bunx tsx run-page-regression.ts
   ```
   If you prefer the Playwright MCP server, load this script in your conversation context and run it with the MCP execution command—the browsers are already installed.
4. **Artifacts**  
   - `/tmp/run-page-full.png` → attach to features, retros, or handoffs.  
   - Console output shows timeline evidence (graph events, screenshot capture, stop node).

### Optional Visual Regression Check
Maintain baselines with Playwright Test:
```typescript
// run-page-visual.spec.ts
import { test, expect } from "@playwright/test";

test("run page regression", async ({ page }) => {
  await page.goto(process.env.FRONTEND_URL ?? "http://localhost:5173", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Detect My First Drift" }).click();
  await page.waitForURL("**/run/**", { waitUntil: "networkidle" });
  await page.waitForTimeout(5000);
  await expect(page).toHaveScreenshot("run-page.png", { fullPage: true, timeout: 45000 });
});
```
Run with:
```bash
FRONTEND_URL=http://localhost:5173 npx playwright test run-page-visual.spec.ts --project=chromium
```
Regenerate baselines via `--update-snapshots` once the fix is confirmed.

### Helper Snippets (optional)
```typescript
// Wait for a specific graph event in the timeline table
async function waitForGraphEvent(page, eventName, timeout = 45000) {
  await page.waitForSelector(`[data-event="${eventName}"]`, { timeout });
}

// Verify run stop node
async function expectStopNode(page) {
  await page.waitForSelector('[data-run-state="stopped"]', { timeout: 45000 });
}
```

Reusable helpers live in `./lib/playwright-helpers.ts` (launch settings, safe click/type, console logging). Copy the functions you need into your script or import them when running from Node/Bun.

---

## 3. Cursor Browser Tools (Optional)

### @Browser Tool Quick Reference
- `browser_navigate(url)` → load a page and capture accessibility tree  
- `browser_snapshot()` → refresh tree after UI changes  
- `browser_click({ element, ref })`, `browser_type`, `browser_select_option` → scripted interactions  
- `browser_console_messages()`, `browser_network_requests()` → capture console and network transcripts  
- `browser_take_screenshot({ fullPage: true })` → manual evidence

**Sample Flow**
```text
1. browser_navigate(FRONTEND_URL)
2. browser_click("Detect My First Drift", ref-from-snapshot)
3. browser_wait_for("agent.event.screenshot_captured") // poll via snapshot
4. browser_take_screenshot(fullPage=true)
```

### Chrome Window Mode (Playwright-controlled)
- Launch a clean Chrome instance with `browser_navigate` + `browser_press_key("Meta+L")` style automation.
- Ideal for visually validating responsive layouts or capturing artifact-quality screenshots.
- Still obey `.env` ports—source the environment then navigate to `FRONTEND_URL`.

---

## 4. Troubleshooting Checklist
- **Graph events missing** → verify backend logs (`task backend:logs`) and ensure the Playwright script waited for SSE events.  
- **Screenshots absent** → confirm Appium/device service is running (check `qa:appium:start`).  
- **Stop node not emitted** → ensure run completes; inspect browser console for uncaught errors.  
- **/run regressions** → re-run the script, capture `/tmp/run-page-full.png`, and attach to the feature ticket or handoff.
- **Services offline** → rerun `.cursor/commands/start-services` and re-run the `curl` checks above.
- **Playwright artifacts** → clean up `/tmp/screengraph-playwright` when finished:
  ```bash
  rm -rf /tmp/screengraph-playwright /tmp/run-page-full.png
  ```

---

## 5. Regression Debugging Playbook (BUG-010 Case Study)

### Systematic RCA for UI Regressions

**Real Example:** Three regressions on `/run` page (Nov 2025)
- Graph events missing
- Screenshots not visible  
- Stop node not executing

**Investigation Flow:**

1. **Visual Comparison**  
   ```bash
   # Capture current state
   browser_take_screenshot({ fullPage: true, filename: "current-state.png" })
   
   # Compare with baseline
   # .playwright-mcp/drift-detection-with-screenshot.png (working)
   # vs current broken state
   ```

2. **Browser MCP Diagnostics**  
   ```text
   browser_navigate("http://localhost:5173")
   browser_click("Detect My First Drift")
   browser_snapshot()  # Check UI tree for missing elements
   browser_console_messages()  # Catch JS errors
   browser_network_requests()  # Verify SSE streams
   ```

3. **Timeline Forensics**  
   ```bash
   # Find last successful run
   bunx tsx backend/scripts/find-completed-runs.ts
   
   # Compare with failed run
   bunx tsx backend/scripts/inspect-run.ts <run_id>
   
   # Look for missing events (e.g., Stop node at step 6)
   ```

4. **Git Bisect**  
   ```bash
   # Identify regression window
   git log --oneline --since="<last_success_time>" --until="<first_failure_time>"
   
   # Examine suspect commits
   git show <commit_hash> --stat
   git show <commit_hash> <specific_file>
   ```

5. **Backend State Inspection**  
   ```bash
   # Check agent state
   bunx tsx backend/scripts/check-agent-state.ts <run_id>
   
   # Verify graph projector cursor
   bunx tsx backend/scripts/check-cursor-ordering.ts
   
   # Test projector functions in isolation
   bunx tsx backend/scripts/test-projector.ts <run_id>
   ```

6. **Root Cause Validation**  
   - Remove suspect code changes
   - Restart services
   - Run fresh test
   - Compare events sequence with baseline

### Key Diagnostic Scripts Created
- `backend/scripts/inspect-run.ts` - Full run event timeline
- `backend/scripts/check-agent-state.ts` - Agent state snapshots
- `backend/scripts/check-cursor-ordering.ts` - Projector cursor health
- `backend/scripts/find-completed-runs.ts` - Identify successful runs for comparison
- `backend/scripts/test-projector.ts` - Isolated projector function testing

### Common Regression Patterns
| Symptom | Check | Common Cause |
|---------|-------|--------------|
| Graph events missing | Cursor limit, projector logs | `CURSOR_LIMIT` too low, cursor stuck |
| Screenshots not rendering | dataUrl in stream, CORS | Missing field in projection output |
| Stop node not executing | Agent state, XState logs | Node execution error, budget exhaustion |
| Run fails prematurely | Worker logs, lease timeout | Database query hangs, lease expired |

### Evidence Collection Checklist
- [ ] Screenshot comparison (baseline vs current)
- [ ] Browser console logs
- [ ] Network tab (SSE streams)
- [ ] Backend logs (Encore dashboard)
- [ ] Database state (run_events, outcomes, cursors)
- [ ] Git diff of regression window
- [ ] Agent state snapshots

**See:** `jira/bugs/BUG-010-run-page-regressions/RCA.md` for complete case study

---

## 6. References
- Playwright Docs: https://playwright.dev/docs/intro  
- Encore/Svelte debugging: see `backend_coding_rules.mdc` and `frontend_engineer.mdc`  
- Automation commands: `.cursor/commands/start-services`, `.cursor/commands/run-default-test`, `task founder:rules:check`
- BUG-010 RCA: `jira/bugs/BUG-010-run-page-regressions/RCA.md`

Use this playbook whenever you need reproducible UI testing. Playwright gives you deterministic coverage; Cursor's tools remain on standby for exploratory analysis.