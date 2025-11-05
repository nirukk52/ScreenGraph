# Agent Database Flow Documentation

## Overview
This document maps the complete flow of database operations from the `/start` API call through the XState agent machine execution, showing which tables are updated at each layer.

**Status**: ✅ Updated for Migration 008 (MVP Schema - Multi-tenancy removed)

## Database Tables Overview

### Core Tables (MVP)
- **`runs`**: Main run lifecycle and metadata
- **`run_events`**: Append-only event log with sequence numbers
- **`run_outbox`**: Publishing cursor for event streaming
- **`run_state_snapshots`**: Full state snapshots per step (renamed from `agent_state_snapshots`)
- **`run_artifacts`**: References to screenshots, XML, etc. (renamed from `artifacts_index`)

### Graph Tables (MVP)
- **`screens`**: UI screen records with perceptual/layout hashes
- **`actions`**: Action definitions per screen
- **`edges`**: Screen-to-screen transitions via actions
- **`graph_persistence_outcomes`**: Graph update tracking per step
- **`graph_projection_cursors`**: Graph projection state

---

## Flow Breakdown by Layer

### 1. API Layer (`/start` endpoint)

**File**: `backend/run/start.ts`  
**Function**: `start()`  
**Table**: `runs`

**Database Operations**:
```sql
INSERT INTO runs (
  run_id, app_package, status, 
  created_at, updated_at
) VALUES (
  ${runId}, ${packageName}, 'queued',
  NOW(), NOW()
)
```

**What it does**: Creates initial run record with status "queued"

---

### 2. Pub/Sub Layer

**File**: `backend/run/start.ts`  
**Function**: `start()` (publish)  
**Topic**: `run-job`

**What it does**: Publishes RunJob message to topic (no direct DB operation)

---

### 3. Orchestrator Subscription Layer

**File**: `backend/agent/orchestrator/subscription.ts`  
**Function**: Subscription handler  
**Tables**: `runs`, `run_outbox`

**Database Operations**:

1. **Claim Run** (`backend/agent/persistence/run-db.repo.ts`):
```sql
UPDATE runs 
SET worker_id = ${workerId}, 
    lease_expires_at = NOW() + INTERVAL '${leaseDurationMs} milliseconds',
    status = 'running',
    started_at = NOW(),
    updated_at = NOW()
WHERE run_id = ${runId} 
  AND (worker_id IS NULL OR lease_expires_at < NOW())
```

2. **Ensure Outbox Cursor** (`backend/agent/persistence/run-outbox.repo.ts`):
```sql
INSERT INTO run_outbox (run_id, next_seq, last_published_seq, updated_at)
VALUES (${runId}, 1, 0, NOW())
ON CONFLICT (run_id) DO NOTHING
```

**What it does**: Claims run for processing and sets up event publishing cursor

---

### 4. Orchestrator Initialization Layer

**File**: `backend/agent/orchestrator/orchestrator.ts`  
**Function**: `initialize()`  
**Tables**: `run_events`, `run_state_snapshots`

**Database Operations**:

1. **Get Latest Snapshot** (`backend/agent/persistence/agent-state.repo.ts`):
```sql
SELECT state_json FROM run_state_snapshots 
WHERE run_id = ${runId} 
ORDER BY step_ordinal DESC LIMIT 1
```

2. **Get Last Event Sequence** (`backend/agent/persistence/run-events.repo.ts`):
```sql
SELECT seq FROM run_events 
WHERE run_id = ${runId} 
ORDER BY seq DESC LIMIT 1
```

3. **Record Run Started Event** (`backend/agent/persistence/run-events.repo.ts`):
```sql
INSERT INTO run_events (run_id, seq, kind, node_name, payload, created_at)
VALUES (${runId}, ${sequence}, 'agent.run.started', NULL, ${payload}, ${timestamp})
```

4. **Save Initial Snapshot** (`backend/agent/persistence/agent-state.repo.ts`):
```sql
INSERT INTO run_state_snapshots (run_id, step_ordinal, node_name, state_json, created_at, updated_at)
VALUES (${runId}, 0, ${nodeName}, ${stateJson}, ${createdAt}, ${updatedAt})
ON CONFLICT (run_id, step_ordinal) DO UPDATE SET ...
```

**What it does**: Resumes from snapshot or creates initial state and events

---

### 5. XState Machine Execution Layer

**File**: `backend/agent/orchestrator/worker.ts`  
**Function**: `runWithXState()`  
**Tables**: `run_events`, `run_state_snapshots`

**Database Operations** (per node execution):

1. **Persist Events** (`backend/agent/persistence/run-events.repo.ts`):
```sql
INSERT INTO run_events (run_id, seq, kind, node_name, payload, created_at)
VALUES (${runId}, ${sequence}, ${kind}, ${nodeName}, ${payload}, ${timestamp})
```

2. **Save State Snapshot** (`backend/agent/persistence/agent-state.repo.ts`):
```sql
INSERT INTO run_state_snapshots (run_id, step_ordinal, node_name, state_json, created_at, updated_at)
VALUES (${runId}, ${stepOrdinal}, ${nodeName}, ${stateJson}, ${createdAt}, ${updatedAt})
ON CONFLICT (run_id, step_ordinal) DO UPDATE SET state_json = EXCLUDED.state_json, updated_at = EXCLUDED.updated_at
```

**What it does**: Orchestrates node execution and persists state/events after each step

---

### 6. Event Publishing Layer

**File**: `backend/run/outbox-publisher.ts`  
**Function**: `publishBatch()`  
**Tables**: `run_outbox`, `run_events`

**Database Operations**:

1. **Get Unpublished Events**:
```sql
SELECT run_id, seq, kind, node_name, payload, created_at
FROM run_events 
WHERE run_id = ${runId} AND seq > ${lastPublishedSeq}
ORDER BY seq ASC
```

2. **Mark Events Published**:
```sql
UPDATE run_events
SET published_at = NOW()
WHERE run_id = ${runId} AND seq > ${lastPublishedSeq}
```

3. **Advance Outbox Cursor**:
```sql
UPDATE run_outbox
SET last_published_seq = ${publishedSeq},
    next_seq = ${publishedSeq + 1},
    updated_at = NOW()
WHERE run_id = ${runId}
```

**What it does**: Publishes events to SSE stream and advances publishing cursor

---

### 7. Run Completion Layer

**File**: `backend/agent/orchestrator/orchestrator.ts`  
**Function**: `finalizeRun()`  
**Tables**: `runs`

**Database Operations**:
```sql
UPDATE runs 
SET status = ${finalStatus},
    finished_at = NOW(),
    stop_reason = ${stopReason},
    updated_at = NOW()
WHERE run_id = ${runId}
```

**What it does**: Marks run as completed/failed/canceled

---

## Complete Flow Summary

1. **API Call** → Creates `runs` record with status "queued"
2. **Pub/Sub** → Publishes RunJob message with app config
3. **Subscription** → Claims run with `worker_id`, sets up `run_outbox` cursor
4. **Orchestrator** → Loads/creates state, records "agent.run.started" event, saves initial snapshot
5. **XState Machine** → Executes nodes in sequence, persisting events and snapshots after each step
6. **Event Publishing** → Publishes events to SSE stream via outbox pattern
7. **Completion** → Updates `runs` status to final state (completed/failed/canceled)

## Key Database Patterns

### Event Sourcing
- All state changes recorded as events in `run_events`
- Events have monotonic sequence numbers per run
- State snapshots allow fast resume from any step

### Outbox Pattern
- Events written to `run_events` first (transactional)
- `run_outbox` tracks publishing progress
- `published_at` timestamp marks published events
- Ensures reliable event delivery to SSE stream

### MVP Simplifications (Migration 008)
- Removed multi-tenancy (`tenant_id`, `project_id`)
- Single `app_package` field instead of complex config
- Renamed tables for clarity (`agent_state_snapshots` → `run_state_snapshots`)
- Status uses ENUM type (no magic strings)
- Worker leasing via `worker_id` and `lease_expires_at`

