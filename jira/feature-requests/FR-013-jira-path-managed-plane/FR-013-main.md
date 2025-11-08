# FR-013: jira-path-managed-plane

**Status:** 📋 Todo | 🚧 In Progress | ✅ Done | 🔥 Blocked  
**Priority:** P1 (High)  
**Milestone:** [M6 - Integrations]  
**Owner:** [TBD]  
**Estimated Effort:** Large

---

## 📝 Description
Expose a minimal integration service that reads our local `/jira` markdown artifacts (feature/bug/tech-debt folders) and syncs them into a Plane workspace as issues/pages on demand. The microservice will accept a repository-relative path (e.g., `jira/feature-requests/FR-012-plane-microservice-hosting`) and perform idempotent create/update in Plane, keeping `/jira` as the authoritative source and Plane as the collaboration surface.

References:
- Plane product docs: [Plane Docs](https://docs.plane.so/)
- Plane OSS repo and self-hosting guides: [makeplane/plane](https://github.com/makeplane/plane?tab=readme-ov-file)

---

## 🎯 Acceptance Criteria
- [ ] API accepts a `path` parameter pointing to a folder under `/jira/**`.  
- [ ] Reads `*-main.md`, `*-status.md`, and optionally `handoff.md` to construct Plane issue/page payloads.  
- [ ] Idempotent sync: re-running on the same path updates fields (title/description/labels) rather than duplicating.  
- [ ] Supports dry-run mode returning a diff (what would be created/updated).  
- [ ] No manual fetch to Plane; use an official client or REST API with typed DTOs (respecting project rules).  
- [ ] Clear mapping doc between `/jira` schema and Plane entities (issue/page/labels).  

---

## 🔗 Dependencies
- FR-012 (Plane microservice hosting) reachable and authenticated  
- Plane API token/config available locally via `.env` (prod via secrets)  

---

## 🧪 Testing Requirements
- [ ] Unit: parse `/jira/**` folders and map fields correctly  
- [ ] Integration: dry-run diffs stable across repeated runs  
- [ ] E2E: sync creates Plane items; re-sync updates without duplicates  

---

## 🔌 Integration Plan
- Define a narrow Encore endpoint: `POST /integrations/plane/sync` with body `{ path: string; dryRun?: boolean }`.  
- Internals:  
  - Read files under the specified path; parse markdown frontmatter and sections.  
  - Build typed DTOs for Plane’s API (issues/pages/labels).  
  - On `dryRun=true`, compute and return a diff (new vs. existing).  
  - On `dryRun=false`, upsert to Plane.  
- Security: validate that `path` resolves inside repo and matches an allowed root set (`jira/**`).  
- Idempotency keys: derive a stable external ID from the folder name (e.g., `FR-012-plane-microservice-hosting`).  

Citations:  
- Docs overview: [Plane Docs](https://docs.plane.so/)  
- Self-host & deployments: [makeplane/plane README](https://github.com/makeplane/plane?tab=readme-ov-file)

---

## 📋 Technical Notes
- Preserve project rules: no `fetch` from frontend; backend uses typed clients.  
- Rate limit and backoff when calling Plane; include structured logs with correlation IDs.  
- Add `/jira`→Plane mapping doc to clarify sections and label conventions.

---

## 🏷️ Labels
`[integration]`, `[sync]`, `[infra]`, `[docs]`, `[priority:P1]`, `[milestone:M6]`

---

## 📚 Related Documents
- `/jira/feature-requests/FR-012-plane-microservice-hosting/FR-012-main.md`
- `.cursor/PORT_ISOLATION_ENFORCEMENT.md`

---

## Release Plan (PROC-001)
- Follow PROC-001 “Production Release” in `.cursor/procedures/PROCEDURES.md`
- Preconditions:
  - [ ] `@verify-worktree-isolation` passes
  - [ ] `@run-default-test` passes on this worktree
- Handoff:
  - After merge to main, run `@update-handoff` and choose the “Production Release Update” workflow
- Notes:
  - Frontend version bump (semver) required before tagging
  - Tag format: `v<frontend>-<date>-<shortsha>`

## Worktree Setup Quicklinks
- Isolation: `@verify-worktree-isolation`
- Start Backend: `./scripts/dev-backend.sh`
- Start Frontend: `./scripts/dev-frontend.sh`
- Smoke Test: `@run-default-test`

