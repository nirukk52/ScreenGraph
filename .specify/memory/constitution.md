# ScreenGraph Constitution — Spec-Driven Development

**Version:** 2.0.0  
**Ratified:** 2025-11-11  
**Last Amended:** 2025-11-11

---

## Core Principles

### I. Specification-First

**Every work item starts in `.specify/specs/`; code implements the spec.**

All work (bugs, features, tech debt) follows the same pattern:
1. Create folder: `.specify/specs/{bugs|features|tech-debt|chore}/NAME/`
2. Write `spec.md` — WHAT we're solving (problem, acceptance criteria)
3. Write `plan.md` — HOW we'll solve it (architecture, approach)
4. Write `tasks.md` — STEPS to implement (checklist)
5. Get approval → Implement → Validate → Document

**Rationale:** Clear contracts prevent rework, enable parallel work, reduce re-reviews.

---

### II. Language Boundaries

**Each language has one job. No cross-language pollution.**

**TypeScript (Backend + Frontend)**
- Backend: Encore.ts APIs, business logic, database
- Frontend: SvelteKit routes, components, stores
- Owner: backend_vibe + frontend_vibe

**Svelte 5 (UI Rendering)**
- Component rendering, reactive state ($state, $derived, $effect)
- Tailwind v4 + Skeleton UI v4 styling only
- Owner: frontend_vibe

**Python (Tooling & Automation)**
- MCP servers (`.claude-skills/`)
- Diagnostic scripts (`backend/scripts/`)
- Test automation, data analysis
- Speckit tooling
- Owner: infra_vibe

**Shell (Task Runners)**
- Dev automation (`.cursor/commands/`)
- Health checks, deployment scripts
- Owner: infra_vibe

**Enforcement:**
- No root package.json dependencies (dev-only build tools ok)
- No backend ↔ frontend shared code
- No Python in backend services
- No TypeScript in automation scripts

---

### III. Test-First Development

**RED-GREEN-REFACTOR cycle is mandatory.**

**The cycle:**
1. RED ❌ — Write test demonstrating desired behavior → Test fails
2. GREEN ✅ — Write minimal code to pass test → Test passes
3. REFACTOR 🧹 — Improve code while test stays green
4. REPEAT 🔄 — Add next test, go to RED

**Focus:**
- Critical paths (agent, graph, API contracts)
- Integration tests (service interactions)
- E2E tests (complete workflows)
- Smoke tests (every commit)

**No petty tests** — focus on flow reliability, not edge cases.

---

### IV. Observable Everything

**All errors must be debuggable via structured logs.**

**Backend (Encore.ts):**
```typescript
import log from "encore.dev/log";
const logger = log.with({ module: "agent", actor: "worker", runId });
logger.info("state transition", { from: "idle", to: "planning" });
logger.error("device failed", { err: error.message, deviceId });
```

**Frontend (SvelteKit):**
- Browser console + Sentry for production
- Structured error logging

**Required fields:** `module`, `actor`, `runId` (when applicable)  
**Format:** Always JSON, never unstructured strings  
**Search examples:** `module:"agent" AND actor:"worker" AND runId:xyz`

---

### V. Python for Tooling

**Python owns all tooling, automation, and skills beyond core services.**

**Python IS for:**
- MCP servers (`.claude-skills/` ecosystem)
- Skill definitions and workflows
- Diagnostic scripts
- Test automation (fixtures, utilities)
- Data analysis, performance benchmarks
- Speckit tooling

**Python is NOT for:**
- Backend services (use Encore.ts)
- Frontend UI (use SvelteKit)
- Business logic (use TypeScript)

**Quality standards:**
- PEP 8 style guide
- Type hints mandatory
- CLI-first design (stdin → stdout)
- Unit tests for reusable code

---

## Development Workflow

### 1. Specification Phase

**Location:** `.specify/specs/{bugs|features|tech-debt|chore}/`

1. Create folder with descriptive name
2. Write `spec.md` (problem, scope, acceptance criteria)
3. Write `plan.md` (architecture, flows, tech stack)
4. Write `tasks.md` (atomic work breakdown)
5. Get founder approval

### 2. Implementation Phase

1. Load appropriate vibe (backend_vibe, frontend_vibe, infra_vibe, qa_vibe)
2. Follow constitution (spec-first, test-first, observable)
3. Write tests first (RED ❌)
4. Implement code (GREEN ✅)
5. Refactor while tests pass (🧹)
6. Use MCP tools from vibe for introspection/debugging

### 3. Validation Phase

1. Run smoke tests: `task qa:smoke:all`
2. Run founder rules: `task founder:rules:check`
3. Type check: `task frontend:typecheck` + `task backend:test`
4. Run full test suite
5. Code review: Does code match spec?

### 4. Documentation Phase

1. Update architecture ADRs if design changed
2. Document pattern in Graphiti (architectural decisions)
3. Link PR to spec in `.specify/specs/`
4. Mark work item complete

---

## Quality Gates

### Pre-Commit Hooks
- Founder rules validation (no console.log, no `any`, American spelling)
- TypeScript type checking
- Linting (biome.json)

### Pre-Push Validation
- All smoke tests passing
- All founder rules passing
- Worktree isolation verified

### Code Review
- Specification compliance (does code match spec?)
- Language boundary adherence
- Type safety (no `any`, explicit literal unions in Encore.ts)
- Test coverage (critical paths tested)
- Logging consistency (structured logs, right fields)

---

## Governance

### Amendment Process
1. Propose change in this file
2. Impact analysis (which teams/systems affected?)
3. Founder ratification
4. Migration plan (how do existing projects adapt?)
5. Version bump (major/minor/patch)
6. Propagation (update vibes, skills, Task commands)

### Versioning (Semantic)
- **MAJOR:** Principle removal or redefinition (breaking change)
- **MINOR:** Principle addition or expanded guidance
- **PATCH:** Clarifications, wording, typos

### Enforcement
- Pre-commit hooks validate compliance
- PR reviews check constitution adherence
- Quarterly audits for drift

### Waiver Process
- Only founder can waive rules
- Waivers require documented rationale
- Waivers expire after 30 days
- All waivers logged in Graphiti

---

## Success Metrics

**Quarterly Review:**
- Time to merge (target: 1-2 days)
- Type coverage (target: 100%, zero `any`)
- Test coverage (target: 80%+ on critical paths)
- Smoke test success rate (target: 100%)
- Specification drift (target: 0% — code matches spec)
- Python tooling coverage (target: all skills, MCPs in Python)
- Graphiti completeness (target: all decisions logged)

---

## Language-Specific Rules

**TypeScript:**
- No `any` types
- Explicit literal unions (NOT indexed access types in Encore.ts)
- Structured logging only (no console.log)
- American spelling

**Svelte 5:**
- Runes only ($state, $derived, $effect, $props)
- No legacy $: reactivity
- Tailwind v4 + Skeleton UI v4
- Use Encore-generated client (never manual fetch)

**Python:**
- PEP 8 style guide
- Type hints for all public functions
- CLI-first design
- Unit tests for reusable code

**Shell:**
- ShellCheck validation
- Error handling (set -euo pipefail)
- Documented usage examples

---

## Compliance Checklist

Before merging ANY code:
- [ ] Spec exists in `.specify/specs/` and is approved
- [ ] Tests written first (RED-GREEN-REFACTOR)
- [ ] No type safety violations
- [ ] Structured logging with required fields
- [ ] No console.log (backend)
- [ ] American spelling throughout
- [ ] Language boundaries respected
- [ ] Appropriate vibe used during development
- [ ] Smoke tests pass
- [ ] Founder rules validation passes
- [ ] Code matches spec

---

## Related Documents

**Core:**
- `.specify/README.md` — Navigation hub
- `.cursor/rules/founder_rules.mdc` — Non-negotiable code standards
- `CLAUDE.md` — Project quick reference

**Workflows:**
- `vibes/README.md` — Engineering persona system
- `.claude-skills/README.md` — Skill management
- `.cursor/commands/README.md` — Task automation

**Architecture:**
- `.specify/architecture/` — Technical ADRs
- `BACKEND_HANDOFF.md` — Backend summary
- `FRONTEND_HANDOFF.md` — Frontend summary

---

**This constitution is the ground truth for ScreenGraph development.**

**Review cycle:** Quarterly (January, April, July, October)  
**Next review:** January 2026  
**Maintained by:** Founder (surgical edits only)

