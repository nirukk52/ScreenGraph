# ScreenGraph Frontend (SvelteKit)

Minimal SvelteKit app deployed to Vercel. Uses SvelteKit 1.x + Svelte 4.x for current compatibility.

## Quick start
- Prereqs: Bun 1.x
- Install: `cd frontend && bun install`
- Dev: `bun run dev`
- Build: `bun run build`
- Preview: `bun run preview`

## Structure
- `src/routes/+page.svelte`: Start Run page
- `src/routes/run/[id]/+page.svelte`: Run Timeline page
- `src/lib/api.ts`: Backend API helpers (start, stream, cancel)
- `svelte.config.js`: Uses `@sveltejs/adapter-vercel@^4`

## Backend integration
- Local dev assumes backend on `http://localhost:4000`
- Start run: POST `http://localhost:4000/run.Start` with `{ url }`
- Stream/cancel: see `$lib/api.ts`

## Deploy (Vercel)
- Project Settings → Root Directory: `frontend`
- Uses Git deployments; pushing `main` triggers deploy
- If stuck, clear build cache and redeploy
- See `DEPLOY_INSTRUCTIONS.md` for details

## Notes
- We will migrate back to Svelte 5 runes once adapter/tooling is stable. Until then, use Svelte 4 syntax only.
