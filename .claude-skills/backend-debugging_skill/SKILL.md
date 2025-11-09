---
name: backend-debugging
description: This skill should be used when debugging Encore.ts backend code or test failures. Leverages Encore MCP tools for runtime introspection, database queries, trace analysis, and systematic 10-phase debugging. Use this when tests fail, debugging production issues, or analyzing system behavior.
---

# Backend Debugging Skill

**Purpose:** Systematic debugging for Encore.ts backends using Encore MCP tools for runtime introspection.

---

## When to Use

Use this skill when:
- Backend tests fail and need investigation
- API endpoints return unexpected results
- Database queries produce wrong data
- PubSub messages aren't being delivered
- Performance issues or bottlenecks
- Analyzing agent run failures
- Understanding system behavior in production

**Prerequisite:** `encore run` must be active for MCP tools to work

---

## Encore MCP Tools - Your Primary Debugging Interface 🔥

**Key Principle:** Always use Encore MCP tools first before manual inspection

### Why Encore MCP?

1. **Programmatic** - Query systems via API, not manual clicks
2. **Repeatable** - Same queries work every time
3. **AI-Friendly** - Claude can use tools directly
4. **Fast** - No dashboard navigation needed
5. **Version Controlled** - Save queries for reuse

### MCP Tool Categories

| Category | Tools | Use Case |
|----------|-------|----------|
| **Database** | `query_database`, `get_databases` | Inspect data, validate state |
| **Services** | `get_services`, `call_endpoint` | Map APIs, test endpoints |
| **Traces** | `get_traces`, `get_trace_spans` | Analyze latency, find errors |
| **PubSub** | `get_pubsub` | Verify subscriptions, message flows |
| **Storage** | `get_storage_buckets`, `get_objects` | Check artifacts, files |
| **Metrics** | `get_metrics` | Monitor performance |

---

## 10-Phase Debugging Process

### Phase 1: Health Check

```bash
task backend:health
task backend:logs
```

**What to look for:**
- Is backend responding?
- Any crash logs?
- Database connected?

### Phase 2: Service Status

```bash
task founder:servers:status
encore logs
```

**What to look for:**
- Are all services running?
- Any error messages?
- Worker subscriptions active?

### Phase 3: Database State

**Use Encore MCP:**

```typescript
// Get database schema
mcp_encore-mcp_get_databases({ include_tables: true })

// Query recent runs
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: "SELECT run_id, status, stop_reason FROM runs ORDER BY created_at DESC LIMIT 5"
  }]
})
```

**What to look for:**
- Recent runs and their statuses
- Any failed runs?
- Stop reasons meaningful?

### Phase 4: Service Introspection

**Use Encore MCP:**

```typescript
// Get all services and endpoints
mcp_encore-mcp_get_services({ 
  include_endpoints: true,
  include_schemas: true
})

// Get specific service
mcp_encore-mcp_get_services({
  services: ["run", "agent"],
  include_endpoints: true
})
```

**What to look for:**
- Endpoint signatures correct?
- Types match expectations?
- All expected services present?

### Phase 5: Type Safety Check

```bash
task backend:test
```

**What to look for:**
- TypeScript errors?
- Type mismatches?
- Missing properties?

### Phase 6: Structured Logging Analysis

**Use Encore MCP to query logs:**

```typescript
// Get run events (structured logs)
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT kind, sequence, payload, created_at
      FROM run_events 
      WHERE run_id = '01K9KEVM6VFB6M5AB7AE04Y1RW'
      ORDER BY sequence
    `
  }]
})
```

**What to look for:**
- Event sequence complete?
- Missing events in timeline?
- Error payloads with details?

### Phase 7: PubSub/Outbox Analysis

**Use Encore MCP:**

```typescript
// Get all PubSub topics and subscriptions
mcp_encore-mcp_get_pubsub()

// Query run job status
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT run_id, status, processing_by
      FROM runs 
      WHERE status = 'queued'
      ORDER BY created_at DESC
    `
  }]
})
```

**What to look for:**
- Subscriptions registered?
- Jobs being picked up?
- Workers claiming runs?

**Critical Notes:**
- `encore test`: Subscriptions only load if imported
- `encore run`: All subscriptions auto-loaded
- Import statement: `import "../orchestrator/subscription"`

### Phase 8: Trace Analysis

**Use Encore MCP:**

```typescript
// Get recent traces
mcp_encore-mcp_get_traces({ 
  limit: "10",
  service: "run"
})

// Get detailed trace spans
mcp_encore-mcp_get_trace_spans({ 
  trace_ids: ["trace_id_here"]
})
```

**What to look for:**
- Slow endpoints?
- Failed requests?
- Timeout issues?

### Phase 9: Isolation Testing

**Test endpoint in isolation:**

```typescript
// Use MCP to call endpoint directly
mcp_encore-mcp_call_endpoint({
  service: "run",
  endpoint: "start",
  method: "POST",
  path: "/run.start",
  payload: JSON.stringify({
    apkPath: "/path/to/test.apk",
    appiumServerUrl: "http://127.0.0.1:4723/",
    packageName: "com.example.test",
    appActivity: ".*"
  })
})
```

**What to look for:**
- Does endpoint respond?
- Correct response type?
- Expected side effects?

### Phase 10: Integration Tests

**Use `backend-testing` skill:**

```bash
encore test agent/tests/metrics.test.ts
```

**What to look for:**
- Tests passing?
- Assertions failing?
- Timeouts occurring?

See: `.claude-skills/backend-testing_skill/SKILL.md`

---

## Common Debugging Queries

### 1. Get Latest Run

```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: "SELECT run_id, status, stop_reason, created_at FROM runs ORDER BY created_at DESC LIMIT 1"
  }]
})
```

### 2. Get Run Events Timeline

```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT kind, sequence, payload, created_at
      FROM run_events 
      WHERE run_id = '01K9KEVM6VFB6M5AB7AE04Y1RW'
      ORDER BY sequence
    `
  }]
})
```

### 3. Get Agent State

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

### 5. Find Failed Runs

```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT run_id, stop_reason, created_at 
      FROM runs 
      WHERE status = 'failed' 
      ORDER BY created_at DESC 
      LIMIT 10
    `
  }]
})
```

### 6. Find Runs Stuck at Specific Node

```typescript
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT r.run_id, a.snapshot->>'nodeName' as stuck_node, r.stop_reason
      FROM runs r
      JOIN agent_state_snapshots a ON r.run_id = a.run_id
      WHERE r.status = 'failed'
        AND a.created_at = (
          SELECT MAX(created_at) 
          FROM agent_state_snapshots 
          WHERE run_id = r.run_id
        )
      ORDER BY r.created_at DESC
      LIMIT 10
    `
  }]
})
```

### 7. Compare Successful vs Failed Runs

```typescript
// Get event count for successful run
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: "SELECT COUNT(*) as event_count FROM run_events WHERE run_id = 'successful_run_id'"
  }]
})

// Get event count for failed run
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: "SELECT COUNT(*) as event_count FROM run_events WHERE run_id = 'failed_run_id'"
  }]
})

// Find missing events in failed run
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT DISTINCT kind 
      FROM run_events 
      WHERE run_id = 'successful_run_id'
      AND kind NOT IN (
        SELECT kind FROM run_events WHERE run_id = 'failed_run_id'
      )
    `
  }]
})
```

---

## Common Backend Issues

### Issue 1: Database Connection Failures

**Symptoms:**
- "failed to connect to database"
- Timeout errors

**Debug with MCP:**
```typescript
mcp_encore-mcp_get_databases({ include_tables: true })
```

**Fixes:**
- Check migrations applied: `task backend:db:migrate`
- Verify connection string
- Reset database: `task founder:workflows:db-reset`

### Issue 2: Type Errors

**Symptoms:**
- TypeScript compilation errors
- Type mismatches at runtime

**Debug with MCP:**
```typescript
mcp_encore-mcp_get_services({
  services: ["run"],
  include_schemas: true
})
```

**Fixes:**
- Regenerate client: `task founder:workflows:regen-client`
- Check for `any` types (forbidden)
- Validate endpoint signatures

### Issue 3: PubSub Messages Not Delivered

**Symptoms:**
- Jobs stay in "queued" status
- Worker not picking up messages

**Debug with MCP:**
```typescript
// Check subscriptions
mcp_encore-mcp_get_pubsub()

// Check queued runs
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: "SELECT run_id, status, created_at FROM runs WHERE status = 'queued' ORDER BY created_at"
  }]
})
```

**Fixes:**
- In `encore test`: Import subscription
- In `encore run`: Check worker logs
- Verify subscription registered

### Issue 4: Logging Issues

**Symptoms:**
- No structured logs
- `console.log` being used

**Fixes:**
- Never use `console.log` (use `encore.dev/log`)
- Always include structured context: `module`, `actor`, `runId`

---

## Advanced Debugging Techniques

### Git Forensics for Regressions

**Timeline Method:**
```bash
# 1. Find last successful run
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: "SELECT run_id, created_at FROM runs WHERE status = 'completed' ORDER BY created_at DESC LIMIT 1"
  }]
})

# 2. Find first failed run
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: "SELECT run_id, created_at FROM runs WHERE status = 'failed' ORDER BY created_at LIMIT 1"
  }]
})

# 3. Identify commits in regression window
git log --oneline --since="Nov 7 17:00" --until="Nov 7 19:00"

# 4. Examine suspect commits
git show <commit_hash> --stat
```

**Binary Search Method:**
```bash
git bisect start
git bisect bad HEAD                         # Current broken state
git bisect good <last_known_good_commit>    # From timeline
# Test each commit
git bisect reset
```

### Worker State Inspection

```typescript
// Check run claim status
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: "SELECT processing_by, processing_started_at FROM runs WHERE run_id = 'xxx'"
  }]
})
```

### Database Query Analysis

**Symptom:** Node execution hangs

**Diagnosis:**
```typescript
// Check agent state
mcp_encore-mcp_query_database({
  queries: [{
    database: "db",
    query: `
      SELECT snapshot->>'nodeName' as node, created_at
      FROM agent_state_snapshots 
      WHERE run_id = 'xxx'
      ORDER BY created_at DESC
    `
  }]
})
```

**Fix:** Move heavy queries outside critical execution path

---

## Common Backend Regression Patterns

| Issue | Symptom | Investigation | Common Cause |
|-------|---------|---------------|--------------|
| **Node Hangs** | Agent state "running" indefinitely | Check agent snapshots | DB query blocks execution |
| **Lease Timeout** | Run fails after 30s | Worker logs, database `processing_by` | Heavy sync operations |
| **Missing Events** | Timeline incomplete | Compare with baseline | Event not emitted |
| **State Machine Stuck** | No transitions after event | XState logs | Guard logic error |

---

## MCP Tool Reference

### Database Tools

**`mcp_encore-mcp_get_databases`**
- Get database schema and table structure
- Use when: Writing queries, understanding relationships

**`mcp_encore-mcp_query_database`**
- Query database with custom SQL
- Use when: Inspecting run status, events, graph data

### Service Tools

**`mcp_encore-mcp_get_services`**
- Get service metadata and endpoints
- Use when: Understanding API structure, validating types

**`mcp_encore-mcp_call_endpoint`**
- Call endpoint directly
- Use when: Testing endpoints in isolation

### Trace Tools

**`mcp_encore-mcp_get_traces`**
- List recent request traces
- Use when: Analyzing performance, finding slow endpoints

**`mcp_encore-mcp_get_trace_spans`**
- Get detailed trace spans
- Use when: Deep debugging of request flows

### PubSub Tools

**`mcp_encore-mcp_get_pubsub`**
- List topics and subscriptions
- Use when: Verifying message flows, debugging subscriptions

---

## Integration with Backend Testing

When tests fail, use this debugging workflow:

1. **Run test** (from `backend-testing` skill)
2. **Get latest run ID** (MCP query)
3. **Inspect run events** (MCP query)
4. **Check agent state** (MCP query)
5. **Analyze traces** (MCP tool)
6. **Fix code** (from `backend_coding_rules.mdc`)
7. **Re-run test** (verify fix)

---

## References

- **Backend Testing**: `.claude-skills/backend-testing_skill/SKILL.md`
- **Backend Coding Rules**: `.cursor/rules/backend_coding_rules.mdc`
- **Encore MCP Workflow**: `.claude-skills/ENCORE_MCP_TESTING_WORKFLOW.md`
- **Encore Documentation**: Use `mcp_encore-mcp_search_docs`

---

**Last Updated**: 2025-11-09
