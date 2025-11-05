# Backend Debugging Procedure for Encore.ts

## Quick Reference: 10-Phase Investigation

### Phase 1: Environment Setup ✓
```bash
cd backend && encore run
encore db conn-uri db --env=local
curl http://localhost:4000/health
```

### Phase 2: Encore MCP Tools (Use First!) 🔧
```
mcp_encore-mcp_get_databases(include_tables=true)
mcp_encore-mcp_query_database([{database: "db", query: "SELECT ..."}])
mcp_encore-mcp_get_services(include_endpoints=true)
mcp_encore-mcp_call_endpoint(service="x", endpoint="y", ...)
mcp_encore-mcp_get_traces(...)
```

### Phase 3: Add Diagnostic Endpoints 📊
Create `diagnostics.ts` in service directory:
```typescript
import { api } from "encore.dev/api";
import db from "../db";
import { loggerWith, MODULES } from "../logging/logger";

interface DiagnosticsResponse {
  status: string;
  database: Record<string, number>;
  schemaChecks: Record<string, boolean>;
}

export const diagnostics = api(
  { expose: true, method: "GET", path: "/service/diagnostics" },
  async (): Promise<DiagnosticsResponse> => {
    const logger = loggerWith({ module: MODULES.SERVICE, actor: "diagnostics" });
    logger.info("Running diagnostics");
    
    // Check schema existence
    const tableExists = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'target_table'
      ) as exists
    `;
    
    // Check column existence
    const columnExists = await db.queryRow<{ exists: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'target_table' AND column_name = 'target_column'
      ) as exists
    `;
    
    // Get row counts
    const count = await db.queryRow<{ count: string }>`
      SELECT COUNT(*)::text as count FROM target_table
    `;
    
    return {
      status: "initialized",
      database: {
        targetTableCount: Number.parseInt(count?.count || "0", 10),
      },
      schemaChecks: {
        hasTargetTable: tableExists?.exists || false,
        hasTargetColumn: columnExists?.exists || false,
      }
    };
  }
);
```

### Phase 4: Database Verification 🗄️
```sql
-- Schema check
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'target_table' 
ORDER BY ordinal_position;

-- Row counts
SELECT 'table1' as table_name, COUNT(*) FROM table1
UNION ALL SELECT 'table2', COUNT(*) FROM table2;

-- Recent data
SELECT * FROM target_table 
ORDER BY created_at DESC LIMIT 10;
```

### Phase 5: Service Initialization ⚙️
Check `encore.service.ts`:
```typescript
import { Service } from "encore.dev/service";
import { startWorker } from "./worker";

export default new Service("service-name");

// Side effects at module load
startWorker(); // Must log startup
```

Look for startup logs:
```
module:"service" actor:"worker" "Worker starting" pollIntervalMs:300
```

### Phase 6: Event Flow Verification 🔄
```sql
-- Check event production
SELECT kind, COUNT(*) 
FROM run_events 
GROUP BY kind 
ORDER BY kind;

-- Check projection cursors
SELECT run_id, next_seq, updated_at 
FROM graph_projection_cursors 
ORDER BY updated_at DESC;

-- Check projection lag
SELECT 
  (SELECT MAX(seq) FROM run_events WHERE run_id = $1) as max_event_seq,
  (SELECT next_seq FROM graph_projection_cursors WHERE run_id = $1) as cursor_pos;
```

### Phase 7: Logging Analysis 📝
Access Encore dashboard: `http://localhost:9400`

Filter patterns:
- Graph: `module:graph actor:projector`
- Agent: `module:agent actor:worker`
- Run: `module:run actor:start`

### Phase 8: Test Scenario 🧪
```bash
curl -X POST http://localhost:4000/run \
  -H "Content-Type: application/json" \
  -d '{
    "apkPath": "/path/to/app.apk",
    "appiumServerUrl": "http://127.0.0.1:4723/",
    "packageName": "com.example.app",
    "appActivity": ".*",
    "maxSteps": 10,
    "goal": "Explore | Max Coverage"
  }'
```

Monitor: events → cursors → destination tables

### Phase 9: Root Cause Patterns 🎯

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Column not found | Migration not applied | Check migration history |
| Endpoints 404 | Service not loaded | Verify `encore.service.ts` export |
| No processing logs | Worker not starting | Check module-level call |
| Events exist, tables empty | Event kind mismatch | Check switch cases |
| Query returns empty | Wrong database | Verify local vs test |

### Phase 10: Documentation 📚
1. Update bug report (jira/bugs/)
2. Keep diagnostic endpoints
3. Update FOUNDERS_NOTEPAD.md
4. Store findings in Graphiti

---

## Real-World Example: BUG-002 Investigation

**Issue**: "Graph tables not updating after Perceive events"

**Investigation Steps**:
1. ✅ Started Encore, verified health endpoint
2. ✅ Created diagnostic endpoints (`/graph/diagnostics`, `/graph/screens`)
3. ✅ Queried database:
   - `run_events`: 145 events
   - `screens`: 7 rows
   - `graph_persistence_outcomes`: 7 rows
   - `graph_projection_cursors`: 7 rows
4. ✅ Verified schema: `graph_projection_cursors` exists, `source_event_seq` exists
5. ✅ Checked service: `startGraphProjector()` called at module load
6. ✅ Ran test scenario: Events generated and projected successfully

**Finding**: NOT A BUG - projection working correctly. Issue was stale database view or misunderstanding.

**Resolution**: Added diagnostic endpoints for future troubleshooting, documented expected behavior.

---

## Key Principles

### 🎯 Use Encore MCP Tools First
Don't write custom diagnostic code until MCP tools are exhausted. They provide real-time introspection.

### 📊 Add Diagnostics, Don't Remove
Keep diagnostic endpoints for ongoing observability. They're invaluable for production debugging.

### 🔍 Verify Schema State
Always check migrations match code expectations. Schema drift is a common source of bugs.

### ⚡ Check Initialization
Background workers MUST start at module load. Check for startup logs.

### 🔄 Follow Event Flow
For projectors: trace from source event → cursor → switch case → destination table.

### 📝 Structured Logging
Use module/actor context for precise log filtering. Always include runId when available.

### 🧪 Test with Knowns
Use controlled test parameters to isolate issues. Known good inputs → expected outputs.

---

## Encore MCP Tool Reference

### Database Tools
- `get_databases(include_tables)` - Schema inspection
- `query_database(queries)` - Run SQL, get results

### Service Tools
- `get_services(include_endpoints, include_schemas)` - Service/endpoint listing
- `call_endpoint(service, endpoint, method, path, payload)` - Test APIs

### Observability Tools
- `get_traces(service?, endpoint?, start_time?, end_time?)` - Request traces
- `get_metrics()` - Runtime metrics

### Other Tools
- `get_metadata()` - Full app architecture
- `get_pubsub()` - Topics and subscriptions
- `get_secrets()` - Secret usage (not values)
- `get_cronjobs()` - Scheduled jobs
- `search_docs(query)` - Encore documentation

---

## Common SQL Diagnostic Queries

```sql
-- Check table exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'target_table'
);

-- Check column exists
SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'target_table' AND column_name = 'target_column'
);

-- List all columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'target_table' 
ORDER BY ordinal_position;

-- Multi-table counts
SELECT 
  'run_events' as table_name, COUNT(*) FROM run_events
UNION ALL SELECT 'screens', COUNT(*) FROM screens
UNION ALL SELECT 'graph_persistence_outcomes', COUNT(*) FROM graph_persistence_outcomes
UNION ALL SELECT 'graph_projection_cursors', COUNT(*) FROM graph_projection_cursors;

-- Event kinds distribution
SELECT kind, COUNT(*) as count 
FROM run_events 
GROUP BY kind 
ORDER BY count DESC;

-- Projection cursor state
SELECT run_id, next_seq, updated_at 
FROM graph_projection_cursors 
ORDER BY updated_at DESC 
LIMIT 10;

-- Recent outcomes
SELECT outcome_id, run_id, step_ordinal, screen_id, upsert_kind, created_at
FROM graph_persistence_outcomes
ORDER BY created_at DESC
LIMIT 10;
```

---

**Last Updated**: 2025-11-05  
**Validated Against**: BUG-002 investigation (ScreenGraph)

