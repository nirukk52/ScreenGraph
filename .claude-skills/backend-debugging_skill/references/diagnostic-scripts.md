# Diagnostic Scripts Arsenal

All scripts live in `backend/scripts/` and can be executed with `bunx tsx`.

## `inspect-run.ts`
```bash
bunx tsx backend/scripts/inspect-run.ts <runId>
```
Outputs run events, graph outcomes, and cursor state in chronological order. Use to confirm event sequencing and projector activity.

## `check-agent-state.ts`
```bash
bunx tsx backend/scripts/check-agent-state.ts <runId>
```
Prints agent state snapshots (node name, status, counters, budgets). Ideal for tracking where a state machine stalled.

## `check-cursor-ordering.ts`
```bash
bunx tsx backend/scripts/check-cursor-ordering.ts
```
Validates graph projector cursor health—identifies stuck cursors or ordering gaps.

## `find-latest-run.ts` / `find-completed-runs.ts`
```bash
bunx tsx backend/scripts/find-latest-run.ts
bunx tsx backend/scripts/find-completed-runs.ts
```
Locate recent runs for comparison when debugging regressions.

## `test-projector.ts`
```bash
bunx tsx backend/scripts/test-projector.ts <runId>
```
Exercises the graph projector in isolation to validate output without rerunning the full agent flow.

## Usage Tips
- Run scripts from repo root or backend directory.
- Combine with SQL queries to cross-check database observations.
- Capture output snippets in Graphiti episodes when documenting RCA.
