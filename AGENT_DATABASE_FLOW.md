# Agent Database Flow Documentation

## Overview
This document maps the complete flow of database operations from the `/start` API call through the XState agent machine execution, showing which tables are updated at each layer.

## Database Tables Overview

### Core Tables
- **`runs`**: Main run lifecycle and metadata
- **`run_events`**: Append-only event log with sequence numbers
- **`run_outbox`**: Publishing cursor for event streaming
- **`agent_state_snapshots`**: Full state snapshots per step for resume capability

### Graph Tables
- **`screens`**: UI screen records with perceptual hashes
- **`actions`**: Action definitions per screen
- **`edges`**: Screen-to-screen transitions via actions
- **`artifacts_index`**: References to screenshots, XML, etc.

### Analysis Tables
- **`action_candidates`**: Generated action options per step
- **`decisions`**: LLM decision records
- **`execution_outcomes`**: Action execution results
- **`verification_assessments`**: Progress verification results
- **`progress_evaluations`**: Progress detection results
- **`continuation_decisions`**: Should-continue decisions
- **`recovery_dispositions`**: Error recovery actions
- **`checkpoints_index`**: Checkpoint references
- **`graph_persistence_outcomes`**: Graph update results

---

## Flow Breakdown by Layer

### 1. API Layer (`/start` endpoint)

**File**: `backend/run/start.ts`  
**Function**: `start()`  
**Table**: `runs`

**Database Operations**:
```sql
INSERT INTO runs (
  run_id, tenant_id, project_id, app_config_id, status, 
  created_at, updated_at, processing_by, lease_expires_at, 
  heartbeat_at, started_at, finished_at, cancel_requested_at, stop_reason
) VALUES (
  ${runId}, ${tenantId}, ${projectId}, ${appConfigId}, 'queued',
  NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL
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
SET processing_by = ${workerId}, 
    lease_expires_at = NOW() + INTERVAL '${leaseDurationMs} milliseconds',
    status = 'running',
    started_at = NOW(),
    updated_at = NOW()
WHERE run_id = ${runId} 
  AND (processing_by IS NULL OR lease_expires_at < NOW())
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
**Tables**: `run_events`, `agent_state_snapshots`

**Database Operations**:

1. **Get Latest Snapshot** (`backend/agent/persistence/agent-state.repo.ts`):
```sql
SELECT state_json FROM agent_state_snapshots 
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
VALUES (${runId}, ${sequence}, 'run.started', NULL, ${payload}, ${timestamp})
```

4. **Save Initial Snapshot** (`backend/agent/persistence/agent-state.repo.ts`):
```sql
INSERT INTO agent_state_snapshots (run_id, step_ordinal, node_name, state_json, created_at, updated_at)
VALUES (${runId}, 0, ${nodeName}, ${stateJson}, ${createdAt}, ${updatedAt})
ON CONFLICT (run_id, step_ordinal) DO UPDATE SET ...
```

**What it does**: Resumes from snapshot or creates initial state and events

---

### 5. XState Machine Execution Layer

**File**: `backend/agent/engine/xstate/agent.machine.ts`  
**Function**: `createAgentMachine()`  
**Tables**: `run_events`, `agent_state_snapshots`

**Database Operations** (per node execution):

1. **Persist Events** (`backend/agent/persistence/run-events.repo.ts`):
```sql
INSERT INTO run_events (run_id, seq, kind, node_name, payload, created_at)
VALUES (${runId}, ${sequence}, ${kind}, ${nodeName}, ${payload}, ${timestamp})
ON CONFLICT (run_id, seq) DO NOTHING
```

2. **Save State Snapshot** (`backend/agent/persistence/agent-state.repo.ts`):
```sql
INSERT INTO agent_state_snapshots (run_id, step_ordinal, node_name, state_json, created_at, updated_at)
VALUES (${runId}, ${stepOrdinal}, ${nodeName}, ${stateJson}, ${createdAt}, ${updatedAt})
ON CONFLICT (run_id, step_ordinal) DO UPDATE SET ...
```

**What it does**: Orchestrates node execution and persists state/events after each step

---

### 6. Individual Node Execution Layer

#### Setup Nodes

**EnsureDevice Node** (`backend/agent/nodes/setup/EnsureDevice/handler.ts`)
- **Tables**: `driver_runtime_contexts`
- **What it does**: Establishes device connection and persists driver context

**ProvisionApp Node** (`backend/agent/nodes/setup/ProvisionApp/handler.ts`)
- **Tables**: `app_fg_contexts`
- **What it does**: Installs/launches app and persists app context

#### Main Loop Nodes

**Perceive Node** (`backend/agent/nodes/main/perceive.ts`)
- **Tables**: `artifacts_index`
- **What it does**: Captures screenshot/XML and indexes artifacts

**EnumerateActions Node** (`backend/agent/nodes/main/enumerate-actions.ts`)
- **Tables**: `action_candidates`
- **What it does**: Generates action candidates using LLM

**ChooseAction Node** (`backend/agent/nodes/main/choose-action.ts`)
- **Tables**: `decisions`
- **What it does**: Records LLM decision for action selection

**Act Node** (`backend/agent/nodes/main/act.ts`)
- **Tables**: `execution_outcomes`
- **What it does**: Records action execution results

**Persist Node** (`backend/agent/nodes/main/persist.ts`)
- **Tables**: `screens`, `actions`, `edges`, `artifacts_index`, `graph_persistence_outcomes`
- **What it does**: Updates exploration graph with new screens/actions

**Verify Node** (`backend/agent/nodes/main/verify.ts`)
- **Tables**: `verification_assessments`
- **What it does**: Records verification results

**DetectProgress Node** (`backend/agent/nodes/main/detect-progress.ts`)
- **Tables**: `progress_evaluations`
- **What it does**: Records progress detection results

**ShouldContinue Node** (`backend/agent/nodes/main/should-continue.ts`)
- **Tables**: `continuation_decisions`
- **What it does**: Records continuation decisions

---

### 7. Event Publishing Layer

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

2. **Advance Outbox Cursor**:
```sql
UPDATE run_outbox
SET last_published_seq = ${publishedSeq},
    next_seq = ${publishedSeq + 1},
    updated_at = NOW()
WHERE run_id = ${runId}
```

**What it does**: Publishes events to SSE stream and advances publishing cursor

---

### 8. Run Completion Layer

**File**: `backend/agent/orchestrator/worker.ts`  
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
2. **Pub/Sub** → Publishes RunJob message
3. **Subscription** → Claims run, sets up `run_outbox` cursor
4. **Orchestrator** → Loads/creates state, records "run.started" event, saves initial snapshot
5. **XState Machine** → Executes nodes in sequence, persisting events and snapshots after each step
6. **Node Execution** → Each node updates relevant analysis/graph tables
7. **Event Publishing** → Publishes events to SSE stream via outbox pattern
8. **Completion** → Updates `runs` status to final state

## Key Database Patterns

### Event Sourcing
- All state changes recorded as events in `run_events`
- Events have monotonic sequence numbers
- State snapshots allow fast resume

### Outbox Pattern
- Events written to `run_events` first
- `run_outbox` tracks publishing progress
- Ensures reliable event delivery

### Graph Persistence
- Screens and actions stored in normalized tables
- Edges represent screen transitions
- Artifacts indexed for retrieval

### Analysis Tracking
- Every decision and outcome recorded
- Enables debugging and optimization
- Supports ML training data collection
