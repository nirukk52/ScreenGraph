## BUG-001 — XState Inspector does not render live session

### Summary
After wiring `@statelyai/inspect` into the backend worker, the Stately Inspector UI (`https://stately.ai/inspect`) shows the registry message "Use the @statelyai/inspect package to inspect live XState code" instead of the live machine session. Backend run logs show errors such as `Machine completed without output` when the inspector is opened, preventing visual inspection of the orchestration loop.

### Severity / Impact
- **Severity**: High — Inspector is required to debug agent orchestration per Phase 2 deliverables.
- **Impact**: Developers cannot visualize node transitions, retry/backoff decisions, or snapshot state.

### Environment
- Backend: `encore run` (local dev)
- Inspector URL: `https://stately.ai/inspect`
- Package: `@statelyai/inspect@0.4.0`

### Steps to Reproduce
1. From repo root, run `cd backend && encore run` (ensure `NODE_ENV` not production).
2. Allow the inspector popup or manually open `https://stately.ai/inspect`.
3. Observe browser shows only the static registry message, with no actor session.
4. Backend logs emit:
   - `Machine completed without output`
   - `Cannot read properties of undefined (reading 'status')`

### Expected Result
- Inspector establishes a live session, showing state transitions, guards, and snapshots as described in the Stately docs ([Inspector docs](https://stately.ai/docs/inspector), [Release blog](https://stately.ai/blog/2024-01-15-stately-inspector)).

### Actual Result
- Inspector page remains static with registry prompt.
- Backend throws runtime errors from `AgentWorker.runWithXState`, halting inspection.

### Suspected Root Cause
- Inspector actor integration may require a running local inspector server or different initialization (e.g., websocket inspector) for backend environments.
- Subscription completion handler currently derives output from context; may still emit before inspector attaches / actor completes.

### Attachments / Logs
- Stack traces:
  - `Machine completed without output`
  - `Cannot read properties of undefined (reading 'status')`
- Registry landing page screenshot (not attached).

### Proposed Fix / Next Steps
1. ✅ Replace `createBrowserInspector` with `createWebSocketInspector` for Node.js WebSocket inspector (COMPLETED)
2. ✅ Add logging to show inspector URL when enabled (COMPLETED)
3. Update worker subscription to gracefully handle missing snapshot fields while still streaming inspection events.
4. Add automated smoke test (or manual QA checklist) for inspector connectivity before Phase 2 sign-off.

### Fix Applied
- Changed `createBrowserInspector` to `createWebSocketInspector()` in `backend/agent/orchestrator/worker.ts`
- Added logging to display inspector URL: `https://stately.ai/inspect?server=ws://localhost:5678`
- Inspector now creates a WebSocket server (port 5678) that Chrome can connect to
- Note: `createWebSocketInspector` is the correct export from `@statelyai/inspect@0.4.0` for Node.js environments

### Owner / Requestor
- Reported by: TBD (current session)
- Suggested Owner: Agent orchestration team


