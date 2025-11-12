# Cursor Browser Tooling

## Core Actions
- `browser_navigate(url)` – Load a page and capture the accessibility snapshot.
- `browser_snapshot()` – Refresh snapshot after UI changes.
- `browser_click({ element, ref })` – Trigger interactions from the latest snapshot.
- `browser_type({ element, ref, text })` – Fill forms or inputs.
- `browser_console_messages()` – Retrieve console logs.
- `browser_network_requests()` – Inspect network traffic, including SSE streams.
- `browser_take_screenshot({ fullPage: true })` – Capture artifact-quality screenshots.

## Sample Flow
```
1. browser_navigate(FRONTEND_URL)
2. browser_click('Detect My First Drift', ref-from-snapshot)
3. browser_snapshot() to await state changes
4. browser_wait_for('agent.event.screenshot_captured') via repeated snapshots
5. browser_take_screenshot({ fullPage: true })
```

## Chrome Window Mode
- Launch a clean Chrome instance and drive it interactively using Cursor commands.
- Useful for responsive layout checks or quick manual verification when Playwright is overkill.

## Tips
- Always source `.env` before invoking the browser tool so URLs resolve correctly.
- Combine with `backend-debugging_skill` when backend logs need inspection.
- Attach screenshots and console outputs to Graphiti episodes or tickets for traceability.
