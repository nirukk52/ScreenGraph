## Graph Service Engineering Context (Encore.ts)

### Service Role
- Event-sourced projector from `run_events` to canonical graph with run-scoped views and SSE.
- Ownership: graph tables and coverage; no writes to `run_events`.

### Purpose
Provide a deterministic, event-sourced ScreenGraph with run-scoped views, live/replay streams, coverage signals, and replayable actions. This service turns `run_events` into queryable and streamable graph state.

### Responsibilities
- Project `run_events` → `screens`, `actions`, `edges`, `graph_persistence_outcomes`
- Expose run-scoped graph retrieval and stream endpoints
- Track action execution coverage for full-crawl support
- Persist action provenance and coordinates for deterministic replay

### Service Boundaries
- Reads: `run_events`, `artifacts`
- Writes: graph tables + `action_execution_coverage`
- No side-effects outside this module; agent remains single writer for events

### API Contracts (Proposed)
- `GET /graph/run/:runId` → full graph (filtered to run), optional artifacts/provenance/coverage
- `GET /graph/run/:runId/stream` → SSE; live for active runs, replay for ended
- (Future) `GET /graph/run/:runId/coverage` → coverage summary for planner
- (Future) `GET /graph/run/:runId/context` → last-visited and affordances payload for LLM

DTO Guidelines
- Explicit request/response types; no `any`
- Enums/literal unions for verbs (`tap|type|swipe|back`) and origins (`xml|llm|heuristic`)
- Use canonical IDs; include `seqRef` when referencing event ordering

### Streaming Semantics
- Event union: `graph.screen.discovered|mapped`, `graph.edge.created|reinforced`, `graph.coverage.updated`, `graph.run.ended`
- Ordering: `(run_events.seq, outcomes.created_at)` using `source_run_seq`
- Replay: `replay=true` emits all historical graph outcomes then closes if run ended

### Database & Migrations
- Existing: `screens`, `actions`, `edges`, `graph_persistence_outcomes`, `graph_projection_cursors`
- Add (004): `source_run_seq` to `graph_persistence_outcomes`
- Add (005): `action_execution_coverage` (per-run action attempt/success/fail)
- Extend `actions` with provenance fields: `origin`, `tap_x`, `tap_y`, `selector_snapshot`, `input_payload`

### Evidence Layer (Run-Scoped Views)
- Favor SQL views over new base tables to keep single-sink projection minimal.
- Views: `screen_observations_view`, `edge_evidence_view`, `action_candidates_view` derived from canonical tables.
- Consumers (planner/analytics) query views for run-local evidence without duplicating storage.

### Deterministic Replay Requirements
- Persist action provenance (origin, selectors, coordinates, input)
- Replay helper verifies post-state via `layout_hash`
- Stable device profile + seeded randomness

### Logging & Observability
- Module: `graph`; Actor: `projector|api`
- Context: `{ module, actor, runId, eventSeq?, seqRef?, screenId?, actionId? }`
- Metrics (future): projection lag, batch duration, action coverage ratio

### Phases (Two-Engineer Split)
1) Projection Join + Schema
   - A: migration 004 + projector `source_run_seq` + coverage writes
   - B: SSE interleave join + typed SSE payloads
2) Endpoints
   - A: `GET /graph/run/:runId` + pagination + filters
   - B: `GET /graph/run/:runId/stream` + replay/fromSeq + tests
3) Deterministic Replay
   - A: persist provenance fields on actions; docs
   - B: replay helper + verification via `layout_hash`
4) Coverage-Driven Crawling Hooks
   - A: coverage endpoint/summary + unexplored actions
   - B: LLM context endpoint (last visited + affordances)

### Testing & QA
- Unit: hasher normalization, deterministic id generation, DTO validation
- Integration: projector tail/replay, SSE ordering, coverage updates
- Manual: live stream in API Explorer, replay on ended run, coverage dashboard queries

### Non-Negotiables
- Type safety end-to-end; no `any`
- No manual fetch; Encore APIs with explicit DTOs
- No magic strings; use enums/literal unions


