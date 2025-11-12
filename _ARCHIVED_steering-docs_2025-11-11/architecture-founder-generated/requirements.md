# ScreenGraph Agent — Requirements for Leap Plan
_Last updated: 2025-10-24 06:57 UTC_

This file specifies what Leap must scaffold so we can immediately test and tune policies *without* real devices.

## Strategic Angle [POC → MVP]
- [POC] **Run a full loop with fakes** producing a trace that can be inspected in a UI/CLI.
- [MVP] **Persisted Evidence** for each step (events + snapshot + artifact index) to enable replay and GTM demos.
- [POST_MVP] Multi‑policy routing and restart flows.
- [NORTHSTAR] Cross‑run graph analytics and UX‑drift detection powered by consistent IDs.

## Functional Requirements
1. **Run Lifecycle**
   - Create `runs` and produce `agent.run.started` → terminal (`finished|failed|canceled`) with **exactly one** terminal transition.
2. **Main Loop (pure nodes)**
   - `Perceive` → `EnumerateActions` → `ChooseAction` → `Act` → `Verify` → `Persist` → `DetectProgress` → `ShouldContinue` → `Stop`.
   - Each node accepts an **ID-first** state and returns a **new** state + `domainEventsToRecord[]`.
3. **Policy & Budgets**
   - Configurable `maxSteps`, `maxTimeMs`, `outsideAppLimit`, `restartLimit` with routing outcomes: `CONTINUE | SWITCH_POLICY | RESTART_APP | STOP`.
4. **Artifacts & Index**
   - `artifacts_index` with `artifact_ref_id`, `kind`, `content_hash_sha256`, `run_id` (fakes store strings, not files).
5. **Graph Persistence**
   - `screens`, `actions`, `edges`, and a per‑step `graph_persistence_outcomes` upsert that is **idempotent** by `(run_id, step_ordinal)`.
6. **Outbox & Events**
   - `run_events` append‑only, `(run_id, seq)` unique; `run_outbox` with `next_seq` and `last_published_seq` cursor.
7. **State Snapshots**
   - `agent_state_snapshots` keyed by `(run_id, step_ordinal)`, small JSON (no blobs).

## Non‑Functional Requirements
- **Determinism**: Seeded RNG, orchestrator‑owned timestamps, stable sorting of candidates.
- **Immutability**: State is value‑type JSON; nodes do not mutate inputs.
- **Idempotency**: Re‑processing the same step produces the same results; upserts protect against duplicates.
- **Observability**: Structured events only; optional token deltas; zero stdout logs required for testing.
- **Security**: No secrets; no PII; opaque artifact IDs.
- **Tenancy**: All top‑level data carries `{tenantId, projectId}`.

## Deliverables (what Leap must output)
- **Directories**
  - `/domain`: JSON schemas/types for state and domain entities.
  - `/application/orchestrator`: main loop runner with single writer semantics.
  - `/ports`: interface contracts for all adapters.
  - `/adapters/fakes`: deterministic in‑memory fakes implementing ports.
  - `/infra/persistence`: thin repository layer for runs, events, snapshots, graph tables (backed by an in‑proc KV/JSON store or sqlite).
  - `/policies`: default policy config and examples.
  - `/cli`: `run:demo` entry to execute one run and print a run summary.
- **Files**
  - `README.md` (how to run the demo)
  - `plan.md` (Leap’s own build plan referencing these requirements)
  - `schemas/*.json` or `*.ts` type declarations for all contracts
  - `examples/fixtures/*.json` for fakes
- **Interfaces (sketch)**
  - `DriverPort`: `captureScreenshot() -> refId`, `dumpUiHierarchy() -> refId` (faked).
  - `OCRPort`: `runOCR(refId) -> refId` (faked).
  - `RepoPort`: CRUD for runs, snapshots, events, graph persistence.
  - `ObjectStorePort`: `put/get/exists` over **string refs** only.
  - `LLMPort`: `enumerateActions(xmlRef) -> actionCandidates[]` (rule‑based fake).
  - `BudgetPort`: counters & limits check.
  - `TelemetryPort`: publish events (no-ops for local).
- **Config**
  - `policy.json`, `budgets.json`, `tenancy.json` with minimal defaults.

## Out of Scope (for Leap)
- Real Appium sessions, device control, network I/O, real object storage, real OCR/LLM calls, UI frontends.

## Acceptance (Definition of Done)
- A single `make run:demo` executes a run from start to terminal with **ordered events**, **consistent snapshots**, and **graph rows** created.
- Re-running the same seed produces identical outputs (hashes, sequences, upserts).
- `cli show-run --run {id}` can print the event timeline and per-step snapshot summary.

## Risks + Mitigation
- **Adapter Drift**: Concrete adapters diverge from ports. → Keep ports in `/ports` with API-compat tests.
- **State Growth**: State grows beyond “small JSON”. → Lint rule to forbid big fields + size budget in tests.
- **Non-deterministic Fakes**: → Seeded RNG and sorted outputs; forbid `Math.random()` without seed.

## Next Move
- Leap composes `plan.md` that enumerates each deliverable, mapping to tasks and estimated effort, then creates the tree and stubs with fakes.