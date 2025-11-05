# Run Service

## Service Role
- API facade for run lifecycle: start, cancel, stream.
- Publishes RunJob to topic; coordinates with Agent to execute.
- Streams run events (and interleaved `graph.*` outcomes) via SSE.
- Does not execute exploration logic and does not write graph tables.

## Interfaces
- `POST /run` – Start a run; returns `runId` and stream URL
- `POST /run/:id/cancel` – Request cancellation
- `GET /run/:id/stream` – SSE of run events; includes `graph.*` interleaved
- `GET /health` – Health check

## Interactions
- Publishes `RunJob` to Pub/Sub; consumed by `agent` worker subscription
- Reads `run_events` to serve SSE; joins `graph_persistence_outcomes` for `graph.*`
- No direct calls to `graph` write paths; read-only join for streaming

## Ownership
- Owns `runs` table and lifecycle fields (status, timestamps, stopReason)
- Owns run-event streaming contract and SSE ordering semantics

## Ordering & Determinism
- SSE ordering by `run_events.seq`; `graph.*` correlated via `source_run_seq`
- Reconnect-safe; clients can request from last known sequence


