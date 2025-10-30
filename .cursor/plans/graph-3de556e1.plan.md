<!-- 3de556e1-4e30-4e85-9f76-9102f97ef9d6 97e47520-ef0f-40a6-88da-56b930b7a457 -->
# Iteration 1: Graph Projection Service (no SSE changes)

### Scope

- Build a background projector that tails `run_events`, derives canonical screens, and writes `graph_persistence_outcomes` for each Perceive step.
- Edges and SSE-join are out of scope for this iteration.

### Key Decisions

- Preserve single-sink: agent only writes `run_events`; projection writes graph tables.
- Idempotency via deterministic `screen_id` = hash(app_id + layout_hash) to avoid duplicates without adding a unique constraint immediately.
- Use Encore generated clients for artifact retrieval; never manual fetch.
- Structured logging with `encore.dev/log` and contextual fields.

### Files to Add

- `backend/graph/encore.service.ts` (service boundary)
- `backend/graph/projector.ts` (background loop runner)
- `backend/graph/repo.ts` (typed DB repo for reads/writes)
- `backend/graph/hasher.ts` (XML normalization + layout hash)
- `backend/graph/types.ts` (DTOs for projector, outcomes)
- `backend/graph/README.md` (purpose + ops notes)
- `backend/db/migrations/007_graph_projection.up.sql` (cursor table + outcomes seq ref)

### DB Changes (007)

- Create `graph_projection_cursors(run_id TEXT PRIMARY KEY, next_seq BIGINT NOT NULL DEFAULT 1, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`.
- Alter `graph_persistence_outcomes` to add `source_run_seq BIGINT NOT NULL DEFAULT 0`.

### Processing Algorithm

- Poll every 200–300ms (setInterval) per existing pattern (`backend/run/outbox-publisher.ts`).
- For each cursor (run):
- Fetch events `WHERE seq >= next_seq ORDER BY seq ASC LIMIT 100`.
- Maintain ephemeral context per run for the current Perceive step:
- On `agent.event.ui_hierarchy_captured`: record `uiXmlRefId` and `elementCount`.
- On `agent.event.screen_perceived`: pair with last `uiXmlRefId` (if present), derive `layout_hash` by fetching XML via artifacts client, else fallback to `perceptualHash64` for iteration 1.
- Resolve `tenant_id, project_id` from `runs`, `app_id` from `app_fg_contexts.package_or_bundle_id` (fallback to `runs.app_config_id`).
- Compute deterministic `screen_id = sha256(app_id + layout_hash).slice(0, 32)`.
- Upsert `screens` (SELECT-if-exists else INSERT with deterministic id; update `last_seen_at`).
- Insert `graph_persistence_outcomes` with `upsert_kind` = `"discovered"` if newly inserted else `"mapped"`, and `source_run_seq = event.seq`.
- Advance cursor: `next_seq = lastProcessedSeq + 1`.
- Error handling: fail-fast within a run’s batch (log with `stopReason`, `err.*`), continue other runs; retry on next tick.

### Types & Contracts

- Define typed DTOs for projector messages and repo methods; no `any`.
- Encapsulate SQL rows with explicit interfaces and narrow `Record<string, unknown>` only for opaque JSON.

### Logging & Metrics

- `log.with({ module: "graph", actor: "projector", runId })` on each step.
- Emit counts: processed events, new/mapped screens, fetch latency for artifacts, batch duration.

### Idempotency & Reentrancy

- Deterministic `screen_id` prevents duplicates without a unique constraint.
- Outcomes table has `UNIQUE (run_id, step_ordinal)` already; projector must upsert or ignore duplicates.
- Cursor advancement only after all event writes succeed.

### Observability/Control (optional in iter 1)

- `GET /graph/status` (exposed true) returns per-run cursor and lag.
- `POST /graph/replay/:runId` (exposed false or restricted) resets cursor to 1 for that run.

### Test Plan

- Seed a run with ordered Perceive trio of events and an artifacts XML; assert `screens` row and an outcomes row are created with `source_run_seq`.
- Re-run projector: assert idempotency (no duplicate screens/outcomes; `last_seen_at` updates).
- Fallback path: if XML fetch fails, ensure perceptual-hash path maps consistently.

### References

- Perceive events: `backend/agent/nodes/main/Perceive/node.ts` (artifacts, `agent.event.screen_perceived`).
- Stream (unchanged in iter 1): `backend/run/stream.ts`.
- Existing graph tables: `backend/db/migrations/003_agent_state_schema.up.sql` (screens/actions/edges/outcomes).

### To-dos

- [ ] Add 007 migration: graph_projection_cursors + outcomes.source_run_seq
- [ ] Create backend/graph service scaffold with encore.service.ts
- [ ] Implement XML normalization and layout hash function
- [ ] Add GraphProjectionRepo for runs, events, screens, outcomes, cursors
- [ ] Use ~encore/clients artifacts.get to fetch XML by refId
- [ ] Implement background loop (setInterval) with per-run batching
- [ ] Add structured logging and basic counters/timings
- [ ] Add tests to verify new/mapped screens and idempotency
- [ ] Write backend/graph/README.md with purpose and ops notes