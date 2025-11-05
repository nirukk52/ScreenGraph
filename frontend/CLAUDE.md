# ScreenGraph Frontend Quick Reference

## Commands
- Install deps – `cd frontend && bun install`
- Dev server – `cd frontend && bun run dev`
- Lint – `cd frontend && bun run lint`
- Type check – `cd frontend && bun run check`
- Tests – `cd frontend && bun run test`
- Generate Encore client (after backend changes) – `cd frontend && bun run gen`

## API Consumption
- Always import from `~encore/clients`; never call `fetch` manually.
- DTOs come from generated clients; regenerate after every backend contract change.
- Keep derived helpers in `src/lib/encore-client.ts` alongside generated artifacts.

## Svelte 5 Runes
- Prefer `$state`, `$derived`, `$effect`, `$props`; no legacy stores.
- Components live in `src/lib/components/`; keep pages thin and delegate logic.
- Co-locate route loaders and actions with `+page.ts/+page.server.ts` when needed.

## Design System
- Global tokens in `src/app.css`; **never** hardcode hex values.
- Reuse `RetroButton`, `RetroCard`, and other retro components from `src/lib/components/`.
- Hover/active states follow the retro shadow pattern: rest (6px), hover (4px + translate), active (0px + translateY).
- Typography scale: hero `text-6xl`, section `text-4xl`, body `text-lg`, secondary color `var(--color-text-secondary)`.

## Build & Deploy
- Production build – `cd frontend && bun run build` (outputs to `dist`).
- Deploy via Vercel CLI – `vercel --prod` (env var `PUBLIC_API_BASE` required).
- On backend schema changes run `bun run gen` before building to avoid drift.

## Diagnostics
- Dev server at `http://localhost:5173`.
- Use Playwright MCP tooling for visual diffing and hover-state verification (see `FRONTEND_HANDOFF.md`).
- For TypeScript path issues run `bunx svelte-kit sync` then rerun the dev server.

## References
- `FRONTEND_HANDOFF.md` – latest status + design drift notes.
- `frontend/DESIGN_DRIFT_FIXES.md` – color/spacing change log.
- `CLAUDE.md` (root) – company-wide quick reference.