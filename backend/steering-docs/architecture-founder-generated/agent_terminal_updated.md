# ScreenGraph Agent — Terminal Node (MVP, Run-First, Updated)

**Run Lifecycle**
- `agent.run.started` | `agent.run.finished` | `agent.run.failed` | `agent.run.canceled`
- Orchestrator guarantees **exactly one terminal** via CAS on `runs.status`.

**Common Node Output fields**
```json
{
  "nodeName": "Stop",
  "stepOrdinal": 99,
  "iterationOrdinalNumber": 3,
  "policyVersion": 1,
  "resumeToken": "01ULID-stop-099",
  "randomSeed": 990099,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

---

## Stop (Terminal)
**Purpose:** Terminalization node; emits exactly one terminal run event.

### Input JSON
```json
{
  "runId": "01J...",
  "intendedTerminalDisposition": "SUCCEEDED",
  "terminalizationBasis": "ROUTED_STOP",
  "finalRunMetrics": {
    "totalIterationsExecuted": 17,
    "uniqueScreensDiscoveredCount": 9,
    "uniqueActionsPersistedCount": 14,
    "runDurationInMilliseconds": 58234
  }
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "confirmedTerminalDisposition": "SUCCEEDED",
  "nodeName": "Stop",
  "stepOrdinal": 99,
  "iterationOrdinalNumber": 3,
  "policyVersion": 1,
  "resumeToken": "01ULID-stop-099",
  "randomSeed": 990099,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

### Incoming Events
- (none required)

### Outgoing Events
1. `agent.node.started`
2. `agent.run.finished`
3. `agent.node.finished`

---

## DB & Outbox Invariants (Appendix)
- `run_events(run_id, sequence)` **UNIQUE**
- `run_outbox(run_id, sequence)` **UNIQUE** WHERE `published_at IS NULL`
- Orchestrator publishes **strictly by next sequence**; sets `published_at`.
- `checksum = sha256(eventId|runId|sequence|kind|payload)`
- CAS on `runs.status` to ensure **exactly one terminal**.
