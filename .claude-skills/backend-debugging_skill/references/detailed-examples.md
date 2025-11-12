# Detailed Debugging Examples

## Case Study: "0 Screens Discovered"
```typescript
// 1. Confirm completion
const run = await db.queryRow`
  SELECT status, stop_reason FROM runs WHERE run_id = ${runId}
`;

// 2. Inspect events
const events = await db.queryAll`
  SELECT seq, kind FROM run_events WHERE run_id = ${runId} ORDER BY seq
`;

// 3. Ensure perception event exists
const perceived = events.find((event) => event.kind === 'agent.event.screen_perceived');

// 4. Check projector outcomes
const outcomes = await db.queryAll`
  SELECT upsert_kind FROM graph_persistence_outcomes WHERE run_id = ${runId}
`;
```
**Diagnosis:** Projector lagged behind event stream.
**Fix:** Increase polling window or delay projector assertions by ~5 seconds.

## Case Study: Subscription Not Loaded
- Symptom: Run remains `queued` and no events emitted.
- Fix: Import worker subscription inside the test file **before** calling the service.

```typescript
import '../agent/orchestrator/subscription';

it('dispatches work to the agent', async () => {
  await start({ runId });
  await expectRunToComplete(runId);
});
```

## Case Study: Path Alias Missing
- Symptom: `Error: Failed to load ~encore/clients`.
- Fix: Update `backend/vitest.config.ts`:
```typescript
resolve: {
  alias: {
    '~encore': resolve(__dirname, './encore.gen')
  }
}
```

## RCA Template
1. **Symptom:** Brief description + log snippet
2. **Impact:** Tests affected / services failing
3. **Root Cause:** What broke (missing import, bad config, etc.)
4. **Fix:** Code/infra change applied
5. **Prevention:** Follow-up actions (tests, scripts, docs)
6. **Graphiti Entry:** Add episode with log excerpts + links
