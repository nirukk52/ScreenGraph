# Frontend Agents Overview

This document explains the agent-related UI in the frontend, how it integrates with the backend, and how to run and troubleshoot locally.

## Why this exists
- To align contributors on the Start Run and Run Timeline experiences
- To document how the frontend calls the backend to start, stream and cancel runs

## Pages
- **Start Run** (`/`): Form to submit a URL and start a run; navigates to the timeline on success.
- **Run Timeline** (`/run/[id]`): Streams events for a run and allows canceling an in‑flight run.

## APIs consumed by the frontend
- **Start run**
  - Method: POST
  - URL (local): `http://localhost:4000/run.Start`
  - Request body: `{ "url": string }`
  - Response: `{ id: string }` → navigate to `/run/{id}`

- **Stream run events**
  - Implemented in `$lib/api.ts`
  - Opens a streaming connection for JSON events; appends to UI incrementally

- **Cancel run**
  - Implemented in `$lib/api.ts`
  - Sends a cancellation command for the given `runId`

Notes:
- For production, replace `localhost` with the deployed backend base URL using environment‑driven config (to be wired up).
- Keep the UI resilient to stream interruptions; surface an error state and allow manual refresh/retry.

## Local development
- Backend (Encore): from repo root, start the backend.
- Frontend (SvelteKit):
  - `cd frontend`
  - `bun install`
  - `bun run dev`

Ensure the backend listens on `localhost:4000` (or update the base URL used by `$lib/api.ts`).

## Troubleshooting
- No events on `/run/[id]`:
  - Confirm backend is running and the run exists
  - Check browser devtools console and network tab
- CORS issues:
  - Allow the Vercel domain in production; allow all origins in local dev
- Vercel build problems:
  - See `DEPLOY_INSTRUCTIONS.md` for adapter compatibility, cache clearing, and root directory guidance
