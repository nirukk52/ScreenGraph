<!-- da25252e-4ea3-4161-b5de-942e24a812c7 4bb096f3-de10-4139-8226-d3389dd57284 -->
# Agent DB-only Orchestration MVP

## Goals

- Make agent module DB-write-only; no in-process publish/queues.
- Orchestrator is SSOT for DB writes to `run_events` (and related tables).
- `outbox-publisher.ts` polls `run_events` and marks `published_at` after publish.
- Split `DbRepoPort` into focused ports per table/concern.

## Scope of Changes

- Remove `backend/agent/orchestrator/outbox.ts` and all `publishEvents()` usages.
- Introduce focused ports with typed DTOs:
- `RunDbPort`: claim/lease/heartbeat/status
- `RunEventsDbPort`: append/read sequences
- `SnapshotDbPort`: save/get snapshots
- `ScreenGraphDbPort`: screens, actions, edges, artifacts
- Refactor `Orchestrator` to depend on these ports (no in-memory outbox):
- On `initialize`: compute `sequenceCounter` via `RunEventsDbPort.getLastEventSequence`, write `run.started` event + initial snapshot
- On `recordNodeEvents`: write `agent.node.started`, node events, and `agent.node.finished`
- On `finalizeRun`: update run status via `RunDbPort.updateRunStatus`, append `run.finished`
- Refactor `AgentWorker`:
- Keep lease heartbeats + cancel checks via `RunDbPort`
- Remove calls to `publishEvents()` and `reset()` tied to outbox; keep reset if needed for in-memory counters only
- Update `subscription.ts` wiring:
- Claim run via `RunDbPort.claimRun`
- Construct adapters for each port and pass to Orchestrator/Worker
- Update `outbox-publisher.ts`:
- Query `run_events WHERE published_at IS NULL ORDER BY run_id, seq`
- Publish/log per event; `UPDATE run_events SET published_at = NOW() WHERE run_id = $1 AND seq = $2`
- Stop referencing `run_outbox` (keep table untouched for now)

## Boundaries & Responsibilities

- `subscription.ts` (agent): claim job, instantiate worker; no DB logic beyond claim wiring.
- `AgentWorker` (agent): lease mgmt, cancel checks, orchestrator lifecycle.
- `Orchestrator` (agent): SSOT for all DB writes to runs/events/snapshots (+ optional screen graph via `ScreenGraphDbPort`).
- `outbox-publisher.ts` (run service): external publisher polling `run_events` only.

## File-Level Edits

- Remove: `backend/agent/orchestrator/outbox.ts`
- Update: `backend/agent/orchestrator/orchestrator.ts` (drop Outbox usage, inject ports, write directly)
- Update: `backend/agent/orchestrator/worker.ts` (remove `publishEvents()` calls)
- Update: `backend/agent/orchestrator/subscription.ts` (construct new ports)
- Split ports:
- Add: `backend/agent/ports/run-db.port.ts`
- Add: `backend/agent/ports/run-events.port.ts`
- Add: `backend/agent/ports/snapshot.port.ts`
- Add: `backend/agent/ports/screen-graph.port.ts`
- Add: `backend/agent/persistence/run-db.repo.ts`
- Add: `backend/agent/persistence/run-events.repo.ts`
- Add: `backend/agent/persistence/snapshot.repo.ts`
- Add: `backend/agent/persistence/screen-graph.repo.ts`
- Deprecate: `backend/agent/persistence/db-repo.ts` (migrate usages)
- Update: `backend/run/outbox-publisher.ts` (read `run_events` + mark `published_at`)
- Docs: `backend/agent/README.md`, `API_DOCUMENTATION.md` (flow and responsibilities)

## Type & DTO Discipline

- Define DTOs at top of new port files; no `any`. Example:
- `RunLifecycleStatus`, `RunRecord` (reused)
- `RunEventDTO { runId: string; sequence: number; type: string; nodeName?: string; payload: Record<string, unknown>; ts: string; }`
- `SnapshotDTO { runId: string; stepOrdinal: number; nodeName: string; stateJson: AgentState }`

## Founders’ Flow (Narrative)

1. `POST /run` inserts `runs` and enqueues job (unchanged), then pubsub delivers `RunJob`.
2. `subscription.ts` claims run (single-writer), builds `AgentWorker` with `Orchestrator` and focused repos.
3. `AgentWorker` initializes orchestrator; orchestrator queries last seq and writes `run.started` to `run_events`, persists snapshot.
4. Agent executes nodes; orchestrator writes node started/events/finished and snapshots.
5. On completion/cancel/fail, orchestrator updates `runs.status` and writes `run.finished`.
6. `outbox-publisher.ts` continuously polls `run_events` where `published_at IS NULL`, publishes, sets `published_at`.

## Open Questions

- Should `ScreenGraphDbPort` live under agent now or be a separate service later? For MVP: keep under agent port but write-only.

## Minimal Risk Notes

- Keep `run_outbox` table untouched; remove only its code usage.
- Ensure stream endpoint still functions (it reads `run_events` already).

## Implementation Todos

- setup-ports: Create focused port interfaces and DTOs
- impl-run-db: Implement `RunDbPort` adapter (DB)
- impl-events-db: Implement `RunEventsDbPort` adapter (DB)
- impl-snapshot-db: Implement `SnapshotDbPort` adapter (DB)
- impl-screen-graph-db: Implement `ScreenGraphDbPort` adapter (DB)
- refactor-orchestrator: Inject ports, remove Outbox, direct writes
- refactor-worker: Remove publish/reset calls, keep lease logic
- wire-subscription: Build adapters and pass into worker/orchestrator
- update-outbox-publisher: Poll `run_events`, mark `published_at`
- remove-legacy-outbox: Delete `agent/orchestrator/outbox.ts`, prune imports
- update-docs: Refresh `backend/agent/README.md` and `API_DOCUMENTATION.md`

### To-dos

- [ ] Create focused port interfaces and DTOs
- [ ] Implement RunDbPort DB adapter
- [ ] Implement RunEventsDbPort DB adapter
- [ ] Implement SnapshotDbPort DB adapter
- [ ] Implement ScreenGraphDbPort DB adapter
- [ ] Inject ports; remove Outbox; write events directly
- [ ] Remove publish/reset; keep lease and cancel checks
- [ ] Construct adapters; pass to worker/orchestrator
- [ ] Poll run_events and set published_at
- [ ] Delete outbox.ts and related imports
- [ ] Refresh backend/agent/README.md and API docs