# Plan: Move `backend/steering-docs` to repo root as `steering-docs`

## Goal
Relocate the documentation tree from `backend/steering-docs` to the repository root `steering-docs/`, and update all code/docs that reference the old path so everything continues to work locally and in CI/CD.

## Current vs Target
- Current: `backend/steering-docs/…`
- Target: `steering-docs/…` (at repo root)

## Affected Areas
1) Backend code that reads docs from the filesystem
   - Files:
     - `backend/steering/get-doc.ts`
     - `backend/steering/list-docs.ts`
     - `backend/steering/update-doc.ts`
   - Change: `path.resolve("./backend/steering-docs")` → `path.resolve("./steering-docs")` (or use a robust `__dirname`-based resolution; see Implementation Step 3)

2) Documentation references in markdown
   - Files (examples):
     - `backend/agent/README.md`
     - `backend/agent/IMPLEMENTATION_SUMMARY.md`
     - Root `README.md` (structure section)
     - Any other docs linking to `/backend/steering-docs/...`
   - Change: `/backend/steering-docs/...` → `/steering-docs/...`

3) Any scripts, tests, or tooling that assume the old path
   - Search for `backend/steering-docs` occurrences and update.

## Implementation Steps
1) Create a feature branch
   - `git checkout -b chore/move-steering-docs-to-root`

2) Move the directory
   - `git mv backend/steering-docs ./steering-docs`

3) Update path resolution in backend code
   - Replace:
     - `const STEERING_DOCS_PATH = path.resolve("./backend/steering-docs");`
   - With one of the following (choose one approach consistently):
     - Simple cwd-based: `path.resolve("./steering-docs")`
     - Safer `__dirname`-based (recommended):
       - In `backend/steering/*.ts` files, set:
         - `const STEERING_DOCS_PATH = path.resolve(__dirname, "../../steering-docs");`
       - Rationale: independent of process cwd, works when the app runs from repo root or from the `backend/` dir.

4) Update markdown links
   - Find all occurrences of `/backend/steering-docs` and switch to `/steering-docs`.
   - Spot-check key files listed in Affected Areas.

5) Verify references in config files
   - If any config (e.g., examples in `README.md`, or other meta docs) show the tree, ensure they reflect `steering-docs/` at repo root.

6) Run and test locally
   - Start backend: `encore run`
   - Exercise steering-docs APIs:
     - `GET /steering/list-docs` (or equivalent Encore client call)
     - `GET /steering/get-doc`
     - `POST /steering/update-doc`
   - Confirm doc listing/reads/writes still work.

7) Update CI/CD if needed
   - Ensure any build/test scripts don’t assume the old path.

8) Commit & PR
   - Commit with a clear message: “chore: move steering-docs to repo root and update references”.
   - Open PR and request review.

## Search Guidance (before and after changes)
- Find hard references to the old path:
  - `rg -n "backend/steering-docs"`
- After edits, validate no stale references remain:
  - `rg -n "backend/steering-docs"` → expect no results

## Validation Checklist
- Backend compiles and runs: `encore run`
- Steering endpoints work (list/get/update docs)
- No remaining `/backend/steering-docs` references in repo
- README(s) and internal docs show `steering-docs/` at repo root

## Rollback Plan
- If anything breaks, revert the PR or run:
  - `git revert <merge-commit-sha>`
  - Or, if local only, `git reset --hard <pre-move-commit>`

## Notes / Considerations
- Using `__dirname`-based path resolution in backend code avoids surprises from varying working directories in different environments.
- No changes are needed for CORS or Encore client generation.
- Frontend continues to use backend endpoints; no path changes required there.


