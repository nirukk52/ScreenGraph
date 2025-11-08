---
name: webapp-testing
description: Playwright-first testing playbook for ScreenGraph. Automate the run page, capture screenshots, verify graph events, and fall back to Cursor browser tools when you need quick manual checks.
---

# ScreenGraph Web App Testing (Playwright + Cursor Tools)

This skill consolidates the former `cursor-browser-mastery`, `cursor-chrome-window-mastery`, and legacy webapp testing guidance into a **Playwright-first** workflow. Use Playwright (via MCP or local scripts) for reliable automation, and keep Cursor’s built-in browser tools handy for fast inspection or ad-hoc verification.

---

## 1. Standard Setup (Do This First)
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

## 5. References
- Playwright Docs: https://playwright.dev/docs/intro  
- Encore/Svelte debugging: see `backend_coding_rules.mdc` and `frontend_engineer.mdc`  
- Automation commands: `.cursor/commands/start-services`, `.cursor/commands/run-default-test`, `task founder:rules:check`

Use this playbook whenever you need reproducible UI testing. Playwright gives you deterministic coverage; Cursor’s tools remain on standby for exploratory analysis.