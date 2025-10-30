# Session Summary: Graph Projection Service Implementation

**Date:** 2025-01-27  
**Session:** Graph Projection Service (Iteration 1) Implementation  
**Commit:** 777cd49

## Overview
Implemented a background Graph Projection Service that consumes `run_events` and maintains derived graph tables (`screens`, `graph_persistence_outcomes`) while preserving the single-sink architecture principle.

## Key Achievements

### 1. Single-Sink Architecture Compliance
- Agent subsystem writes ONLY to `run_events` table
- Graph projection service consumes `run_events` and derives state
- No writes back to `run_events` from projection (preserves audit trail)
- Enables deterministic replay and clear separation of concerns

### 2. Graph Projection Service Structure
**Files Created:**
- `backend/graph/encore.service.ts` - Service boundary, auto-starts projector
- `backend/graph/projector.ts` - Background loop (300ms polling)
- `backend/graph/repo.ts` - Typed DB repository layer
- `backend/graph/hasher.ts` - XML normalization and deterministic hashing
- `backend/graph/types.ts` - DTOs and contracts
- `backend/graph/hasher.test.ts` - Unit tests for hashing utilities
- `backend/graph/README.md` - Operations documentation

**Migration:**
- `backend/db/migrations/007_graph_projection.up.sql` - Cursors table + source_run_seq column

### 3. Implementation Patterns Established

#### Cursor-Based Replay
- `graph_projection_cursors` table tracks per-run sequence pointers
- Automatic cursor hydration for new runs
- Fair scheduling via `updated_at` ordering
- Supports manual replay via `resetCursor()` helper

#### Deterministic Identifiers
- Screen IDs: `sha256(appId::layoutHash)[:32]` (not DB-generated UUIDs)
- Outcome IDs: `${runId}-${stepOrdinal.padStart(6,'0')}`
- Ensures idempotency without unique constraints
- Enables cross-run deduplication

#### XML Normalization & Layout Hashing
**Steps:**
1. Strip XML declaration tags
2. Normalize line endings (CRLF → LF)
3. Trim each line
4. Filter empty lines
5. Collapse inter-tag whitespace

**Hash:** `sha256(\`${appId}::${normalizedXml}\`)`

**Fallback:** Uses `perceptualHash64` if artifact download fails

#### Event Context Tracking
- Maintains ephemeral per-run context: `pendingStepOrdinal`, `pendingUiRefId`
- Tracks Perceive node lifecycle: `agent.node.started` → `agent.event.ui_hierarchy_captured` → `agent.event.screen_perceived` → `agent.node.finished`
- Cleans context after projection

### 4. Integration Points
- Uses Encore generated clients (`~encore/clients`) for artifacts service
- Retrieves UI hierarchy XML via `artifactsBucket.download()`
- Fetches run metadata from `runs` and `app_fg_contexts` tables
- Structured logging: `module: "graph"`, `actor: "projector"`

### 5. Logging & Observability
- Per-screen logs: `eventSeq`, `stepOrdinal`, `outcomeKind`, `screenId`
- Batch summaries: `eventsProcessed`, `projectedScreens`, `durationMs`
- Warnings for missing context/artifacts
- Metrics deferred to future iteration (logs sufficient for ops)

## Procedures Established

### Graph Projection Implementation Procedure
1. Create Encore service boundary (`encore.service.ts`)
2. Implement background loop with cursor management
3. Create typed repository layer for DB operations
4. Implement event handlers with ephemeral context tracking
5. Use deterministic hashing for entity IDs
6. Record outcomes with source sequence correlation
7. Add structured logging throughout
8. Write unit tests for pure functions (hashing utilities)

### Screen Identification Procedure
1. Attempt to download UI hierarchy XML artifact
2. Normalize XML using standard procedure
3. Compute layout hash: `sha256(appId::normalizedXml)`
4. Derive screen ID: `sha256(appId::layoutHash)[:32]`
5. Upsert screen row (check existence first)
6. Record outcome: `discovered` (new) or `mapped` (existing)

## Preferences Established

### Deterministic Hashing Over UUIDs
- Always prefer deterministic identifiers for entities that should deduplicate
- Pattern: `sha256(scope::content)[:length]` for IDs
- Enables idempotent inserts without database unique constraints

### Background Loop Patterns
- Polling interval: 300ms (balanced latency vs CPU)
- Batch size: 100 events per run per tick
- Cursor limit: 50 concurrent runs processed per tick
- Use `updated_at` ordering for fair scheduling

### Single-Sink Architecture
- Agent writes events only
- Projections consume events and derive state
- Never write derived events back to event log
- Maintain separate cursor tables per projection

## Facts Recorded

### Architecture Boundaries
- Agent subsystem: Single writer to `run_events`
- Graph projection: Read-only consumer of `run_events`
- Artifacts service: Provides object storage (downloads via bucket API)
- No cross-boundary writes (preserves separation of concerns)

### Database Schema Changes
- `graph_projection_cursors`: `(run_id PK, next_seq, updated_at)`
- `graph_persistence_outcomes.source_run_seq`: Correlates outcomes to source events

### Performance Characteristics
- Theoretical throughput: ~333 batches/second (300ms interval)
- Max events processed: 50 runs × 100 events = 5000 events/tick
- Idempotency: Handled via deterministic IDs + conflict resolution

## Future Work (Not in Iteration 1)

### SSE Integration
- Extend `/run/:id/stream` to emit `graph.*` messages
- Join `graph_persistence_outcomes` with `run_events` by `source_run_seq`
- Emit one message per Perceive step showing discovered vs mapped

### Metrics
- Add Encore metrics for projection latency, throughput, discovery ratios
- Alert on projection lag > 2 seconds

### Edge Projection
- Project action events to create labeled edges
- Link screens via action sequences

## Testing Status
- ✅ Unit tests for hashing utilities (`hasher.test.ts`)
- ⏸️ Integration tests deferred (verify via Encore dashboard logs per standard practice)
- ⏸️ Idempotency tests deferred (low-level implementation detail)

## Related Files
- Approach document: `GRAPH_PROJECTION_APPROACH.md`
- Service README: `backend/graph/README.md`
- Migration: `backend/db/migrations/007_graph_projection.up.sql`

