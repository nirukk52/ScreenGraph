# Project Status

Date: 2025-10-26

## Backend (Encore)
- Stack: Encore.ts + PostgreSQL; App ID: screengraph-ovzi
- Local: `encore run` → http://localhost:4000 (Dashboard: http://localhost:9400)
- Cloud base: https://{env}-screengraph-ovzi.encr.app
- Endpoints: POST `/run`, WS `/run/:id/stream`, POST `/run/:id/cancel`, GET `/health`
- Next: Verify latest cloud deploy and logs in Encore dashboard

## Frontend (SvelteKit)
- Stack: SvelteKit 2 (Svelte 5), Bun, Tailwind
- Local: `cd frontend && bun run dev` → http://localhost:5173
- API client: `frontend/src/lib/encore-client.ts` (regenerate: `cd frontend && bun run gen`)
- Next: Deploy via Vercel (root: `frontend`, build: `bun run build`)

## Agent
- Location: `backend/agent/*` (domain, nodes, orchestrator)
- Orchestration endpoints: `backend/run` (start, stream, cancel)
- Persistence: SQL migrations in `backend/db/migrations`
- Tests: `backend/agent/tests` (determinism, idempotency, golden-run)

## Links
- Encore deploys: https://app.encore.cloud/screengraph-ovzi/deploys
- Vercel dashboard: https://vercel.com/dashboard
