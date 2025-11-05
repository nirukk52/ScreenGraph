# ScreenGraph Backend

Encore.ts services that orchestrate the ScreenGraph agent, persist events, and expose APIs consumed by the SvelteKit frontend.

## Quick Start
- Install dependencies once per machine:
  ```bash
  cd backend
  bun install
  ```
- Run the stack locally (auto-provisions PostgreSQL + Pub/Sub):
  ```bash
  cd backend
  encore run
  ```
- Local endpoints: `http://localhost:4000` (REST + SSE), dashboard at `http://localhost:9400`.

## Services
- **Run API (`backend/run`)** – Start, cancel, and stream agent runs.
- **Agent Orchestrator (`backend/agent`)** – XState machine, ports/adapters, persistence.
- **Graph Projection (`backend/graph`)** – Background worker projecting `run_events` into graph tables.
- **Artifacts (`backend/artifacts`)** – Deterministic storage for screenshots and XML dumps.
- **Logging (`backend/logging`)** – Convenience helpers for structured Encore logs.

Each service obeys Encore boundaries: no cross-imports outside generated clients, no manual HTTP hops.

## Development Workflow
- **Tests** – `cd backend && encore test`
- **Database tools**
  ```bash
  cd backend
  encore db reset      # wipe local Postgres (useful during schema changes)
  encore db shell      # psql shell with credentials pre-configured
  encore db conn-uri   # copy connection string for external tooling
  ```
- **Logging discipline** – Always call `log.with({ module, actor, ...context })`; include `stopReason` on failures.
- **DTO rules** – Declare request/response DTOs at the top of the file or import from shared types. No `any`; prefer discriminated unions for dynamic payloads.
- **Secrets** – Manage via `encore secret set`; never read from `.env`.

## Directory Layout
```
backend/
├── encore.app            # App ID + CORS configuration
├── package.json          # Bun-managed dependencies
├── agent/                # Agent machine, nodes, adapters, persistence
├── run/                  # HTTP handlers for run lifecycle
├── graph/                # Projection service + hashing utilities
├── artifacts/            # Artifact storage service
├── logging/              # Logger helpers and actor/module constants
├── db/
│   ├── migrations/       # Sequential *.up.sql files (no .down.sql)
│   └── index.ts          # Database entrypoint
└── tests/                # Encore test files (uses `encore test` runner)
```

## API Highlights
- `POST /run` – start a run; queues work on the `run-job` topic and returns SSE stream URL.
- `GET /run/:id/stream` – Server-Sent Events emitting run timeline updates.
- `POST /run/:id/cancel` – cooperative cancellation for in-flight runs.
- Additional documentation endpoints exposed from `backend/steering` for knowledge base management.

Full spec lives in `backend/API_DOCUMENTATION.md` (regenerate clients via `cd frontend && bun run gen`).

## Data & Persistence
- **Events** – `run_events` is append-only with monotonic `seq` per run.
- **Snapshots** – `run_state_snapshots` store deterministic machine state for replay/resume.
- **Graph** – `screens`, `actions`, `edges`, and `graph_persistence_outcomes` track derived UI graph data. Projection cursors live in `graph_projection_cursors`.
- **Outbox** – `run_outbox` drives SSE delivery without double-publish.

See `AGENT_DATABASE_FLOW.md` for a step-by-step map from `/run` through projection.

## Deployment
- Deploy via Encore Cloud:
  ```bash
  cd backend
  encore auth login
  git push encore main
  ```
- Monitor deployment + logs at <https://app.encore.cloud> (app ID `screengraph-ovzi`).
- Update environment secrets through Encore’s CLI or dashboard.

## Troubleshooting
- **Port busy** – `lsof -ti:4000 | xargs kill` before re-running `encore run`.
- **Schema drift** – `cd backend && encore db reset`, then restart the service.
- **Missing generated clients** – Ensure frontend ran `bun run gen` after backend DTO changes.
- **Log noise** – Ensure `module`/`actor` pairs are set correctly before logging; dashboard filters rely on them.

## Reference Docs
- `BACKEND_HANDOFF.md` – Live status before/after each backend task.
- `CLAUDE.md` (root) – Founder-managed quick reference, always keep synchronized.
- `GRAPH_PROJECTION_APPROACH.md` – Design notes for the projection worker.
- `WEBDRIVER_APPIUM_SETUP_REVIEW.md` & `DEVICE_SETUP_INVESTIGATION.md` – Device automation procedures.

