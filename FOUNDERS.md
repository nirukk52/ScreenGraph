# ScreenGraph Founders Doc

This document captures the working mental models for the current app, and immediate steps to improve those models and accelerate development.

## Purpose
- Provide a shared, lightweight source of truth for how the system is supposed to work.
- Help make rapid decisions without rediscovering tribal knowledge.
- Keep a short list of quick wins to continually reduce friction.

## Core Mental Models

### 1) Run Lifecycle
- A Run represents a single autonomous agent execution over an app under test.
- Creation: `POST /run` inserts a `runs` row and publishes a `run-job` to orchestrate processing.
- Execution: The orchestrator consumes `run-job` and starts the agent loop.
- Streaming: Clients attach to `/run/:id/stream` to receive backfill + live events in order.
- Completion: Terminal events close the stream and finalize run status.

### 2) Event Sourcing (Lightweight)
- Domain events for a run are written to `run_events` with monotonically increasing `seq`.
- Stream endpoint backfills from last seen `seq` and then polls for new events, preserving order.
- Terminal events: `agent.run.finished`, `agent.run.failed`, `agent.run.canceled` close the stream.

### 3) Orchestration via Pub/Sub
- `run-job` Topic triggers the worker (`orchestrator`) to kick off the agent loop.
- The worker is idempotent with respect to run status updates and event sequences.
- Failures are surfaced; retries handled per pub/sub semantics (at-least-once delivery).

### 4) Idempotency & Consistency
- Event inserts enforce uniqueness on `(run_id, seq)`; duplicates with differing payloads are rejected.
- Run status updates follow a compare-and-set style rule: first terminal status wins.

### 5) Frontend Timeline
- `RunTimeline` subscribes to the backend stream with `lastEventSeq` for robust resume after reconnects.
- UI deduplicates events by `seq` and recognizes terminal states to stop streaming.

## Current Implementation Anchors
- Start Run: `backend/run/start.ts` (`POST /run`, publishes `run-job`).
- Orchestrator Worker: `backend/run/orchestrator.ts` (subscribes to `run-job`, runs agent loop).
- Stream: `backend/run/stream.ts` (backfill then live poll, closes on terminal events).
- Frontend Timeline: `frontend/pages/RunTimeline.tsx` (connects, dedupes, displays).
- Idempotency tests: `backend/agent/tests/idempotency.test.ts`.

## Invariants (What must always be true)
- Event order per run is strictly increasing by `seq`.
- Stream never emits out-of-order or duplicate events to the same client session.
- First terminal status for a run is final; subsequent attempts are ignored.

## Immediate Quick Wins (Rapid Dev)
1) Tighten Event Type Naming
   - Align terminal types across backend and frontend (`agent.run.finished|failed|canceled` vs UI constants) to avoid mismatches.
2) Add Indexes
   - Ensure `run_events(run_id, seq)` composite index and `runs(run_id)` are present for fast backfill/stream queries.
3) Stream Backoff & Jitter
   - Introduce jittered backoff in stream polling to reduce thundering herd during reconnects.
4) Health & Diagnostics
   - Add a lightweight `GET /run/:id/status` returning current status and last seq for quick UI sanity checks.
5) Event Shape Contract
   - Export a shared `RunEvent` TypeScript type to both backend and frontend to prevent drift.
6) Better Error Surfacing in Stream
   - Map internal errors to structured `APIError` details so UI can render actionable messages.
7) Orchestrator Observability
   - Add structured logs around agent loop start/stop and per-step timing; include `runId` consistently.
8) Guardrails in Start Run
   - Validate `goal`, `maxSteps` bounds and `appiumServerUrl` format early with descriptive errors.

## Near-Term Improvements to Mental Models
- Clarify state machine for Run (diagram + textual spec) including intermediate states (e.g., running, canceling, canceled).
- Define a canonical event taxonomy and naming scheme (prefixes, domains, terminal markers).
- Document backpressure strategy for high event volumes (batching, pagination windows, or cursor-based streaming).

## Operating Principles
- Prefer explicit invariants and tests over comments.
- Design for idempotency and at-least-once delivery first; layer exactly-once only if needed.
- Keep the founder doc short and actionable; update alongside meaningful behavior changes.

## Encore Rapid Dev Best Practices
- **Tight dev loop**
  - Use `encore run --watch` during local development for auto-reload.
  - Tail logs with `encore logs` and include `runId` in all log contexts via `log.with({ runId })`.
- **Type-safe APIs**
  - Prefer `api({ ... }, async (req): Promise<Res> => {})` with explicit request/response interfaces.
  - Use `Query<T>`, `Header<"...">`, and path params (`/route/:id`) for validation without extra code.
  - Prefer `APIError.*` helpers with `withDetails` for actionable UI errors.
- **Streaming endpoints**
  - Handshake carries `lastEventSeq`; always backfill then stream live updates.
  - Emit consistent terminal event names and close the stream on first terminal event.
- **Pub/Sub orchestration**
  - Declare `Topic` at module top-level; handlers must be idempotent (at-least-once delivery).
  - Keep messages small; store large payloads in DB and reference by ID.
- **SQL & migrations**
  - Keep migrations atomic and sequentially numbered; include indices for hot paths (e.g., `run_events(run_id, seq)`).
  - Use only `query`, `queryRow`, `exec`; strongly type result rows for safety and clarity.
- **Secrets management**
  - Define secrets with `secret("Name")`; set values via CLI or dashboard.
  - Use `.secrets.local.cue` for local overrides; never hardcode secrets in code.
- **CORS & headers**
  - Configure CORS in `encore.app` (`allow_origins_with_credentials` for authenticated frontends).
  - Let Encore infer headers from types; add `allow_headers`/`expose_headers` only for raw endpoints.
- **Middleware**
  - Centralize auth and cross-cutting concerns; use `target` filters instead of runtime checks.
- **Static assets**
  - Serve built frontend via `api.static` for cohesive local dev and preview environments.
- **Client generation**
  - Use the generated TS client for external consumers; regenerate clients after API surface changes (`encore gen client ...`).
- **Observability**
  - Adopt structured logs with stable keys; include timing around orchestrator steps and DB queries.
- **Environment-aware behavior**
  - Use `appMeta()` to adjust behavior (e.g., verbose logging in dev, stricter limits in prod).
- **DB tooling**
  - Leverage `encore db proxy` for external tools, and `encore db reset` to clean local state for reproducible tests.
