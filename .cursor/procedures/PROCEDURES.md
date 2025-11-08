# Standard Operating Procedures (SOPs)

This catalog defines deterministic, copy-pasteable procedures used across worktrees and the main tree. Each procedure has:
- An ID (stable)
- Preconditions
- Steps (deterministic, minimal branching)
- Verification criteria
- Rollback plan

Keep procedures concise (≤100 lines), actionable, and kept in sync with our tooling/commands.

---

## Documentation Standards

### Line Limits (ENFORCED)
All work items (FR/BUG/TD/CHORE) must follow these limits:
- **handoff.md**: ≤ 50 lines (focused handoff context)
- **main.md**: ≤ 150 lines (core implementation details)
- **status.md**: ≤ 100 lines (todos, progress tracking)
- **retro.md**: ≤ 100 lines (learnings, rating out of 5)

### Handoff Chain Concept
Each handoff explicitly links to the NEXT item in the backlog:
```
FR-015 → FR-016 → FR-017 → [FR-018: Next feature]
   ↓
BUG-003 (discovered during FR-016)
   ↓
TD-005 (refactor needed from bug fix)
```

This creates a narrative of development progress and preserves context.

### Item-Level Documentation
**All work tracked through:**
- `jira/feature-requests/FR-XXX/`
- `jira/bugs/BUG-XXX/`
- `jira/tech-debt/TD-XXX/`
- `jira/chores/CHORE-XXX/`

**No global handoffs.** Use `update-handoff [ITEM-ID]` instead.

---

## PROC-001 — Production Release (Encore backend + Vercel frontend)

### Why
Standardize the release flow to production ensuring isolation, reproducibility, and fast rollback.

### Preconditions
- CI green on the release PR
- Local verification done using smoke tests
- Item handoff updated with current status (`update-handoff [ITEM-ID]`)

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
   - Run `@update-handoff` and select “Production Release Update”
   - Paste Release Notes (see template below)

### Verification (must be true)
- Backend deploy status: green
- Frontend production: healthy, loads without console errors
- API connectivity: production frontend reaches production backend
- Smoke test passes: run page shows events/screens

### Rollback
1) Backend: Redeploy previous successful version in Encore Cloud
2) Frontend: Re-deploy previous Vercel build (or revert commit)
3) Document rollback in affected item handoffs

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

## PROC-002 — Item Handoff Update (Quick)

### Why
Fast handoff update for regular development work (30 seconds).

### When to Use
- Regular development sessions
- Bug fixes in progress
- Feature iterations
- Minor refactoring

### When NOT to Use
Use full `update-handoff` for production releases or major milestones.

### Steps
1) Ensure you're working on a tracked item (FR/BUG/TD/CHORE)
2) Run: `quick-update-handoff [ITEM-ID]`
   - Or just `quick-update-handoff` to auto-detect from git
3) Answer prompts:
   - What are you doing? (1 line)
   - Work rating (0-5)
   - Notes (optional)
4) Modules auto-detected from git status
5) Status.md timestamp auto-updated

### Verification
- Handoff entry added to `jira/[category]/[ITEM-ID]/handoff.md`
- Line count ≤ 50 lines
- Status.md "Last Updated" reflects current date

---

## PROC-003 — Item Handoff Update (Full)

### Why
Comprehensive handoff for production releases, feature completions, major milestones.

### When to Use
- Production releases
- Feature completions requiring retros
- Major architectural changes
- End-of-milestone summaries

### Steps
1) Run: `update-handoff [ITEM-ID]`
2) Answer all prompts:
   - What I am doing
   - What is pending (comma-separated)
   - What's next (comma-separated)
   - Modules touched (comma-separated)
   - Work rating (0-5)
   - Next item ID (for handoff chain)
   - Related items
   - Notes for next agent
3) Review handoff entry in `jira/[category]/[ITEM-ID]/handoff.md`

### Verification
- Handoff entry comprehensive and actionable
- Handoff chain properly linked (Next Item specified)
- Line count ≤ 50 lines
- All sections filled out

---

## PROC-004 — Create New Work Item

### Why
Standardize creation of features, bugs, tech debt, and chores.

### Item Types
- **FR-XXX**: Feature requests (new capabilities)
- **BUG-XXX**: Bugs (issues to fix)
- **TD-XXX**: Tech debt (refactoring, quality)
- **CHORE-XXX**: Chores (maintenance, config, dependencies)

### Steps
1) Choose appropriate creation command:
   ```bash
   create-feature-doc    # For FR-XXX
   create-bug-doc        # For BUG-XXX
   create-tech-debt-doc   # For TD-XXX
   create-chore      # For CHORE-XXX (NEW)
   ```
2) Follow prompts to fill in details
3) Templates created:
   - `handoff.md` (50 line limit)
   - `main.md` (150 line limit)
   - `status.md` (100 line limit)
   - `retro.md` (100 line limit)

### Verification
- Directory created: `jira/[category]/[ITEM-ID]-[title]/`
- All 4 template files present
- Templates customized with item ID and title

---

## PROC-005 — New Worktree Bring-up (Quick)

### Why
Quickly set up a new worktree for parallel development.

### Preconditions
- Main tree working and tested
- Standard ports available (4000, 5173, 9400, 4723)

### Steps
1) Start services:
   ```bash
   ./automation/scripts/dev-backend.sh
   ./automation/scripts/dev-frontend.sh
   ```
2) Verify health:
   - Backend: http://localhost:4000
   - Frontend: http://localhost:5173
   - Dashboard: http://localhost:9400
3) Run smoke test to ensure flow is healthy
4) Create work item for your task using PROC-004

### Verification
- Backend responding on port 4000
- Frontend loading on port 5173
- No port conflicts
- Smoke tests pass

---