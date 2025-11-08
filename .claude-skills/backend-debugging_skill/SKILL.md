# Backend Debugging Skill

**Purpose:** Systematic 10-phase debugging procedure for Encore.ts backend issues.

---

## When to Use

- Backend service errors or crashes
- API endpoint failures
- Database query issues
- PubSub message delivery problems
- Performance bottlenecks

---

## 10-Phase Debugging Process

### Phase 1: Health Check
```bash
task backend:health
task backend:logs
```

### Phase 2: Service Status
```bash
task founder:servers:status
encore logs
```

### Phase 3: Database State
```bash
task backend:db:shell
# Check recent migrations
```

### Phase 4: Encore Dashboard
- Open http://localhost:9400
- Review traces, logs, metrics

### Phase 5: Type Safety
```bash
task backend:test
# Check for type errors
```

### Phase 6: Structured Logging
- Review `encore.dev/log` usage
- Check for proper context fields

### Phase 7: PubSub/Outbox
- Verify message delivery
- Check outbox publisher status

### Phase 8: Isolation Testing
- Test endpoint in isolation
- Mock dependencies

### Phase 9: Integration Tests
```bash
encore test
```

### Phase 10: MCP Tools
- Use Encore MCP for runtime introspection
- Check metadata, traces, database schemas

---

## Common Issues

### Database Connection Failures
- Check migrations applied
- Verify connection string
- Reset database if needed: `task founder:workflows:db-reset`

### Type Errors
- Regenerate client: `task founder:workflows:regen-client`
- Check for `any` types (forbidden)

### Logging Issues
- Never use `console.log` (use `encore.dev/log`)
- Always include structured context

---

## BUG-010 Case Study: Advanced Debugging Techniques

### Diagnostic Scripts Arsenal

Created during BUG-010 investigation (all in `backend/scripts/`):

1. **`inspect-run.ts`** - Complete run event timeline
   ```bash
   bunx tsx backend/scripts/inspect-run.ts <runId>
   # Shows: events, graph outcomes, cursor state, run record
   ```

2. **`check-agent-state.ts`** - Agent state snapshots
   ```bash
   bunx tsx backend/scripts/check-agent-state.ts <runId>
   # Shows: nodeName, status, counters, budgets, timestamps
   ```

3. **`check-cursor-ordering.ts`** - Projector cursor health
   ```bash
   bunx tsx backend/scripts/check-cursor-ordering.ts
   # Reveals: cursor limit issues, stuck cursors, ordering problems
   ```

4. **`find-completed-runs.ts`** / **`find-latest-run.ts`**
   ```bash
   bunx tsx backend/scripts/find-completed-runs.ts  # Successful runs
   bunx tsx backend/scripts/find-latest-run.ts      # Recent runs (any status)
   ```

5. **`test-projector.ts`** - Isolated projector testing
   ```bash
   bunx tsx backend/scripts/test-projector.ts <runId>
   # Tests: cursor hydration, event fetch, screen projection
   ```

### Git Forensics for Regressions

**Timeline Method:**
```bash
# 1. Find last successful run
bunx tsx backend/scripts/find-completed-runs.ts
# Example: 01K9G8YXY6MG7J7875A5AM9Z4H at 2025-11-07 17:03

# 2. Find first failed run
bunx tsx backend/scripts/find-latest-run.ts
# Example: 01K9GDQF9JQFM8A4Q5WGMARPAT at 2025-11-07 18:26

# 3. Identify commits in regression window
git log --oneline --since="Nov 7 17:00" --until="Nov 7 19:00"

# 4. Examine suspect commits
git show <commit_hash> --stat               # Files changed
git show <commit_hash> <file_path>          # Detailed diff
git show <commit_hash>~1:<file_path>       # Before version
```

**Binary Search Method:**
```bash
git bisect start
git bisect bad HEAD                         # Current broken state
git bisect good <last_known_good_commit>    # From timeline
# Test each commit automatically until culprit found
git bisect reset                            # Exit bisect mode
```

### Database Query Analysis

**Stop Node Hang (BUG-010 Example):**
```typescript
// PROBLEM: Query inside node execution blocks XState machine
const rows = await db.query`SELECT COUNT(*) FROM graph_persistence_outcomes WHERE run_id = ${runId}`;

// SYMPTOMS:
// - Worker times out after 30s lease
// - Agent state shows "running" but stuck
// - No "agent.node.finished" event emitted

// DIAGNOSIS:
// 1. Check worker lease timeout logs
// 2. Inspect agent state (last snapshot shows incomplete node)
// 3. Test query in isolation (encore exec bunx tsx test-query.ts)
// 4. Profile query execution time

// FIX:
// Move heavy queries OUTSIDE critical execution path
// Use lightweight operations in terminal nodes
```

### Cursor Limit Investigation

**Projector Stalling Pattern:**
```typescript
// SYMPTOM: Recent runs never get graph_persistence_outcomes
// CHECK: backend/graph/projector.ts
const CURSOR_LIMIT = 50;  // ❌ Only processes 50 oldest cursors

// DIAGNOSIS:
bunx tsx backend/scripts/check-cursor-ordering.ts
// Output: 75 total cursors, positions 51-75 never processed

// VALIDATION:
SELECT COUNT(*) FROM graph_projection_cursors;  -- Shows 75
SELECT * FROM graph_projection_cursors ORDER BY updated_at ASC LIMIT 50;  -- Top 50
SELECT * FROM graph_projection_cursors ORDER BY updated_at DESC LIMIT 10; -- Recent (excluded)

// FIX:
const CURSOR_LIMIT = 200;  // Scale with concurrent runs
```

### Worker State Inspection

**Understanding Worker Lifecycle:**
```bash
# 1. Check run claim status
SELECT processing_by, processing_started_at FROM runs WHERE run_id = '<runId>';

# 2. Verify lease heartbeat
# Watch Encore logs for "extending lease" messages

# 3. Inspect final disposition
SELECT status, stop_reason FROM runs WHERE run_id = '<runId>';
# status=failed indicates worker crash/timeout before Stop node
```

### Phase 11: Advanced Regression Analysis (NEW)

When standard phases 1-10 don't reveal the issue:

1. **Compare successful vs failed run events side-by-side**
   ```bash
   diff <(bunx tsx backend/scripts/inspect-run.ts <good_run>) \
        <(bunx tsx backend/scripts/inspect-run.ts <bad_run>)
   ```

2. **Identify missing events in sequence**
   - Successful run: 19 events (includes Stop at step 6)
   - Failed run: 15 events (stops at WaitIdle step 5)
   - Missing: `agent.node.started Stop`, `agent.run.finished`

3. **Trace XState machine transitions**
   - Add logging to guards and actions in `agent.machine.factory.ts`
   - Monitor which guards evaluate true/false
   - Identify unexpected state transitions

4. **Test node execution in isolation**
   ```typescript
   // scripts/test-node-isolation.ts
   import { stop } from "../agent/nodes/terminal/Stop/node";
   const input = { /* build input from failed run state */ };
   const result = await stop(input);
   console.log("Node output:", result);
   ```

### Common Backend Regression Patterns

| Issue | Symptom | Investigation | Common Cause |
|-------|---------|---------------|--------------|
| **Cursor Limit** | Recent runs stuck at seq=1 | `check-cursor-ordering.ts` | `CURSOR_LIMIT` too low |
| **Node Hangs** | Agent state "running" indefinitely | `check-agent-state.ts` | DB query blocks execution |
| **Lease Timeout** | Run fails after 30s | Worker logs, database `processing_by` | Heavy sync operations |
| **Missing Events** | Timeline incomplete | `inspect-run.ts`, compare with baseline | Event not emitted or lost |
| **State Machine Stuck** | No transitions after event | XState logs, guard evaluation | Guard logic error |

### Lesson: Avoid Heavy Operations in Critical Path

**Bad Pattern (BUG-010):**
```typescript
export async function stop(input: StopInput) {
  // ❌ DB query inside terminal node execution
  const rows = await db.query`SELECT COUNT(*) ...`;
  // If query hangs, entire machine stalls
}
```

**Good Pattern:**
```typescript
export async function stop(input: StopInput) {
  // ✅ Use pre-computed metrics from input
  const metrics = input.finalRunMetrics;
  // Terminal nodes must be lightweight and deterministic
}
```

**Rationale:**
- Terminal nodes finalize run state → must complete reliably
- Heavy queries → post-run analytics layer
- Critical path → optimized for latency, not accuracy

---

## References
- BUG-010 RCA: `jira/bugs/BUG-010-run-page-regressions/RCA.md`
- Diagnostic Scripts: `backend/scripts/`
- Encore Debugging: `backend_coding_rules.mdc`

