# Troubleshooting Guide

## Fast-Fail Signals
- `page.waitForURL` timeout → Backend `startRun` failure; inspect `task backend:logs`.
- Timeline event `agent.app.launch_failed` → Appium/device misconfiguration (fails ~2s with payload hints).
- Playwright screenshot shows Vite overlay → Svelte rune misuse; consult `frontend-debugging_skill`.
- Screenshot gallery empty → Backend projector lag; verify backend integration test.

## Environment Checklist
- Services running: `task founder:servers:start`
- `.env` sourced (`source .env`)
- Appium/device online (`task qa:appium:start`)
- Backend integration test `encore test run/start.integration.test.ts` passes

## Cleanup
```bash
rm -rf /tmp/screengraph-playwright /tmp/run-page-full.png
```
- Avoid polluting the repo with temporary Playwright assets.

## Appium/WebDriver Errors
- Refer to `backend-development_skill/WEBDRIVER_SESSION_ERRORS.md` for common device session issues.
- Restart Appium server or emulator when encountering stale session IDs.

## Reporting
- Attach screenshots, console logs, and reproduction steps to Graphiti episodes or bug tickets.
- Include timeout values, environment info, and any backend anomalies found during investigation.
