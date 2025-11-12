# FR-011: Port Management with Cursor Worktree Support

**Status:** ⏳ Proposed  
**Priority:** P1 (Dev Experience)  
**Milestone:** M1 - DX Stability  
**Owner:** Platform  
**Estimated Effort:** Small → Medium

---

## 📝 Description
When running multiple Cursor worktrees for ScreenGraph in parallel, ports often collide (backend 4000/4002, frontend 5173, Encore dashboard 9400, Appium 4723). This FR proposes a simple, robust port management strategy that integrates cleanly with Cursor worktrees ([Cursor worktrees docs](https://cursor.com/docs/configuration/worktrees)) and our existing dev commands, avoiding heavy tooling while remaining flexible.

---

## ✅ Proposed Approach (Easy + Robust)

1) Lightweight Port Coordinator (custom, zero-deps)
- Maintain a local JSON registry: `~/.screengraph/ports.json`
- Map: `{ worktreeName: { backend, dashboard, frontend, appium } }`
- On `encore run` / `bun run dev` / agent start, resolve desired ports:
  - If env vars set (`BACKEND_PORT`, `FRONTEND_PORT`, `ENCORE_DASHBOARD_PORT`, `APPIUM_PORT`) → use them
  - Else if registry has assignment for current worktree → reuse
  - Else pick nearest free ports from ranges and persist to registry
- Expose resolved ports via env exports and print a one-line summary

2) CLI Fallbacks (built-in tools)
- macOS: `lsof -i :<port>` check; Linux: `ss -ltnp | grep :<port>`
- Free a port only on explicit user request (no auto-kill)
- Provide a small `scripts/ports.sh` with helpers:
  - `ports:who 4000` → show process
  - `ports:pick backend` → returns next available in range
  - `ports:assign <worktree>` → writes assignment into registry

3) Optional Visual Aids (out of band)
- Portmaster for visual inspection ([safing.io/portmaster](https://safing.io/portmaster))
- Portainer if Dockerized flows are introduced ([portainer.io](https://www.portainer.io/))
- Not required for MVP; keep them documented as optional

---

## 🔢 Default Port Ranges (per worktree)
- Backend API (Encore): 4000–4009
- Encore Dashboard: 9400–9409
- Frontend (Vite/SvelteKit): 5173–5183
- Appium: 4723–4733

Assignment Strategy:
- Derive offset from worktree name (hash modulo range) → stable
- If occupied, linearly probe next free port within range

---

## 🎯 Acceptance Criteria
- [ ] Starting backend in two different worktrees assigns non-conflicting ports without manual steps
- [ ] Frontend auto-detects the correct backend base URL (no hard-coded list); respects env override
- [ ] `Detect my first drift` works concurrently across two worktrees (backend + Appium)
- [ ] One-line summary prints on start (worktree name + assigned ports)
- [ ] Docs updated in `CLAUDE.md` with envs and troubleshooting

---

## 🧩 Integrations
- Backend
  - Respect `BACKEND_PORT` for Encore service when available
  - Print resolved ports at startup in structured logs
- Frontend
  - `getEncoreClient` reads `VITE_BACKEND_BASE_URL` first; falls back to probe logic
- Agent / Appium
  - Respect `APPIUM_PORT` and `AUTO_START_APPIUM` (already supported)

---

## 🚦 Developer Flow
- Add `scripts/ports.sh` (helpers only) and `scripts/port-coordinator.mjs` (node) for registry
- Wire minimal calls into existing dev scripts:
  - Backend pre-start: resolve ports → export → run `encore run`
  - Frontend pre-start: resolve → export `VITE_BACKEND_BASE_URL` → `bun run dev`
- No changes to production paths

---

## 📋 Tasks
1. Create `scripts/port-coordinator.mjs` (read/write `~/.screengraph/ports.json`, check availability, choose ports)
2. Add `scripts/ports.sh` helpers (`who`, `pick`, `assign`) with macOS/Linux branches
3. Backend: read `BACKEND_PORT` and `ENCORE_DASHBOARD_PORT` if provided; log resolved ports
4. Frontend: read `VITE_BACKEND_BASE_URL`; if missing, keep existing probe as fallback
5. Docs: Update `CLAUDE.md` with envs and troubleshooting

---

## 🧪 Testing
- Start two worktrees; verify each assigns stable, unique ports across restarts
- Kill a process occupying a chosen port → retry picks next free port
- Frontend connects to the matching backend without manual edits
- Agent auto-starts Appium on per-worktree port and connects

---

## ⚠️ Risks & Mitigations
- Registry corruption → atomic write with temp file + rename
- Cross-OS tooling differences → use Node for registry + probing; shell helpers optional
- Surprise auto-kill → never kill automatically; only on explicit `ports:free`

---

## 📎 References
- Cursor Worktrees: https://cursor.com/docs/configuration/worktrees
- Portmaster: https://safing.io/portmaster
- Portainer: https://www.portainer.io/
