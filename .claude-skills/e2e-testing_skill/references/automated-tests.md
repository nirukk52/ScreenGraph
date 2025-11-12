# Automated Playwright Tests

## Quick Start Commands
```bash
# Headed mode (visual debugging with slowMo)
bun run test:e2e:headed

# CI mode (headless)
bun run test:e2e:ci

# Interactive UI mode
bun run test:e2e:ui
```
- Run from the repository root or `frontend/`.
- Tests read configuration from `.env` (`VITE_PACKAGE_NAME`, `VITE_APPIUM_SERVER_URL`, etc.).

## Project Layout
- Specs: `frontend/tests/e2e/`
- Config: `frontend/playwright.config.ts`
- Shared helpers: `frontend/tests/e2e/helpers.ts`
- Custom utilities: `lib/playwright-helpers.ts`

## Timeout Policy (Standardised 2025-11-12)
| Operation | Timeout | Notes |
| --- | --- | --- |
| Entire test | 60s | Set with `test.setTimeout(60000)` for screenshot discovery test |
| Navigation (`page.goto`) | 30s | Wait for `domcontentloaded` |
| Element visibility | 10s | Buttons, headings, UI affordances |
| Agent events (SSE) | 15s | Screenshot capture, graph events |
| Image rendering | 10s | Screenshot gallery assets |

```typescript
test.describe('/run page smoke tests', () => {
  test.setTimeout(60_000);

  test('should discover and display screenshots', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /detect.*drift/i }).click();
    await page.waitForURL(/\/run\/[a-f0-9-]+/i, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page.locator("[data-testid='run-events'] [data-event-kind='agent.event.screenshot_captured']").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("[data-testid='discovered-screens'] img").first()).toBeVisible({ timeout: 10_000 });
  });
});
```

## Pre-Push Integration
The Playwright suite runs automatically via `.husky/pre-push`. Ensure:
- Backend/frontend services are green before pushing.
- Appium/device service is available when the agent flow is required.
- Failures are investigated locally before retrying pushes.

## Environment Checklist
- `task founder:servers:start` or equivalent harness is running
- `.env` values exported (`source .env`)
- Appium/device connected (`task qa:appium:start` if needed)
- Backend integration test `encore test run/start.integration.test.ts` passes (agent must be healthy)
