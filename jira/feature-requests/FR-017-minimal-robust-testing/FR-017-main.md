# FR-017: Minimal Robust Testing Stack (Encore + SvelteKit)

**Status:** 📋 Todo  
**Priority:** P1 (High)  
**Milestone:** Foundation / Infrastructure  
**Owner:** TBD  
**Estimated Effort:** M (2–3 days)

---

## 📝 Description

Establish a minimal, robust testing stack for our Encore backend and SvelteKit frontend that prevents regressions and plugs into the unified automation from FR-013. The goal is fast local feedback, CI reliability, and pre-push gating.

- Frontend: Vitest for unit/integration, Playwright Test for E2E, MSW for mocking, Zod for schema validation.
- Backend: Keep `encore test` for domain and repo layers; add Supertest for HTTP endpoint checks against local Encore; evaluate Testcontainers for DB-dependent isolation.
- Automation: Wire into FR-013 Taskfile + Husky so pushes are blocked if tests or type checks fail.

---

## 🎛 Core Stack (Minimal)

- Vitest — unit + integration (fast, native ESM)
- Playwright Test — E2E (headless, traces, screenshots)
- Supertest — HTTP endpoint tests (Encore @ localhost:4000)
- MSW — mock fetch for unit/integration (frontend)
- Zod — schema validation for API contracts (type-safe DTOs)
- Testcontainers (Node) — proto for ephemeral Postgres/Redis (decide if needed with Encore runtime)

References (Context7 docs): Vitest (`/vitest-dev/vitest`), Playwright (`/microsoft/playwright`), MSW (`/websites/mswjs_io`), Supertest (`/ladjs/supertest`), Testcontainers Node (`/testcontainers/testcontainers-node`), Zod (`/colinhacks/zod`).

---

## ✅ Acceptance Criteria

- Scripts exist to run: typecheck, lint, unit, e2e; unified `task qa:smoke:frontend` and `task qa:smoke:backend` (FR-013 style).
- Frontend: at least 1 Vitest spec (unit) and 1 Playwright spec (E2E) for `/app-info` green locally and in CI.
- Backend: at least 1 Supertest spec hitting `/appinfo/:packageName` against local Encore, green locally and in CI.
- MSW handlers present for one API path used in a unit test (no network).
- Zod schemas used to validate one API response in tests (parse/guard).
- Pre-push hook (FR-013 Husky) blocks push on failures (typecheck, lint, unit, e2e).
- CI job runs same Taskfile targets; artifacts include Playwright HTML report.
- Decision record: Testcontainers viability with Encore (go/no-go + next steps).

---

## 📦 Install Plan (Bun)

- Frontend devDeps: `vitest @testing-library/svelte @testing-library/jest-dom jsdom @playwright/test msw`
- Frontend deps: `zod`
- Backend devDeps: `supertest testcontainers`

Note: Use Bun (`bun add -d ...`) and keep versions pinned via lockfile.

---

## 🧭 Sequential Tasks (Phased)

### Phase 1 — Frontend Unit/Integration Baseline (fast feedback)
- Add Vitest config (jsdom), Testing Library, Jest-DOM setup.
- Add scripts: `test`, `test:watch`, `coverage` (with thresholds), and wire to `check` pipeline.
- Add 1 unit test for a dumb component and 1 integration test for `/app-info` data render using MSW.
- Introduce Zod parse in the test to validate a response object (guards regressions on shapes).

### Phase 2 — Frontend E2E Baseline (real browser)
- Add Playwright, init config, and scripts: `e2e`, `e2e:headed`, `e2e:report`.
- Add 1 E2E for `/app-info` (assert title, rating, screenshots visible). Save trace/video on failure.

### Phase 3 — Backend HTTP Checks (thin API smoke)
- Add Supertest as devDep in `backend/` and create a test that:
  - Starts Encore locally (reuse `@start` or dedicated script) OR expects it running.
  - Hits `GET /appinfo/com.pinterest` and asserts 200 + schema with Zod.
- Document how to run this in CI (separate job or before E2E).

### Phase 4 — Isolation Prototype (Testcontainers)
- Prototype ephemeral Postgres with `testcontainers` in Node tests.
- Compare against Encore-provisioned DB in `encore test` to avoid duplication.
- Produce decision record: adopt for integration tests or rely on Encore test env only.

### Phase 5 — Automation & Gating (FR-013 Alignment)
- Add Taskfile targets: `qa:smoke:frontend` → typecheck+lint+vitest; `qa:e2e:frontend` → playwright; `qa:smoke:backend` → supertest/encore test.
- Add Husky pre-push hook to call Taskfile QA targets (block on fail).
- CI: run same tasks; upload Playwright HTML report.

---

## 🧪 Test Matrix

- Local: Bun + Vite dev, headless Playwright; DEV mode.
- CI: Node 20, Playwright browsers, headless only; artifacts on fail.
- Browsers: Chromium default; optionally WebKit/Firefox later.

---

## 🔗 Dependencies

- FR-013: Taskfile + Husky integration (use its conventions/namespaces).
- Existing Encore backend running locally on port 4000 for E2E and Supertest.

---

## 📚 Notes & Risks

- Encore already has `encore test`; avoid redundant DB orchestration unless Testcontainers adds clear value.
- Keep it minimal: 1–2 tests per layer to establish patterns + automation, expand later.
- Enforce coverage threshold for unit/integration (e.g., lines >= 80%) without blocking CI initially (warn-only), then tighten.

---

## Release Plan (PROC-001)
- Preconditions: `@verify-worktree-isolation`, green CI.
- Handoff: run `@update_handoff` and include new QA tasks and gating summary.

## Worktree Setup Quicklinks
- Isolation: `@verify-worktree-isolation`
- Start services: `@start`
- Frontend dev: `cd frontend && bun run dev`
- Backend: `cd backend && encore run`
