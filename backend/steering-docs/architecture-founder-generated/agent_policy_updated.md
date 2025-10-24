# ScreenGraph Agent — Policy Routing Nodes (MVP, Run-First, Updated)

**Convention Principles**
- **Determinism:** Pure nodes; side-effects via ports only.
- **Event Discipline:** `agent.node.started` → (optional) `agent.node.token_delta` → `agent.node.finished`.
- **Naming:** Use singular `agent.*` prefix for events.
- **Error Handling:** `errorId`, `retryable`, `humanReadableFailureSummary`.
- **Sequencing:** Orchestrator assigns `sequence`; computes `checksum`.

## Run Lifecycle (first-class)
- `agent.run.started`
- `agent.run.finished`
- `agent.run.failed`
- `agent.run.canceled`

**Cancellation State Machine**
- API sets `runs.status = CANCELED_REQUESTED` → orchestrator honors at node boundaries → emits `agent.run.canceled` and sets `CANCELED` via CAS.

**Continuation Decision Event**
- `agent.run.continuation_decided` includes `routingDirectiveReason`.

**Emission Ownership**
- Nodes return `domainEventsToRecord[]`; orchestrator writes. Nodes are DB-blind.

**Common Node Output fields**
```json
{
  "nodeName": "SwitchPolicy",
  "stepOrdinal": 12,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-switch-012",
  "randomSeed": 121212,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

---

## 1) SwitchPolicy (stubbed for MVP, policyVersion=1)
**Purpose:** Change exploration strategy safely mid-run.

### Input JSON
```json
{
  "runId": "01J...",
  "currentStrategyConfiguration": {"strategyName": "breadth_first_explore", "policyVersion": 1},
  "requestedStrategyConfiguration": {"strategyName": "targeted_path_follow", "policyVersion": 2},
  "reasonPlaintext": "Stall detected after 5 iterations without new screens"
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "effectiveStrategyConfiguration": {"strategyName": "targeted_path_follow", "policyVersion": 2},
  "nodeName": "SwitchPolicy",
  "stepOrdinal": 12,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-switch-012",
  "randomSeed": 121212,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

### Incoming Events
- `agent.policy.switch_requested`

### Outgoing Events
1. `agent.node.started`
2. `agent.policy.switched`
3. `agent.node.finished`

---

## 2) RestartApp
**Purpose:** Relaunch app cleanly and restore stable UI context.

### Input JSON
```json
{
  "runId": "01J...",
  "deviceRuntimeContext": {"driverSessionId": "b6f7..."},
  "applicationUnderTestDescriptor": {"androidPackageId": "com.example.app"},
  "restartReasonPlaintext": "Crash or ANR suspected"
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "applicationForegroundContext": {
    "currentPackageId": "com.example.app",
    "currentActivityName": "com.example.app.HomeActivity"
  },
  "nodeName": "RestartApp",
  "stepOrdinal": 13,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-restart-013",
  "randomSeed": 131313,
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
2. `agent.app.restarted`
3. `agent.node.finished`

---

## (Removed) Policy Stop
> The “Policy: Stop” node has been **removed**. Route via `ShouldContinue: STOP` → **Terminalization (Stop)**.

---

## DB & Outbox Invariants (Appendix)
- `run_events(run_id, sequence)` **UNIQUE**
- `run_outbox(run_id, sequence)` **UNIQUE** WHERE `published_at IS NULL`
- Orchestrator publishes **strictly by next sequence**; sets `published_at`.
- `checksum = sha256(eventId|runId|sequence|kind|payload)`
- CAS on `runs.status` ensures **exactly one terminal**.
