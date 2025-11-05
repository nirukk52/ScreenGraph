## Graph Projection Service

### Service Role
- Projects `run_events` into a canonical screen graph (`screens`, `actions`, `edges`).
- Provides run-scoped graph retrieval and live/replay streams.
- Tracks action execution coverage and persists action provenance for deterministic replay.
- Reads artifacts for XML normalization; never writes `run_events`.

### Purpose
Consume `run_events` and maintain a canonical, deterministic screen graph across runs: `screens`, `actions`, `edges`, and `graph_persistence_outcomes`. This enables full-coverage automated crawling, live updates, and deterministic replay.

### Architecture
- **Event-Sourced Projection**: Derives graph state from `run_events` (single-sink design)
- **Background Worker**: Started from `encore.service.ts` via `startGraphProjector()`
- **Idempotent Processing**: Safe to replay or retry without duplication
- **Run-Scoped Views**: Full graph can be filtered to a specific `run_id` while keeping canonical storage

---

## Goals (MVP)
- Expose one endpoint to get the full ScreenGraph for a given `run_id`.
- Expose one endpoint to stream the full graph for a given `run_id` (live during the run or replay after it ends), emitting on new screens/edges.
- Support automated crawling with full coverage: track discovered screens, available actions, executed actions, and edges; surface coverage gaps.
- Provide deterministic, replayable action data (provenance and coordinates) to reproduce runs.
- Enable future LLM-driven action selection by returning recent screens/actions context and action affordances.

---

## API Design (Proposed)

### GET /graph/run/:runId
Returns the full ScreenGraph as observed for `runId`. Canonical data is filtered to screens/actions/edges seen or created by this run, but objects retain canonical IDs.

Query params:
- `includeArtifacts?` boolean (default false) – include latest artifact refs per screen
- `includeActionProvenance?` boolean (default true) – include `origin` and `coordinates`
- `includeExecutionStatus?` boolean (default true) – include action execution coverage fields

Response shape (summary):
- `screens[]` with `screen_id`, `layout_hash`, `perceptual_hash64`, `first_seen_run_id`, `latest_seen_run_id`, `seen_count`
- `actions[]` with `action_id`, `screen_id`, `verb`, `target_key`, `origin`, `coordinates?`, `params`, `execution` (attempted/succeeded/failed counts for this run)
- `edges[]` with `edge_id`, `from_screen_id`, `action_id`, `to_screen_id`, `evidence_counter`
- `metadata` with counts and coverage percentages (screen coverage, action execution coverage)

### GET /graph/run/:runId/stream
Server-Sent Events stream for the run’s ScreenGraph. If the run is active, emits live updates. If ended, can replay and then close.

Query params:
- `replay?` boolean (default true) – emit historical outcomes first
- `fromSeq?` number (default 0) – start after this source sequence

Event types (union):
- `graph.screen.discovered`, `graph.screen.mapped`
- `graph.edge.created`, `graph.edge.reinforced`
- `graph.coverage.updated`
- `graph.run.ended`

Ordering: Interleaved by `(run_events.seq, outcomes.created_at)` using `graph_persistence_outcomes.source_run_seq` for correlation.

---

## Implementation Details

### Runtime
Background loop that continuously tails `run_events` and projects to graph tables.

### Data Flow
1. Hydrates missing cursors from `run_events`
2. Streams batches per run (200-300ms cadence)
3. Tracks Perceive node context:
   - `agent.node.started`
   - `agent.event.ui_hierarchy_captured`
   - `agent.event.screen_perceived`
4. Downloads UI XML artifacts when available
5. Normalizes XML, computes hashes, upserts screens
6. Records projection outcomes with deterministic IDs + `source_run_seq`

### Idempotency Guarantees
- **Deterministic `screen_id`**: `sha256(appId::layoutHash)` slice 32
- **Deterministic `outcome_id`**: `sha256(runId::stepOrdinal::discovered)` slice 32
- **`graph_persistence_outcomes`**: Keyed by `(run_id, step_ordinal)` to avoid duplicates
- Safe to replay: outcomes are upserted, not appended

### Screen Deduplication Algorithm
1. Extract XML layout from artifacts
2. Normalize XML (remove whitespace, sort attributes)
3. Compute `layout_hash` = `sha256(normalized_xml)`
4. Query: `SELECT * FROM screens WHERE app_id = ? AND layout_hash = ?`
5. **Match found** → update `latest_seen_run_id`, increment `seen_count` → outcome: `mapped`
6. **No match** → insert new screen → outcome: `discovered`

### Deterministic Replay Model
- Every `action` stores deterministic replay data:
  - `origin`: "xml" | "llm" | "heuristic" (how it was derived)
  - `coordinates?`: `{ x: number; y: number }` when a tap/gesture used coordinates
  - `selector_snapshot?`: stable selector/xpath at time of action
  - `input_payload?`: text or data provided to inputs
- Replay invariant: Given same device form factor and seed, we can re-execute actions and verify target screen by `layout_hash`.

### Coverage Model (Full-Crawl Support)
- Track action execution coverage per screen:
  - `execution.attempted_count`, `execution.succeeded_count`, `execution.failed_count` (scoped per run and aggregated canonically)
- Coverage metrics:
  - Screen coverage: fraction of discovered screens vs. reachable space
  - Action coverage: fraction of actions attempted/succeeded at least once
  - Dead-ends and unreachable screens lists
  - Used to drive next-action selection for the agent

### Edge Creation (Future)
When an action results in a transition:
1. Correlate sequence: Perceive A → Act → Perceive B
2. Find `action_id` from screen A's action list
3. Upsert `edges` row: `screen_a_id → action_id → screen_b_id`
4. Increment `evidence_counter` if edge exists
5. Emit `graph.edge.created` or `graph.edge.reinforced`

---

## Evidence Layer (Run-Scoped Views)
Minimal, run-scoped evidence is exposed as SQL views over canonical tables; no new base tables are required.

- `screen_observations_view(run_id, step_ordinal, screen_id, upsert_kind, source_run_seq, created_at)`
  - Backed by `graph_persistence_outcomes` rows of kind `discovered|mapped`
- `edge_evidence_view(run_id, from_screen_id, action_id, to_screen_id, evidence_counter, last_evidence_run_id)`
  - Backed by `edges`, filtered/joined to runs when available
- `action_candidates_view(run_id, screen_id, action_id, verb, target_key, origin, selector_snapshot, tap_x, tap_y)`
  - Backed by `actions` with provenance fields; scoped to the run via usage in outcomes

These views let planners/analytics consume run-local evidence without duplicating storage.

Example (illustrative):
```sql
CREATE VIEW screen_observations_view AS
SELECT run_id, step_ordinal, screen_id, upsert_kind, source_run_seq, created_at
FROM graph_persistence_outcomes
WHERE upsert_kind IN ('discovered','mapped');
```

---

## Database Schema

### `screens`
```sql
CREATE TABLE screens (
  screen_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  layout_hash TEXT NOT NULL,
  perceptual_hash64 TEXT,
  first_seen_run_id TEXT NOT NULL,
  latest_seen_run_id TEXT NOT NULL,
  seen_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, layout_hash)
);
```

### `actions`
```sql
CREATE TABLE actions (
  action_id TEXT PRIMARY KEY,
  screen_id TEXT NOT NULL REFERENCES screens(screen_id),
  verb TEXT NOT NULL,
  target_key TEXT NOT NULL,
  origin TEXT, -- 'xml' | 'llm' | 'heuristic'
  tap_x INTEGER, -- optional for coordinate-originated actions
  tap_y INTEGER,
  selector_snapshot TEXT, -- xpath/css at action time
  input_payload JSONB, -- text or other inputs
  params JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `edges`
```sql
CREATE TABLE edges (
  edge_id TEXT PRIMARY KEY,
  from_screen_id TEXT NOT NULL REFERENCES screens(screen_id),
  action_id TEXT NOT NULL REFERENCES actions(action_id),
  to_screen_id TEXT NOT NULL REFERENCES screens(screen_id),
  evidence_counter INTEGER DEFAULT 1,
  last_evidence_run_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_screen_id, action_id, to_screen_id)
);
```

### `graph_persistence_outcomes`
```sql
CREATE TABLE graph_persistence_outcomes (
  outcome_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_ordinal INTEGER NOT NULL,
  screen_id TEXT,
  action_id TEXT,
  to_screen_id TEXT,
  upsert_kind TEXT NOT NULL,
  source_run_seq BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(run_id, step_ordinal)
);
```

### `action_execution_coverage` (new)
```sql
CREATE TABLE action_execution_coverage (
  run_id TEXT NOT NULL,
  action_id TEXT NOT NULL REFERENCES actions(action_id),
  attempted_count INTEGER DEFAULT 0,
  succeeded_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (run_id, action_id)
);
```

### `graph_projection_cursors`
```sql
CREATE TABLE graph_projection_cursors (
  run_id TEXT PRIMARY KEY,
  next_seq BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Logging

### Module & Actor
- **Module**: `graph`
- **Actor**: `projector`

### Per-Screen Logs
```typescript
logger.info("screen projected", {
  runId,
  stepOrdinal,
  screenId,
  upsertKind: "discovered" | "mapped",
  layoutHash,
  seenCount,
  sourceRunSeq
});
```

### Batch Summary
```typescript
logger.info("projection batch processed", {
  runId,
  eventsProcessed,
  projectedScreens,
  durationMs,
  cursorPosition: nextSeq
});
```

---

## Operations

### Replay Projection for a Run
```sql
UPDATE graph_projection_cursors 
SET next_seq = 1 
WHERE run_id = '<run_id>';
```

Or via repo method:
```typescript
await graphRepo.resetCursor(runId);
```

### Monitor Projection Lag
Compare `eventSeq` in logs vs `source_run_seq` in outcomes:
```sql
SELECT 
  run_id,
  MAX(source_run_seq) as last_projected_seq,
  NOW() - MAX(created_at) as lag
FROM graph_persistence_outcomes
GROUP BY run_id;
```

### Action Coverage Snapshot (per run)
```sql
SELECT a.screen_id,
       a.action_id,
       c.attempted_count,
       c.succeeded_count,
       c.failed_count
FROM actions a
LEFT JOIN action_execution_coverage c ON c.action_id = a.action_id AND c.run_id = $1
WHERE a.screen_id IN (
  SELECT screen_id FROM screens s WHERE s.first_seen_run_id = $1 OR s.latest_seen_run_id = $1
)
ORDER BY a.screen_id;
```

### Check Screen Deduplication
```sql
SELECT 
  screen_id,
  app_id,
  layout_hash,
  seen_count,
  first_seen_run_id,
  latest_seen_run_id
FROM screens
WHERE app_id = '<app_id>'
ORDER BY seen_count DESC;
```

---

## Dependencies

### Required Services
- **`artifacts`**: For downloading UI XML layouts
- **`run_events`**: Source of truth for projection
- **`runs`**: Run metadata
- **`app_fg_contexts`**: App-level metadata

### Artifact Download Flow
1. Parse `agent.event.ui_hierarchy_captured` for artifact reference
2. Call `artifacts.get(artifactId)`
3. Extract XML from stored artifact
4. Normalize and hash

---

## Metrics (Future)

### Planned Encore Metrics
- `graph_projection_lag_seconds` - Time between event creation and projection
- `graph_projection_batch_duration_ms` - Processing time per batch
- `graph_screens_total` - Total unique screens per app
- `graph_edges_total` - Total navigation edges per app
- `graph_projection_errors_total` - Failed projections
- `graph_action_coverage_ratio` - Executed actions / total actions (per run and global)

### Current Observability
Logs provide full operational visibility until metrics are standardized.

---

## Testing

### Unit Tests
- Hasher normalization (whitespace, attribute order)
- Deterministic ID generation
- Deduplication logic

### Integration Tests
- End-to-end projection from `run_events`
- Cursor management and replay
- Idempotency verification

### Manual Verification
1. Start a run with Perceive nodes
2. Query `graph_persistence_outcomes` for outcomes
3. Check `screens` table for deduplicated records
4. Verify `seen_count` increments on re-perception

---

## Phases & Work Division (Two Agents)

### Phase 1: Projection Join + Schema Additions
- Agent A:
  - Add `source_run_seq` to `graph_persistence_outcomes` (migration 004)
  - Update projector to populate `source_run_seq`
  - Implement `action_execution_coverage` writes (attempt/success/fail events)
- Agent B:
  - Extend run stream join to interleave `graph.*` based on `source_run_seq`
  - Define typed DTOs for `graph.*` SSE payloads

Acceptance:
- Logs show interleaved `agent.*` and `graph.*` events with stable ordering
- Coverage table updates visible after actions

### Phase 2: Endpoints (Run-Scoped Graph & Stream)
- Agent A:
  - Implement `GET /graph/run/:runId` with filters and metadata
  - Add pagination; ensure types align with Encore validation
- Agent B:
  - Implement `GET /graph/run/:runId/stream` with `replay` and `fromSeq`
  - Add tests for live and ended runs (replay then close)

Acceptance:
- API Explorer shows both endpoints; sample runs return expected shapes
- SSE works in browser; messages include `seqRef` correlation

### Phase 3: Deterministic Replay Support
- Agent A:
  - Extend `actions` writes to persist `origin`, `coordinates`, `selector_snapshot`, `input_payload`
  - Document replay invariants and preconditions
- Agent B:
  - Provide a `replay` helper/CLI (dev-only) that replays a run using graph data
  - Add verification via `layout_hash` post-action

Acceptance:
- Replay reproduces the same screen sequence for a stable device profile
- Mismatch triggers verification errors with structured logs

### Phase 4: Coverage-Driven Crawling Hooks
- Agent A:
  - Expose `GET /graph/run/:runId/coverage` summary
  - Add `unexplored_actions` computation
- Agent B:
  - Add lightweight endpoint to fetch last visited screens/actions for LLM
  - Ensure outputs are deterministic and typed (no `any`)

Acceptance:
- Coverage endpoints guide a crawler to pick next actions deterministically
- LLM input contract is stable and documented

---

## LLM Integration Data Contract (Future)
- Last N visited screens (ids, layout_hash, timestamps)
- Available actions per current screen with provenance and selectors
- Unexplored actions prioritized by coverage deficit
- Strict DTOs only; no magic strings; enums for verbs and origins
