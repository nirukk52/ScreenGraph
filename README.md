# ScreenGraph

Autonomous mobile app exploration platform built on an Encore.ts backend and a SvelteKit frontend. ScreenGraph coordinates a deterministic agent that explores Android apps, persists every observation, and projects a navigable screen graph.

## Architecture Snapshot
- `frontend/` – SvelteKit 2 (Svelte 5 runes) deployed to Vercel; consumes the backend via generated Encore clients.
- `backend/` – Encore.ts services deployed to Encore Cloud; includes run management, agent orchestration, graph projection, logging, and artifact storage.
- `docs/` & `steering-docs/` – Living documentation written alongside implementation work; follow the founder rules for maintenance.

The backend and frontend are completely isolated. No shared `node_modules`, no root-level package manifests, and no cross-imports.

---

## Quick Start

### Prerequisites
- [Bun](https://bun.sh) ≥ 1.0
- [Encore CLI](https://encore.dev/docs/install)
- Git

### Install Dependencies
```bash
cd backend
bun install

cd ../frontend
bun install
```

### Generate Encore Client (after backend contract changes)
```bash
cd frontend
bun run gen
```

### Run Services
```bash
# Terminal 1 – Backend
cd backend
encore run

# Terminal 2 – Frontend
cd frontend
bun run dev
```

- Backend API: `http://localhost:4000`
- Encore dashboard: `http://localhost:9400`
- Frontend dev: `http://localhost:5173`

---

## Development Workflows

### Backend (Encore.ts)
- **Tests:** `cd backend && encore test`
- **Database:**
  - Reset local DB – `cd backend && encore db reset`
  - Shell access – `cd backend && encore db shell`
  - Connection string – `cd backend && encore db conn-uri`
- **Logs:** `encore logs` (supports `--env=prod` for production)
- **Logging contract:** use `encore.dev/log` with contextual `module`/`actor` fields; never `console.log`.

### Frontend (SvelteKit)
- **Dev server:** `cd frontend && bun run dev`
- **Lint:** `cd frontend && bun run lint`
- **Type check:** `cd frontend && bun run check`
- **Unit tests:** `cd frontend && bun run test`
- **API usage:** always import from `~encore/clients`, never call `fetch` directly.

### Type-Safe API Iteration
1. Modify backend endpoint (DTOs at top of file).
2. `cd frontend && bun run gen` to refresh generated clients.
3. Update frontend code to use the regenerated types.

---

## API Overview
- Full reference: `backend/API_DOCUMENTATION.md`
- Key endpoints:
  - `POST /run` – start a new agent run.
  - `GET /run/:id/stream` – Server-Sent Events stream for run progress.
  - `POST /run/:id/cancel` – cancel an active run.
  - `GET /health` – health probe for orchestration services.

Logs and metrics live in Encore Cloud; search by `module` + `actor` for scoped analysis. Example queries:
```
module:"agent" AND actor:"worker" AND runId:<ID>
module:"run" AND actor:"start" AND level:ERROR
```

---

## Project Structure
```
ScreenGraph/
├── README.md
├── AGENT_DATABASE_FLOW.md
├── BACKEND_HANDOFF.md
├── BACKEND_README.md
├── FRONTEND_HANDOFF.md
├── backend/
│   ├── encore.app
│   ├── package.json
│   ├── agent/            # XState agent machine, nodes, adapters
│   ├── run/              # Run lifecycle APIs (start, stream, cancel, health)
│   ├── graph/            # Background projection service
│   ├── artifacts/        # Artifact storage service
│   ├── logging/          # Logger helpers and conventions
│   └── db/               # Typed migrations
├── frontend/
│   ├── package.json
│   ├── CLAUDE.md         # Frontend conventions & quick reference
│   ├── src/
│   │   ├── lib/          # Generated Encore client + UI components
│   │   └── routes/       # SvelteKit pages (landing, run timeline, steering)
│   └── tailwind.config.ts
├── docs/                 # Founder-managed docs (logging plan, QA methodology)
└── steering-docs/        # Living artifacts, procedures, preferences
```

---

## Deployment

### Backend → Encore Cloud
```bash
cd backend
encore auth login
git push encore main
```
- Monitor builds at <https://app.encore.cloud> (app ID: `screengraph-ovzi`).
- Secrets managed via `encore secret set`.

### Frontend → Vercel
```bash
cd frontend
vercel --prod
```
- Required env var: `PUBLIC_API_BASE` (pointing to the Encore deployment).
- Build command: `bun run build`. Install command: `bun install`. Output: `dist`.

---

## Troubleshooting
- **Port 4000 busy:** `lsof -ti:4000 | xargs kill` then relaunch `encore run`.
- **Encore service stuck:** stop the process, run `cd backend && encore db reset`, then restart.
- **Frontend fails to pick up new API types:** `cd frontend && bun run gen` followed by `bun run check`.
- **CORS errors:** confirm origins inside `backend/encore.app` include the caller.
- **Device automation issues:** see `DEVICE_SETUP_INVESTIGATION.md` and `WEBDRIVER_APPIUM_SETUP_REVIEW.md`.

---

## Additional References
- `CLAUDE.md` – Quick command cheat sheet (founder-managed).
- `BACKEND_README.md` – Service-level deep dive.
- `BACKEND_HANDOFF.md` & `FRONTEND_HANDOFF.md` – Always update before handing work off.
- `GRAPH_PROJECTION_APPROACH.md` – Historical context for the graph service.
- `docs/FOUNDER_QA_METHODOLOGY.md` – Log-based QA workflow.

---

## License

Proprietary – consult the founder before sharing outside the team.

---

Welcome to ScreenGraph 🚀
