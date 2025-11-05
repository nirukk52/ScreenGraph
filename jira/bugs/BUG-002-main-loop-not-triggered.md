## BUG-002 — Graph projection not updating after Perceive events

### Summary
After a run successfully executes the Perceive node and emits `agent.event.screen_perceived`, `agent.event.ui_hierarchy_captured`, and `agent.event.screenshot_captured` events to `run_events`, the graph projection service fails to update the `screens`, `actions`, and `edges` tables. The graph projector appears to be running but does not process the events, leaving graph tables empty even though Perceive completes successfully.

### Severity / Impact
- **Severity**: Critical (P0) — Blocks all graph functionality
- **Impact**: 
  - Graph tables (`screens`, `actions`, `edges`) remain empty after runs complete
  - `graph_persistence_outcomes` table not populated
  - Frontend graph visualization has no data to render
  - FR-009 (Graph Stream Endpoint) is blocked
  - Cannot demonstrate screen deduplication or graph evolution

### Environment
- **Backend**: `encore run` (local dev)
- **Graph Service**: `backend/graph/encore.service.ts` with `startGraphProjector()`
- **Database**: PostgreSQL via Encore
- **Migrations**: Potentially misaligned (003 vs 007/008)

### Steps to Reproduce
1. Start backend: `cd backend && encore run`
2. Trigger a run via `POST /run` with valid APK and Appium server
3. Observe agent logs show Perceive node completes:
   - `agent.node.started { nodeName: "Perceive" }`
   - `agent.event.screenshot_captured`
   - `agent.event.ui_hierarchy_captured`
   - `agent.event.screen_perceived`
   - `agent.node.finished { nodeName: "Perceive", outcomeStatus: "SUCCESS" }`
4. Check `run_events` table: events are present with correct `kind` values
5. Check graph tables:
   ```sql
   SELECT COUNT(*) FROM screens;  -- Returns 0
   SELECT COUNT(*) FROM graph_persistence_outcomes;  -- Returns 0
   SELECT COUNT(*) FROM graph_projection_cursors;  -- Returns 0 or missing table
   ```
6. Check graph projector logs: No "Screen projected" or "Projection batch processed" messages

### Expected Result
- Graph projector polls `run_events` every 300ms
- Hydrates cursor for new runs (`graph_projection_cursors` row created)
- Processes `agent.event.screen_perceived` events
- Downloads UI XML from artifacts, normalizes, computes layout hash
- Inserts/updates `screens` table with new screen
- Records outcome in `graph_persistence_outcomes` with `upsert_kind` = "discovered" or "mapped"
- Logs: `"Screen projected"` and `"Projection batch processed"`

### Actual Result
- Graph tables remain empty
- No graph projector logs appear (or only generic tick logs with 0 events processed)
- `graph_projection_cursors` table may not exist (schema mismatch)
- Graph service may be silently failing or not running

### Suspected Root Cause
**Primary suspects:**

1. **Schema Mismatch (Most Likely)**:
   - Projector code expects tables/columns from migrations 007 & 008 (`graph_projection_cursors`, `run_events.kind`, `graph_persistence_outcomes.source_event_seq`)
   - Database may still be on migration 003 which has different schema (`run_events.type` instead of `kind`, no cursor table, no `source_event_seq`)
   - Repo queries fail silently or return empty results

2. **Graph Service Not Running**:
   - `backend/graph/encore.service.ts` may not be registered properly
   - `startGraphProjector()` may not be called on service init
   - Encore may not recognize graph as a service (missing exports?)

3. **Event Kind Mismatch**:
   - Perceive emits events with `kind: "agent.event.screen_perceived"`
   - Projector filters for this exact string in switch statement
   - Mismatch in event kind field name (`kind` vs `type` from migration 003) causes events to be skipped

4. **Artifacts Service Dependency**:
   - Projector downloads UI XML via `artifacts.getArtifactMeta()` and `artifactsBucket.download()`
   - If artifacts service is unavailable or bucket not configured, projector may fail silently

### Attachments / Logs
**Expected logs (not appearing):**
```
[graph/projector] Screen projected { eventSeq: 42, stepOrdinal: 4, outcomeKind: "discovered", screenId: "abc123..." }
[graph/projector] Projection batch processed { eventsProcessed: 3, projectedScreens: 1, durationMs: 45 }
```

**SQL to check schema version:**
```sql
-- Check if using old schema (003)
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'run_events' AND column_name IN ('type', 'kind');

-- Check if cursor table exists
SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'graph_projection_cursors');

-- Check if source_event_seq column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'graph_persistence_outcomes' AND column_name = 'source_event_seq';
```

### Proposed Fix / Next Steps
1. **Verify Database Schema**:
   ```bash
   encore db shell run
   \d run_events  -- Check if has 'kind' column or 'type' column
   \d graph_projection_cursors  -- Check if table exists
   \d graph_persistence_outcomes  -- Check for source_event_seq column
   ```

2. **Apply Latest Migrations**:
   ```bash
   encore db reset  # WARNING: Drops all data
   encore run  # Applies migrations 001-008 fresh
   ```

3. **Verify Graph Service Running**:
   - Check `encore run` output for `graph` service initialization
   - Add debug log in `startGraphProjector()` to confirm it's called
   - Check for projector tick logs every 300ms

4. **Manual Test Projection**:
   - Insert test event into `run_events` with proper schema
   - Observe if projector picks it up
   - Check for error logs in Encore dashboard

5. **Check Repo Queries**:
   - Add debug logging in `GraphProjectionRepo.fetchEvents()` to see what SQL is executed
   - Verify `run_events` rows have expected column names matching repo query

### Owner / Requestor
- **Reported by**: Founder QA
- **Suggested Owner**: Graph/Backend team
- **Priority**: P0 (blocks FR-009, graph MVP milestone)

---

### Notes
- This is the root cause for empty graph tables, not main loop triggering
- Migration 007 added `graph_projection_cursors` and `source_event_seq`
- Migration 008 refactored schema (`type` → `kind`, removed multi-tenancy)
- Projector code in `backend/graph/projector.ts` and `repo.ts` assumes 007/008 schema
- Related: FR-009 depends on this working to have data to stream


