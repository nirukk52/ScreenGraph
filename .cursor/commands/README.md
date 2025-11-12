# Cursor Commands

Quick reference for automation kept in `.cursor/commands/`. Execute scripts from the repo root; Task namespaces live under the subdirectories here.

---

## Service Automation

- `start-services` — Start both backend and frontend with the Turborepo harness.
- `stop-services` — Stop all running services.

---

## Testing & Drift Verification

- `run-default-test` — Guided Playwright flow for the default drift detection run.
- `qa/Taskfile.yml` — Invoke with `cd .cursor && task qa:<command>` for smoke tests, linting, and E2E suites.

---

## Maintenance

- `update-skills.md` — Procedure for keeping vibes and Claude skills current.
- `shared/Taskfile.yml` & `ops/Taskfile.yml` — Environment helpers (`task shared:*`, `task ops:*`).
- `verify-worktree-isolation` — Legacy check kept for reference; runs only if explicitly invoked.

---

**Last Updated:** 2025-11-12
