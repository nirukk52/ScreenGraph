ScreenGraph/
├─ apps/
│  ├─ frontend/                 # SvelteKit UI
│  └─ backend/                  # Encore.ts APIs, jobs, events
│
├─ packages/
│  ├─ rust-core/                # Rust libs (FFI/WASM bridges)
│  ├─ ui-kit/                   # Shared Svelte components
│  └─ core-ts/                  # TS domain models, utilities
│
├─ .specify/                    # SPEC-DRIVEN CONTROL (Spec Kit)
│  ├─ spec.md                   # Problem, scope, NFRs, user stories
│  ├─ plan.md                   # Architecture, flows, stack tradeoffs
│  ├─ constitution.md           # Ground rules (tests, style, perf budgets)
│  └─ tasks/                    # Atomic tasks + acceptance criteria
│
├─ .claude/                     # SKILL DEFINITIONS & POLICY
│  ├─ CLAUDE.md                 # Project prompting contract
│  ├─ settings.json             # Project policy (models, limits)
│  ├─ settings.local.json       # Local overrides (gitignored)
│  └─ skills/                   # Agent Skills (no “vibe” term)
│     ├─ enabled.json           # Active skill set
│     ├─ presets/               # Presets to switch contexts fast
│     │  ├─ frontend.json
│     │  ├─ backend.json
│     │  └─ testing.json
│     ├─ triggers.md            # Auto-apply rules per repo signals
│     ├─ backend/SKILL.md       # Encore handlers, repos, events
│     ├─ frontend/SKILL.md      # Svelte routes, stores, actions
│     ├─ testing/SKILL.md       # Vitest/Playwright, flake-hardening
│     └─ rust/SKILL.md          # FFI/WASM, build/release patterns
│
├─ skills-runtime/              # EXECUTION TOOLBELT (formerly “vibe”)
│  ├─ .mcp/
│  │  ├─ config.json            # MCP server registry
│  │  └─ servers/
│  │     ├─ test-runner.js      # Run unit/e2e, parse for Skills
│  │     ├─ fs-ops.js           # Safe scaffold/refactor (guardrails)
│  │     └─ quick-deploy.js     # Preview deploy (FE/BE)
│  ├─ kit/
│  │  ├─ templates/             # Codegen templates (thin useful path)
│  │  │  ├─ svelte-component.svelte
│  │  │  ├─ encore-endpoint.ts
│  │  │  ├─ test.spec.ts
│  │  │  └─ docker-compose.yml
│  │  ├─ snippets/              # Auth, errors, telemetry helpers
│  │  └─ configs/               # tsconfig.base, biome, vite, etc.
│  ├─ prompts/
│  │  ├─ workflows/             # Skill-run playbooks (E2E)
│  │  │  ├─ implement-task.md   # Executes one .specify/tasks/* end-to-end
│  │  │  ├─ debug-test.md
│  │  │  └─ refactor-module.md
│  │  └─ personas/
│  │     ├─ code-reviewer.md
│  │     └─ architect.md
│  ├─ context/
│  │  ├─ project-context.md     # One-pager boot file for Skills
│  │  ├─ coding-style.md        # TS/Svelte/Rust conventions
│  │  ├─ common-patterns.md     # Stores, routing, API error model
│  │  └─ gotchas.md             # Flaky zones, perf pitfalls
│  ├─ tests/
│  │  ├─ sanity/                # Repo-wide smoke/sanity checks
│  │  └─ fixtures/
│  └─ toolbox/
│     ├─ integrations/          # figma/, github/, linear/ (tokens in .env.local)
│     └─ editor/
│        └─ cursor/             # Editor settings sync for team
│
├─ docs/
│  ├─ decisions/                # ADRs (linked from .specify/plan.md)
│  ├─ guides/                   # How to run Skills, agents, e2e, deploy
│  └─ references/               # Cheatsheets, API maps
│
├─ .env.example
├─ package.json                 # PNPM/Turbo workspaces
└─ turbo.json                   # Orchestrate build/test across workspaces

Here's a leaner, skills-centric model that fits startup pace better:

ScreenGraph/
├─ apps/
│  ├─ frontend/                 # SvelteKit UI
│  └─ backend/                  # Encore.ts APIs
│
├─ packages/
│  ├─ rust-core/                # Rust libs (FFI/WASM)
│  ├─ ui-kit/                   # Shared Svelte components
│  └─ core-ts/                  # TS domain models
│
├─ .ai/                         # SINGLE AI WORKSPACE
│  ├─ README.md                 # Quick-start: how to use skills
│  ├─ context.md                # Project overview, stack, conventions
│  ├─ constitution.md           # Ground rules (tests, perf, style)
│  │
│  ├─ skills/                   # CORE: Feature-based AI capabilities
│  │  ├─ enabled.json           # Active skills list
│  │  ├─ presets/               # Quick context switching
│  │  │  ├─ backend-dev.json
│  │  │  ├─ frontend-dev.json
│  │  │  └─ full-stack.json
│  │  │
│  │  ├─ backend/               # Backend development skill
│  │  │  ├─ SKILL.md            # What: Encore patterns, repos, events
│  │  │  ├─ workflows/          # How: Step-by-step playbooks
│  │  │  │  ├─ add-endpoint.md
│  │  │  │  └─ test-api.md
│  │  │  └─ templates/          # Codegen: Encore boilerplate
│  │  │     └─ endpoint.ts
│  │  │
│  │  ├─ frontend/
│  │  │  ├─ SKILL.md
│  │  │  ├─ workflows/
│  │  │  │  ├─ add-route.md
│  │  │  │  └─ test-component.md
│  │  │  └─ templates/
│  │  │     ├─ page.svelte
│  │  │     └─ component.svelte
│  │  │
│  │  ├─ testing/
│  │  │  ├─ SKILL.md
│  │  │  ├─ workflows/
│  │  │  │  ├─ unit-test.md
│  │  │  │  └─ e2e-test.md
│  │  │  └─ templates/
│  │  │     └─ test.spec.ts
│  │  │
│  │  └─ rust/
│  │     ├─ SKILL.md
│  │     ├─ workflows/
│  │     │  ├─ add-ffi.md
│  │     │  └─ wasm-build.md
│  │     └─ templates/
│  │        └─ ffi-module.rs
│  │
│  ├─ mcp/                      # MCP servers (execution layer)
│  │  ├─ servers.json           # Server registry
│  │  └─ servers/
│  │     ├─ test-runner.js
│  │     ├─ scaffold.js
│  │     └─ deploy.js
│  │
│  ├─ shared/                   # Cross-skill resources
│  │  ├─ snippets/              # Auth, errors, telemetry
│  │  ├─ patterns.md            # Common solutions
│  │  └─ gotchas.md             # Known pitfalls
│  │
│  └─ tasks/                    # Current work queue
│     ├─ active/                # In-progress tasks
│     ├─ backlog/               # Planned tasks
│     └─ template.md            # Task acceptance criteria format
│
├─ docs/
│  ├─ adr/                      # Architecture decisions
│  └─ guides/                   # Runbooks, deployment
│
└─ turbo.json


ScreenGraph/
├─ apps/
│  ├─ frontend/
│  └─ backend/
├─ packages/
│  ├─ rust-core/
│  ├─ ui-kit/
│  └─ core-ts/
├─ .ai/
│  ├─ README.md
│  ├─ context.md
│  ├─ constitution.md
│  ├─ skills/
│  │  ├─ enabled.json
│  │  ├─ presets/
│  │  ├─ rust/SKILL.md + workflows/ + templates/
│  │  ├─ backend/SKILL.md + workflows/ + templates/
│  │  ├─ frontend/SKILL.md + workflows/ + templates/
│  │  └─ testing/SKILL.md + workflows/ + templates/
│  ├─ mcp/servers.json + servers/
│  ├─ shared/snippets/ + patterns.md + gotchas.md
│  └─ tasks/active/ + backlog/ + template.md
├─ docs/adr/ + guides/
└─ turbo.json

ScreenGraph/
├─ apps/
│  ├─ frontend/                 # SvelteKit UI
│  └─ backend/                  # Encore.ts APIs, jobs, events
│
├─ packages/
│  ├─ rust-core/                # Rust libs (FFI/WASM bridges)
│  ├─ ui-kit/                   # Shared Svelte components
│  └─ core-ts/                  # TS domain models, utilities
│
├─ .specify/                    # SPEC-DRIVEN CONTROL (Spec Kit)
│  ├─ spec.md                   # Problem, scope, NFRs, user stories
│  ├─ plan.md                   # Architecture, flows, stack tradeoffs
│  ├─ constitution.md           # Ground rules (tests, style, perf budgets)
│  └─ tasks/                    # Atomic tasks + acceptance criteria
│
├─ .claude/                     # SKILL DEFINITIONS & POLICY
│  ├─ CLAUDE.md                 # Project prompting contract
│  ├─ settings.json             # Project policy (models, limits)
│  ├─ settings.local.json       # Local overrides (gitignored)
│  └─ skills/                   # Agent Skills (no “vibe” term)
│     ├─ enabled.json           # Active skill set
│     ├─ presets/               # Presets to switch contexts fast
│     │  ├─ frontend.json
│     │  ├─ backend.json
│     │  └─ testing.json
│     ├─ triggers.md            # Auto-apply rules per repo signals
│     ├─ backend/SKILL.md       # Encore handlers, repos, events
│     ├─ frontend/SKILL.md      # Svelte routes, stores, actions
│     ├─ testing/SKILL.md       # Vitest/Playwright, flake-hardening
│     └─ rust/SKILL.md          # FFI/WASM, build/release patterns
│
├─ skills-runtime/              # EXECUTION TOOLBELT (formerly “vibe”)
│  ├─ .mcp/
│  │  ├─ config.json            # MCP server registry
│  │  └─ servers/
│  │     ├─ test-runner.js      # Run unit/e2e, parse for Skills
│  │     ├─ fs-ops.js           # Safe scaffold/refactor (guardrails)
│  │     └─ quick-deploy.js     # Preview deploy (FE/BE)
│  ├─ kit/
│  │  ├─ templates/             # Codegen templates (thin useful path)
│  │  │  ├─ svelte-component.svelte
│  │  │  ├─ encore-endpoint.ts
│  │  │  ├─ test.spec.ts
│  │  │  └─ docker-compose.yml
│  │  ├─ snippets/              # Auth, errors, telemetry helpers
│  │  └─ configs/               # tsconfig.base, biome, vite, etc.
│  ├─ prompts/
│  │  ├─ workflows/             # Skill-run playbooks (E2E)
│  │  │  ├─ implement-task.md   # Executes one .specify/tasks/* end-to-end
│  │  │  ├─ debug-test.md
│  │  │  └─ refactor-module.md
│  │  └─ personas/
│  │     ├─ code-reviewer.md
│  │     └─ architect.md
│  ├─ context/
│  │  ├─ project-context.md     # One-pager boot file for Skills
│  │  ├─ coding-style.md        # TS/Svelte/Rust conventions
│  │  ├─ common-patterns.md     # Stores, routing, API error model
│  │  └─ gotchas.md             # Flaky zones, perf pitfalls
│  ├─ tests/
│  │  ├─ sanity/                # Repo-wide smoke/sanity checks
│  │  └─ fixtures/
│  └─ toolbox/
│     ├─ integrations/          # figma/, github/, linear/ (tokens in .env.local)
│     └─ editor/
│        └─ cursor/             # Editor settings sync for team
│
├─ docs/
│  ├─ decisions/                # ADRs (linked from .specify/plan.md)
│  ├─ guides/                   # How to run Skills, agents, e2e, deploy
│  └─ references/               # Cheatsheets, API maps
│
├─ .env.example
├─ package.json                 # PNPM/Turbo workspaces
└─ turbo.json                   # Orchestrate build/test across workspaces
