# Testing Commands Analysis & Simplification Strategy

## Executive Summary

**Current State:** 17+ testing commands across 4 entry points (Turbo root scripts, Task commands, service package.json, legacy commands)  
**Problem:** Overlapping responsibilities, inconsistent naming, unclear hierarchy  
**Recommendation:** Consolidate to 8 core commands with clear hierarchy

---

## 📊 Complete Testing Command Inventory

### Entry Point 1: Root Package.json (Turborepo Harness)
| Command | What It Does | Underlying Tool |
|---------|--------------|-----------------|
| `bun run qa:smoke` | Runs all smoke tests | → `task qa:smoke:all` |
| `bun run qa:smoke:backend` | Backend health check | → `task qa:smoke:backend` |
| `bun run qa:smoke:frontend` | Frontend availability check | → `task qa:smoke:frontend` |
| `bun run test:e2e` | Frontend E2E tests (headless) | → `turbo run test:e2e` → `playwright test` |
| `bun run test:e2e:headed` | Frontend E2E tests (headed) | → `turbo run test:e2e:headed` → `playwright test` |
| `bun run test:e2e:ci` | Frontend E2E tests (CI mode) | → `turbo run test:e2e:ci` → `playwright test` |
| `bun run test:e2e:ui` | Playwright UI mode | → `turbo run test:e2e:ui` → `playwright test --ui` |
| `bun run lint` | Frontend linting | → `task frontend:lint` |
| `bun run typecheck` | Frontend type checking | → `task frontend:typecheck` |

### Entry Point 2: Task Commands (.cursor/commands/)
| Command | What It Does | Underlying Tool |
|---------|--------------|-----------------|
| `task qa:smoke:backend` | Backend health check | → `curl http://localhost:4000/health` |
| `task qa:smoke:frontend` | Frontend availability check | → `curl http://localhost:5173` |
| `task qa:smoke:all` | All smoke tests | → Calls both above |
| `task qa:e2e` | E2E test harness | → `bun run test:e2e` in backend |
| `task backend:test` | Backend unit tests | → `encore test` |
| `task frontend:test` | Frontend unit tests | → `bun test` |
| `task frontend:typecheck` | TypeScript checking | → `bun run check` |
| `task frontend:lint` | Linting | → `bunx biome lint` |
| `task founder:testing:smoke` | Founder smoke tests | → Calls `qa:smoke:backend` + `qa:smoke:frontend` |
| `task founder:testing:backend` | Founder backend tests | → `encore test` |
| `task founder:testing:frontend` | Founder frontend tests | → `bun test` |

### Entry Point 3: Backend Package.json Scripts
| Command | What It Does | Test Framework |
|---------|--------------|----------------|
| `bun run test` | Unit tests | Vitest |
| `bun run test:watch` | Unit tests (watch mode) | Vitest |
| `bun run wdio` | WebdriverIO tests | WebdriverIO + Mocha |

### Entry Point 4: Frontend Package.json Scripts
| Command | What It Does | Test Framework |
|---------|--------------|----------------|
| `bun run test:e2e` | E2E tests (headless) | Playwright |
| `bun run test:e2e:headed` | E2E tests (headed) | Playwright |
| `bun run test:e2e:ci` | E2E tests (CI) | Playwright |
| `bun run test:e2e:ui` | Playwright UI | Playwright |

---

## 🔍 Analysis: Similarities & Differences

### Test Types (What)

| Type | Purpose | Scope | Speed | Tools Used |
|------|---------|-------|-------|------------|
| **Smoke** | Is it alive? | HTTP health checks | < 5s | curl |
| **Unit** | Logic correctness | Single functions/classes | < 30s | Vitest (backend), Bun (frontend) |
| **E2E** | Full user flows | Frontend + Backend + Browser | 30s-5min | Playwright |
| **Integration** | Service boundaries | Multiple services | 10s-1min | Vitest + Encore |
| **Static** | Code quality | All source files | 10s-30s | TypeScript, Biome |

### Test Frameworks (How)

| Framework | Used In | Test Files | Config File |
|-----------|---------|------------|-------------|
| **Vitest** | Backend | `*.test.ts` (11 files) | `backend/vitest.config.ts` |
| **Playwright** | Frontend | `tests/e2e/*.spec.ts` (1 file) | `frontend/playwright.config.ts` |
| **WebdriverIO** | Backend | `tests/_appium-server.spec.js` | `backend/wdio.conf.js` |
| **TypeScript** | Frontend | All `.ts/.svelte` files | `frontend/tsconfig.json` |
| **Biome** | Both | All source files | Root `biome.json` |

### Entry Points (Where)

```
Root Scripts (9 commands)
    ↓ delegates to
Task Commands (11 commands)
    ↓ delegates to
Service Scripts (7 commands)
    ↓ delegates to
Test Frameworks (5 tools)
```

**Problem:** Too many layers with duplicate names creating confusion.

---

## 🚨 Key Problems Identified

### 1. **Duplicate/Overlapping Commands**
```bash
# All do the same thing:
bun run qa:smoke          # Root
task qa:smoke:all         # Task
task founder:testing:smoke # Task (founder namespace)

# All do the same thing:
task backend:test         # Task
task founder:testing:backend # Task (founder)
cd backend && bun run test   # Direct
```

### 2. **Inconsistent Naming**
- Smoke: `qa:smoke:*` vs `founder:testing:smoke`
- E2E: `test:e2e` vs `qa:e2e`
- Unit: `backend:test` vs `founder:testing:backend`

### 3. **Unclear Hierarchy**
- Should devs use root scripts or Task commands?
- When to use service-specific vs orchestration layer?
- What's the difference between `qa:*` and `founder:testing:*`?

### 4. **Missing Tests**
- Frontend has NO unit tests (only E2E)
- Backend has unit tests but they're not in CI
- No integration tests between services
- WebdriverIO tests exist but aren't wired up

### 5. **Confusing E2E Setup**
- `task qa:e2e` calls backend's `test:e2e` script
- But frontend has the actual E2E tests
- Backend script probably doesn't exist or is wrong

---

## ✅ Simplification Strategy

### Phase 1: Consolidate to 8 Core Commands

**Single Source of Truth:** All testing through Task commands only.

```bash
# Quick checks (< 5s each)
task qa:smoke              # Both services health check
task qa:lint               # Both services lint
task qa:typecheck          # Both services typecheck

# Unit tests (< 30s each)
task qa:unit:backend       # Backend Vitest
task qa:unit:frontend      # Frontend unit (when added)
task qa:unit               # Both

# Integration/E2E (30s-5min)
task qa:e2e                # Playwright tests
task qa:integration        # Service boundary tests (when added)
```

### Phase 2: Remove Redundant Layers

**Before:**
```
bun run qa:smoke → task qa:smoke:all → task qa:smoke:backend + task qa:smoke:frontend
```

**After:**
```
task qa:smoke → parallel health checks for both services
```

**Changes Required:**
1. Remove `founder:testing:*` tasks (duplicate of `backend:test`, `frontend:test`)
2. Remove root package.json test scripts (keep only `bun run task` as bridge)
3. Consolidate `qa:smoke:*` into single `qa:smoke` with parallel execution
4. Fix `qa:e2e` to call frontend Playwright tests, not backend

### Phase 3: Establish Clear Hierarchy

```
┌─────────────────────────────────────────────┐
│  Developer Interface (One Entry Point)      │
│  cd .cursor && task qa:<command>            │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Task Orchestration Layer                   │
│  .cursor/commands/qa/Taskfile.yml           │
│  - Handles service coordination             │
│  - Parallel execution                       │
│  - Error aggregation                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Service-Specific Scripts (Internal Only)   │
│  backend/package.json, frontend/package.json│
│  - Not called directly by developers        │
│  - Only invoked by Task layer               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│  Test Frameworks (Implementation Detail)    │
│  Vitest, Playwright, TypeScript, Biome      │
└─────────────────────────────────────────────┘
```

**Golden Rule:** Devs only call `task qa:*` commands. Everything else is internal.

---

## 📋 Proposed Command Matrix

### Consolidated Testing Commands

| Command | Type | Scope | Time | Description | Replaces |
|---------|------|-------|------|-------------|----------|
| `task qa:smoke` | Smoke | Both | < 5s | Health checks for all services | `qa:smoke:all`, `qa:smoke:backend`, `qa:smoke:frontend`, `founder:testing:smoke` |
| `task qa:lint` | Static | Both | 10s | Biome linting for both services | `frontend:lint` |
| `task qa:typecheck` | Static | Both | 20s | TypeScript checking for both | `frontend:typecheck` |
| `task qa:unit` | Unit | Both | 30s | All unit tests (backend + frontend) | `backend:test`, `frontend:test`, `founder:testing:*` |
| `task qa:unit:backend` | Unit | Backend | 15s | Backend Vitest tests only | `backend:test`, `founder:testing:backend` |
| `task qa:unit:frontend` | Unit | Frontend | 15s | Frontend unit tests (when added) | `frontend:test`, `founder:testing:frontend` |
| `task qa:e2e` | E2E | Frontend | 1-5min | Playwright browser tests | `test:e2e`, `qa:e2e` (current broken one) |
| `task qa:all` | All | Both | 2-6min | Complete test suite | New |

### Special-Purpose Commands (Keep)

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `task qa:e2e:headed` | Playwright headed mode | Local debugging |
| `task qa:e2e:ui` | Playwright UI mode | Test development |
| `task qa:unit:watch` | Watch mode | Active TDD |

---

## 🎯 Implementation Plan

### Step 1: Update `.cursor/commands/qa/Taskfile.yml`

```yaml
version: '3'

tasks:
  # Smoke tests (parallel)
  smoke:
    desc: "Health checks for all services"
    cmds:
      - echo "🧪 Running smoke tests..."
      - |
        (curl -sf http://localhost:4000/health && echo "✅ Backend healthy") &
        (curl -sf http://localhost:5173 > /dev/null && echo "✅ Frontend healthy") &
        wait
    silent: false

  # Static analysis (sequential)
  lint:
    desc: "Lint both services"
    cmds:
      - echo "🔍 Linting backend..."
      - cd ../../backend && bunx biome lint .
      - echo "🔍 Linting frontend..."
      - cd ../../frontend && bunx biome lint .
    silent: false

  typecheck:
    desc: "TypeScript checking for both services"
    cmds:
      - echo "🔍 Type checking frontend..."
      - cd ../../frontend && bun run check
      - echo "✅ Frontend types valid"
    silent: false

  # Unit tests (parallel)
  unit:backend:
    desc: "Backend unit tests"
    cmds:
      - echo "🧪 Running backend unit tests..."
      - cd ../../backend && encore test
    silent: false

  unit:frontend:
    desc: "Frontend unit tests"
    cmds:
      - echo "🧪 Running frontend unit tests..."
      - cd ../../frontend && bun test
    silent: false

  unit:
    desc: "All unit tests"
    cmds:
      - task: unit:backend
      - task: unit:frontend
    silent: false

  # E2E tests
  e2e:
    desc: "Frontend E2E tests (headless)"
    cmds:
      - echo "🧪 Running E2E tests..."
      - cd ../../frontend && bun run test:e2e
    silent: false

  e2e:headed:
    desc: "Frontend E2E tests (headed)"
    cmds:
      - cd ../../frontend && bun run test:e2e:headed
    silent: false

  e2e:ui:
    desc: "Playwright UI mode"
    cmds:
      - cd ../../frontend && bun run test:e2e:ui
    silent: false

  # Complete suite
  all:
    desc: "Complete test suite"
    cmds:
      - task: smoke
      - task: lint
      - task: typecheck
      - task: unit
      - task: e2e
    silent: false
```

### Step 2: Remove Redundant Tasks

**Delete from `.cursor/commands/founder/Taskfile.yml`:**
```yaml
# DELETE these (lines 72-91):
  testing:smoke:
  testing:backend:
  testing:frontend:
```

### Step 3: Simplify Root Package.json

**Replace all test scripts with:**
```json
{
  "scripts": {
    "qa": "cd .cursor && task qa:all",
    "qa:smoke": "cd .cursor && task qa:smoke",
    "qa:lint": "cd .cursor && task qa:lint",
    "qa:typecheck": "cd .cursor && task qa:typecheck",
    "qa:unit": "cd .cursor && task qa:unit",
    "qa:e2e": "cd .cursor && task qa:e2e"
  }
}
```

### Step 4: Update Documentation

**Update `CLAUDE.md`:**
```markdown
## Testing Commands

All tests run through Task commands from `.cursor/`:

### Quick Checks (< 30s)
- `task qa:smoke` - Health checks
- `task qa:lint` - Code linting  
- `task qa:typecheck` - Type checking

### Test Suites
- `task qa:unit` - All unit tests
- `task qa:unit:backend` - Backend only
- `task qa:unit:frontend` - Frontend only
- `task qa:e2e` - Browser E2E tests

### Full Suite
- `task qa:all` - Everything (2-6min)

### Special Modes
- `task qa:e2e:headed` - Debug E2E visually
- `task qa:e2e:ui` - Playwright UI
```

### Step 5: Update Husky Hooks

**`.husky/pre-push`:**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

cd .cursor && task qa:smoke
```

---

## 📈 Before/After Comparison

### Before (Current State)
```bash
# Developer confusion:
bun run qa:smoke              # Root harness
task qa:smoke:all             # Task
task founder:testing:smoke    # Task (founder)
cd backend && bun run test    # Direct

# 17+ commands across 4 entry points
# Unclear which to use when
# Duplicated logic in 3 places
```

### After (Proposed)
```bash
# Single entry point:
task qa:smoke        # Quick health check
task qa:unit         # All unit tests
task qa:e2e          # E2E tests
task qa:all          # Everything

# 8 core commands, 1 entry point
# Clear hierarchy
# Zero duplication
```

---

## 🎯 Success Metrics

1. **Simplicity:** 17+ commands → 8 core commands
2. **Clarity:** 1 entry point (Task) instead of 4
3. **Speed:** Parallel smoke tests (5s → 2s)
4. **Consistency:** All `qa:*` namespace
5. **Discoverability:** `task --list-all` shows everything

---

## 🚀 Next Steps

1. **Immediate:** Update `.cursor/commands/qa/Taskfile.yml` with new structure
2. **Quick:** Remove `founder:testing:*` tasks (redundant)
3. **Medium:** Add frontend unit tests (currently missing)
4. **Long-term:** Add integration tests for service boundaries

---

**Last Updated:** 2025-11-09  
**Status:** Proposal (pending approval)

