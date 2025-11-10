---
name: backend-debugging
description: Systematic debugging for Encore.ts backend issues using diagnostic scripts, database queries, and structured logs. Use when backend tests fail, services crash, or async flows stall.
---

# Backend Debugging Skill

## Purpose

Systematic approach to debugging Encore.ts backend failures using:
- Diagnostic scripts in `backend/scripts/`
- Direct database queries
- Structured log analysis
- Test failure investigation

---

## Quick Debugging Workflow

### Step 1: Identify What Failed

```bash
# Check test output
encore test ./run/start.integration.test.ts

# Look for:
# - Which assertion failed
# - Last logged status
# - Error messages
```

### Step 2: Query Database State

```sql
-- Check run status
SELECT run_id, status, stop_reason, created_at
FROM runs
ORDER BY created_at DESC
LIMIT 5;

-- Check events emitted
SELECT seq, kind, created_at
FROM run_events
WHERE run_id = '<runId>'
ORDER BY seq;

-- Check graph projection
SELECT outcome_id, upsert_kind, screen_id
FROM graph_persistence_outcomes
WHERE run_id = '<runId>';

-- Check agent state
SELECT snapshot->>'nodeName' as node, snapshot->>'status' as status
FROM run_state_snapshots
WHERE run_id = '<runId>'
ORDER BY step_ordinal DESC
LIMIT 1;
```

### Step 3: Use Diagnostic Scripts

```bash
# Inspect complete run timeline
bunx tsx backend/scripts/inspect-run.ts <runId>

# Check agent state snapshots
bunx tsx backend/scripts/check-agent-state.ts <runId>

# Find recent runs
bunx tsx backend/scripts/find-latest-run.ts

# Check projector cursor health
bunx tsx backend/scripts/check-cursor-ordering.ts
```

---

## Common Test Failures

### Failure 1: "Run stayed 'queued'"

**Symptom:**
```
Timeout: status=queued after 60000ms
```

**Cause:** Worker subscription not loaded

**Fix:**
```typescript
// Add at top of test file
import "../agent/orchestrator/subscription";
```

---

### Failure 2: "Service call hangs"

**Symptom:** Test times out with no error

**Cause:** Service not loaded in test runtime

**Fix:**
```typescript
// Import required services
import "../artifacts/store";
import "../graph/encore.service.ts";
```

---

### Failure 3: "Path alias not found"

**Symptom:**
```
Error: Failed to load ~encore/clients
```

**Fix:** Add to `backend/vitest.config.ts`:
```typescript
resolve: {
  alias: {
    "~encore": resolve(__dirname, "./encore.gen"),
  },
},
```

---

### Failure 4: "0 screens discovered"

**Symptom:** Agent completes but `projectedScreens: 0`

**Cause:** Graph projector runs async, test checks too early

**Fix:**
```typescript
expect(runStatus).toBe("completed");

// Wait for async projection
await new Promise(r => setTimeout(r, 5000));

// NOW check screens
const count = await queryScreens(runId);
```

---

### Failure 5: "Budget exhausted"

**Symptom:**
```
stop_reason: "budget_exhausted"
stepsTotal: 5
```

**Cause:** `maxSteps` too low with retries/backtracking

**Fix:**
```typescript
const response = await start({
  ...request,
  maxSteps: 20,  // Increase to allow retries
});
```

---

## Diagnostic Scripts Arsenal

Located in `backend/scripts/`:

### 1. `inspect-run.ts`
Complete run event timeline with graph outcomes and cursor state.

```bash
bunx tsx backend/scripts/inspect-run.ts <runId>
```

**Shows:**
- All run_events with seq and kind
- Graph persistence outcomes
- Cursor state
- Run record details

### 2. `check-agent-state.ts`
Agent state snapshots and progression.

```bash
bunx tsx backend/scripts/check-agent-state.ts <runId>
```

**Shows:**
- nodeName, status, counters, budgets
- Step-by-step state evolution
- Timestamps and transitions

### 3. `check-cursor-ordering.ts`
Graph projector cursor health check.

```bash
bunx tsx backend/scripts/check-cursor-ordering.ts
```

**Shows:**
- Total cursors vs processed
- Stuck cursors
- Ordering issues

### 4. `find-latest-run.ts` / `find-completed-runs.ts`
Find runs for comparison.

```bash
bunx tsx backend/scripts/find-latest-run.ts
bunx tsx backend/scripts/find-completed-runs.ts
```

### 5. `test-projector.ts`
Test graph projector in isolation.

```bash
bunx tsx backend/scripts/test-projector.ts <runId>
```

---

## Database Query Patterns

### Check If Worker Claimed Run

```sql
SELECT run_id, status, worker_id, created_at, updated_at
FROM runs
WHERE run_id = '<runId>';
```

**Expected:** `worker_id` should be populated

---

### Check Event Sequence

```sql
SELECT seq, kind, node_name, created_at
FROM run_events
WHERE run_id = '<runId>'
ORDER BY seq;
```

**Expected:** Continuous sequence with no gaps

---

### Check Screen Discovery

```sql
SELECT 
  gpo.outcome_id,
  gpo.upsert_kind,
  gpo.screen_id,
  gpo.step_ordinal,
  gpo.created_at
FROM graph_persistence_outcomes gpo
WHERE gpo.run_id = '<runId>'
ORDER BY gpo.step_ordinal;
```

**Expected:** At least one `upsert_kind = 'discovered'`

---

### Check Projection Lag

```sql
SELECT 
  r.run_id,
  r.status,
  COUNT(re.seq) as events_count,
  COUNT(gpo.outcome_id) as projections_count,
  (COUNT(re.seq) - COUNT(gpo.outcome_id)) as lag
FROM runs r
LEFT JOIN run_events re ON r.run_id = re.run_id
LEFT JOIN graph_persistence_outcomes gpo ON r.run_id = gpo.run_id
WHERE r.run_id = '<runId>'
GROUP BY r.run_id, r.status;
```

---

## Debugging Checklist

When a test fails, check in order:

- [ ] 1. Did worker claim run? (status != 'queued')
- [ ] 2. Are subscriptions imported in test?
- [ ] 3. Did run complete? (status = 'completed')
- [ ] 4. Were events emitted? (COUNT run_events > 0)
- [ ] 5. Did graph project? (COUNT graph_persistence_outcomes > 0)
- [ ] 6. Waited long enough for async? (5s after completion)
- [ ] 7. Using correct column names? (seq, upsert_kind)
- [ ] 8. Is Appium running? (http://127.0.0.1:4723/status)
- [ ] 9. Is device connected? (adb devices)
- [ ] 10. Check stop_reason for clues

---

## Integration Test Debugging Example

**Test fails with "0 screens discovered":**

```typescript
// 1. Check if run completed
const run = await db.queryRow`
  SELECT status, stop_reason FROM runs WHERE run_id = ${runId}
`;
console.log("Run:", run);  // { status: "completed", stop_reason: "success" }

// 2. Check events
const events = await db.queryAll`
  SELECT seq, kind FROM run_events WHERE run_id = ${runId} ORDER BY seq
`;
console.log("Events:", events.length);  // 19 events

// 3. Check if screen_perceived event exists
const perceived = events.find(e => e.kind === "agent.event.screen_perceived");
console.log("Screen perceived?", !!perceived);  // true

// 4. Check projector outcomes
const outcomes = await db.queryAll`
  SELECT upsert_kind FROM graph_persistence_outcomes WHERE run_id = ${runId}
`;
console.log("Outcomes:", outcomes);  // []

// 5. Diagnosis: Projector didn't run OR ran too slow
// Fix: Add 5s delay before checking OR increase poll interval
```

---

## Critical Rules

### Rule 1: Never Use `console.log` in Production

❌ **Bad:**
```typescript
console.log("Run started:", runId);
```

✅ **Good:**
```typescript
import log from "encore.dev/log";
const logger = log.with({ module: "run", actor: "start", runId });
logger.info("Run started");
```

### Rule 2: Always Import Subscriptions in Tests

❌ **Bad:**
```typescript
it("should process job", async () => {
  await publishToTopic({ runId });
  // Worker never runs - subscription not loaded!
});
```

✅ **Good:**
```typescript
import "../agent/orchestrator/subscription";

it("should process job", async () => {
  await publishToTopic({ runId });
  // Worker processes job
});
```

### Rule 3: Poll, Don't Sleep

❌ **Bad:**
```typescript
await new Promise(r => setTimeout(r, 20000));
const status = await getStatus(runId);
```

✅ **Good:**
```typescript
while (Date.now() - start < timeout) {
  const status = await getStatus(runId);
  if (status === "completed") break;
  await new Promise(r => setTimeout(r, 2000));
}
```

---

## Testing in CI/CD

```yaml
# .github/workflows/test.yml
- name: Run backend tests
  run: |
    cd backend
    encore test
```

**Requirements:**
- Appium must be running (or skip tests that need it)
- Android emulator setup (for integration tests)
- Environment variables configured

---

## Related Skills

- **backend-testing** - Patterns for writing tests
- **webapp-testing** - E2E tests with Playwright
- **graphiti-mcp-usage** - Documenting debugging discoveries
