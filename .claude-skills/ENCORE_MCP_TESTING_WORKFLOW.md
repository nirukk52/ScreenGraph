# Encore MCP Testing Workflow 🔥

**Date**: 2025-11-09  
**Status**: ✅ Correct Approach

## The Right Way to Test Backends

### ❌ OLD WAY (Wrong)
```bash
# Start encore run in terminal 1
cd backend && encore run

# Run test in terminal 2  
cd backend && encore test

# Check dashboard manually
# Open http://localhost:9400
```

**Problems:**
- Requires two terminals
- `encore run` needed just for debugging
- Can't inspect `encore test` runtime
- Dashboard shows wrong environment

### ✅ NEW WAY (Correct)
```bash
# Just run the test
cd .cursor && task backend:integration:metrics

# Use Encore MCP to debug
# (Claude/AI agents use MCP tools directly)
```

**Benefits:**
- Single command
- No `encore run` required
- Inspect `encore test` runtime directly
- Programmatic debugging

## Encore MCP Tools for Testing

### 1. Query Test Database

```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT run_id, status, stop_reason, created_at
      FROM runs 
      ORDER BY created_at DESC 
      LIMIT 5
    `
  }]
})
```

**Use when:** Need to see recent test runs and their outcomes

### 2. Get Run Events

```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT event_type, sequence_number, payload 
      FROM run_events 
      WHERE run_id = '01K9KEVM6VFB6M5AB7AE04Y1RW'
      ORDER BY sequence_number
    `
  }]
})
```

**Use when:** Need to see full event timeline for a failed run

### 3. Check Agent State

```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT 
        snapshot->>'nodeName' as node_name,
        snapshot->>'status' as status,
        snapshot->>'stopReason' as stop_reason,
        created_at
      FROM agent_state_snapshots 
      WHERE run_id = '01K9KEVM6VFB6M5AB7AE04Y1RW'
      ORDER BY created_at DESC 
      LIMIT 1
    `
  }]
})
```

**Use when:** Need to see where agent got stuck

### 4. Count Discovered Screens

```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT COUNT(DISTINCT screen_id) as screen_count
      FROM graph_persistence_outcomes 
      WHERE run_id = '01K9KEVM6VFB6M5AB7AE04Y1RW'
        AND upsert_kind = 'discovered'
    `
  }]
})
```

**Use when:** Validating metrics for deterministic testing

### 5. Get Service Metadata

```typescript
mcp_encore-mcp_get_services({ 
  services: ["run", "agent"], 
  include_endpoints: true,
  include_schemas: true
})
```

**Use when:** Need to understand endpoint signatures or service structure

### 6. Inspect PubSub Topics

```typescript
mcp_encore-mcp_get_pubsub()
```

**Use when:** Debugging subscription issues or message flows

### 7. Get Database Schema

```typescript
mcp_encore-mcp_get_databases({ 
  include_tables: true 
})
```

**Use when:** Writing new queries or understanding table relationships

## Complete Debugging Workflow

### Step 1: Run Test
```bash
cd .cursor && task backend:integration:metrics
```

### Step 2: Get Latest Run ID
```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: "SELECT run_id, status, stop_reason FROM runs ORDER BY created_at DESC LIMIT 1"
  }]
})
```

**Output:**
```json
{
  "run_id": "01K9KEVM6VFB6M5AB7AE04Y1RW",
  "status": "failed",
  "stop_reason": "failed"
}
```

### Step 3: Get Run Events
```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT event_type, payload 
      FROM run_events 
      WHERE run_id = '01K9KEVM6VFB6M5AB7AE04Y1RW'
      ORDER BY sequence_number
    `
  }]
})
```

**Analyze:** Which node did it fail at? What was the last event?

### Step 4: Get Agent State
```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT snapshot 
      FROM agent_state_snapshots 
      WHERE run_id = '01K9KEVM6VFB6M5AB7AE04Y1RW'
      ORDER BY created_at DESC 
      LIMIT 1
    `
  }]
})
```

**Analyze:** What node was executing? What counters/budgets were set?

### Step 5: Check Metrics
```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT payload->>'metrics' as metrics
      FROM run_events 
      WHERE run_id = '01K9KEVM6VFB6M5AB7AE04Y1RW'
        AND event_type = 'agent.run.finished'
    `
  }]
})
```

**Analyze:** Were metrics captured before failure?

## Common Queries for Testing

### Find All Failed Runs
```sql
SELECT run_id, stop_reason, created_at 
FROM runs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10
```

### Find Runs That Got Stuck at Specific Node
```sql
SELECT r.run_id, a.snapshot->>'nodeName' as stuck_node
FROM runs r
JOIN agent_state_snapshots a ON r.run_id = a.run_id
WHERE r.status = 'failed'
  AND a.created_at = (
    SELECT MAX(created_at) 
    FROM agent_state_snapshots 
    WHERE run_id = r.run_id
  )
ORDER BY r.created_at DESC
```

### Compare Successful vs Failed Runs
```sql
-- Successful run event count
SELECT COUNT(*) FROM run_events WHERE run_id = 'successful_run_id';

-- Failed run event count
SELECT COUNT(*) FROM run_events WHERE run_id = 'failed_run_id';

-- Missing events in failed run
SELECT DISTINCT event_type 
FROM run_events 
WHERE run_id = 'successful_run_id'
AND event_type NOT IN (
  SELECT event_type FROM run_events WHERE run_id = 'failed_run_id'
);
```

## Integration with backend-testing_skill

The `backend-testing_skill` now includes Encore MCP examples for all testing patterns:

- Pattern 1: Unit Test (direct endpoint calls)
- Pattern 2: Integration Test Database (query results)
- Pattern 3: Integration Test PubSub (verify message flow)
- Pattern 4: Metrics Test (validate deterministic behavior)

**All patterns**: Use Encore MCP for debugging instead of manual inspection!

## Key Benefits

1. **No Manual Dashboard Checks** - Query programmatically
2. **Isolated Test Runtime** - `encore test` creates clean environment
3. **Repeatable** - Same queries work every time
4. **AI-Friendly** - Claude/agents can use MCP tools directly
5. **Version Controlled** - Queries can be saved in test helpers

## Update Your Workflow

### Before (Manual)
```bash
cd backend && encore run      # Terminal 1
cd backend && encore test      # Terminal 2
# Open dashboard, click around, find run, check events manually
```

### After (Automated)
```bash
cd .cursor && task backend:integration:metrics
# Use Encore MCP tools to query results programmatically
```

**This is the way.** 🚀

