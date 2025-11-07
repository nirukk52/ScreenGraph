---
name: Test Default Run
description: Worktree-agnostic drift test. Auto-detect frontend/backend URLs, click Detect Drift, verify screenshot.
---

# Test Default Run (Worktree-Agnostic)

## Goal
Run the simplest end-to-end drift test in local setup: open the frontend, press "Detect My First Drift", wait, verify a screenshot appears.

## Port & URL Setup (Do this first)
1) Load `.env` (single environment):
   - `source .env 2>/dev/null || true`
   - `BACKEND_URL=${VITE_BACKEND_BASE_URL:-http://localhost:${BACKEND_PORT:-4000}}`
   - `FRONTEND_URL=http://localhost:${FRONTEND_PORT:-5173}`

2) Verify reachability (best-effort; proceed even if checks fail):
- Try `curl -sf $FRONTEND_URL > /dev/null`
- Try `curl -sf $BACKEND_URL/health > /dev/null`

## Automated Browser Steps
- Navigate to FRONTEND_URL
- Snapshot to get refs
- Click button "Detect My First Drift"
- Wait 30s for agent flow (EnsureDevice → ProvisionApp → Perceive)
- Snapshot again
- Verify:
  - Heading: "Discovered Screens (≥1)"
  - An `img` under Discovered Screens exists
  - Run events include `agent.event.screenshot_captured` and `graph.screen.discovered`
- Take a full-page screenshot to `.playwright-mcp/test-default-run-[timestamp].png`

## Success Criteria (all true)
- Run page URL is `/run/<id>`
- WebSocket connected (logs show "WebSocket opened")
- Screenshot captured and displayed in UI
- Run completes successfully

## Troubleshooting (quick)
- If no screenshot: ensure Appium/device is running
- If WebSocket fails: ensure backend is reachable at BACKEND_URL
- If artifacts 404: restart backend and retry

## Execute Now
Use the browser MCP tools to perform the steps above automatically using detected FRONTEND_URL and BACKEND_URL.


