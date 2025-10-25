# ScreenGraph Agent — Node Specifications (MVP, Run-First, Updated)

**Convention Principles**
- **Determinism:** All nodes are pure and side-effect free; I/O via ports only.
- **Event Discipline:** Every node emits `agent.node.started` → (optional) `agent.node.token_delta` → `agent.node.finished` in-order.
- **Naming:** Domain-centric, explicit, long-form where clarity helps (e.g., `actionExecutionOutcomeStatus`). Use singular prefix `agent.*` for all events.
- **Error Handling:** Use `errorId`, `retryable`, and `humanReadableFailureSummary`.
- **IDs:** ULID strings for all identifiers.
- **Time:** ISO-8601 UTC strings.
- **Multi-Tenancy:** All payloads carry `tenantId` and `projectId` (optional) when persisted/published.
- **Sequencing:** `sequence` is monotonic per `runId` and assigned by the orchestrator/outbox.

## Run Lifecycle (first-class)
Emitted by the **orchestrator**. Exactly one terminal event is guaranteed via CAS on `runs.status`.

- `agent.run.started`
- `agent.run.finished`
- `agent.run.failed`
- `agent.run.canceled`

**Continuation Decision**
- `agent.run.continuation_decided` now includes `routingDirectiveReason` in payload.

**Cancellation State Machine**
- API sets `runs.status = CANCELED_REQUESTED`.
- Orchestrator honors at node boundaries → emits `agent.run.canceled` and sets `runs.status = CANCELED` via CAS.

**Canonical Event Envelope (all events)**
```json
{
  "eventId": "01JBD0QJ8K9M2N3P4Q5R6S7T8U",
  "runId": "01JBD0QJ8K9M2N3P4Q5R6S7T8U",
  "tenantId": "01HZX0TENANT1234567890",
  "projectId": "01HZX0PROJECT12345678",
  "sequence": 42,
  "ts": "2025-10-23T12:00:00Z",
  "kind": "agent.node.finished",
  "version": "1",
  "payload": { "domainSpecific": true },
  "checksum": "sha256(eventId|runId|sequence|kind|payload)"
}
```

**Emission Ownership (Who Emits)**
- Nodes return `domainEventsToRecord[]`; **orchestrator** writes and publishes. Nodes are DB-blind.

**Standard Control Events (incoming to any node)**
- `agent.run.cancellation_requested`
- `agent.run.pause_requested`
- `agent.run.resume_requested`
- `agent.policy.switch_requested`

**Standard Node Lifecycle Events (emitted by all nodes)**
- `agent.node.started`
- `agent.node.token_delta` (optional)
- `agent.node.finished`

**Common Node Output fields (append to every node Output)**
```json
{
  "nodeName": "Perceive",
  "stepOrdinal": 4,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-perceive-004",
  "randomSeed": 424242,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

**State Snapshots**
After each node, persist small `agent_state_snapshot` (JSONB pointer) with `stepOrdinal` to enable replay & inspect-step-N UI.

---

# Category: Main Loop Nodes

## 1) Perceive
**Purpose:** Capture screenshot and UI hierarchy; produce normalized perception.

### Input JSON
```json
{
  "runId": "01J...",
  "iterationOrdinalNumber": 1,
  "captureDirectives": {
    "includeScreenshotPng": true,
    "includeUiHierarchyXml": true
  },
  "previousScreenPerceptualHash64": "fd12..."
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "perceptionArtifacts": {
    "screenshotObjectStorageReference": "obj://shots/01J.../0001.png",
    "uiHierarchyXmlObjectStorageReference": "obj://xml/01J.../0001.xml",
    "screenPerceptualHash64": "a9c3f0d4e1b2c3d4",
    "normalizedViewportSize": {"width": 1080, "height": 2400}
  },
  "nodeName": "Perceive",
  "stepOrdinal": 4,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-perceive-004",
  "randomSeed": 424242,
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
2. `agent.event.screenshot_captured`
3. `agent.event.ui_hierarchy_captured`
4. `agent.event.screen_perceived`
5. `agent.node.finished`

---

## 2) EnumerateActions
**Purpose:** Derive actionable operations from perception.

### Input JSON
```json
{
  "runId": "01J...",
  "perceptionArtifacts": {
    "uiHierarchyXmlObjectStorageReference": "obj://xml/01J.../0001.xml"
  },
  "enumerationHeuristics": {
    "maxActionsPerScreen": 20,
    "includeBackNavigationAction": true
  }
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "availableActionCandidates": [
    {
      "actionCandidateId": "01ACT...01",
      "actionKind": "TAP",
      "hitTargetBounds": {"x": 120, "y": 640, "width": 300, "height": 96},
      "elementStableIdentitySignature": "sig:btn-login:hash...",
      "confidenceScore": 0.92
    }
  ],
  "nodeName": "EnumerateActions",
  "stepOrdinal": 5,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-enum-005",
  "randomSeed": 515151,
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
2. `agent.event.actions_enumerated`
3. `agent.node.finished`

---

## 3) ChooseAction
**Purpose:** Select the next action to execute (heuristic for MVP).

### Input JSON
```json
{
  "runId": "01J...",
  "availableActionCandidates": [{"actionCandidateId": "01ACT...01","actionKind":"TAP"}],
  "selectionStrategyConfiguration": {
    "strategyName": "breadth_first_explore",
    "avoidPreviouslyVisitedSignatures": true
  }
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "chosenActionDecision": {
    "selectedActionCandidateId": "01ACT...01",
    "selectionRationalePlaintext": "Prefer primary CTA on first encounter",
    "fallbackUsed": false
  },
  "nodeName": "ChooseAction",
  "stepOrdinal": 6,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-choose-006",
  "randomSeed": 616161,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

### Incoming Events
- `agent.run.cancellation_requested`
- `agent.policy.switch_requested`

### Outgoing Events
1. `agent.node.started`
2. `agent.node.token_delta` (optional)
3. `agent.event.action_selected`
4. `agent.node.finished`

---

## 4) Act
**Purpose:** Execute the selected UI action via DriverPort.

### Input JSON
```json
{
  "runId": "01J...",
  "chosenActionDecision": { "selectedActionCandidateId": "01ACT...01" },
  "deviceRuntimeContext": { "driverSessionId": "b6f7..." },
  "executionTimeoutInMilliseconds": 5000
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "actionExecutionOutcomeStatus": "COMPLETED",
  "postActionStabilityWaitMillis": 350,
  "nodeName": "Act",
  "stepOrdinal": 7,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-act-007",
  "randomSeed": 717171,
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
2. `agent.event.action_performed`
3. `agent.node.finished`

---

## 5) Verify
**Purpose:** Confirm that the action produced meaningful UI change.

### Input JSON
```json
{
  "runId": "01J...",
  "preActionScreenPerceptualHash64": "a9c3f0...",
  "postActionPerceptionDirective": {"recaptureIfNeeded": true, "maxWaitMillis": 2000}
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "verificationAssessment": {
    "visualChangeDetected": true,
    "postActionScreenPerceptualHash64": "bb44aa...",
    "perceptualHammingDistance": 18
  },
  "nodeName": "Verify",
  "stepOrdinal": 8,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-verify-008",
  "randomSeed": 818181,
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
2. `agent.event.action_verification_completed`
3. `agent.node.finished`

---

## 6) Persist
**Purpose:** Persist screens/actions and artifacts (hash-deduped).

### Input JSON
```json
{
  "runId": "01J...",
  "perceptionArtifacts": {
    "screenshotObjectStorageReference": "obj://shots/01J.../0002.png",
    "uiHierarchyXmlObjectStorageReference": "obj://xml/01J.../0002.xml",
    "screenPerceptualHash64": "bb44aa..."
  },
  "chosenActionDecision": {"selectedActionCandidateId": "01ACT...01"},
  "verificationAssessment": {"visualChangeDetected": true}
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "graphPersistenceOutcome": {
    "screenRecordIdentity": "01SCR...",
    "actionRecordIdentity": "01ACTREC...",
    "persistenceOperationKind": "UPSERTED_SCREEN_AND_ACTION"
  },
  "nodeName": "Persist",
  "stepOrdinal": 9,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-persist-009",
  "randomSeed": 919191,
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
2. `graph.screen.discovered`
3. `graph.action.created`
4. `graph.updated`
5. `agent.node.finished`

---

## 7) DetectProgress
**Purpose:** Decide whether exploration is making forward progress.

### Input JSON
```json
{
  "runId": "01J...",
  "recentScreenPerceptualHashes64": ["a9c3f0...", "bb44aa..."],
  "recentGraphPersistenceOutcomes": ["UPSERTED_SCREEN_AND_ACTION"]
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "progressEvaluation": {
    "progressState": "FORWARD_PROGRESS",
    "basis": "new_screen_inserted"
  },
  "nodeName": "DetectProgress",
  "stepOrdinal": 10,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-progress-010",
  "randomSeed": 101010,
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
2. `agent.run.progress_evaluated`
3. `agent.node.finished`

---

## 8) ShouldContinue
**Purpose:** Route to next step: Continue, Switch Policy, Restart App, or Stop.

### Input JSON
```json
{
  "runId": "01J...",
  "progressEvaluation": {"progressState": "FORWARD_PROGRESS"},
  "strategyConfiguration": {
    "maxIterations": 300,
    "maxScreensToDiscover": 200,
    "allowPolicySwitching": true
  }
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "continuationDecision": {
    "routingDirective": "CONTINUE",
    "routingDirectiveReason": "forward_progress_detected"
  },
  "nodeName": "ShouldContinue",
  "stepOrdinal": 11,
  "iterationOrdinalNumber": 1,
  "policyVersion": 1,
  "resumeToken": "01ULID-continue-011",
  "randomSeed": 111000,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

### Incoming Events
- `agent.run.cancellation_requested`
- `agent.policy.switch_requested`

### Outgoing Events
1. `agent.node.started`
2. `agent.run.continuation_decided`
3. `agent.node.finished`

---

## DB & Outbox Invariants (Appendix)
- `run_events(run_id, sequence)` **UNIQUE**
- `run_outbox(run_id, sequence)` **UNIQUE** WHERE `published_at IS NULL`
- Orchestrator publishes **strictly by next sequence**; sets `published_at`.
- `checksum = sha256(eventId|runId|sequence|kind|payload)`
- CAS on `runs.status` to ensure **exactly one terminal**.
