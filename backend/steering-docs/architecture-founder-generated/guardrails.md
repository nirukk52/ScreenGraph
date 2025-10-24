# ScreenGraph Agent — Guardrails for Leap Plan
_Last updated: 2025-10-24 06:57 UTC_

This file defines the **non-negotiable constraints** Leap must follow while drafting `plan.md` for the agent system **before Cursor/Appium/device setup takes over**. Guardrails exist to preserve determinism, replayability, and GTM velocity.

## Strategic Angle [POC → MVP]
- [POC] **Thin Vertical First**: One deterministic loop from `Perceive → EnumerateActions → ChooseAction → Act → Verify → Persist → DetectProgress → ShouldContinue → Stop`.
- [MVP] **Run as Evidence**: Every decision/event must reconstruct a timeline suitable for demos, audits, and drift-analytics.
- [POST_MVP] **Policy Switching**: Multiple strategies (BFS, goal‑guided) switched by explicit policy versioning.
- [NORTHSTAR] **Enterprise-grade Replay**: Any step can be resumed/replayed with the same outcome given identical inputs.

## Architectural Direction
- **Single Writer**: Orchestrator is the only writer of `run_events` and `agent_state_snapshots`. Nodes are *pure*; all side‑effects happen via ports/adapters. [POC/MVP]
- **ID‑First State**: State carries only IDs, counters, budgets, and tiny scalars. Large artifacts (screenshots, XML, OCR, traces) live in object storage indexed by IDs. [MVP]
- **Outbox Discipline**: Every node yields `node.started` → `node.finished` (and optional token deltas). Orchestrator assigns a **monotonic `sequence`** and publishes strictly in order. [MVP]
- **Termination CAS**: Exactly one terminal event per run (`finished | failed | canceled`) guarded by compare‑and‑swap on `runs.status`. [MVP]
- **Multi‑Tenancy**: All top‑level payloads include `{tenantId, projectId}`; never leak bucket names or signed URLs. [MVP]
- **No Handles in State**: Absolutely no driver/DB/SDK handles in the state object. Only IDs and scalars. [POC/MVP]

## Execution Plan Expectations for Leap
- **Deliver Scaffolding Only**: Generate folders, contracts, and placeholder adapters sufficient to run the orchestrator with **fake ports**. Device/Appium comes later.
- **Contracts > Code**: Produce JSON schemas/types for: `AgentState`, `RunEvents`, `ActionCandidates`, `Decisions`, `ExecutionOutcomes`, `VerificationAssessments`, `GraphPersistenceOutcomes`.
- **Ports/Adapters**: Stub ports with in‑memory fakes: `DriverPort`, `OCRPort`, `RepoPort`, `ObjectStorePort`, `LLMPort`, `BudgetPort`, `TelemetryPort`. No external SDK usage in this phase.
- **Policy & Budgets**: Include a policy file with: `maxSteps`, `maxTimeMs`, `outsideAppLimit`, `restartLimit`, and routing rules for `ShouldContinue`.

## Guardrails (Hard)
1. **Determinism**: Same inputs → same outputs. Seeds and timestamps are orchestrator‑assigned.
2. **Immutability**: Each node returns a **new** state instance; previous state is never mutated.
3. **Idempotency**: Replays of the same `(runId, stepOrdinal)` must re‑produce identical events and snapshots (no duplicate side‑effects).
4. **Ordering**: `(run_id, sequence)` is globally unique per run. Publisher reads and emits strictly in `sequence` order.
5. **Minimal Snapshots**: Snapshot = small JSON + IDs to external artifacts. No heavy blobs inline.
6. **Error Taxonomy**: Failures return `{errorId, retryable, humanReadableFailureSummary}`; recovery is explicit (`RecoverFromError`, `RestartApp`) and logged.
7. **Cancellation**: Honor `CANCELED_REQUESTED` only at node boundaries to preserve invariants.
8. **Policy Versioning**: `policyVersion` is a scalar in state; switches are explicit and recorded.
9. **Security**: No PII in events/state; artifact IDs are opaque; access via authorized services only.
10. **Observability**: Token deltas/logs are attached as domain events (not printed to stdout).

## Risks + Mitigation
- **Risk**: Leap scaffolds adapters that secretly perform I/O.  
  **Mitigation**: All adapters must be *fakes* behind ports with deterministic data tables (JSON fixtures).
- **Risk**: Snapshot bloat.  
  **Mitigation**: CI rule to check snapshot size and forbid binary fields.
- **Risk**: Event reordering in publisher.  
  **Mitigation**: Publisher reads strictly by `next_seq`; transactionally updates `published_at` + cursor.

## Next Move
- Leap generates the scaffolding per **requirements.md** and **testing_requirements.md**, outputs `plan.md` that references all created files, and provides a `make run:demo` that executes the loop entirely with fakes.