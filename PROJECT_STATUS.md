# Project Status

**Last Updated:** 2025-10-27

## ✅ Recently Completed

### Agent Orchestration (Complete)
- **NodeEngine**: Typed control plane with retry/backtrack transitions
- **Worker Loop**: Budget enforcement, cancellation, lease heartbeats
- **Orchestrator**: Event recording, snapshot persistence, ID generation
- **Node Registry**: Factory wiring for EnsureDevice → ProvisionApp flow
- **Status**: Infrastructure complete; nodes ready for wiring

### Structured Logging (Complete)
- **Module/Actor Organization**: Unified logging with `module` and `actor` fields
- **Dashboard Filtering**: Search by `module:"agent"`, `actor:"worker"`, `runId:<ID>`
- **Full Instrumentation**: Subscription, Worker, Orchestrator, API all logged
- **Status**: Production-ready; primary QA method established

## 🏗️ Current Architecture

### Backend (Encore.ts + PostgreSQL)
- **Stack**: Encore.ts, PostgreSQL, Bun
- **App ID**: screengraph-ovzi
- **Local**: `encore run` → http://localhost:4000 (or 4001 if 4000 busy)
- **Dashboard**: http://localhost:9400
- **Cloud**: https://{env}-screengraph-ovzi.encr.app

### Frontend (SvelteKit)
- **Stack**: SvelteKit 2 (Svelte 5), Bun, Tailwind
- **Local**: `cd frontend && bun run dev` → http://localhost:5173
- **API Client**: `frontend/src/lib/encore-client.ts` (regenerate: `bun run gen`)
- **Deploy**: Vercel (root: `frontend`, build: `bun run build`)

## 📂 Key Subsystems

### `/backend/run` - Run Service
- API endpoints: POST `/run`, GET `/run/:id/stream`, POST `/run/:id/cancel`, GET `/health`
- Pub/Sub: `run-job` topic publishes to agent orchestrator
- **Status**: Fully logged, production-ready

### `/backend/agent` - Agent Domain
- **`/orchestrator`**: NodeEngine, Worker, Orchestrator, node registry
- **`/nodes`**: Setup (EnsureDevice, ProvisionApp, LaunchOrAttach, WaitIdle), Main (8 nodes), Policy, Recovery, Terminal
- **`/ports`**: Abstract interfaces (Appium, DB, LLM, OCR, storage)
- **`/adapters`**: Concrete implementations (WebDriverIO, fakes)
- **`/domain`**: Core types (state, events, entities, actions)
- **Status**: Orchestration complete; main nodes pending wiring

### `/backend/logging` - Structured Logging
- `logger.ts`: LogContext, loggerWith helper, MODULES/ACTORS constants
- `HANDOFF.md`: Complete implementation summary with Graphiti episode IDs
- **Status**: Production-ready

### `/backend/db` - Database
- PostgreSQL migrations in `backend/db/migrations`
- Tables: `runs`, `run_events`, `agent_state_snapshots`, `run_outbox`, `steering_documents`
- **Status**: Schema complete

## 🎯 Next Steps

### Immediate
1. Wire node handlers into registry (EnsureDevice, ProvisionApp with real Appium calls)
2. Test orchestration flow with real device
3. Verify logs in Encore dashboard for full run

### Short-Term
- Complete main loop nodes (Perceive → Act → Verify cycle)
- Integrate LangGraph.js for main decision loop
- Add policy switching and recovery nodes

### Medium-Term
- Deploy to staging environment
- Frontend timeline UI for run visualization
- Performance optimization and monitoring

## 🔗 Important Links
- **Encore Deploys**: https://app.encore.cloud/screengraph-ovzi/deploys
- **Vercel Dashboard**: https://vercel.com/dashboard
- **API Docs**: [backend/API_DOCUMENTATION.md](backend/API_DOCUMENTATION.md)
- **Logging Guide**: [backend/logging/CLAUDE.md](backend/logging/CLAUDE.md)
- **Agent Architecture**: [backend/agent/CLAUDE.md](backend/agent/CLAUDE.md)
