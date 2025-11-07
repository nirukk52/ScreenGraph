## ScreenGraph — Architecture Review (Living Document)

> Purpose: A single, evolving reference for architecture, flows, critiques, and models across backend (Encore.ts) and frontend (SvelteKit). This document is indexed and designed for continuous updates as the system grows.

### How to use this document
- Keep entries short and actionable; link out to deeper service docs.
- Prefer type-safe, Encore-first backend patterns and SvelteKit v2 + Svelte v5 Runes on the frontend.
- Do not duplicate content from rules; link to them:
  - @backend_engineer.mdc, @frontend_engineer.mdc
  - @backend_llm_instructions.mdc, @frontend_llm_instruction.mdc

---

## Index
- [System Overview](#system-overview)
- [Service Map (Encore.ts)](#service-map-encorets)
- [Key Flows](#key-flows)
  - [Start Run → Orchestrate → Stream Timeline](#start-run--orchestrate--stream-timeline)
  - [Artifacts Persistence](#artifacts-persistence)
  - [Graph Projection and Streaming](#graph-projection-and-streaming)
  - [Run Cancellation](#run-cancellation)
- [Data Model Overview](#data-model-overview)
- [Frontend Architecture (SvelteKit)](#frontend-architecture-sveltekit)
- [Encore ↔ Svelte Integration](#encore--svelte-integration)
- [Observability & Diagnostics](#observability--diagnostics)
- [CORS & Security](#cors--security)
- [Critiques & Risks](#critiques--risks)
- [Evolution Plan](#evolution-plan)
- [References](#references)
- [Changelog](#changelog)

---

## System Overview
- **Goal:** Build a deterministic, event-sourced ScreenGraph of an Android app’s UI while an agent explores it. Provide live and replayable streams for UI and timeline visualization.
- **Architecture style:** Event-sourced projection with single-sink semantics — all writes originate from agent-run events; the graph is derived and thus replayable.
- **Execution model:**
  - Backend: Encore.ts services: `run/`, `agent/`, `artifacts/`, `graph/`.
  - Frontend: SvelteKit 2 + Svelte 5; typed calls via generated Encore client.
  - Storage: PostgreSQL (Encore SQLDatabase), Encore Objects (artifacts bucket).
  - Streams: Server-streaming endpoints for run timeline and graph updates.

---

## Service Map (Encore.ts)

- `backend/run/`
  - Public API for run lifecycle: start, cancel, stream timeline.
  - Publishes jobs, reads run events, interleaves `graph.*` outcomes in the stream.
  - Endpoints (representative):
    - POST `/run` — create run, publish job, return `{ runId, streamUrl }`
    - POST `/run/:id/cancel` — mark pending cancellation
    - GET `/run/:id/stream` — server-streaming timeline (heartbeat, `agent.*`, interleaved `graph.*`)

- `backend/agent/`
  - Orchestrates exploration via a typed XState machine; executes nodes deterministically.
  - Ports/adapters interact with device/app/encore services. Persists snapshots and node events.
  - Consumes `run-job` topic; writes `run_events`; uploads artifacts via Encore client.

- `backend/artifacts/`
  - Content-addressed artifact storage (screenshots, UI XML) with deterministic `refId`.
  - Endpoints (internal):
    - POST `/artifacts` — store artifact content; returns `{ refId, byteSize, contentHashSha256 }`
    - GET `/artifacts/:refId` — fetch indexed metadata

- `backend/graph/`
  - Event-sourced projector from `run_events` → canonical tables (`screens`, `actions`, `edges`, outcomes).
  - Provides run-scoped graph retrieval and streaming (live or replay).
  - Endpoints (representative):
    - GET `/graph/run/:runId` — full ScreenGraph (filters canonical by run)
    - GET `/graph/run/:runId/stream` — server-streamed `graph.*` events with replay option

---

## Key Flows

### Start Run → Orchestrate → Stream Timeline
1. Client calls `POST /run` (service: `backend/run`). Run row inserted (status `queued`), job published.
2. `agent` worker consumes job, initializes XState agent machine with `EnsureDevice` entry.
3. Agent iterates nodes (launch/attach, perceive, decide, act), persisting:
   - `run_events` for timeline
   - Artifacts via `artifacts.store` (refs persisted in events/state)
4. `run` service `GET /run/:id/stream` merges:
   - Heartbeats + `agent.*` from `run_events`
   - Interleaved `graph.*` from `graph_persistence_outcomes` using source sequence correlation
5. Frontend subscribes to the stream for live timeline; closes on terminal event.

### Artifacts Persistence
1. Agent produces screenshot/XML; computes `sha256` and calls internal POST `/artifacts`.
2. Service uploads to objects bucket; indexes row (idempotent by `artifact_ref_id`).
3. Deterministic `refId`: `obj://artifacts/{runId}/{kind}/{sha256}.{ext}`.
4. Graph projector later reads XML via `refId` to compute `layout_hash`.

### Graph Projection and Streaming
1. Background projector tails `run_events`, normalizes XML, computes hashes, upserts:
   - `screens` (perceptual/layout hash), `actions` (provenance, coordinates), `edges`
   - Writes `graph_persistence_outcomes` with `source_run_seq`.
2. Stream endpoint `GET /graph/run/:runId/stream`:
   - If active run: live updates + optional backfill from `fromSeq`
   - If ended: replay outcomes then close (deterministic order).

### Run Cancellation
1. `POST /run/:id/cancel` sets cancellation request timestamp in `runs`.
2. Agent loop checks budgets/stop conditions; transitions to stopped, sets final status.
3. Timeline stream detects terminal event and closes.

---

## Data Model Overview

Migrations (see `backend/db/migrations/`):
- `001_crawl_schema.up.sql` — initial crawl schema (runs, events)
- `002_crawl_outbox.up.sql` — outbox scaffolding
- `003_agent_state_schema.up.sql` — snapshots/state
- `004_run_lease_management.up.sql` — leases/concurrency
- `005_event_kind_alignment.up.sql` — event kind normalization
- `006_add_app_events.up.sql` — app-level event extensions
- `007_graph_projection.up.sql` — `screens`, `actions`, `edges`, outcomes, cursors
- `008_mvp_schema_refactor.up.sql` — consolidations/refactors

Canonical tables (high-level):
- `runs` — lifecycle, timestamps, stop reasons
- `run_events` — ordered agent timeline (`seq`, `kind`, `payload`, `created_at`)
- `run_artifacts` — artifact index (`artifact_ref_id`, `run_id`, `kind`, sizes, hashes)
- `screens` — canonical screens (layout/perceptual hashes)
- `actions` — candidate affordances + provenance (origin: `xml|llm|heuristic`)
- `edges` — `(from_screen, action, to_screen)` with evidence
- `graph_persistence_outcomes` — projection outcomes with `source_run_seq`
- `graph_projection_cursors` — projector position per run
- `action_execution_coverage` — per-run coverage of attempted/failed/succeeded actions

Determinism pillars:
- Stable IDs (`sha256` of domain tuples).
- Idempotent upserts and outcome keys.
- Event-ordering via `run_events.seq` with correlated `source_run_seq`.

---

## Frontend Architecture (SvelteKit)
- Structure: `frontend/src/routes/` (pages), `frontend/src/lib/` (components, stores, clients).
- Svelte 5 Runes for state management (`$state`, `$derived`, `$effect`) and snippets for composition.
- Typed backend calls: generated Encore client at `frontend/src/lib/encore-client.ts`.
- Core UX:
  - Timeline: subscribe to `GET /run/:id/stream` and render live events.
  - Graph view: subscribe to `GET /graph/run/:runId/stream` and update screens/edges in real time.
- Dev discipline:
  - Use Tailwind; avoid inline CSS.
  - SSR on first load; CSR thereafter. Use `+page(.server).ts` for data, keep UI minimal/typed.

---

## Encore ↔ Svelte Integration
- Generate client after backend changes:
  - `cd frontend && bun run gen`
- Local dev:
  - Backend: `cd backend && encore run`
  - Frontend: `cd frontend && bun run dev`
- CORS: configured in `backend/encore.app` (allow `http://localhost:5173` and production origins).
- Contracts:
  - Frontend MUST call Encore via the generated client (no manual `fetch`).
  - Backend services MUST keep explicit request/response types (no `any`), leverage Encore validation.

---

## Observability & Diagnostics
- Logging: `encore.dev/log` only; include `{ module, actor, runId }` where applicable.
  - Run: `module="run"`, actors: `start|stream|cancel`.
  - Graph: `module="graph"`, actors: `projector|api`.
  - Artifacts: `module="artifacts"`, actors: `store|getMeta`.
- Tracing & Metrics: Use Encore traces/metrics to inspect projector cadence and stream latencies.
- Debug scripts:
  - `backend/scripts/check-graph-bug.ts` (graph projection checks)
  - `encore logs` for live log streaming

---

## CORS & Security
- `backend/encore.app` global CORS:
  - All origins allowed for non-credentialed requests by default.
  - Credentialed origins allowlisted (`localhost:5173`, Vercel domains, etc.).
- No raw artifact content is exposed publicly by default (metadata only).
- Authentication: When required, integrate via Encore `authHandler` and propagate with generated clients.

---

## Critiques & Risks
- **SSE merging complexity:** Interleaving `agent.*` and `graph.*` requires careful sequence handling; watch for off-by-one or replay gaps.
- **Projector replay cost:** Recomputing hashes and outcomes can be CPU/IO intensive; consider batching and backpressure.
- **Idempotency boundaries:** Ensure artifact indexing and graph outcome uniqueness remain stable across deploys.
- **Backtracking semantics:** XState backtracks must preserve determinism and emit clear events for timeline consumers.
- **Outbox delivery:** If/when external integrations are added, use outbox patterns with idempotent consumers.
- **SSE vs WebSocket:** SSE simplicity is great; if bi-directionality is needed later, evaluate WS upgrade path.

Mitigations:
- Keep DTOs explicit with literal unions and stable enums.
- Maintain deterministic IDs; document hashing strategies.
- Extend projector metrics for lag, retries, and replay durations.

---

## Evolution Plan
- Short term:
  - Finalize `GET /graph/run/:runId` and `.../stream` contracts.
  - Timeline UI refinement with coverage overlays from graph stream.
  - Improve projector observability (lag, batch sizes, outcomes/sec).
- Mid term:
  - Coverage views (screen/action coverage for planners).
  - Raw artifact access with auth-gating (optional).
  - Replay tooling: rebuild graph from `run_events` for specified ranges.
- Long term:
  - Distributed projector sharding by run/app.
  - LLM-assisted planning/affordance scoring (integrate `steering`).

Related JIRA notes (see `jira/feature-requests/`):
- FR-009 graph-stream endpoint
- FR-010 run default config sync
- FR-004 orchestrator worker / FR-005 outbox publisher

---

## References
- Service docs:
  - `backend/run/README.md`, `backend/run/CLAUDE.md`
  - `backend/graph/README.md`, `backend/graph/FOUNDER_MENTAL_MODEL.md`, `backend/graph/CLAUDE.md`
  - `backend/artifacts/README.md`, `backend/artifacts/IMPLEMENTATION.md`
  - `backend/agent/ARCHITECTURE_SUMMARY.md`, `backend/agent/orchestrator/README.md`
- Rules and engineering guides:
  - @backend_engineer.mdc, @frontend_engineer.mdc
  - @backend_llm_instructions.mdc, @frontend_llm_instruction.mdc
- Quick start & conventions:
  - `CLAUDE.md` (root), `backend/CLAUDE.md`, `frontend/CLAUDE.md`
  - `BACKEND_HANDOFF.md`, `FRONTEND_HANDOFF.md`

---

## Changelog
- 2025-11-07: Initial version — system overview, flows, data model, critiques, and evolution plan. Linked to rules and service docs.


