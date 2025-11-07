# Standard Operating Procedures (SOPs)

This catalog defines deterministic, copy-pasteable procedures used across worktrees and the main tree. Each procedure has:
- An ID (stable)
- Preconditions
- Steps (deterministic, minimal branching)
- Verification criteria
- Rollback plan

Keep procedures concise (≤100 lines), actionable, and kept in sync with our tooling/commands.

---

## PROC-001 — Production Release (Encore backend + Vercel frontend)

### Why
Standardize the release flow to production ensuring isolation, reproducibility, and fast rollback.

### Preconditions
- CI green on the release PR
- Local verification done using `@verify-worktree-isolation` and `@test-default-run`
- Handoff updated with current status (`@update_handoff`)

### Versioning
- Frontend: update `frontend/package.json` version (semver)
- Tag schema: `v<frontend>-<date>-<shortsha>` (example: `v0.4.0-2025-11-06-a1b2c3d`)

### Steps
1) Freeze main
   - Merge policy: squash & merge the release PR into `main`
   - Create annotated tag:
     ```
     git tag -a v<frontend>-<date>-<shortsha> -m "Release: <summary>"
     git push origin --tags
     ```
2) Backend (Encore Cloud)
   - Ensure Encore project is correct in `backend/encore.app`
   - Trigger deploy (CI or Encore Cloud)
   - Wait for status: Deployment successful
3) Frontend (Vercel)
   - Vercel auto-deploys on `frontend/` changes to `main`
   - Verify production URL renders and connects to Encore Cloud backend
4) Database
   - Confirm all migrations applied (`encore db shell` in prod when applicable)
5) Post-release verification (Production)
   - Open production frontend
   - Run smoke test:
     - Create a run
     - Verify WebSocket/stream connects
     - Confirm at least one screen discovered
6) Handoff and docs
   - Run `@update_handoff` and select “Production Release Update”
   - Paste Release Notes (see template below)

### Verification (must be true)
- Backend deploy status: green
- Frontend production: healthy, loads without console errors
- API connectivity: production frontend reaches production backend
- Smoke test passes: run page shows events/screens

### Rollback
1) Backend: Redeploy previous successful version in Encore Cloud
2) Frontend: Re-deploy previous Vercel build (or revert commit)
3) Communicate rollback in `BACKEND_HANDOFF.md` / `FRONTEND_HANDOFF.md`

### Release Notes Template (paste into handoff)
```
## Release Notes
- Version: <version/tag>
- Date: <YYYY-MM-DD>
- Backend changes: <bullet list>
- Frontend changes: <bullet list>
- Migrations: <yes/no + id(s)>
- Smoke test: <pass/fail> (link/screenshot)
```

---

## PROC-002 — New Worktree Bring-up (Quick)
1) `@verify-worktree-isolation`
2) Start services:
   - `./scripts/dev-backend.sh`
   - `./scripts/dev-frontend.sh`
3) `@test-default-run` to ensure the flow is healthy
4) Record worktree name and ports in the feature README


