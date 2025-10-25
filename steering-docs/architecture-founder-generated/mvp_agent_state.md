
# ScreenGraph — MVP Agent State (Production-Grade, ID-First)
**Version:** 1.0 (M6 focus)  
**Owner:** Orchestrator (single writer)  
**Status:** MVP-ready (immutable, serializable, deterministic)  
**Scope:** This document defines the **runtime state object** carried between orchestrator nodes. It is **ID-first** (references over payloads), JSON-only, and contains **no runtime handles** (drivers/SDKs).

---

## 1) Design Principles (Hard Invariants)
- **Immutability:** Nodes return a **new** state instance; previous states are never mutated.  
- **Serializability:** **JSON-only** primitives (string, number, boolean, array, object). No binary, no Date objects (use ISO-8601 strings).  
- **IDs over Payloads:** Heavy assets and derived objects are stored out-of-band and referenced by **IDs**/**object-storage references**.  
- **Determinism:** One **orchestrator** assigns sequence, timestamps, and performs outbox publishing. State is a **pure value**.  
- **No Handles:** Absolutely **no** driver/model/DB clients inside state. Only IDs and scalars.  
- **Small & Inspectable:** State captures **what changed**, not whole worlds. Derived, large, or replayable detail goes to artifacts referenced by ID.  
- **Replayable:** Every step has a tiny **snapshot** (this state object) + external artifacts by ID, enabling **replay** and “inspect step N” UI.

Why this matters: These invariants unlock enterprise-grade reliability (replay, audits, drift analysis) and reduce incident surface (no live handles).

---

## 2) Top-Level Shape (JSON, ID-First)

```jsonc
{
  // 2.1 Identity & Routing (always present)
  "tenantId": "01TENANT...",
  "projectId": "01PROJECT...",
  "runId": "01RUN...",               // ULID, monotonic per run
  "policyVersion": 1,                // small integer
  "nodeName": "EnumerateActions",    // last node that produced this state
  "stepOrdinal": 5,                  // increases within run
  "iterationOrdinalNumber": 1,       // logical iteration in main loop
  "resumeToken": "01ULID-step-0005", // allows resume-at-node
  "randomSeed": 515151,              // deterministic RNG seed for node
  "timestamps": {
    "createdAt": "2025-10-23T12:00:00Z",
    "updatedAt": "2025-10-23T12:00:01Z"
  },

  // 2.2 Device/App Context (IDs only)
  "deviceRuntimeContextId": "01DEVCTX...",          // points to driver session meta
  "applicationForegroundContextId": "01APPFG...",   // points to package/activity info

  // 2.3 Perception Artifacts (IDs/refs only)
  "perception": {
    "screenshotRefId": "obj://shots/01RUN/0005.png",
    "uiHierarchyXmlRefId": "obj://xml/01RUN/0005.xml",
    "ocrRefId": "obj://ocr/01RUN/0005.json",
    "screenPerceptualHash64": "a9c3f0d4e1b2c3d4"    // 64-bit hash as hex
  },

  // 2.4 Action Enumeration (IDs only)
  "availableActionCandidateIds": ["01ACTCAND-01", "01ACTCAND-02"],

  // 2.5 Decision (IDs only)
  "chosenActionDecisionId": "01DECIDE-0005",        // selection + rationale stored externally

  // 2.6 Execution Result (IDs only)
  "actionExecutionOutcomeId": "01EXECOUT-0005",     // status, timings, traces

  // 2.7 Verification (IDs only)
  "verificationAssessmentId": "01VERIFY-0005",      // visual change heuristics

  // 2.8 Persistence Outcome (IDs only)
  "graphPersistenceOutcomeId": "01GRAPHOUT-0005",   // screenId/actionId and upsert kind

  // 2.9 Progress & Continuation (IDs only)
  "progressEvaluationId": "01PROGRESS-0005",        // FORWARD/STALL + basis
  "continuationDecisionId": "01CONTINUE-0005",      // CONTINUE | SWITCH_POLICY | RESTART_APP | STOP

  // 2.10 Recovery/Checkpoint (IDs only, optional)
  "recoveryDispositionId": null,                    // if RecoverFromError ran
  "checkpointRefId": null,                          // obj://checkpoints/...

  // 2.11 Budgets & Counters (thin scalars kept inline for fast checks)
  "counters": {
    "stepsTotal": 12,
    "screensNew": 7,
    "noProgressCycles": 0,
    "outsideAppSteps": 0,
    "restartsUsed": 0,
    "errors": 0
  },
  "budgets": {
    "maxSteps": 300,
    "maxTimeMs": 600000,
    "maxTaps": 800,
    "outsideAppLimit": 3,
    "restartLimit": 2
  },

  // 2.12 Lifecycle
  "status": "running",               // running | paused | completed | failed
  "stopReason": null,                // set on terminalization

  // 2.13 Orchestrator Bookkeeping (single-writer)
  "lastEventSequence": 42,           // last published run_events sequence
  "checksum": "sha256(...)"          // checksum for envelope (diagnostic only)
}
```

**Notes**
- All IDs are **ULIDs**.  
- All timestamps are **UTC ISO-8601** strings.  
- **Only** counters/budgets remain inline because hot-path checks must be O(1) without extra reads. Everything heavier is an ID/ref.

---

## 3) Field Catalog (What, Why, and Where It Lives)

| Section | Field | Type | Why ID-First? | Persistence Home |
|---|---|---:|---|---|
| Identity | tenantId, projectId, runId | string | Multi-tenant routing, replay key | `runs`, event envelope |
| Routing | nodeName, stepOrdinal, iterationOrdinalNumber, resumeToken, randomSeed | string/number | Deterministic replay & resume | `agent_state_snapshots` |
| Time | timestamps.createdAt, timestamps.updatedAt | string | Audit & diff | in state JSON |
| Device | deviceRuntimeContextId | string | Driver metadata changes across runs | `driver_runtime_contexts` |
| App FG | applicationForegroundContextId | string | Foreground app/Activity | `app_fg_contexts` |
| Perception | screenshotRefId, uiHierarchyXmlRefId, ocrRefId, screenPerceptualHash64 | string | Heavy/binary artifacts | object storage + `artifacts_index` |
| Actions | availableActionCandidateIds[] | string[] | Candidate explosion, dedup by ID | `action_candidates` |
| Decision | chosenActionDecisionId | string | Explainability without bloat | `decisions` |
| Exec | actionExecutionOutcomeId | string | Timings & retries grow | `execution_outcomes` |
| Verify | verificationAssessmentId | string | pHash deltas, thresholds | `verification_assessments` |
| Persist | graphPersistenceOutcomeId | string | screenId/actionId linkage | `graph_persistence_outcomes` |
| Progress | progressEvaluationId | string | FORWARD/STALL basis | `progress_evaluations` |
| Continue | continuationDecisionId | string | Router of the loop | `continuation_decisions` |
| Recovery | recoveryDispositionId | string? | Error taxonomy & action | `recovery_dispositions` |
| Checkpoint | checkpointRefId | string? | Fast resume from snapshot | object storage + index |
| Budgets | budgets.* | number | Guardrails | in state JSON |
| Counters | counters.* | number | O(1) checks | in state JSON |
| Bookkeeping | lastEventSequence, checksum | number/string | Outbox discipline | `run_events`, `run_outbox` |

---

## 4) Allowed Mutations per Node (State Delta Contract)
Each node may update **only** specific sections to keep deltas minimal and predictable.

| Node | Allowed Updates | Must Not Touch |
|---|---|---|
| EnsureDevice | deviceRuntimeContextId | perception, actions, decisions |
| ProvisionApp | applicationForegroundContextId | perception, decisions |
| LaunchOrAttach | applicationForegroundContextId | budgets (except counters) |
| WaitIdle | — (no-op or updatedAt only) | decisions, persistence |
| Perceive | perception.*, counters.stepsTotal++ | decisions, budgets.* |
| EnumerateActions | availableActionCandidateIds[], counters.stepsTotal++ | budgets.*, persistence |
| ChooseAction | chosenActionDecisionId | perception, persistence |
| Act | actionExecutionOutcomeId, counters.stepsTotal++ | budgets.*, persistence |
| Verify | verificationAssessmentId | budgets.*, persistence |
| Persist | graphPersistenceOutcomeId | budgets.*, device/app ctx |
| DetectProgress | progressEvaluationId | budgets.*, persistence |
| ShouldContinue | continuationDecisionId | perception, enumeration |
| SwitchPolicy | policyVersion | counters (except updatedAt) |
| RestartApp | applicationForegroundContextId, counters.restartsUsed++ | perception (unless forced re-perceive) |
| RecoverFromError | recoveryDispositionId | budgets (except updatedAt) |
| Stop | status = completed|failed|canceled, stopReason | everything else |

Rule of thumb: **Only the node that “owns” a concern writes it.**

---

## 5) Budget & Stop Logic (Inline & Deterministic)
- **Budget Exhaustion:** stop when `stepsTotal ≥ maxSteps` OR `outsideAppSteps ≥ outsideAppLimit` OR `restartsUsed ≥ restartLimit`.  
- **Time Guard:** orchestrator compares wall-clock elapsed to `budgets.maxTimeMs` and routes via **ShouldContinue** to STOP.  
- **No-Progress:** consecutive STALL evaluations increase `noProgressCycles`; threshold route to `SwitchPolicy` → `RestartApp` → `Stop` (as configured).

**Terminalization:** Only the **Stop** node sets `status` + `stopReason`. Exactly one terminal per run (CAS on `runs.status`).

---

## 6) Snapshotting (Small JSON + External Refs)
After every node:
1) Persist this state under `agent_state_snapshots(runId, stepOrdinal)` (overwriting allowed)  
2) Persist artifacts externally by **refId**  
3) Append `run_events` + `run_outbox` with monotonic sequence

This enables:
- Inspect-step UI (jump to any step)  
- Minimal rework on resume (load snapshot + continue)  
- Full replay for audits and analytics

---

## 7) Examples (Two Consecutive States)

### 7.1 After **Perceive**
```jsonc
{
  "runId": "01RUN...", "nodeName": "Perceive", "stepOrdinal": 4, "iterationOrdinalNumber": 1,
  "perception": {
    "screenshotRefId": "obj://shots/01RUN/0004.png",
    "uiHierarchyXmlRefId": "obj://xml/01RUN/0004.xml",
    "ocrRefId": "obj://ocr/01RUN/0004.json",
    "screenPerceptualHash64": "a9c3f0..."
  },
  "availableActionCandidateIds": [],
  "counters": { "stepsTotal": 4, "screensNew": 1, "noProgressCycles": 0, "outsideAppSteps": 0, "restartsUsed": 0, "errors": 0 },
  "budgets":   { "maxSteps": 300, "maxTimeMs": 600000, "maxTaps": 800, "outsideAppLimit": 3, "restartLimit": 2 },
  "status": "running"
}
```

### 7.2 After **EnumerateActions**
```jsonc
{
  "runId": "01RUN...", "nodeName": "EnumerateActions", "stepOrdinal": 5, "iterationOrdinalNumber": 1,
  "perception": { "screenPerceptualHash64": "a9c3f0..." },
  "availableActionCandidateIds": ["01ACTCAND-01","01ACTCAND-02","01ACTCAND-03"],
  "counters": { "stepsTotal": 5, "screensNew": 1, "noProgressCycles": 0, "outsideAppSteps": 0, "restartsUsed": 0, "errors": 0 },
  "status": "running"
}
```

---

## 8) Validation Checklist (State is acceptable iff…)
- `runId`, `nodeName`, `stepOrdinal`, `iterationOrdinalNumber` present.  
- If `perception.screenshotRefId` is present → `uiHierarchyXmlRefId` SHOULD be present.  
- When `availableActionCandidateIds` non-empty → `chosenActionDecisionId` **not** set yet.  
- When `chosenActionDecisionId` set → `actionExecutionOutcomeId` **not** set yet.  
- When `actionExecutionOutcomeId` set → `verificationAssessmentId` SHOULD be next.  
- When `graphPersistenceOutcomeId` set → `progressEvaluationId` SHOULD be next.  
- `status` is `running` until **Stop**; only **Stop** sets terminal status + `stopReason`.  
- `timestamps.updatedAt` must advance on each state emission.  

---

## 9) Security & PII
- No PII in state.  
- Artifact IDs must not leak bucket names or signed URLs in logs/UI.  
- All IDs are opaque; resolve via authorized services only.

---

## 10) Migration & Versioning
- Introduce new optional fields as **nullable**; do not repurpose existing keys.  
- Bump **minor** version for additive changes; **major** for breaking renames/removals.  
- Keep a `state_version` if/when needed; MVP uses repo tag + policyVersion for drift control.

---

## 11) FAQ (Operational)
**Q:** Why keep counters inline but decisions by ID?  
**A:** Counters gate routing on hot path (O(1) checks). Decisions carry rationale/LLM traces → externalized by ID to keep state small and deterministic.

**Q:** Why store `screenPerceptualHash64` inline?  
**A:** It’s a tiny scalar critical to loop logic (dedupe/progress) and valuable for quick diffs without fetching artifacts.

**Q:** Where do large JSONs (e.g., enumerations) live?  
**A:** In dedicated tables/objects keyed by IDs (e.g., `action_candidates`), not inside state.

---

## 12) Appendix — Stop Reasons (canonical)
- `success` — run reached goal or configured end.  
- `budget_exhausted` — steps/time/restarts limit crossed.  
- `crash` — unrecoverable driver/app error.  
- `no_progress` — configured stall threshold exceeded.  
- `user_cancelled` — cancellation honored at boundary.
