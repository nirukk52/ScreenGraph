# FR-018: monorepo-harness-evaluation

**Status:** 📋 Todo  
**Priority:** P1 (High)  
**Milestone:** M2 - Orchestration  
**Owner:** TBD  
**Estimated Effort:** Medium

---

## 📝 Description
Evaluate whether ScreenGraph should adopt a lightweight monorepo harness (e.g., Turborepo) to coordinate backend/frontend dev servers, caching, and shared tooling without violating founder rules. Document trade-offs between maintaining FR-013 Taskfile orchestration versus introducing a root-level build system, and produce a recommendation with migration steps if adoption is approved. Business goal: reduce duplicate orchestration logic while preserving strict backend/frontend isolation and automation guardrails.

Turborepo is the preferred candidate (per founder request). The evaluation must surface which founder rules require amendments (notably "no root package.json") and ensure any adoption keeps Encore backend and SvelteKit frontend isolated while still unlocking parallel task execution, remote caching, and a single `turbo run dev` experience.

---

## 🎯 Acceptance Criteria
- [ ] Decision record comparing Turborepo and current FR-013 Taskfile flow, including founder rule implications and DX/CI impacts.
- [ ] Prototype harness that starts Encore + SvelteKit with a single command while keeping backend/frontend dependencies isolated.
- [ ] Updated founder rules (or explicit rationale for exceptions) and CLAUDE.md guidance if harness adoption is recommended.
- [ ] Rollback plan documenting how to revert to existing Taskfile-only flow if harness causes regressions.

---

## 🔍 Findings to Date
- **Founder rule conflict:** Current policy bans root `package.json` and shared tooling. Turborepo requires root-level config (`package.json`, `turbo.json`) but can stay dev-only and keep workspaces isolated. Need founder approval + documented exception language.
- **FR-013 alignment:** Taskfile remains the source of truth for automation. If Turborepo is adopted, Taskfile commands must either wrap `turbo run …` or vice-versa to avoid duplication. Husky hooks must continue invoking the same QA entry points.
- **FR-017 coupling:** Testing stack (Vitest/Playwright/Supertest) relies on Taskfile targets (`qa:smoke:*`). Turborepo pipelines must execute those targets or provide equivalent scripts so pre-push and CI remain deterministic.
- **Port coordination impact (FR-012 Plane integration):** Turborepo must not hard-code ports; the existing `env.mjs` port resolver still needs to run before spawning services, implying shared scripts between Taskfile and Turborepo.
- **DX opportunity:** Turborepo can deliver a single `turbo run dev` command with concurrency, caching, and filtered builds, reducing the need for custom shell logic.
- **Prototype harness created (main branch):** Added dev-only root `package.json`, `turbo.json`, and Bun workspace configuration; `bun run dev` now bridges to Taskfile via Turborepo while keeping backend/frontend package boundaries intact.

---

## 🛠️ Planned Tasks
1. **Requirements matrix (in progress):** Map FR-013, FR-017, FR-012, and founder rules to Turborepo capabilities (pipelines, caching, filters) and identify required rule updates.
2. **Foundational spike:** Create `turbo.json`, root `package.json` (private, dev-only), and minimal scripts (`turbo run dev`, `turbo run qa:smoke`) in a sandbox branch. Integrate with existing Taskfile targets to verify compatibility.
3. **Automation bridge:** Decide whether Taskfile invokes Turborepo or Turborepo shells out to Taskfile. Prototype both to compare ergonomics and failure reporting.
4. **Governance updates:** Draft founder-rule amendment covering dev-only root tooling, document fallback/rollback procedures, and update CLAUDE.md/automation README accordingly.
5. **Decision record & handoff:** Summarize findings, risks, rollback steps, and recommended rollout plan (including worktree isolation + port policy updates).

---

## 📌 Key Evaluation Questions
- Can we guarantee backend/frontend dependency isolation when using Turborepo workspaces plus Bun package manager?
- How do Husky hooks (`pre-commit`, `pre-push`, `post-checkout`) trigger harness workflows without duplicating logic?
- What founder rule wording change is minimally invasive yet future-proof (e.g., allow root dev tooling only, explicitly prohibit shared runtime deps)?
- Does Turborepo improve CI reliability or only local DX? Quantify expected gains (startup time, cache hits).
- What is the regression risk if Turborepo config drifts from Taskfile definitions? How do we enforce parity?

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
- Turborepo config reference [https://turborepo.com/docs/reference/configuration](https://turborepo.com/docs/reference/configuration)
- FR-018 critique & recommendation (`jira/feature-requests/FR-018-monorepo-harness-evaluation/FR-018-critique.md`)


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

