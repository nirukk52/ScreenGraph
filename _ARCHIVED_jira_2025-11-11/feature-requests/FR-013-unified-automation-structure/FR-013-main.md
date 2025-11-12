# FR-013: Unified Automation Structure

**Status:** 🚧 In Progress  
**Priority:** P1 (High)  
**Milestone:** Foundation / Infrastructure  
**Owner:** Founder  
**Estimated Effort:** XL (Multi-Phase)

---

## 📝 Description

Unify four automation systems (`.github`, `.claude-skills`, `.cursor`, `.husky`) using **Taskfile** as the central orchestration layer with a shared `automation/` library. This eliminates code duplication, enforces consistency across all entry points, and provides a single source of truth for all development workflows.

**Business Value:**
- **Zero Duplication**: Business logic lives in one place (`automation/`)
- **Consistent Enforcement**: Worktree isolation, port coordination, and founder rules enforced at all levels (Git hooks, CI/CD, Cursor commands, AI agents)
- **Improved Developer Experience**: Fast, clear feedback with unified interface (`task <command>`)
- **Reduced Maintenance**: One implementation for all four systems
- **Enhanced Safety**: Multi-layer guardrails prevent common mistakes

**Current State:**
- `.cursor/commands/` contains shell scripts with duplicated logic
- No Git hook enforcement
- `.github` workflows use custom scripts
- No Claude Skills integration
- Port coordination scattered across files
- Preflight checks manually called

**Target State:**
- All systems call `task` commands
- Shared automation library (`automation/`)
- Husky enforces rules locally before commits
- GitHub Actions run same tasks as local dev
- Claude Skills can trigger workflows
- Cursor commands ARE Taskfile definitions

---

## 🎯 Acceptance Criteria

### Core Functionality
- [ ] **Unified Interface**: All automation accessible via `task <namespace>:<command>`
- [ ] **Zero Duplication**: Business logic exists only in `automation/` folder
- [ ] **Worktree Safety**: Cannot run services from main tree (enforced at all levels)
- [ ] **Port Coordination**: Works seamlessly across all four entry points
- [ ] **Fast Execution**: Commands run in <2s for simple operations (<5s for complex)

### System Integration
- [ ] **Husky Hooks**: 4 hooks (pre-commit, pre-push, post-checkout, commit-msg) call tasks
- [ ] **Cursor Commands**: All `.cursor/commands/` converted to Taskfiles
- [ ] **GitHub Workflows**: CI/CD calls tasks (no custom scripts)
- [ ] **Claude Skills**: `.claude-skills/skills.json` configured with task references

### Quality & Safety
- [ ] **Backward Compatible**: Existing workflows continue during migration
- [ ] **Clear Errors**: Helpful messages when guardrails triggered
- [ ] **Documented**: README in each major folder + updated CLAUDE.md
- [ ] **Tested**: Smoke tests pass on all phases
- [ ] **CI/CD Stable**: No disruption to deployment pipeline

---

## 🏗️ Architecture

### Folder Structure

```
/project-root
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Updated: calls task qa:smoke:*
│       └── deploy.yml               # Updated: calls task founder:workflows:release
│
├── .husky/                          # NEW: Git hook enforcement
│   ├── pre-commit                   # → task founder:rules:check
│   ├── pre-push                     # → task qa:smoke:backend + qa:smoke:frontend
│   ├── post-checkout                # → task shared:preflight:check-worktree
│   └── commit-msg                   # → task shared:validate:commit-message
│
├── .claude-skills/                  # NEW: AI workflow integration
│   ├── skills.json                  # Defines skills that call tasks
│   └── README.md
│
├── .cursor/
│   ├── Taskfile.yml                 # NEW: Root orchestrator
│   ├── commands/
│   │   ├── README.md                # Updated: explains Taskfile structure
│   │   ├── Taskfile.yml             # NEW: Includes all sub-domains
│   │   ├── shared/
│   │   │   ├── Taskfile.yml         # NEW: Reusable preflight, env tasks
│   │   │   ├── preflight.sh         # Kept: Called as task prereq
│   │   │   └── env.mjs              # Symlink → automation/scripts/env.mjs
│   │   ├── founder/
│   │   │   ├── Taskfile.yml         # NEW: Servers, worktrees, jira, testing
│   │   │   ├── servers/             # Kept: Shell scripts called by tasks
│   │   │   ├── worktrees/           # Kept: Shell scripts called by tasks
│   │   │   └── jira/                # Kept: Shell scripts called by tasks
│   │   ├── backend/
│   │   │   └── Taskfile.yml         # NEW: Backend-scoped tasks
│   │   ├── frontend/
│   │   │   └── Taskfile.yml         # NEW: Frontend-scoped tasks
│   │   ├── ops/
│   │   │   └── Taskfile.yml         # NEW: Port/env management
│   │   └── qa/
│   │       └── Taskfile.yml         # NEW: Smoke tests, Appium
│   └── rules/                       # Kept: No changes
│
├── automation/                      # NEW: Shared automation library
│   ├── README.md                    # Documents architecture
│   ├── scripts/
│   │   ├── env.mjs                  # Moved from .cursor/commands/shared/
│   │   ├── port-coordinator.mjs     # Symlink from scripts/
│   │   ├── check-founder-rules.mjs  # NEW: Validates all founder rules
│   │   ├── validate-commit-msg.mjs  # NEW: Conventional commit enforcement
│   │   └── worktree-detection.mjs   # NEW: Extracted preflight logic
│   ├── templates/
│   │   ├── github-issue.md
│   │   ├── jira-bug.md
│   │   └── pr-checklist.md
│   └── lib/
│       ├── preflight-checks.mjs     # NEW: Reusable check functions
│       └── port-resolver.mjs        # NEW: Port allocation logic
│
└── scripts/                         # Kept: Existing scripts
    ├── dev-backend.sh               # Kept: Called by tasks
    ├── dev-frontend.sh              # Kept: Called by tasks
    └── port-coordinator.mjs         # Kept: Symlinked to automation/
```

### Integration Flow

```
┌─────────────┐
│   HUSKY     │  Local Git Hooks
│  (pre-*)    │  → task founder:rules:check
└──────┬──────┘
       │
       ├──────────┐
       │          │
┌──────▼──────┐  │  ┌─────────────┐
│   CURSOR    │  │  │   GITHUB    │  CI/CD Workflows
│  (commands) │  │  │  (actions)  │  → task qa:smoke:*
└──────┬──────┘  │  └──────┬──────┘
       │         │         │
       └────┬────┴────┬────┘
            │         │
       ┌────▼─────────▼────┐
       │    TASKFILE.YML    │  Central Orchestrator
       │  (.cursor/Taskfile) │
       └────────┬────────────┘
                │
       ┌────────▼────────────┐
       │   automation/       │  Shared Library
       │   - scripts/        │  • env.mjs
       │   - lib/            │  • port-coordinator.mjs
       │   - templates/      │  • check-founder-rules.mjs
       └─────────────────────┘
                │
       ┌────────▼────────────┐
       │   scripts/          │  Existing Scripts
       │   - dev-backend.sh  │  (called by tasks)
       │   - dev-frontend.sh │
       └─────────────────────┘
```

---

## 📋 Implementation Phases

### Phase 1: Foundation (Low Risk) ✅ START HERE
**Goal:** Create shared library without behavioral changes

**Tasks:**
- [ ] Create `automation/` folder structure
- [ ] Move `env.mjs` to `automation/scripts/`
- [ ] Create `worktree-detection.mjs` (extract from preflight.sh)
- [ ] Create `check-founder-rules.mjs` (consolidate rule checks)
- [ ] Create symlinks for backward compatibility
- [ ] Add `automation/README.md` documenting architecture
- [ ] Test: Existing scripts still work

**Deliverables:**
- `automation/` folder with scripts, lib, templates
- Symlinks maintain backward compatibility
- No behavioral changes

**Validation:**
- `@verify-worktree-isolation` still works
- `scripts/dev-backend.sh` still works
- `scripts/dev-frontend.sh` still works

---

### Phase 2: Taskfile Setup (Medium Risk)
**Goal:** Install Taskfile and create basic structure

**Tasks:**
- [ ] Install `go-task` binary (https://taskfile.dev)
- [ ] Create `.cursor/Taskfile.yml` (root orchestrator)
- [ ] Create `.cursor/commands/Taskfile.yml` (includes sub-tasks)
- [ ] Create `.cursor/commands/shared/Taskfile.yml` (preflight, env)
- [ ] Create `.cursor/commands/ops/Taskfile.yml` (ports, env)
- [ ] Convert one simple command as PoC: `task ops:ports:show`
- [ ] Test in current worktree

**Deliverables:**
- Working Taskfile structure
- Proof-of-concept task working
- Documentation of task naming conventions

**Validation:**
- `task --list` shows available commands
- `task ops:ports:show` executes successfully
- Task output is clear and helpful

---

### Phase 3: Command Migration (Medium Risk)
**Goal:** Convert all `.cursor/commands/` to Taskfiles

**Migration Order:**
1. **ops/** (simplest, lowest risk)
   - [ ] `task ops:ports:reserve`
   - [ ] `task ops:ports:release`
   - [ ] `task ops:ports:show`
   - [ ] `task ops:env:print`

2. **qa/** (moderate complexity)
   - [ ] `task qa:appium:start`
   - [ ] `task qa:appium:stop`
   - [ ] `task qa:smoke:backend`
   - [ ] `task qa:smoke:frontend`

3. **backend/** (backend-specific)
   - [ ] `task backend:dev`
   - [ ] `task backend:logs`
   - [ ] `task backend:db:migrate`
   - [ ] `task backend:db:reset`

4. **frontend/** (frontend-specific)
   - [ ] `task frontend:dev`
   - [ ] `task frontend:build`
   - [ ] `task frontend:typecheck`
   - [ ] `task frontend:lint`

5. **founder/** (highest complexity)
   - [ ] `task founder:servers:start`
   - [ ] `task founder:servers:stop`
   - [ ] `task founder:servers:restart`
   - [ ] `task founder:servers:status`
   - [ ] `task founder:worktrees:create`
   - [ ] `task founder:worktrees:switch`
   - [ ] `task founder:testing:smoke`
   - [ ] `task founder:rules:check`
   - [ ] `task founder:workflows:regen-client`
   - [ ] `task founder:jira:new-bug`
   - [ ] `task founder:jira:new-feature`

**Deliverables:**
- All commands converted to tasks
- Old shell scripts remain (parallel execution for validation)
- Task naming conventions documented

**Validation:**
- Each task tested in worktree
- Behavior matches old scripts
- Performance acceptable (<2s for simple tasks)

---

### Phase 4: Husky Integration (Medium Risk)
**Goal:** Add Git hook enforcement

**Tasks:**
- [ ] Install Husky: `bun add --dev husky`
- [ ] Initialize: `bunx husky init`
- [ ] Create `.husky/post-checkout` → `task shared:preflight:check-worktree`
- [ ] Test: Switch branches, verify preflight runs
- [ ] Create `.husky/pre-commit` → `task founder:rules:check`
- [ ] Test: Try committing with `console.log`, verify rejection
- [ ] Create `.husky/pre-push` → `task qa:smoke:backend && task qa:smoke:frontend`
- [ ] Test: Try pushing broken code, verify rejection
- [ ] Create `.husky/commit-msg` → `task shared:validate:commit-message`
- [ ] Test: Try invalid commit message, verify rejection
- [ ] Document bypass: `HUSKY_SKIP_HOOKS=1 git commit` (emergency only)

**Deliverables:**
- `.husky/` folder with 4 hooks
- All hooks tested and working
- Documentation in CLAUDE.md

**Validation:**
- post-checkout detects worktree violations
- pre-commit rejects founder rule violations
- pre-push rejects failing smoke tests
- commit-msg enforces conventional commits
- CI still passes (redundant checks)

---

### Phase 5: External Integration (High Risk)
**Goal:** Update GitHub and Claude to use tasks

**Tasks:**
- [ ] Update `.github/workflows/ci.yml`:
  ```yaml
  - name: Install Task
    run: sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin
  - name: Run Smoke Tests
    run: task qa:smoke:backend
  ```
- [ ] Test in feature branch: Push and verify CI works
- [ ] Update `.github/workflows/deploy.yml` to use tasks
- [ ] Create `.claude-skills/` folder
- [ ] Create `.claude-skills/skills.json`:
  ```json
  {
    "skills": [
      {
        "name": "start-dev-environment",
        "description": "Start backend and frontend services",
        "command": "task founder:servers:start",
        "requires": ["worktree-isolation"]
      },
      {
        "name": "run-smoke-tests",
        "description": "Run smoke tests for backend and frontend",
        "command": "task qa:smoke:backend && task qa:smoke:frontend"
      }
    ]
  }
  ```
- [ ] Test Claude Skills integration
- [ ] Monitor CI/CD for one full deployment cycle

**Deliverables:**
- Updated GitHub workflows
- Working Claude Skills integration
- CI/CD stable

**Validation:**
- CI passes on feature branch
- Deploy succeeds
- Claude Skills can trigger commands
- No disruption to production

---

### Phase 6: Documentation & Cleanup
**Goal:** Finalize and document

**Tasks:**
- [ ] Update `CLAUDE.md`:
  - Remove references to old shell scripts
  - Document Taskfile structure
  - Document Husky hooks
  - Document Claude Skills
- [ ] Update `.cursor/rules/founder_rules.mdc`:
  - Add Taskfile conventions
  - Document task naming patterns
  - Add Husky bypass guidelines
- [ ] Create `MIGRATION_GUIDE.md` for team
- [ ] Remove deprecated shell scripts (after validation period)
- [ ] Add `automation/README.md` architecture diagram
- [ ] Update `BACKEND_HANDOFF.md` and `FRONTEND_HANDOFF.md`
- [ ] Create video walkthrough (optional)

**Deliverables:**
- Comprehensive documentation
- Clean codebase
- Team-ready

**Validation:**
- Documentation reviewed
- Team understands new structure
- No confusion about old vs new commands

---

## 🔗 Dependencies

**Required Before Starting:**
- None (can start immediately)

**External Dependencies:**
- `go-task` binary (https://taskfile.dev/installation)
- `husky` npm package (https://typicode.github.io/husky/)
- Existing port-coordinator.mjs must continue working
- Existing preflight.sh logic must be preserved

**Potential Conflicts:**
- None identified (additive changes)

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] `automation/scripts/check-founder-rules.mjs` has test coverage
- [ ] `automation/lib/preflight-checks.mjs` has test coverage
- [ ] `automation/lib/port-resolver.mjs` has test coverage

### Integration Tests
- [ ] Husky hooks trigger correctly on Git operations
- [ ] Tasks call automation scripts correctly
- [ ] Port coordination works across all entry points
- [ ] Worktree detection works in all scenarios

### End-to-End Tests
- [ ] Create new worktree → ports allocated → services start → smoke tests pass
- [ ] Commit with violation → pre-commit hook rejects → error message clear
- [ ] Push broken code → pre-push hook rejects → CI never sees it
- [ ] GitHub CI runs → tasks execute → same behavior as local
- [ ] Claude Skills trigger commands → tasks execute correctly

### Performance Tests
- [ ] Simple tasks (<2s): `task ops:ports:show`, `task shared:preflight:check-worktree`
- [ ] Medium tasks (<5s): `task founder:servers:status`, `task frontend:typecheck`
- [ ] Complex tasks (<30s): `task qa:smoke:backend`, `task founder:servers:start`
- [ ] Hook overhead (<1s): pre-commit should be fast enough not to annoy developers

---

## 📋 Technical Notes

### Taskfile Example Structure

**Root Taskfile** (`.cursor/Taskfile.yml`):
```yaml
version: '3'

includes:
  shared: ./commands/shared/Taskfile.yml
  founder: ./commands/founder/Taskfile.yml
  backend: ./commands/backend/Taskfile.yml
  frontend: ./commands/frontend/Taskfile.yml
  ops: ./commands/ops/Taskfile.yml
  qa: ./commands/qa/Taskfile.yml

vars:
  BACKEND_PORT:
    sh: node automation/scripts/env.mjs backend-port
  FRONTEND_PORT:
    sh: node automation/scripts/env.mjs frontend-port
  WORKTREE_NAME:
    sh: node automation/scripts/env.mjs worktree-name

tasks:
  default:
    desc: "List all available tasks"
    cmds:
      - task --list
```

**Shared Taskfile** (`.cursor/commands/shared/Taskfile.yml`):
```yaml
version: '3'

tasks:
  preflight:
    desc: "Run preflight checks (worktree, ports, rules)"
    cmds:
      - ./shared/preflight.sh
    silent: false

  check-worktree:
    desc: "Verify we're in a valid worktree"
    cmds:
      - node ../../../automation/scripts/worktree-detection.mjs
    silent: false

  load-env:
    desc: "Load and print environment variables"
    cmds:
      - node ../../../automation/scripts/env.mjs print
    silent: false

  validate:commit-message:
    desc: "Validate commit message format"
    cmds:
      - node ../../../automation/scripts/validate-commit-msg.mjs {{.CLI_ARGS}}
    silent: false
```

**Founder Taskfile** (`.cursor/commands/founder/Taskfile.yml`):
```yaml
version: '3'

tasks:
  servers:start:
    desc: "Start backend and frontend services"
    deps:
      - task: shared:preflight
    cmds:
      - echo "🚀 Starting services..."
      - ../../../scripts/dev-backend.sh &
      - ../../../scripts/dev-frontend.sh &
      - echo "✅ Services started. Backend: {{.BACKEND_PORT}}, Frontend: {{.FRONTEND_PORT}}"
    silent: false

  servers:stop:
    desc: "Stop all services"
    cmds:
      - echo "🛑 Stopping services..."
      - pkill -f "encore run" || true
      - pkill -f "vite" || true
      - echo "✅ Services stopped"
    silent: false

  servers:status:
    desc: "Check service status"
    cmds:
      - node ../../../automation/scripts/env.mjs status
    silent: false

  rules:check:
    desc: "Validate all founder rules"
    cmds:
      - node ../../../automation/scripts/check-founder-rules.mjs
    silent: false
```

### Husky Hook Example

**`.husky/pre-commit`**:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run founder rules check
task founder:rules:check

# If check fails, exit 1 will prevent commit
```

**`.husky/pre-push`**:
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🧪 Running smoke tests before push..."

# Run smoke tests (parallel if possible)
task qa:smoke:backend &
BACKEND_PID=$!

task qa:smoke:frontend &
FRONTEND_PID=$!

# Wait for both
wait $BACKEND_PID || exit 1
wait $FRONTEND_PID || exit 1

echo "✅ Smoke tests passed"
```

### Founder Rules Checker

**`automation/scripts/check-founder-rules.mjs`**:
```javascript
#!/usr/bin/env node

/**
 * Validates all Founder Rules before commit.
 * Checks:
 * - No console.log (must use encore.dev/log)
 * - No `any` types
 * - No magic strings
 * - American spelling
 * - No root package.json
 */

import { glob } from 'glob';
import { readFile } from 'fs/promises';

const errors = [];

// Rule 1: No console.log
const tsFiles = await glob('backend/**/*.ts');
for (const file of tsFiles) {
  const content = await readFile(file, 'utf-8');
  if (content.includes('console.log')) {
    errors.push(`❌ ${file}: Found console.log (use encore.dev/log instead)`);
  }
}

// Rule 2: No `any` type
for (const file of tsFiles) {
  const content = await readFile(file, 'utf-8');
  if (content.match(/:\s*any\b/)) {
    errors.push(`❌ ${file}: Found 'any' type (use explicit types)`);
  }
}

// Rule 3: No root package.json
const rootPkg = await glob('package.json', { ignore: ['backend/**', 'frontend/**'] });
if (rootPkg.length > 0) {
  errors.push(`❌ Root package.json detected (backend/frontend must be independent)`);
}

if (errors.length > 0) {
  console.error('\n🚨 Founder Rules Violations:\n');
  errors.forEach(err => console.error(err));
  console.error('\nFix these issues before committing.\n');
  process.exit(1);
}

console.log('✅ All founder rules passed\n');
```

### Claude Skills Configuration

**`.claude-skills/skills.json`**:
```json
{
  "version": "1.0",
  "skills": [
    {
      "name": "start-dev-environment",
      "description": "Start backend and frontend services in worktree",
      "command": "task founder:servers:start",
      "requires": ["worktree-isolation"],
      "category": "development"
    },
    {
      "name": "run-smoke-tests",
      "description": "Run smoke tests for both backend and frontend",
      "command": "task qa:smoke:backend && task qa:smoke:frontend",
      "category": "testing"
    },
    {
      "name": "check-founder-rules",
      "description": "Validate all founder rules compliance",
      "command": "task founder:rules:check",
      "category": "quality"
    },
    {
      "name": "create-feature-doc",
      "description": "Create new feature request folder with templates",
      "command": "task founder:jira:new-feature",
      "category": "project-management"
    },
    {
      "name": "regenerate-client",
      "description": "Regenerate frontend Encore client after backend changes",
      "command": "task founder:workflows:regen-client",
      "requires": ["backend-changes"],
      "category": "development"
    }
  ]
}
```

---

## 🏷️ Labels

`[infrastructure]`, `[automation]`, `[taskfile]`, `[husky]`, `[claude-skills]`, `[priority-high]`, `[multi-phase]`

---

## 📚 Related Documents

- **Bootstrap .github structure**: https://github.com/twbs/bootstrap/tree/main/.github
- **Anthropic Claude Skills**: https://github.com/anthropics/skills
- **Husky documentation**: https://typicode.github.io/husky/
- **Taskfile documentation**: https://taskfile.dev/
- `.cursor/PORT_ISOLATION_ENFORCEMENT.md` - Worktree isolation requirements
- `.cursor/rules/founder_rules.mdc` - Founder rules that must be enforced
- `.cursor/commands/verify-worktree-isolation` - Existing preflight logic
- `CLAUDE.md` - Project quick reference (needs updating)

---

## Release Plan (PROC-001)

- Follow PROC-001 "Production Release" in `.cursor/procedures/PROCEDURES.md`
- **Preconditions:**
  - [x] `@verify-worktree-isolation` passes
  - [ ] All 6 phases complete
  - [ ] `@run-default-test` passes on this worktree
  - [ ] Team reviewed and approved new structure
  - [ ] Documentation complete
- **Handoff:**
  - After merge to main, run `@update-handoff` and choose "Production Release Update"
- **Notes:**
  - This is infrastructure change - deploy during low-traffic window
  - Monitor first few commits/pushes for hook issues
  - Have rollback plan (disable Husky temporarily)

## Worktree Setup Quicklinks

- **Isolation**: `@verify-worktree-isolation`
- **Start Backend**: `./scripts/dev-backend.sh`
- **Start Frontend**: `./scripts/dev-frontend.sh`
- **Smoke Test**: `@run-default-test`

