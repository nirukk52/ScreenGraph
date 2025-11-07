# .cursor Operations Plan

## Objectives
- Centralize founder-level control for Jira, worktrees, and service lifecycles under a single command surface.
- Enforce main-tree safety (require `LOCAL_MODE_AUTHORIZED=1`) and run `shared/preflight.sh` before every action.
- Keep local Jira docs synchronized when creating, linking, or closing issues.
- Provide a simple dashboard to start/stop backend and frontend, view ports, and run smoke checks.

## Candidate Structures

| Option | Structure | Command Layer | Pros | Cons |
| --- | --- | --- | --- | --- |
| A | Root `Taskfile.yml` + per-domain Taskfiles (`Taskfiles/founder.yml`, etc.) | `just` aliases (e.g., `just founder:servers:start`) | Friendly commands, Task handles includes/env | Two toolchains (`task`, `just`) |
| B | Same Taskfile layout without `just` | Use `task founder:servers:start` | Single dependency, full Task features | Longer commands |
| C | `.cursor/scripts/*.mjs` (zx only) | `npm scripts` / manual | JS/TS everywhere, easy JSON/Jira logic | No native orchestration/dependency graph |

## Recommended Approach (Option A)
- Taskfile hierarchy orchestrates guardrails and workflows.
- `just` provides short, memorable aliases.
- zx scripts stay inside Task recipes when JSON/Jira automation is needed.

## Directory Layout
```
.cursor/
  commands/
    shared/            # preflight guardrails, env helpers
    founder/           # control panel descriptors
    backend/
    frontend/
    ops/
    qa/
  scripts/             # zx helpers (env inspect, jira sync, etc.)
Taskfile.yml           # root orchestrator (includes domain Taskfiles)
Taskfiles/
  founder.yml
  backend.yml
  frontend.yml
  ops.yml
  qa.yml
justfile               # human-friendly aliases wrapping Task targets
```

## Functional Requirements

### Guardrails
- Every Task must call `shared/preflight.sh` first.
- Abort on main tree unless `LOCAL_MODE_AUTHORIZED=1`.
- Port assignments run through `shared/env.mjs` (`--write-env`).

### Founder Control Panel (`just founder:*`)
- `worktrees:create`, `switch`, `status`, `prune` – manage git worktrees and env files.
- `servers:start`, `stop`, `restart`, `status` – run backend/frontend scripts, print URLs.
- `jira:new-bug`, `jira:new-feature`, `jira:status-report`, `jira:link-worktree`, `jira:close-issue` – keep `jira/` docs current.

### Backend / Frontend
- `just backend:dev`, `backend:health`, `backend:logs` – wrap Encore scripts with guardrails.
- `just frontend:dev`, `frontend:typecheck`, `frontend:lint`, `frontend:smoke` – run UI workflows.

### Ops & QA
- `just ops:ports:reserve|release|show`, `ops:env:print|switch` – surface env details.
- `just qa:smoke`, `qa:e2e`, `qa:appium:start|stop` – standardized test entry points.

## Implementation Phases
1. **Bootstrap** – add Taskfile hierarchy, justfile aliases, ensure every Task runs preflight.
2. **Command Mapping** – update `.cursor/commands/*` to invoke just/Task, deprecate direct script calls.
3. **Automation** – move complex shell logic into zx helpers referenced by Task recipes.
4. **Policy & Memory** – add founder rules reminder and Cursor memory note (“Use `just ...` commands; main tree requires authorization”).

## Founder Go-Live Checklist
- Install `task` and `just` locally.
- Run `just ops:env:print` to verify ports and mode.
- Test `just founder:servers:start/stop` and `just worktrees:status` in both main and worktree contexts.
- Ensure Jira commands create/update markdown and metadata before broader rollout.
