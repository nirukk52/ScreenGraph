# ScreenGraph Agent — Recovery Nodes (MVP, Run-First, Updated)

**Run Lifecycle**
- `agent.run.started` | `agent.run.finished` | `agent.run.failed` | `agent.run.canceled`
- Cancellation state machine: API sets `CANCELED_REQUESTED`; orchestrator honors at boundaries.

**Common Node Output fields**
```json
{
  "nodeName": "RecoverFromError",
  "stepOrdinal": 20,
  "iterationOrdinalNumber": 2,
  "policyVersion": 1,
  "resumeToken": "01ULID-recover-020",
  "randomSeed": 202020,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

---

## 1) RecoverFromError
**Purpose:** Handle transient device/UI failures and resume loop.

### Input JSON
```json
{
  "runId": "01J...",
  "lastFailedNodeName": "Act",
  "lastFailureContext": {"errorId": "DRIVER_TIMEOUT", "humanReadableFailureSummary": "Tap timeout"},
  "retryPolicy": {"maxRetries": 2, "backoffMillis": 500}
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "recoveryDisposition": "RETRY_NEXT_NODE",
  "nodeName": "RecoverFromError",
  "stepOrdinal": 20,
  "iterationOrdinalNumber": 2,
  "policyVersion": 1,
  "resumeToken": "01ULID-recover-020",
  "randomSeed": 202020,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

### Incoming Events
- `agent.run.cancellation_requested`

### Outgoing Events
1. `agent.node.started`
2. `agent.run.recovery_applied`
3. `agent.node.finished`

---

## 2) ResumeFromCheckpoint (spec retained, implement later)
**Purpose:** Reload last persisted AgentState snapshot to continue without redoing expensive steps.

### Input JSON
```json
{
  "runId": "01J...",
  "requestedCheckpointKind": "LAST_SUCCESSFUL_NODE",
  "allowPartialState": false
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "restoredAgentStateReference": "obj://checkpoints/01J.../iter-0003.json",
  "nodeName": "ResumeFromCheckpoint",
  "stepOrdinal": 21,
  "iterationOrdinalNumber": 2,
  "policyVersion": 1,
  "resumeToken": "01ULID-resume-021",
  "randomSeed": 212121,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

### Incoming Events
- `agent.run.cancellation_requested`

### Outgoing Events
1. `agent.node.started`
2. `agent.run.checkpoint_restored`
3. `agent.node.finished`

---

## Error Taxonomy (for recovery decisions)
| errorId | retryable | Description |
|----------|----------|-------------|
| DRIVER_TIMEOUT | true | Timeout in driver operation |
| UI_STALLED | false | No UI change detected |
| ARTIFACT_WRITE_FAILED | false | Failed to persist artifact |
| POLICY_VIOLATION | false | Policy rules breached |

---

## DB & Outbox Invariants (Appendix)
- `run_events(run_id, sequence)` **UNIQUE**
- `run_outbox(run_id, sequence)` **UNIQUE** WHERE `published_at IS NULL`
- Orchestrator publishes **strictly by next sequence**; sets `published_at`.
- `checksum = sha256(eventId|runId|sequence|kind|payload)`
- CAS on `runs.status` to ensure **exactly one terminal**.
