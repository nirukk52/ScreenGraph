# Outbox Pattern Implementation

## Overview

This document describes the implementation of the outbox pattern for reliable event streaming in ScreenGraph.

## Architecture

The outbox pattern decouples event creation from event publishing by:
1. **Orchestrator** writes events to `run_events` table (immutable event log)
2. **Outbox Publisher** polls `run_outbox` cursors and publishes events to streaming layer
3. **Cursor Management** tracks `next_seq` and `last_published_seq` per run

## Components

### 1. RunOutboxDbPort (`backend/agent/ports/run-outbox.port.ts`)
Interface defining outbox cursor operations:
- `ensureOutboxCursor(runId)` - Creates cursor when run starts
- `getCursor(runId)` - Retrieves current cursor state
- `advanceCursor(runId, publishedSeq)` - Updates cursor after publishing

### 2. RunOutboxRepo (`backend/agent/persistence/run-outbox.repo.ts`)
SQL-backed implementation of RunOutboxDbPort:
- Uses `run_outbox` table to track per-run publishing cursors
- Manages sequence numbers for ordered event publishing

### 3. Orchestrator Updates (`backend/agent/orchestrator/orchestrator.ts`)
- Added `outboxDb` dependency to constructor
- Calls `ensureOutboxCursor()` during initialization to create cursor for each run

### 4. Outbox Publisher (`backend/run/outbox-publisher.ts`)
Rewritten to use proper cursor-based pattern:
- Polls `run_outbox` table every 200ms
- For each active cursor, fetches unpublished events from `run_events` starting at `next_seq`
- Publishes events in sequential order
- Updates `published_at` timestamp in `run_events`
- Advances cursor after successful publication

### 5. Database Schema (`backend/db/migrations/002_crawl_outbox.up.sql`, `003_agent_state_schema.up.sql`)
`run_outbox` table structure:
```sql
CREATE TABLE run_outbox (
  run_id TEXT PRIMARY KEY,
  next_seq BIGINT NOT NULL DEFAULT 1,
  last_published_seq BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## How It Works

### 1. Run Initialization
When a run starts, the Orchestrator calls `ensureOutboxCursor()` to create a cursor entry:
- `next_seq = 1` (start from first event)
- `last_published_seq = 0` (nothing published yet)

### 2. Event Recording
Orchestrator writes events to `run_events` table with sequential `seq` numbers:
- Events are written immediately
- No blocking on publishing
- Events are immutable once written

### 3. Event Publishing
Outbox publisher polls every 200ms:
1. Fetches all active cursors from `run_outbox`
2. For each cursor, queries `run_events` where `seq >= next_seq` and `published_at IS NULL`
3. Publishes events in order
4. Marks events as published by setting `published_at = NOW()`
5. Advances cursor: `last_published_seq = max(seq)`, `next_seq = max(seq) + 1`

### 4. Cursor Advancement
After successfully publishing a batch of events:
- Updates `last_published_seq` to the highest published sequence
- Sets `next_seq` to the next sequence to publish
- Updates `updated_at` timestamp

## Benefits

1. **Event Ordering**: Events are always published in sequential order
2. **Fault Tolerance**: If publishing fails, events remain in database for retry
3. **Decoupling**: Orchestrator doesn't block on streaming availability
4. **Reliability**: Survives Redis/streaming service downtime
5. **Replay Capability**: Can replay events from database source of truth

## Performance Characteristics

- **Polling Interval**: 200ms (configurable)
- **Batch Size**: Up to 100 events per run per poll
- **Cursor Limit**: Processes up to 50 runs per poll cycle
- **Max Events/Second**: ~500 events/sec theoretical throughput

## Future Enhancements

1. **Redis Publishing**: Replace TODO with actual Redis Pub/Sub publishing
2. **WebSocket Streaming**: Emit events to WebSocket connections
3. **Monitoring**: Add metrics for publishing latency and failures
4. **Retry Logic**: Implement exponential backoff for failed publishes
5. **Cleanup**: Archive old published events after retention period

## Related Files

- `backend/agent/ports/run-outbox.port.ts` - Interface definition
- `backend/agent/persistence/run-outbox.repo.ts` - Implementation
- `backend/agent/orchestrator/orchestrator.ts` - Orchestrator with outbox integration
- `backend/agent/orchestrator/subscription.ts` - Dependency injection
- `backend/run/outbox-publisher.ts` - Publisher implementation
- `backend/db/migrations/002_crawl_outbox.up.sql` - Schema definition
- `backend/db/migrations/003_agent_state_schema.up.sql` - Also contains schema

## Testing

To test the implementation:
1. Start a run (creates cursor entry)
2. Wait for events to be recorded
3. Monitor logs for outbox publisher activity
4. Verify events are published in order
5. Check `run_outbox` table for cursor advancement

