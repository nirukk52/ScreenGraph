# Database Schema Refactoring Summary

## Migration: 008_mvp_schema_refactor.up.sql

**Date**: 2025-11-05  
**Purpose**: Simplify database schema for MVP, enforce naming conventions, remove unnecessary complexity.

---

## Changes Made

### 1. **Dropped 11 Unnecessary Tables**

Tables removed as they store intermediate data better captured in events:

- `action_candidates` - Decision data (redundant with events)
- `decisions` - Rationale tracking (not MVP-critical)
- `execution_outcomes` - Timing/trace data (observability feature)
- `verification_assessments` - Verification scoring (derivable from events)
- `progress_evaluations` - Evaluation tracking (redundant with events)
- `continuation_decisions` - Continuation tracking (redundant with events)
- `recovery_dispositions` - Recovery logging (redundant with events)
- `checkpoints_index` - Checkpoint management (advanced feature)
- `driver_runtime_contexts` - Overly granular device tracking
- `app_fg_contexts` - Overly granular app context tracking
- `action_catalog` - Separate catalog (derivable from graph)
- `policies` - Multi-policy support (MVP uses single policy)

**Rationale**: MVP focuses on **Runs → Events → Graph**. These tables added complexity without core value.

---

### 2. **Fixed Status Fields (No More Magic Strings)**

#### Before:
```sql
status TEXT NOT NULL DEFAULT 'queued'
```

#### After:
```sql
CREATE TYPE run_status_enum AS ENUM (
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled'
);

status run_status_enum NOT NULL DEFAULT 'queued'
```

**Rationale**: Enforces valid values at database level, prevents typos, follows "NO MAGIC STRINGS" rule.

---

### 3. **Removed Multi-Tenancy (Simplified for MVP)**

#### Removed Columns:
- `tenant_id` from `runs`, `screens`, `edges`
- `project_id` from `runs`, `screens`, `edges`
- `app_id` → replaced with `app_package`

#### Before (screens table):
```sql
screen_id, tenant_id, project_id, app_id, layout_hash, ...
```

#### After (screens table):
```sql
screen_id, app_package, layout_hash, perceptual_hash, ...
```

**Rationale**: Multi-tenancy adds complexity. MVP serves single user. Can add back post-MVP if needed.

---

### 4. **Renamed Tables for Domain Clarity**

| Old Name | New Name | Reason |
|----------|----------|--------|
| `agent_state_snapshots` | `run_state_snapshots` | Snapshots belong to runs, not agents |
| `artifacts_index` | `run_artifacts` | Clearer ownership and purpose |

**Rationale**: Domain-oriented naming over technical naming. Tables should reflect business concepts.

---

### 5. **Simplified Core Tables**

#### runs
**Removed**:
- `policy_version` (multi-policy not needed)
- `processing_by`, `heartbeat_at` (complex lease management)
- `app_config_id` (replaced with `app_package`)

**Added**:
- `app_package TEXT NOT NULL` (clearer than app_config_id)
- `worker_id TEXT NULL` (simplified lease tracking)

#### screens
**Removed**:
- `ocr_stems_hash` (OCR advanced feature)
- `tenant_id`, `project_id` (multi-tenancy)
- `app_id` → `app_package`

**Renamed**:
- `perceptual_hash64` → `perceptual_hash` (shorter, no need for "64" in name)

#### actions
**Renamed**:
- `target_key` → `target_selector` (clearer semantic meaning)
- `bounds_norm` → `target_bounds` (consistent naming)

#### edges
**Removed**:
- `evidence_counter` (nice-to-have metric, not MVP)
- `tenant_id`, `project_id` (multi-tenancy)

---

### 6. **Added Table Comments (Documentation)**

Every table now has:
- `COMMENT ON TABLE` explaining its purpose
- `COMMENT ON COLUMN` for key fields

Example:
```sql
COMMENT ON TABLE runs IS 'Tracks agent exploration runs. Each run explores one app and generates graph data.';
COMMENT ON COLUMN runs.run_id IS 'Unique identifier for the run (ulid format)';
```

**Rationale**: Self-documenting schema makes onboarding easier, prevents misuse.

---

### 7. **Updated Foreign Key Constraints**

All tables now have proper FK constraints with `ON DELETE CASCADE`:
- `run_events.run_id → runs.run_id`
- `run_outbox.run_id → runs.run_id`
- `run_state_snapshots.run_id → runs.run_id`
- `run_artifacts.run_id → runs.run_id`
- `actions.screen_id → screens.screen_id`
- `edges.from_screen_id → screens.screen_id`
- `edges.action_id → actions.action_id`

**Rationale**: Data integrity enforced at database level, prevents orphaned records.

---

## Code Updates

### Files Updated:

1. **backend/graph/repo.ts** - Updated to use `app_package`, `run_state_snapshots`, `run_artifacts`, `source_event_seq`
2. **backend/graph/types.ts** - Changed `RunMetadata` to use `appPackage` instead of `tenantId/projectId/appId`
3. **backend/graph/hasher.ts** - Updated functions to use `appPackage` parameter
4. **backend/graph/projector.ts** - Updated to use `appPackage` field
5. **backend/agent/persistence/agent-state.repo.ts** - Changed table name to `run_state_snapshots`
6. **backend/agent/persistence/screen-graph.repo.ts** - Updated to use `app_package`, `run_artifacts`, `target_selector`
7. **backend/run/stream.ts** - Updated to use `app_package`, `source_event_seq`

---

## Schema Summary (Post-Refactor)

### Core Tables (8 total)

1. **runs** - Run lifecycle tracking
2. **run_events** - Immutable event log
3. **run_outbox** - Event publishing cursor
4. **run_state_snapshots** - State snapshots for replay
5. **run_artifacts** - Artifact index (screenshots, XML)
6. **screens** - Unique screens per app
7. **actions** - Actions discoverable on screens
8. **edges** - Screen transitions via actions
9. **graph_persistence_outcomes** - Graph projection tracking
10. **graph_projection_cursors** - Graph projector cursor

**Total**: 10 tables (down from 21)

---

## Benefits

### 1. **Clarity**
- Domain-oriented names (`app_package` not `app_id`)
- No technical jargon in table names
- Self-documenting via comments

### 2. **Simplicity**
- 50% fewer tables
- No multi-tenancy complexity
- Removed intermediate tracking tables

### 3. **Type Safety**
- ENUMs prevent magic strings
- Foreign keys enforce referential integrity
- Indexed fields for performance

### 4. **Maintainability**
- Less code to update
- Clearer ownership (runs → events → graph)
- Easier to reason about

---

## Migration Safety

### Backup Tables Created:
- `runs_backup`
- `run_events_backup`
- `screens_backup`
- `actions_backup`
- `edges_backup`
- `graph_persistence_outcomes_backup`

**Note**: Uncomment DROP statements in migration after verifying success.

---

## Rollback Plan

If issues arise:
1. Restore from backup tables
2. Revert code changes via git
3. Drop migration 008

```sql
-- Rollback script (if needed)
DROP TABLE IF EXISTS runs CASCADE;
CREATE TABLE runs AS SELECT * FROM runs_backup;
-- ... repeat for other tables
```

---

## Next Steps

1. ✅ Run migration: `encore db migrate up`
2. ✅ Verify schema: `\d+ runs` in psql
3. ✅ Test run creation: POST /run
4. ✅ Check logs in Encore dashboard
5. ✅ Verify graph projection works
6. ⏳ Drop backup tables after 1 week of stable operation

---

## Questions?

See:
- `008_mvp_schema_refactor.up.sql` for full migration
- `FOUNDERS.md` for naming conventions
- `backend/graph/README.md` for graph architecture




