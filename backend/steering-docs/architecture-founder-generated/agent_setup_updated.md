# ScreenGraph Agent — Node Specifications (MVP, Run-First, Updated)

**Convention Principles**
- **Determinism:** All nodes are pure and side-effect free; I/O via ports only.
- **Event Discipline:** Every node emits `agent.node.started` → (optional) `agent.node.token_delta` → `agent.node.finished` in-order.
- **Naming:** Domain-centric, explicit, long-form where clarity helps (e.g., `actionExecutionOutcomeStatus`). Use singular prefix `agent.*` for all events.
- **Error Handling:** Use `errorId` and `humanReadableFailureSummary` in outputs and events, plus `retryable` where applicable.
- **IDs:** ULID strings for all identifiers.
- **Time:** ISO-8601 UTC strings.
- **Multi-Tenancy:** All payloads carry `tenantId` and `projectId` (optional) when persisted/published.
- **Sequencing:** `sequence` is monotonic per `runId` and assigned by the orchestrator/outbox.

## Run Lifecycle (first-class)
Emitted by the **orchestrator** (single writer). Exactly one terminal event is guaranteed via CAS on `runs.status`.

- `agent.run.started`
- `agent.run.finished`
- `agent.run.failed`
- `agent.run.canceled`

**Cancellation State Machine**
- API sets `runs.status = CANCELED_REQUESTED`.
- Orchestrator checks before each node; on honor: emits `agent.run.canceled` and sets `runs.status = CANCELED` via CAS. No partial terminals.

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
- **Nodes** return `domainEventsToRecord[]` and a structured **Output** object.
- **Orchestrator** assigns `sequence`, computes `checksum`, persists `run_events` and `run_outbox`, and publishes. Nodes are **DB-blind**.

**Standard Control Events (incoming to any node)**
- `agent.run.cancellation_requested`
- `agent.run.pause_requested`
- `agent.run.resume_requested`
- `agent.policy.switch_requested`

**Standard Node Lifecycle Events (emitted by all nodes)**
- `agent.node.started`
- `agent.node.token_delta` (optional, streaming logs/reasons)
- `agent.node.finished`

**Common Node Output fields (append to every node Output)**
```json
{
  "nodeName": "EnsureDevice",
  "stepOrdinal": 0,
  "iterationOrdinalNumber": 0,
  "policyVersion": 1,
  "resumeToken": "01ULID...",
  "randomSeed": 123456,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

**State Snapshots**
After each node, persist small `agent_state_snapshot` (JSONB pointer to artifacts) with `stepOrdinal` to unlock replay & “inspect step N” UI.

---

# Category: Setup Nodes

## 1) EnsureDevice
**Purpose:** Verify device/emulator availability and driver session readiness.

### Input JSON
```json
{
  "runId": "01J...",
  "tenantId": "01T...",
  "projectId": "01P...",
  "iterationOrdinalNumber": 0,
  "deviceConfiguration": {
    "platformName": "android",
    "deviceName": "Pixel_7_Emu",
    "platformVersion": "14",
    "appiumServerUrl": "http://127.0.0.1:4723"
  },
  "driverReusePolicy": "REUSE_OR_CREATE"
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "deviceRuntimeContext": {
    "driverSessionId": "b6f7...",
    "deviceId": "emulator-5554",
    "capabilitiesEcho": {"platformName": "android", "automationName": "UiAutomator2"},
    "healthProbeStatus": "HEALTHY"
  },
  "nodeName": "EnsureDevice",
  "stepOrdinal": 0,
  "iterationOrdinalNumber": 0,
  "policyVersion": 1,
  "resumeToken": "01ULID-ensuredevice-000",
  "randomSeed": 987654,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

### Incoming Events
1. `agent.run.cancellation_requested`
2. `agent.run.pause_requested`

### Outgoing Events
1. `agent.node.started`
2. `agent.node.finished`

---

## 2) ProvisionApp
**Purpose:** Ensure target app is present and correct build installed.

### Input JSON
```json
{
  "runId": "01J...",
  "tenantId": "01T...",
  "projectId": "01P...",
  "deviceRuntimeContext": { "driverSessionId": "b6f7..." },
  "applicationUnderTestDescriptor": {
    "androidPackageId": "com.example.app",
    "apkStorageObjectReference": "s3://bucket/builds/app-1.2.3.apk",
    "expectedBuildSignatureSha256": "ab12..."
  },
  "installationPolicy": "INSTALL_IF_MISSING"
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "applicationProvisioningOutcome": {
    "appPresenceStatus": "PRESENT",
    "installedVersionName": "1.2.3",
    "installedVersionCode": 123,
    "signatureValidationStatus": "MATCHED"
  },
  "nodeName": "ProvisionApp",
  "stepOrdinal": 1,
  "iterationOrdinalNumber": 0,
  "policyVersion": 1,
  "resumeToken": "01ULID-provision-001",
  "randomSeed": 111111,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

### Incoming Events
- `agent.run.cancellation_requested`
- `agent.run.pause_requested`

### Outgoing Events
1. `agent.node.started`
2. `agent.node.finished`

---

## 3) LaunchOrAttach
**Purpose:** Launch the app or attach to an existing foreground task.

### Input JSON
```json
{
  "runId": "01J...",
  "deviceRuntimeContext": { "driverSessionId": "b6f7..." },
  "applicationUnderTestDescriptor": { "androidPackageId": "com.example.app" },
  "launchAttachMode": "LAUNCH_OR_ATTACH"
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "applicationForegroundContext": {
    "currentPackageId": "com.example.app",
    "currentActivityName": "com.example.app.HomeActivity",
    "appBroughtToForegroundTimestamp": "2025-10-23T12:00:20Z"
  },
  "nodeName": "LaunchOrAttach",
  "stepOrdinal": 2,
  "iterationOrdinalNumber": 0,
  "policyVersion": 1,
  "resumeToken": "01ULID-launch-002",
  "randomSeed": 222222,
  "nodeExecutionOutcomeStatus": "SUCCESS",
  "errorId": null,
  "retryable": null,
  "humanReadableFailureSummary": null
}
```

### Incoming Events
- `agent.run.cancellation_requested`
- `agent.run.pause_requested`

### Outgoing Events
1. `agent.node.started`
2. `agent.node.finished`

---

## 4) WaitIdle
**Purpose:** Ensure UI is stable before perception begins.

### Input JSON
```json
{
  "runId": "01J...",
  "idleHeuristicsConfiguration": {
    "minQuietMillis": 400,
    "maxWaitMillis": 5000
  }
}
```

### Output JSON
```json
{
  "runId": "01J...",
  "uiStabilityAssessment": {
    "quietWindowObservedMillis": 620,
    "networkInFlightStatus": "NONE"
  },
  "nodeName": "WaitIdle",
  "stepOrdinal": 3,
  "iterationOrdinalNumber": 0,
  "policyVersion": 1,
  "resumeToken": "01ULID-waitidle-003",
  "randomSeed": 333333,
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
2. `agent.node.finished`

---

## DB & Outbox Invariants (Appendix)
- `run_events(run_id, sequence)` **UNIQUE**
- `run_outbox(run_id, sequence)` **UNIQUE** WHERE `published_at IS NULL`
- Orchestrator publishes **strictly by next sequence**; sets `published_at`.
- `checksum = sha256(eventId|runId|sequence|kind|payload)`
- CAS on `runs.status` to ensure **exactly one terminal** transition.
