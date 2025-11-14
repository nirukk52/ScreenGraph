# ScreenGraph Agent — Testing Requirements (for Leap output)
_Last updated: 2025-10-24 06:57 UTC_

The following tests & fixtures must ship with Leap’s scaffolding to prove the loop is deterministic, idempotent, and replayable **without real devices**.

## Strategic Angle [POC → MVP]
- [POC] Prove **ordered events**, **small snapshots**, and **graph upserts** work end-to-end.
- [MVP] Prove **resume/replay** and **budget/stop routing** are deterministic.
- [POST_MVP] Policy switch and restart flows.
- [NORTHSTAR] Cross-run drift analytics based on stable screen/action IDs.

## Test Matrix
1. **Event Ordering & Publishing**
   - Insert N node events with increasing `sequence`. Ensure publisher only emits in-order; cursor advances correctly.
   - Duplicate publish attempts are no-ops (idempotency).
2. **Snapshot Minimality**
   - Assert snapshot JSON size < configurable threshold (e.g., 8 KB). No binary fields present.
3. **Deterministic Loop (Golden Run)**
   - With seed `S`, run the full loop using fakes; assert:
     - Same `run_events` stream on re-run.
     - Same snapshots (`deepEqual`) at each `stepOrdinal`.
     - Same `graph_persistence_outcomes` rows and counts.
4. **Idempotent Upserts**
   - Re-apply `Persist` for the same `(run_id, step)`; row count does not increase; `evidence_counter` bumps when appropriate.
5. **Policy & Budgets**
   - Exceed `maxSteps` and verify terminal stop reason = `budget_exhausted`.
   - STALL streak triggers `ShouldContinue=SWITCH_POLICY` or `RESTART_APP` as configured.
6. **Cancellation**
   - Set `CANCELED_REQUESTED` during loop; verify termination only at next node boundary with `agent.run.canceled` emitted once.
7. **Recovery Taxonomy**
   - Inject `errorId=DRIVER_TIMEOUT` in `Act`; verify `RecoverFromError` chooses `RETRY_NEXT_NODE` and loop continues.
8. **Tenancy & Security**
   - All events/snapshots include `{tenantId, projectId}`; no PII, no bucket names, no signed URLs.
9. **Deterministic Enumeration**
   - For a fixed XML fixture, `EnumerateActions` returns a **stable**, **sorted** set; `ChooseAction` picks the same candidate.

## Fixtures
- `/examples/fixtures/`
  - `android_home.xml`, `login_flow.xml` (static UI trees).
  - `perception.json` (pre-computed phash, ocr refs).
  - `candidates.json` (stable enumeration set).
  - `policy.defaults.json`, `budgets.defaults.json`.
  - `tenancy.defaults.json`.

## Tooling Expectations
- A single command `make test` runs all tests locally with no external dependencies.
- Provide `cli show-run` to visualize the last run’s timeline.
- Include a linter that **fails** if snapshot size or forbidden fields appear.

## Risks + Mitigation
- **Flaky Seeds**: Unseeded randomness slips in. → CI check forbids `Math.random()`; only seeded RNG allowed.
- **Hidden I/O**: Fakes call the network. → Integration tests wrap ports and assert no outbound calls.

## Next Move
- Ship tests alongside the scaffolding; Leap’s `plan.md` must list each test and where it lives.