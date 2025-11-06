---
name: backend-debugging-encore
description: A systematic procedure for investigating and debugging backend issues in Encore.ts applications. Uses MCP tools for live inspection, creates diagnostic endpoints, verifies database schema, checks service initialization, traces event flows, and provides SQL queries for common debugging scenarios. Essential for troubleshooting projection failures, schema mismatches, service startup issues, and event-driven systems.
---

# Backend Debugging for Encore.ts Applications

This skill provides a systematic 10-phase approach to investigating and resolving backend issues in Encore.ts applications, with emphasis on the ScreenGraph architecture pattern (event-sourced projections, Pub/Sub, background workers).

## When to Use This Skill

- Backend service not responding or endpoints returning 404
- Database tables not populating despite events being generated
- Background workers or projectors not processing data
- Schema mismatch errors or migration issues
- Event-driven flows not completing (events exist but no downstream effects)
- Pub/Sub subscriptions not consuming messages
- Performance issues or projection lag

## Phase 1: Environment Setup & Verification

**Goal:** Confirm the application is running and accessible.

```bash
# Start Encore backend
cd backend && encore run

# Verify health endpoint
curl http://localhost:4000/health

# Get database connection URI
cd backend/db && encore db conn-uri db --env=local

# Verify API Explorer is accessible
# Open: http://localhost:4000/#/api
```

**Success Criteria:**
- ✅ Encore starts without errors
- ✅ Health endpoint returns 200 with `{"status":"healthy","database":"connected"}`
- ✅ Database URI is accessible
- ✅ API Explorer loads

## Phase 2: Use Encore MCP Tools (CRITICAL: Always Use First!)

**Before writing any diagnostic code**, use Encore MCP tools for live inspection:

### Database Inspection
```
mcp_encore-mcp_get_databases(include_tables=true)
```
Returns: All databases with table schemas, columns, types

```
mcp_encore-mcp_query_database([
  {database: "db", query: "SELECT COUNT(*) FROM table_name"},
  {database: "db", query: "SELECT kind, COUNT(*) FROM run_events GROUP BY kind"}
])
```
Returns: Query results from multiple databases

### Service & Endpoint Inspection
```
mcp_encore-mcp_get_services(
  include_endpoints=true, 
  include_schemas=true,
  services=["graph", "run", "agent"]
)
```
Returns: Service definitions, endpoints, request/response schemas

### Testing Endpoints
```
mcp_encore-mcp_call_endpoint(
  service="graph",
  endpoint="diagnostics",
  method="GET",
  path="/graph/diagnostics"
)
```
Returns: API response with full type information

### Trace Analysis
```
mcp_encore-mcp_get_traces(
  service="graph",
  endpoint="diagnostics",
  start_time="2025-11-05T00:00:00Z",
  limit=10
)
```
Returns: Request traces with timing, status, metadata

### Full Architecture
```
mcp_encore-mcp_get_metadata()
```
Returns: Complete app structure, all services, databases, topics

**When MCP Tools Fail:**
- Error "app not found" → Encore not running, restart with `encore run`
- Empty results → Service not loaded, check `encore.service.ts` exports
- Permission errors → Check if endpoint requires authentication
- Docker errors → Start Docker daemon locally (Encore relies on Docker for local DB & subsystems)

## Phase 3: Create Diagnostic Endpoints

**Only if MCP tools are insufficient.** Add to service directory:

```typescript
// backend/graph/diagnostics.ts
import { api } from "encore.dev/api";
import db from "../db";
import { loggerWith, MODULES } from "../logging/logger";

interface DiagnosticsResponse {
  status: string;
  database: {
    targetTableCount: number;
    relatedTableCount: number;
  };
  schemaChecks: {
    hasTargetTable: boolean;
    hasRequiredColumn: boolean;
  };
}

export const diagnostics = api(
  { expose: true, method: "GET", path: "/service/diagnostics" },
  async (): Promise<DiagnosticsResponse> => {
    const logger = loggerWith({ 
      module: MODULES.SERVICE, 
      actor: "diagnostics" 
    });
    logger.info("Running diagnostics");
    
    // Check table exists
    const tableExists = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'target_table'
      ) as exists
    `;
    
    // Check column exists
    const columnExists = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'target_table' 
        AND column_name = 'required_column'
      ) as exists
    `;
    
    // Get counts
    const targetCount = await db.queryRow<{ count: string }>`
      SELECT COUNT(*)::text as count FROM target_table
    `;
    
    const relatedCount = await db.queryRow<{ count: string }>`
      SELECT COUNT(*)::text as count FROM related_table
    `;
    
    return {
      status: "initialized",
      database: {
        targetTableCount: Number.parseInt(targetCount?.count || "0", 10),
        relatedTableCount: Number.parseInt(relatedCount?.count || "0", 10),
      },
      schemaChecks: {
        hasTargetTable: tableExists?.exists || false,
        hasRequiredColumn: columnExists?.exists || false,
      }
    };
  }
);
```

**Test endpoint:**
```bash
curl http://localhost:4000/service/diagnostics | jq
```

## Phase 4: Database State Verification

Use SQL queries to verify schema and data:

```sql
-- Check table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'target_table' 
ORDER BY ordinal_position;

-- Multi-table row counts
SELECT 'run_events' as table_name, COUNT(*) FROM run_events
UNION ALL SELECT 'screens', COUNT(*) FROM screens
UNION ALL SELECT 'graph_persistence_outcomes', COUNT(*) FROM graph_persistence_outcomes
UNION ALL SELECT 'graph_projection_cursors', COUNT(*) FROM graph_projection_cursors;

-- Event kinds distribution
SELECT kind, COUNT(*) as count 
FROM run_events 
GROUP BY kind 
ORDER BY count DESC;

-- Recent data
SELECT * FROM target_table 
ORDER BY created_at DESC 
LIMIT 10;

-- Check foreign keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='target_table';
```

**Run via MCP:**
```
mcp_encore-mcp_query_database([
  {database: "db", query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'target_table'"}
])
```

## Phase 5: Service Initialization Verification

**Check that services are loading correctly:**

### Verify `encore.service.ts` Export
```typescript
// backend/graph/encore.service.ts
import { Service } from "encore.dev/service";
import { startGraphProjector } from "./projector";

export default new Service("graph"); // MUST export default

startGraphProjector(); // Side effect at module load
```

### Check for Startup Logs
Background workers MUST log at startup:

```typescript
export function startGraphProjector(): void {
  const logger = loggerWith({ 
    module: MODULES.GRAPH, 
    actor: GRAPH_ACTORS.PROJECTOR 
  });
  
  if (projectorRunning) {
    logger.warn("Graph projector already running");
    return;
  }

  logger.info("Graph projector starting", { 
    pollIntervalMs: POLL_INTERVAL_MS 
  });
  
  projectorRunning = true;
  void scheduleTick();
}
```

**Look for this log:**
```
module:"graph" actor:"projector" "Graph projector starting" pollIntervalMs:300
```

**If missing:** Service not loading or worker not starting.

## Phase 6: Event Flow Verification

For event-driven systems (projectors, subscriptions):

### Check Event Production
```sql
-- Total events
SELECT COUNT(*) FROM run_events;

-- Events by kind
SELECT kind, COUNT(*) FROM run_events GROUP BY kind ORDER BY kind;

-- Recent events
SELECT run_id, seq, kind, created_at 
FROM run_events 
ORDER BY created_at DESC 
LIMIT 20;

-- Events for specific run
SELECT seq, kind, node_name, created_at 
FROM run_events 
WHERE run_id = 'target_run_id' 
ORDER BY seq;
```

### Check Projection Cursors
```sql
-- Cursor state
SELECT run_id, next_seq, updated_at 
FROM graph_projection_cursors 
ORDER BY updated_at DESC;

-- Projection lag (compare event seq to cursor position)
SELECT 
  re.run_id,
  MAX(re.seq) as max_event_seq,
  gpc.next_seq as cursor_position,
  (MAX(re.seq) - gpc.next_seq) as lag
FROM run_events re
JOIN graph_projection_cursors gpc ON gpc.run_id = re.run_id
GROUP BY re.run_id, gpc.next_seq;
```

### Check Projection Outcomes
```sql
-- Recent outcomes
SELECT outcome_id, run_id, step_ordinal, screen_id, upsert_kind, 
       source_event_seq, created_at
FROM graph_persistence_outcomes
ORDER BY created_at DESC
LIMIT 20;

-- Outcomes per run
SELECT run_id, COUNT(*) as outcome_count
FROM graph_persistence_outcomes
GROUP BY run_id
ORDER BY outcome_count DESC;
```

### Trace Event Flow
For projectors: **Source Event → Cursor → Switch Case → Destination Table**

1. ✅ Event exists in `run_events`
2. ✅ Cursor advanced past event seq
3. ✅ Event kind matches switch case in projector
4. ✅ Destination table updated
5. ✅ Outcome recorded

**Common Failures:**
- Event exists, cursor not advancing → Worker not running
- Cursor advances, no outcome → Event kind not handled in switch
- Outcome recorded, table empty → Outcome logic bug

## Phase 7: Logging Analysis

Access Encore dashboard: `http://localhost:9400`

### Filter Patterns

**Graph Issues:**
```
module:graph actor:projector
```

**Agent Issues:**
```
module:agent actor:worker
module:agent actor:orchestrator
```

**Run Issues:**
```
module:run actor:start
module:run actor:stream
```

**With Run Context:**
```
module:graph runId:"01XXXXX"
```

### Key Log Fields
- `module` - Service/subsystem
- `actor` - Component within module
- `runId` - Correlate across services
- `stepOrdinal` - Execution sequence
- `eventSeq` - Event ordering
- `err` - Error details

## Phase 8: Test Scenario Execution

Run controlled test with known parameters:

```bash
curl -X POST http://localhost:4000/run \
  -H "Content-Type: application/json" \
  -d '{
    "apkPath": "/Users/priyankalalge/SAAS/Scoreboard/AppiumPythonClient/test/apps/kotlinconf.apk",
    "appiumServerUrl": "http://127.0.0.1:4723/",
    "packageName": "com.jetbrains.kotlinconf",
    "appActivity": ".*",
    "maxSteps": 10,
    "goal": "Explore | Max Coverage"
  }'
```

**Monitor in parallel:**
```bash
# Watch event generation
watch -n 1 'curl -s http://localhost:4000/graph/diagnostics | jq ".database.runEventsCount"'

# Watch screen projection
watch -n 1 'curl -s http://localhost:4000/graph/diagnostics | jq ".database.screensCount"'

# Watch cursor advancement
# Via MCP: mcp_encore-mcp_query_database([{database: "db", query: "SELECT * FROM graph_projection_cursors ORDER BY updated_at DESC LIMIT 1"}])
```

**Success Indicators:**
- Events incrementing
- Screens incrementing
- Cursors updating (updated_at changes)
- No errors in logs

## Phase 9: Root Cause Classification

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| **Column not found error** | Migration not applied | Run `encore db reset` or verify migration 008 applied |
| **Endpoints return 404** | Service not loaded | Check `encore.service.ts` has `export default new Service("name")` |
| **WS connection has no status** | Endpoint not active or backend down | Start Docker, restart backend; verify endpoint listed in API Explorer |
| **No processing logs** | Background worker not starting | Verify worker function called at module load, add startup log |
| **Events exist, tables empty** | Event kind not handled | Check switch case in projector, verify kind matches exactly |
| **Query returns empty** | Wrong database instance | Verify using local DB: `encore db conn-uri db --env=local` |
| **Cursor not advancing** | Worker loop crashed | Check logs for errors, verify `scheduleTick()` has finally block |
| **Projection lag growing** | Processing too slow | Increase batch size, optimize queries, check for N+1 queries |
| **Outcomes recorded, no data** | Logic bug in upsert | Check `upsertScreen()` logic, verify deterministic ID generation |

### Detailed Diagnostics by Pattern

**Pattern: Schema Mismatch**
```sql
-- Verify migration 008 applied
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'graph_projection_cursors'
);

SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'graph_persistence_outcomes' 
  AND column_name = 'source_event_seq'
);
```

**Pattern: Service Not Starting**
- Check: `encore.service.ts` exports default Service
- Check: No import errors in service files
- Check: Worker function called at module load
- Look for: Startup logs immediately after `encore run`

**Pattern: Event Not Projecting**
- Check: Event kind in `run_events` matches projector switch case
- Check: Cursor includes run with events
- Check: Switch case has handler for event kind
- Check: Handler doesn't throw error (check logs)

## Phase 10: Documentation & Resolution

### Update Bug Report
```markdown
## BUG-XXX — [Title]

### Status
✅ RESOLVED - [Root cause summary]

### Root Cause
[Detailed explanation]

### Evidence
```bash
curl http://localhost:4000/service/diagnostics
# Include output
```

### Fix Applied
[Description of fix]

### Verification
[How to verify fix works]
```

### Keep Diagnostic Endpoints
DO NOT delete diagnostic endpoints after debugging. They provide ongoing observability.

### Update Documentation
- Add findings to `FOUNDERS_NOTEPAD.md`
- Update service README if pattern is reusable
- Document in `BACKEND_HANDOFF.md` if affects handoff

### Store in Knowledge Base
Store debugging findings for future reference:
- Unique failure patterns
- Schema evolution lessons
- Performance optimization insights

## Real-World Example: BUG-002

**Reported Issue:** "Graph tables not updating after Perceive events"

**Investigation Steps:**
1. ✅ Started Encore: `encore run` successful
2. ✅ Created diagnostics: `/graph/diagnostics` endpoint
3. ✅ Used MCP to query database:
   ```
   mcp_encore-mcp_query_database([
     {database: "db", query: "SELECT COUNT(*) FROM screens"},
     {database: "db", query: "SELECT COUNT(*) FROM graph_persistence_outcomes"}
   ])
   ```
4. ✅ Results: 7 screens, 7 outcomes, 7 cursors
5. ✅ Verified schema: Both required tables and columns exist
6. ✅ Ran test: Events generated and projected successfully

**Finding:** NOT A BUG - Projection working correctly. Reporter had stale database view.

**Resolution:** Added `/graph/diagnostics` and `/graph/screens` endpoints for future verification.

## SQL Query Library

### Schema Verification
```sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'target_table' 
ORDER BY ordinal_position;

-- Table indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'target_table';

-- Table constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'target_table';
```

### Data Verification
```sql
-- Row counts for multiple tables
SELECT 
  (SELECT COUNT(*) FROM run_events) as run_events,
  (SELECT COUNT(*) FROM screens) as screens,
  (SELECT COUNT(*) FROM graph_persistence_outcomes) as outcomes,
  (SELECT COUNT(*) FROM graph_projection_cursors) as cursors;

-- Recent records with timestamp
SELECT * FROM target_table 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Count by status/kind
SELECT status, COUNT(*) FROM runs GROUP BY status;
SELECT kind, COUNT(*) FROM run_events GROUP BY kind ORDER BY COUNT(*) DESC;
```

### Event Flow Verification
```sql
-- Projection progress for a run
WITH run_stats AS (
  SELECT 
    run_id,
    MAX(seq) as max_event_seq,
    COUNT(*) as event_count
  FROM run_events 
  WHERE run_id = $1
  GROUP BY run_id
),
cursor_stats AS (
  SELECT run_id, next_seq as cursor_pos
  FROM graph_projection_cursors
  WHERE run_id = $1
),
outcome_stats AS (
  SELECT run_id, COUNT(*) as outcome_count
  FROM graph_persistence_outcomes
  WHERE run_id = $1
  GROUP BY run_id
)
SELECT 
  r.run_id,
  r.event_count,
  r.max_event_seq,
  c.cursor_pos,
  (r.max_event_seq - c.cursor_pos) as lag,
  o.outcome_count
FROM run_stats r
LEFT JOIN cursor_stats c ON c.run_id = r.run_id
LEFT JOIN outcome_stats o ON o.run_id = r.run_id;
```

## Key Principles

### 🎯 Encore MCP Tools First
Always use MCP tools before writing custom diagnostic code. They provide real-time introspection without code changes.

### 📊 Add Diagnostics, Never Remove
Diagnostic endpoints are permanent observability improvements. Keep them for production debugging.

### 🔍 Verify Schema State
Schema drift is the #1 cause of backend issues. Always verify migrations match code expectations.

### ⚡ Check Initialization
Background workers MUST log at startup. If no startup log, worker didn't initialize.

### 🔄 Follow Event Flow
For projectors: Event → Cursor → Handler → Destination. Find where the chain breaks.

### 📝 Structured Logging
Use `loggerWith({ module, actor, runId })` for precise filtering in Encore dashboard.

### 🧪 Test with Knowns
Known good inputs → expected outputs. Isolate variables.

### 📚 Document Findings
Every debugging session teaches something. Capture patterns for next time.

## Guidelines

- **Start with MCP tools** - They're faster than writing diagnostic code
- **Be systematic** - Follow the 10 phases in order
- **Check logs first** - Many issues reveal themselves in startup logs
- **Verify schema** - Schema mismatch is the most common issue
- **Test with knowns** - Use controlled test parameters to isolate variables
- **Keep diagnostics** - Don't delete diagnostic endpoints after debugging
- **Document patterns** - Store learnings for future investigations
- **Think event flow** - For projectors, trace the complete path from source to destination

## Examples

### Example 1: "Graph Not Updating"
```
1. Use MCP: mcp_encore-mcp_query_database to check row counts
2. Result: Tables have data → Not actually broken
3. Create /graph/diagnostics for ongoing verification
4. Update bug report: NOT A BUG - Working as designed
```

### Example 2: "Service Returns 404"
```
1. Check: curl http://localhost:4000/service/endpoint
2. Result: 404
3. Use MCP: mcp_encore-mcp_get_services(include_endpoints=true)
4. Result: Service not listed
5. Check: encore.service.ts missing "export default new Service()"
6. Fix: Add proper export
7. Restart: encore run
8. Verify: Endpoint now accessible
```

### Example 3: "Background Worker Not Processing"
```
1. Check logs: No startup message
2. Check: encore.service.ts calls startWorker()
3. Result: Function defined but not called
4. Fix: Add startWorker() at module load
5. Verify: See "Worker starting" log
6. Verify: Cursors now updating
```

## Resources

- [Encore.ts Documentation](https://encore.dev/docs)
- [ScreenGraph Backend README](../BACKEND_README.md)
- [Graph Service README](../graph/README.md)
- [Debugging Procedure](../DEBUGGING_PROCEDURE.md)

