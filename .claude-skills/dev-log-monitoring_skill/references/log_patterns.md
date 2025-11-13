# ScreenGraph Log Patterns Reference

## Backend Log Patterns (Encore.ts)

### Agent State Machine Flow

**Node Transitions:**
```
INF Node started   actor=orchestrator nodeName=[EnsureDevice|ProvisionApp|LaunchOrAttach|Perceive|WaitIdle|Stop]
INF Node finished  actor=orchestrator nodeName=[...] outcomeStatus=[SUCCESS|FAILURE]
```

**Event Recording:**
```
INF Event recorded: [event_kind] actor=orchestrator eventSeq=[N] module=agent runId=[runId]
```

Common event kinds:
- `agent.run.started` - Run initialization
- `agent.node.started` - Node execution begins
- `agent.node.finished` - Node execution completes
- `agent.device.check_started` / `agent.device.check_completed`
- `agent.appium.health_check_started` / `agent.appium.health_check_completed`
- `agent.app.install_checked`
- `agent.event.screenshot_captured`
- `agent.event.ui_hierarchy_captured`
- `agent.event.screen_perceived`
- `agent.run.finished` - Run completion

**Snapshot Updates:**
```
INF Snapshot saved actor=orchestrator module=agent runId=[runId] snapshot={...} stepOrdinal=[N]
```

### Graph Projection

```
INF Projection batch processed actor=projector durationMs=[N] eventsProcessed=[N] module=graph projectedScreens=[N] runId=[runId]
```

### Stream Backfill

```
INF Backfill complete actor=stream endpoint=stream graphOutcomesCount=[N] module=run runEventsCount=[N] runId=[runId] totalMessages=[N]
DBG Sending backfill event actor=stream endpoint=stream isGraphEvent=[true|false] kind=[event_kind] module=run runId=[runId] seq=[N]
```

### Graph Stream

```
INF Graph stream client connected actor=api endpoint=streamGraphForRun fromSeq=[N] module=graph replay=true runId=[runId]
INF Starting backfill actor=api endpoint=streamGraphForRun fromSeq=[N] module=graph runId=[runId]
INF Backfill fetched actor=api count=[N] endpoint=streamGraphForRun module=graph runId=[runId]
DBG Sending backfill event actor=api endpoint=streamGraphForRun module=graph runId=[runId] screenId=[hash] seqRef=[N] type=graph.screen.discovered
INF Backfill complete actor=api endpoint=streamGraphForRun lastSentSeq=[N] module=graph runId=[runId]
INF Run ended, closing stream after backfill actor=api endpoint=streamGraphForRun module=graph runId=[runId]
```

## Frontend Log Patterns (SvelteKit + Vite)

### Vite Dev Server

```
VITE v6.4.1  ready in [N] ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Vite Connection

```
[DEBUG] [vite] connecting...
[DEBUG] [vite] connected.
[LOG] [vite] server connection lost. Polling for restart...
```

### Graph Stream (Frontend)

```
[LOG] [Graph Stream] Creating stream for runId: [runId]
[LOG] [Graph Stream] Stream created, socket state: 0
[LOG] [Graph Stream] Starting to read from stream...
[LOG] [Graph Stream] WebSocket opened
[LOG] [Graph Stream] Received event from stream: {type: graph.screen.discovered, data: Object}
[LOG] [Graph Stream] Stream ended (no more events)
[LOG] [Graph Stream] WebSocket closed {code: 1005, reason: , wasClean: true}
```

### Error Patterns

```
[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED
[ERROR] Failed to start run: TypeError: Failed to fetch
[ERROR] WebSocket connection to 'ws://localhost:5173/' failed: Error during WebSocket handshake
```

## Key Metrics to Watch

### Agent State Snapshot

Look for `snapshot` field in logs:
```json
{
  "budgets": {
    "maxSteps": 10,
    "maxTimeMs": 600000,
    "maxTaps": 1000,
    "restartLimit": 3
  },
  "counters": {
    "errors": 0,
    "noProgressCycles": 0,
    "screensNew": 0,
    "stepsTotal": 6
  },
  "status": "running|completed|failed",
  "stopReason": "success|error|timeout|...",
  "stepOrdinal": 6
}
```

### Run Duration

```
Stop OUTPUT ... metrics={"runDurationInMilliseconds":5326,"totalIterationsExecuted":5,"uniqueActionsPersistedCount":0,"uniqueScreensDiscoveredCount":0}
```

### Stream Health

- Check for `WebSocket opened` and `WebSocket closed` messages
- Verify `Backfill complete` shows expected event counts
- Look for `status: 101` in network logs (successful WebSocket upgrade)

## Troubleshooting Patterns

### Backend Not Responding

```bash
# Symptom:
[ERROR] Failed to load resource: net::ERR_CONNECTION_REFUSED @ http://localhost:4000/

# Check:
curl -s http://localhost:4000/health

# Solution:
cd backend && encore run
```

### Frontend Dev Server Crashed

```bash
# Symptom:
[ERROR] WebSocket connection to 'ws://localhost:5173/' failed
[LOG] [vite] server connection lost. Polling for restart...

# Solution:
cd frontend && bun run dev
```

### No Events in Stream

```bash
# Check backend logs for:
INF Backfill complete ... runEventsCount=0

# This means no events were recorded - check if run actually started
```

### Graph Projection Issues

```bash
# Look for:
INF Projection batch processed ... projectedScreens=0

# If always 0, check graph service is loaded and endpoints are registered
```

