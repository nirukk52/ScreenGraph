# Manual Playwright Workflow

## Set Up Scratch Environment
```bash
mkdir -p /tmp/screengraph-playwright && cd /tmp/screengraph-playwright
bun init -y >/dev/null
bun add -d playwright@^1.48.0 tsx typescript
bunx playwright install chromium
```

## Example Regression Script (`run-page-regression.ts`)
```typescript
import { chromium } from 'playwright';

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';
const RUN_BUTTON_TEXT = 'Detect My First Drift';
const TIMELINE_EVENT = 'agent.event.screenshot_captured';

async function run() {
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await page.goto(FRONTEND_URL, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: RUN_BUTTON_TEXT }).click();
    await page.waitForURL('**/run/**', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    await page.waitForSelector(`[data-event="${TIMELINE_EVENT}"]`, { timeout: 30000 });
    await expectScreenshots(page);
    await page.screenshot({ path: '/tmp/run-page-full.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error('❌ Playwright run failed:', error);
  process.exitCode = 1;
});
```

## Execution
```bash
FRONTEND_URL=${FRONTEND_URL:-http://localhost:5173} bunx tsx run-page-regression.ts
```
- Attach `/tmp/run-page-full.png` to tickets or handoffs.
- Clean up scratch directory when finished: `rm -rf /tmp/screengraph-playwright /tmp/run-page-full.png`.

## Visual Regression Example
```typescript
import { test, expect } from '@playwright/test';

test('run page regression', async ({ page }) => {
  await page.goto(process.env.FRONTEND_URL ?? 'http://localhost:5173', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Detect My First Drift' }).click();
  await page.waitForURL('**/run/**', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await expect(page).toHaveScreenshot('run-page.png', { fullPage: true, timeout: 45000 });
});
```

## Artifact Checklist
- Full-page screenshot (`run-page-full.png`)
- Console output from manual script
- Network trace (optional) for debugging SSE or asset issues
