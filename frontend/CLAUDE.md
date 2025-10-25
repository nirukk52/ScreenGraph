We are in the middle of building/migrating core of the app.
Backend ->  Encore -> Encore Cloud
Frontend -> SvelteKit -> Vercel


A typical SvelteKit project looks like this:

my-project/
├ src/
│ ├ lib/
│ │ ├ server/
│ │ │ └ [your server-only lib files]
│ │ └ [your lib files]
│ ├ params/
│ │ └ [your param matchers]
│ ├ routes/
│ │ └ [your routes]
│ ├ app.html
│ ├ error.html
│ ├ hooks.client.js
│ ├ hooks.server.js
| ├ service-worker.js
│ └ tracing.server.js
├ static/
│ └ [your static assets]
├ tests/
│ └ [your tests]
├ package.json
├ svelte.config.js
├ tsconfig.json
└ vite.config.js

---

Contributor rules (frontend):
- Current stack: SvelteKit 1.x + Svelte 4.x for compatibility with Vercel adapter.
- Do NOT use Svelte 5 runes (`$state`, `$derived`, `$props`) until we upgrade back to Svelte 5.
- Use standard Svelte 4 syntax, `$app/stores` for `page` access, and basic `<slot />` if layouts are reintroduced.
- Keep SvelteKit files under `frontend/` only. Root-level config should be minimal.
- Frontend talks to backend via HTTP; keep base URLs centralized in `$lib/api.ts` (env‑driven config later).
- All functions/components should include a short comment explaining why they exist.
- Small, focused PRs; include a brief test plan in the PR description.
- Deployment is via Vercel Git integration (Root Directory: `frontend`).