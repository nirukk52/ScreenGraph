# Debug Queries

Use these queries inside `task backend:db:shell` or via `encore-mcp_query_database`.

## Run Status & Ownership
```sql
SELECT run_id, status, worker_id, stop_reason, created_at, updated_at
FROM runs
WHERE run_id = '<runId>';
```
- Confirms worker claimed the run (`worker_id IS NOT NULL`).
- Check `stop_reason` for early exits.

## Event Timeline
```sql
SELECT seq, kind, node_name, created_at
FROM run_events
WHERE run_id = '<runId>'
ORDER BY seq;
```
- Expect contiguous `seq` values.
- Missing events indicate a stalled worker or failed subscription.

## Graph Projector Outcomes
```sql
SELECT outcome_id, upsert_kind, screen_id, step_ordinal, created_at
FROM graph_persistence_outcomes
WHERE run_id = '<runId>'
ORDER BY step_ordinal;
```
- At least one `upsert_kind = 'discovered'` when screens exist.

## Projection Lag Analysis
```sql
SELECT
  r.run_id,
  r.status,
  COUNT(re.seq)          AS events_count,
  COUNT(gpo.outcome_id)  AS projections_count,
  (COUNT(re.seq) - COUNT(gpo.outcome_id)) AS lag
FROM runs r
LEFT JOIN run_events re ON r.run_id = re.run_id
LEFT JOIN graph_persistence_outcomes gpo ON r.run_id = gpo.run_id
WHERE r.run_id = '<runId>'
GROUP BY r.run_id, r.status;
```
- Non-zero `lag` indicates projector backlog.

## Agent Snapshot
```sql
SELECT snapshot->>'nodeName' AS node,
       snapshot->>'status'   AS status,
       created_at
FROM run_state_snapshots
WHERE run_id = '<runId>'
ORDER BY step_ordinal DESC
LIMIT 1;
```
- Validates the last known agent state before failure.

## Recent Runs
```sql
SELECT run_id, status, stop_reason
FROM runs
ORDER BY created_at DESC
LIMIT 5;
```
- Quickly compare recent outcomes for pattern spotting.
