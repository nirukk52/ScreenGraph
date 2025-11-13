# Cursor Commands

Quick reference for automation kept in `.cursor/commands/`. Execute scripts from the repo root; Task namespaces live under the subdirectories here.

---

## 🚀 The 3 Meta Commands (NEW!)

**Use these at specific lifecycle points:**

- `@before-task [task]` - Comprehensive discovery before starting work (2500 tokens, 1× per spec)
- `@during-task [subtask]` - Lightweight guidance during implementation (300 tokens, 5-10× per spec)
- `@after-task [completed]` - Knowledge capture after completion (600 tokens, 1× per spec)

**82% token savings. Guaranteed knowledge capture. Self-improving.**

**See:** `THE_3_COMMANDS.md` for quick reference, `START_HERE.md` for complete guide

---

## Service Automation

- `@start-services` — Start both backend and frontend with the Turborepo harness.
- `@stop-services` — Stop all running services.

---

## Spec-Kit Commands

Use `@before-task` before creating specs, `@during-task` during implementation, `@after-task` after completion:

- `/speckit.specify` — Create feature specification
- `/speckit.plan` — Create implementation plan
- `/speckit.tasks` — Break down into tasks
- `/speckit.implement` — Execute implementation
- `/speckit.checklist` — Validation checklist
- `/speckit.analyze` — Analyze existing code
- `/speckit.clarify` — Ask clarifying questions

---

## Testing & Drift Verification

- `qa/Taskfile.yml` — Invoke with `cd .cursor && task qa:<command>` for smoke tests, linting, and E2E suites.

---

## Maintenance

- `update-skills.md` — Procedure for keeping vibes and Claude skills current.
- `shared/Taskfile.yml` & `ops/Taskfile.yml` — Environment helpers (`task shared:*`, `task ops:*`).

---

**Last Updated:** 2025-11-13
