## FR-011 — Port Management for Cursor Worktrees (Root Plan)

**Owners**: vbKGG (this worktree), JKEcU (peer worktree)

**Purpose**: Define a deterministic, collision-free developer experience so multiple Cursor worktrees can run ScreenGraph concurrently without manual port edits, and standardize environment setup per worktree.

**References**: [Cursor worktrees](https://cursor.com/docs/configuration/worktrees), [Initialization Script](https://cursor.com/docs/configuration/worktrees#initialization-script)

---

### Objectives
- Scale to 20 concurrent agents by enforcing: one worktree == one agent == one Cursor chat window == one dedicated Chrome instance.
- Assign deterministic, stable port blocks per worktree; avoid collisions automatically.
- Make `encore run` and `bun run dev` work out-of-the-box per worktree.
- Align Appium/WDIO and Encore Dashboard to the same block.
- Provide clear preflight/conflict messages and a one-command recovery path.

---

### Scope (services covered)
- Backend API (Encore dev), Encore Dashboard
- Frontend (Vite/SvelteKit dev)
- Appium server, WDIO runners
- Realtime/stream ports if separate

---

### Port Contract (stable indices within a block)
- 0: Backend API (Encore)
- 1: Frontend (Vite)
- 2: Encore Dashboard
- 3: Realtime/Stream (if separate)
- 4: Appium server
- 5+: WDIO/test slots, device sessions

Block formula (conceptual): `port = base + (blockSize × worktreeIndex) + serviceIndex`

Default ranges for local dev (fallback when env not pinned):
- Backend: 4000–4009
- Dashboard: 9400–9409
- Frontend: 5173–5183
- Appium: 4723–4733

---

### Worktree Integration
- Use Cursor Worktree Initialization Script to compute a stable assignment per worktree and write local env:
  - backend: `BACKEND_PORT`, `ENCORE_DASHBOARD_PORT`
  - frontend: `VITE_BACKEND_BASE_URL`
  - appium: `APPIUM_PORT`
- Provide `ports:show` and `ports:who <port>` helpers for quick inspection.

---

### Environment Isolation Policy
- Ports: deterministic per worktree (this plan delivers).
- Frontend base URL: read from `VITE_BACKEND_BASE_URL` (per worktree).
- Database: suffix DB/schema by worktree code if/when isolation is needed for tests.
- Secrets: rely on Encore env types; no cross-worktree sharing of local overrides.
- Browser isolation: each worktree launches its own Chrome instance with an isolated user-data-dir to prevent cross-session leakage.

---

### Agent Model (One Agent per Worktree)
- Exactly one primary agent per worktree. This guarantees clean isolation and linear reasoning per agent.
- Each agent uses its worktree’s ports and a dedicated Chrome instance; Appium is one-per-worktree.
- If parallelism is required, spawn additional worktrees (up to 20) instead of multiplexing within one.

### Capacity Plan (Target: 20 Agents)
- 20 worktrees running simultaneously on one developer machine.
- Ensure port block strategy supports ≥20 unique assignments without overlap.
- Confirm OS limits: file descriptors, Chrome instances, Appium sessions; document minimum hardware guidance.
- CORS and Encore Dashboard ports must accept all 20 local origins within configured allowlist.

---

### Preflight & Healing
- Pre-start check: if an assigned port is busy, linearly probe within the block.
- If still busy, print the conflicting PID/process and a safe recovery command.
- Never auto-kill processes.

---

### Developer UX
- Zero manual flags; `encore run` and `bun run dev` pick env-assigned ports.
- Standard env names: `BACKEND_PORT`, `FRONTEND_PORT`, `ENCORE_DASHBOARD_PORT`, `APPIUM_PORT`, `STREAM_PORT`.
- A small `ports:show` prints the table for the current worktree.
- Frontend (SvelteKit 2, Svelte 5) always consumes the Encore-generated client; base URL comes from `VITE_BACKEND_BASE_URL`.

---

### Collaboration Workflow (vbKGG × JKEcU)
- This plan is the single shared doc at repo root.
- Each worktree maintains its own status log under `@feature-requests/FR-011-port-management-worktrees/`.
- Both agents update this plan after findings and finalize acceptance.

---

### Worktree Naming Policy (Natural Language)
- Each worktree MUST have a descriptive, human-friendly name tied to the feature.
- Suggested format: `<Feature> — <Qualifier>` (e.g., "Port Management — Vector Bay").
- See `@feature-requests/FR-011-port-management-worktrees/worktree-names.md` for the mapping.

---

### Acceptance Criteria
- 20 worktrees (20 agents) can run concurrently on one machine without port conflicts.
- Each worktree owns one agent, one Cursor chat window, and one Chrome instance.
- Frontend connects to the correct backend for its worktree.
- Appium/WDIO align to each worktree’s block.
- Clear preflight messages and safe recovery guidance.
- Docs updated; helpers available; smoke tests pass at 5, 10, and 20 concurrent worktrees.

---

### Initial Task Split
vbKGG
- Create `ports` helpers, draft init script wiring, and env propagation.
- Verify CORS behavior and generated client points to the correct backend.
- Implement Chrome instance isolation per worktree (dedicated profile dir config).

JKEcU
- Exercise parallel worktrees at scale (5 → 10 → 20); run backend/frontend/appium concurrently.
- Validate memory/CPU footprint with 20 Chrome instances; document thresholds.
- Report conflicts and refine preflight checks and UX.

Status logs:
- `@feature-requests/FR-011-port-management-worktrees/status-vbKGG.md`
- `@feature-requests/FR-011-port-management-worktrees/status-JKEcU.md`


