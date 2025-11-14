# FR-018: Turborepo Harness Critique & Recommendation

## 1. Current Snapshot
- **Harness in place:** `bun run dev` now drives both services via Turborepo (root `package.json`, `turbo.json`).
- **Taskfile integration:** Founder commands (`task founder:servers:start/stop`) simply wrap the Turborepo harness.
- **Automation guardrails:** FR-013 Taskfile topology, Husky hooks, and CI still invoke the original task targets; no end-to-end alignment work has been done yet.
- **Testing stack (FR-017):** QA commands (`qa:smoke:*`) are untouched and currently sit outside the Turborepo pipeline.
- **Plane hosting (FR-012):** Port allocator scripts remain independent from the harness; Turkorepo tasks do not yet consult them.

## 2. Practical Critique
1. **Rule deviation risk:** Founder rules explicitly forbid root-level runtime dependencies. We introduced a root `package.json`. Even though it is dev-only, the rule needs formal amendment; otherwise future audits will flag it.
2. **Dual orchestration:** Taskfile is still the authoritative source for QA and ops, while Turborepo now handles dev servers. Without a single source of truth, definitions will drift (duplicated scripts, env handling, port management).
3. **Guardrail mismatch:** Husky/CI continue to call Taskfile directly. If developers rely on Turborepo for workflows, they may bypass required checks (e.g., `turbo run qa:smoke` does not exist yet).
4. **Port coordination gap:** Turborepo executes `encore run` / `vite dev` without running the preflight port reservation scripts, so multi-worktree isolation is not enforced by default.
5. **DX vs reliability:** Harness gives faster start-up and concurrent logs, but adds complexity (root dependencies, new CLI, new caches). Without remote caching/hooks integration, the benefit is limited to dev convenience.

## 3. Recommendation — Integration Plan
| Phase | Objective | Key Actions |
| --- | --- | --- |
| **A. Policy Alignment** | Formalize exception for dev-only root tooling | Draft amendment to `.cursor/rules/founder_rules.mdc` clarifying Turborepo usage; highlight prohibition on shared runtime deps and commit requirement to keep workspaces isolated |
| **B. Pipeline Consolidation** | Make Turborepo and Taskfile consistent | Define Turborepo tasks for `qa:smoke:*`, `lint`, `typecheck`, `build`. Taskfile should invoke `turbo run` for these targets to avoid duplication |
| **C. Guardrail Bridging** | Uphold Husky/CI behavior | Update Husky and GitHub Actions to call `bun run task …` or `bun run turbo …` consistently; ensure identical command graph |
| **D. Port & Env Preflight** | Preserve worktree isolation | Wrap `turbo run dev` with preflight script that executes `automation/scripts/env.mjs` before launching services (or add `dependsOn` script in turbo pipeline) |
| **E. Rollback & Telemetry** | Stay reversible | Document rollback steps, monitor for regressions, and collect dev feedback on harness effectiveness after adoption |

## 4. Immediate Next Steps
1. Finish requirements matrix (FR-013/FR-017/FR-012 vs Turborepo capabilities).
2. Introduce shared scripts so Taskfile ↔ Turborepo reuse identical command definitions.
3. Draft founder rule amendment and circulate for approval.
4. Add Turborepo tasks for QA and ensure Husky/CI run them.
5. Implement preflight wrapper (port coordination, env validation) before Turborepo spawns servers.

## 5. Decision Gate
- **Adopt fully** once policy update is signed off and guardrails are satisfied.
- **Rollback** if Turborepo integration cannot maintain automation parity or if founder rules remain unchanged.
