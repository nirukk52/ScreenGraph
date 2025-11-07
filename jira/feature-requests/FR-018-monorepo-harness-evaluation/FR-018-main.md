# FR-018: monorepo-harness-evaluation

**Status:** 📋 Todo  
**Priority:** P1 (High)  
**Milestone:** M2 - Orchestration  
**Owner:** TBD  
**Estimated Effort:** Medium

---

## 📝 Description
Evaluate whether ScreenGraph should adopt a lightweight monorepo harness (e.g., Turborepo) to coordinate backend/frontend dev servers, caching, and shared tooling without violating founder rules. Document trade-offs between maintaining FR-013 Taskfile orchestration versus introducing a root-level build system, and produce a recommendation with migration steps if adoption is approved. Business goal: reduce duplicate orchestration logic while preserving strict backend/frontend isolation and automation guardrails.

---

## 🎯 Acceptance Criteria
- [ ] Decision record comparing Turborepo and current FR-013 Taskfile flow, including founder rule implications and DX/CI impacts.
- [ ] Prototype harness that starts Encore + SvelteKit with a single command while keeping backend/frontend dependencies isolated.
- [ ] Updated founder rules (or explicit rationale for exceptions) and CLAUDE.md guidance if harness adoption is recommended.
- [ ] Rollback plan documenting how to revert to existing Taskfile-only flow if harness causes regressions.

---

## 🔗 Dependencies
- FR-013: Unified automation structure (ensure compatibility with Taskfile + Husky + CI tasks).
- FR-017: Minimal robust testing stack (QA automation must keep working under new harness).
- FR-012: Plane microservice hosting (port isolation policy coordination).
- Founder rules (`.cursor/rules/founder_rules.mdc`) may need revisions if a root package harness is introduced.

---

## 🧪 Testing Requirements
- [ ] Verify `bun run dev` (or successor command) boots both services and passes smoke tests defined in FR-013.
- [ ] Ensure `task founder:servers:status` and stop commands remain accurate or are superseded with documented equivalents.
- [ ] Validate Husky pre-push hooks still execute required QA tasks under the new harness.
- [ ] Confirm CI workflows run without regressions using the chosen orchestration approach.

---

## 📋 Technical Notes
- Turborepo offers parallel task orchestration, remote caching, and incremental builds for JS/TS monorepos while keeping package isolation via workspaces (MIT license) [https://github.com/vercel/turborepo](https://github.com/vercel/turborepo).
- Evaluate whether to install Turborepo CLI (via `bun add -d turbo`) versus relying on `npx create-turbo` scaffolding. Follow official installation guidance [https://turborepo.com/docs/getting-started/installation](https://turborepo.com/docs/getting-started/installation).
- Compare harness options: (a) retain Taskfile + Husky only, (b) introduce Turborepo for command orchestration, (c) script-based approach (shell wrappers) to avoid root package.json.
- Ensure any root-level tooling remains dev-only and does not share node_modules across backend/frontend to respect service isolation.

```bash
# Example Turborepo script experiment (to be validated)
turbo run dev --filter=backend... --filter=frontend...
```

---

## 🏷️ Labels
`[infra]`, `[tooling]`, `[priority:P1]`, `[milestone:M2]`

---

## 📚 Related Documents
- FR-013: Unified automation structure (`jira/feature-requests/FR-013-unified-automation-structure/FR-013-main.md`)
- FR-017: Minimal robust testing stack (`jira/feature-requests/FR-017-minimal-robust-testing/FR-017-main.md`)
- FR-012: Plane microservice hosting (`jira/feature-requests/FR-012-plane-microservice-hosting/FR-012-main.md`)
- Founder rules (`.cursor/rules/founder_rules.mdc`)
- Turborepo docs: Getting started installation [https://turborepo.com/docs/getting-started/installation](https://turborepo.com/docs/getting-started/installation)


---

## Release Plan (PROC-001)
- Follow PROC-001 “Production Release” in `.cursor/procedures/PROCEDURES.md`
- Preconditions:
  - [ ] `@verify-worktree-isolation` passes
  - [ ] `@test-default-run` passes on this worktree
- Handoff:
  - After merge to main, run `@update_handoff` and choose the “Production Release Update” workflow
- Notes:
  - Frontend version bump (semver) required before tagging
  - Tag format: `v<frontend>-<date>-<shortsha>`

## Worktree Setup Quicklinks
- Isolation: `@verify-worktree-isolation`
- Start Backend: `./scripts/dev-backend.sh`
- Start Frontend: `./scripts/dev-frontend.sh`
- Smoke Test: `@test-default-run`

