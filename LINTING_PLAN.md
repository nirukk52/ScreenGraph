## Linting & Formatting Plan (Frontend + Backend)

Purpose: Establish consistent code quality and formatting for both services without root-level coupling. Each service owns its config and dependencies (use Bun).

### Principles
- Keep backend (`backend/`) and frontend (`frontend/`) independent; no root configs.
- Use TypeScript strict mode already enabled.
- Prefer zero-override, minimal, readable rules.

### Frontend (SvelteKit)
1) ESLint (Svelte + TS)
   - Packages: eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin, eslint-plugin-svelte, eslint-config-prettier, eslint-plugin-import, eslint-plugin-tailwindcss
   - Config: `frontend/eslint.config.js` (flat config)
   - Goals: Svelte + TS best practices, import ordering, unused vars, tailwind class linting.

2) Prettier
   - Packages: prettier, prettier-plugin-svelte, prettier-plugin-tailwindcss
   - Config: `frontend/prettier.config.cjs` (cooperate with ESLint via eslint-config-prettier)

3) Scripts (add to `frontend/package.json`)
   - "lint": "eslint .",
   - "lint:fix": "eslint . --fix",
   - "format": "prettier --write ."

4) Tailwind linting
   - Via eslint-plugin-tailwindcss for invalid/duplicate classes; prettier-plugin-tailwindcss for class sorting.

### Backend (Encore)
1) ESLint (TS)
   - Packages: eslint, @typescript-eslint/parser, @typescript-eslint/eslint-plugin, eslint-config-prettier, eslint-plugin-import
   - Config: `backend/eslint.config.js` (flat config)
   - Goals: TS best practices, import order, unused code detection.

2) Prettier
   - Packages: prettier
   - Config: `backend/prettier.config.cjs`

3) Scripts (add to `backend/package.json`)
   - "lint": "eslint .",
   - "lint:fix": "eslint . --fix",
   - "format": "prettier --write ."

### Unused code detection
- Primary: ESLint rules (@typescript-eslint/no-unused-vars, no-unused-vars).
- Optional later: ts-prune or knip (run locally, not enforced in CI initially).

### Import organization
- Use eslint-plugin-import with sort/order rules.
- Let prettier handle formatting; avoid conflicting ESLint stylistic rules.

### CI (later)
- Frontend CI: run `bun run lint` and `bun run check`.
- Backend CI: run `bun run lint` (build handled by Encore CI).

### Non-Goals
- No root-level configs or packages.
- No shared node_modules.

### Next Steps (Action Items)
- Frontend: add ESLint + Prettier configs and deps; wire scripts.
- Backend: add ESLint + Prettier configs and deps; wire scripts.
- Run once: lint and format both services.


