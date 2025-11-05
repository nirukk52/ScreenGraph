## Graph Projection Service

### Purpose
Consume `run_events` and maintain derived screen graph tables (`screens`, `actions`, `edges`, `graph_persistence_outcomes`).

### Architecture
- **Event-Sourced Projection**: Derives graph state from `run_events` (single-sink design)
- **Background Worker**: Started from `encore.service.ts` via `startGraphProjector()`
- **Idempotent Processing**: Safe to replay or retry without duplication

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

### Edge Creation (Future)
When an action results in a transition:
1. Correlate sequence: Perceive A → Act → Perceive B
2. Find `action_id` from screen A's action list
3. Upsert `edges` row: `screen_a_id → action_id → screen_b_id`
4. Increment `evidence_counter` if edge exists
5. Emit `graph.edge.created` or `graph.edge.reinforced`

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
