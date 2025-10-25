## Split Repos Plan: Encore Backend + SvelteKit Frontend (Vercel)

- Why this exists: This plan defines the milestones to separate the monorepo into two focused repos while preserving a single product experience. It ensures the backend continues to leverage Encore's capabilities and the frontend migrates to SvelteKit on Vercel with clean integration and observability.

---

### Milestone 1 — Repo Split Strategy, Scaffolding, and Baselines
- Outcome: Two repos initialized with clear ownership, envs, and baselines.
- Tasks:
  - Define repos
    - Backend: screengraph-backend (Encore app)
    - Frontend: screengraph-frontend (SvelteKit)
  - Backend
    - Keep current Encore app (`encore.app` unchanged)
    - Tag current main as pre-split baseline
    - Document API base URL contract and versioning policy
  - Frontend
    - Scaffold SvelteKit (SSR disabled initially or hybrid per route)
    - Set env config: `PUBLIC_API_BASE` (prod: https://<app-id>.encr.app, dev: http://localhost:4000)
    - Port core pages/components; stub client
  - Developer Experience
    - Local dev scripts documented
    - Lint/format configs aligned (TS, ESLint/Prettier optional)

---

### Milestone 2 — Backend Hardening on Encore and Cloud Readiness
- Outcome: Backend is stable, documented, observable, and safe to consume from the new frontend.
- Tasks:
  - API contracts
    - Freeze current endpoint shapes; add minor response envelopes if needed
    - Generate TS client (optional) or document REST/WS routes
  - Security & CORS
    - If calling directly from Vercel domain: add allowlist in `encore.app`
    - If proxying via custom domain: prefer same-origin to avoid CORS
  - Observability
    - Ensure structured logs for key flows
    - Add minimal tracing/labels for run lifecycle events
  - Streaming/WebSockets
    - Confirm WS URLs and auth model; document reconnection/backoff
  - Secrets/DB
    - Verify secrets set in Cloud
    - Confirm migrations stable; add reset instructions for dev

---

### Milestone 3 — SvelteKit Frontend Migration and Vercel Deployment
- Outcome: Frontend runs on Vercel, calls Encore API reliably, and supports streaming where applicable.
- Tasks:
  - SvelteKit
    - Implement pages: StartRun, RunTimeline, SteeringWheel
    - Create API client wrapper using `PUBLIC_API_BASE`
    - WS client: `PUBLIC_WS_BASE = PUBLIC_API_BASE.replace(/^http/, 'ws')`
  - Deployment
    - Vercel project: root=frontend repo
    - Build command: `pnpm build` or `bun run build` (pick one)
    - Output: `.vercel/output` (SvelteKit adapter-auto) or static if CSR-only
    - Env vars: `PUBLIC_API_BASE` (prod, preview, dev)
  - Edge concerns
    - If rewrites used: `vercel.json` rewrite `/api/*` → Encore API
    - If direct API calls: set CORS allowlist in Encore

---

### Milestone 4 — Integration, Domains, Observability, and Cutover
- Outcome: One cohesive product URL via custom domain, with backend on Encore and frontend on Vercel, and dashboards to monitor health.
- Tasks:
  - Domains
    - Frontend: `app.example.com` → Vercel
    - API (optional): `api.example.com` → Encore Cloud custom domain
    - Frontend calls
      - Same-origin `/api` via Vercel rewrites, or
      - Direct `https://api.example.com` with CORS allowlist
  - Monitoring
    - Define golden signals: latency, errors, WS disconnects
    - Add minimal health/status endpoints and UI indicators
  - Cutover
    - Smoke tests (Run start, timeline stream, steering docs)
    - Update environment docs; announce to team
    - Decommission Encore static serving for frontend

---

### Local Dev Cheat Sheet
- Backend: `encore run`
- Frontend: `cd frontend && PUBLIC_API_BASE=http://localhost:4000 bun run dev`
- WS Base: `PUBLIC_WS_BASE=http://localhost:4000` → replace to `ws://`

---

### Risks & Mitigations
- WS through Vercel rewrites unreliable → connect directly to Encore WS
- CORS issues → prefer same-origin via rewrites or set allowlist in `encore.app`
- Drift between repos → enforce versioned API docs and smoke tests in CI

---

### Success Criteria
- Backend deploys independently on Encore; DB migrations stable
- Frontend deploys independently on Vercel; pages load and interact with API
- One product URL via custom domain(s); streaming works reliably
- Clear runbooks for local dev, preview envs, and production
