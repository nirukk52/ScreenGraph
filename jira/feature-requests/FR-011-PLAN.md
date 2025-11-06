## FR-011 — Port Management for Cursor Worktrees (Plan)

Status: Planning • Owner: Platform • Scope: Local dev only (Encore + SvelteKit + Appium)

---

### 0) Context
- Problem: Running multiple Cursor worktrees collides on ports (backend 4000/4002, dashboard 9400, frontend 5173, Appium 4723).
- Reference: `jira/feature-requests/FR-011-port-management-worktrees.md` (authoritative requirements).
- Constraint: Keep solution local-first, zero-deps, predictable and explicit. Never auto-kill processes.

---

### 1) Goals
- Assign stable, non-conflicting ports per worktree without manual steps.
- Respect explicit env overrides at all times; fail loudly if overridden port is busy.
- Print a one-line summary per worktree; expose resolved ports via env exports.

---

### 2) Port Registry (Your Project's Approach)

- Registry location: `~/.screengraph/ports.json` (user-local, not in repo).
- Responsibility: Persist stable port assignments per worktree; provide discovery for tools.
- Identity: `worktreeName` detected via `git worktree list` or `process.env.WORKTREE_NAME` fallback to directory name.

Schema (v1):

```json
{
  "version": 1,
  "worktrees": {
    "vbKGG": {
      "backend": 4002,
      "dashboard": 9402,
      "frontend": 5175,
      "appium": 4725,
      "updatedAt": "2025-11-06T12:00:00.000Z"
    }
  }
}
```

Default port ranges (per worktree):
- Backend API (Encore): 4000–4009
- Encore Dashboard: 9400–9409
- Frontend (Vite/SvelteKit): 5173–5183
- Appium: 4723–4733

Resolution algorithm:
- Input: `worktreeName`, optional env overrides (`BACKEND_PORT`, `ENCORE_DASHBOARD_PORT`, `FRONTEND_PORT`, `APPIUM_PORT`).
- Seed: `offset = hash(worktreeName) % 10` → stable per worktree.
- For each service in `[backend, dashboard, frontend, appium]`:
  - If env override is set → check availability.
    - If free → use override.
    - If busy → exit non-zero with clear instructions (never auto-kill).
  - Else if registry has value → verify still free; if busy, linear-probe to next in range.
  - Else pick `base + offset`; if busy, linear-probe within the 10-slot range.
- Persist chosen ports to registry via atomic write (temp file + rename).
- Output env exports and a single summary line.

Availability checks:
- Preferred: Node net server probe (`server.listen(port)`) for cross-OS reliability.
- CLI helpers (optional): macOS `lsof -i :<port>`, Linux `ss -ltnp | grep :<port>`.

Atomic write:
- Write to `ports.json.tmp` then `fs.rename` to `ports.json`.
- Ensure directory exists (`~/.screengraph/`); create with `0o700` permissions.

One-line summary (stdout):
- Format: `[dev:ports] worktree=<name> backend=<p> dashboard=<p> frontend=<p> appium=<p>`
- Include when coordinator runs and at each service startup (structured logs in backend).

---

### 3) Deliverables
- `scripts/port-coordinator.mjs` — Node script that:
  - Detects `worktreeName`, resolves/assigns ports, writes registry (atomic), prints `export` lines and summary.
  - Exits non-zero with actionable message if an overridden port is busy.
- `scripts/ports.sh` — Thin helpers:
  - `ports:who <port>` → show owning process (macOS/Linux branches).
  - `ports:pick <service>` → print next available in service range.
  - `ports:assign <worktree> [service] [port]` → write/update registry entry.

---

### 4) Integration Points
- Backend (Encore):
  - Pre-start hook: run coordinator → export `BACKEND_PORT`, `ENCORE_DASHBOARD_PORT` → `encore run`.
  - Logging: use `encore.dev/log` structured logs to print resolved ports with `module: "dev:ports"`.
- Frontend (SvelteKit):
  - Pre-start: coordinator sets `VITE_BACKEND_BASE_URL` (e.g., `http://localhost:4002`).
  - Dev port: prefer `FRONTEND_PORT` from coordinator; pass `--port` to dev server if available.
- Agent/Appium:
  - Coordinator sets `APPIUM_PORT`; agent and `scripts/dev-android-appium.sh` must respect it.

---

### 5) Developer UX
- Commands (suggested):
  - Backend: `cd backend && bun run dev` internally calls coordinator, then `encore run`.
  - Frontend: `cd frontend && bun run dev` internally calls coordinator.
  - Inspect: `bun run ports:who 4000`, `bun run ports:pick backend`, `bun run ports:assign <wt> backend 4003`.
- Output example:
  - `[dev:ports] worktree=vbKGG backend=4002 dashboard=9402 frontend=5175 appium=4725`
  - Followed by shell-safe exports for interactive use.

---

### 6) Acceptance Criteria
- Two worktrees can start concurrently with unique, stable ports; no manual steps.
- Frontend connects to the correct backend via `VITE_BACKEND_BASE_URL` (respects env override).
- Agent/Appium respects `APPIUM_PORT`; parallel device sessions do not conflict.
- Clear failure when overridden ports are busy; helper commands assist diagnosis.

---

### 7) Risks & Mitigations
- Registry corruption → atomic write with temp + rename; validate JSON on load.
- OS differences → Node probe primary; shell helpers optional per-OS implementations.
- Surprise auto-kill → never implemented; only explicit user action using helpers.

---

### 8) Next Steps
- Implement coordinator + helpers; wire into backend/frontend dev scripts.
- Update `backend/CLAUDE.md` and root `CLAUDE.md` with envs and troubleshooting.
- Add quick tests/checklist to `BACKEND_HANDOFF.md` for two-worktree verification.

---

### 9) References
- Feature: `jira/feature-requests/FR-011-port-management-worktrees.md`
- Cursor Worktrees: https://cursor.com/docs/configuration/worktrees
- Portmaster (optional visual aid): https://safing.io/portmaster

