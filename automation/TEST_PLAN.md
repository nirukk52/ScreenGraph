# Unified Automation System - Critical Test Plan

**Purpose:** Verify core functionality of the unified automation system (Phases 1-3)  
**Scope:** High-level critical tests only  
**Estimated Time:** 15-20 minutes

---

## Test Categories

### 🎯 Category 1: Core Automation Scripts (5 min)

**Purpose:** Verify automation library foundation works correctly

| Test | Command | Expected Result | Status |
|------|---------|----------------|--------|
| **T1.1** Worktree Detection | `node automation/scripts/worktree-detection.mjs info` | Shows current worktree (jcCtc), isMain: false | ⬜ |
| **T1.2** Environment Status | `node automation/scripts/env.mjs status` | Shows 4 services with ports and PIDs | ⬜ |
| **T1.3** Founder Rules Check | `node automation/scripts/check-founder-rules.mjs` | Runs validation, shows violations or passes | ⬜ |

---

### 🎯 Category 2: Task Orchestration (5 min)

**Purpose:** Verify Taskfile structure and task execution

| Test | Command | Expected Result | Status |
|------|---------|----------------|--------|
| **T2.1** List All Tasks | `cd .cursor && task --list` | Shows 44+ tasks across 6 domains | ⬜ |
| **T2.2** Port Configuration | `task ops:ports:show` | Displays Backend: 4000, Frontend: 5173, etc. | ⬜ |
| **T2.3** Service Status | `task founder:servers:status` | Shows worktree and service status | ⬜ |
| **T2.4** Rules Validation | `task founder:rules:check` | Runs founder rules check | ⬜ |

---

### 🎯 Category 3: Critical Workflows (5 min)

**Purpose:** Verify end-to-end workflows work correctly

| Test | Command | Expected Result | Status |
|------|---------|----------------|--------|
| **T3.1** Smoke Test Backend | `task qa:smoke:backend` | Curls health endpoint, passes or fails cleanly | ⬜ |
| **T3.2** Smoke Test Frontend | `task qa:smoke:frontend` | Curls frontend, passes or fails cleanly | ⬜ |
| **T3.3** Worktree Preflight | `task shared:preflight` | Runs verify-worktree-isolation script | ⬜ |
| **T3.4** Environment Print | `task ops:env:print` | Prints BACKEND_PORT, FRONTEND_PORT, WORKTREE_NAME | ⬜ |

---

### 🎯 Category 4: Task Dependencies (3 min)

**Purpose:** Verify task dependencies execute in correct order

| Test | Command | Expected Result | Status |
|------|---------|----------------|--------|
| **T4.1** Server Start Deps | `task founder:servers:start --dry` | Shows dependency: shared:check-worktree-strict | ⬜ |
| **T4.2** Smoke All Deps | `task qa:smoke:all --dry` | Shows deps: smoke:backend, smoke:frontend | ⬜ |

---

### 🎯 Category 5: Variable Resolution (2 min)

**Purpose:** Verify environment variables auto-resolve from automation scripts

| Test | Command | Expected Result | Status |
|------|---------|----------------|--------|
| **T5.1** Backend Port Var | `task backend:health --dry` | Shows BACKEND_PORT variable in command | ⬜ |
| **T5.2** Frontend Port Var | `task frontend:dev --dry` | Shows FRONTEND_PORT variable in command | ⬜ |

---

### 🎯 Category 6: Safety & Guardrails (Optional)

**Purpose:** Verify safety mechanisms work

| Test | Command | Expected Result | Status |
|------|---------|----------------|--------|
| **T6.1** Worktree Strict Check | `task shared:check-worktree-strict` | Passes (if in worktree) or fails (if main tree) | ⬜ |
| **T6.2** Main Tree Detection | Switch to main tree, run T6.1 | Should fail with error message | ⬜ |

---

## Quick Test Script

Run all critical tests in sequence:

```bash
#!/bin/bash
# Quick test suite for unified automation

cd /path/to/ScreenGraph/worktree

echo "🧪 Running Critical Tests..."
echo ""

# Category 1: Automation Scripts
echo "📦 Category 1: Core Scripts"
node automation/scripts/worktree-detection.mjs info
node automation/scripts/env.mjs status | head -n 10
node automation/scripts/check-founder-rules.mjs | head -n 5
echo ""

# Category 2: Task Orchestration
echo "🎯 Category 2: Task Orchestration"
cd .cursor
task --list | wc -l
task ops:ports:show
task founder:servers:status | head -n 10
echo ""

# Category 3: Critical Workflows
echo "🔄 Category 3: Workflows"
task qa:smoke:backend
task qa:smoke:frontend
echo ""

# Category 4: Dependencies (dry run)
echo "🔗 Category 4: Dependencies"
task founder:servers:start --dry | head -n 5
echo ""

# Category 5: Variables (dry run)
echo "💾 Category 5: Variables"
task backend:health --dry | grep BACKEND_PORT
echo ""

echo "✅ Critical tests complete!"
```

---

## Pass Criteria

**Minimum passing requirements:**

- ✅ All Category 1 tests pass (automation scripts work)
- ✅ All Category 2 tests pass (tasks execute)
- ✅ All Category 3 tests pass (workflows function)
- ✅ At least 2/2 Category 4 tests pass (dependencies work)
- ✅ At least 1/2 Category 5 tests pass (variables resolve)

**Optional:**
- Category 6 tests validate safety mechanisms

---

## Known Issues / Expected Failures

1. **T3.1/T3.2 Smoke Tests**: May fail if services not running (expected)
2. **T6.2 Main Tree**: Should intentionally fail with error (safety working)
3. **Founder Rules Check**: May show violations (expected if code has issues)

---

## Regression Testing

Run this test plan:
- ✅ After Phase 3 completion (now)
- ✅ After Phase 4 (Husky integration)
- ✅ After Phase 5 (GitHub/Claude integration)
- ✅ Before final release (Phase 6)
- ✅ After any Taskfile changes
- ✅ After automation script updates

---

## Test Execution Log

**Test Run:** [Date]  
**Tester:** [Name]  
**Environment:** Worktree [name]

### Results Summary

- Category 1: ⬜ Pass / ⬜ Fail
- Category 2: ⬜ Pass / ⬜ Fail
- Category 3: ⬜ Pass / ⬜ Fail
- Category 4: ⬜ Pass / ⬜ Fail
- Category 5: ⬜ Pass / ⬜ Fail
- Category 6: ⬜ Pass / ⬜ Fail / ⬜ Skip

**Overall:** ⬜ PASS / ⬜ FAIL

**Notes:**
```
[Any issues, observations, or recommendations]
```

---

## Quick Validation Commands

For quick smoke testing between phases:

```bash
# Verify everything works (1 minute)
cd .cursor
task --list | grep -c "^*" # Should show 44+ tasks
task founder:servers:status # Should show services
task qa:smoke:backend # Should pass if backend running
task founder:rules:check # Should run validation
```

---

**Last Updated:** 2025-11-07  
**Version:** 1.0 (Phase 3 Complete)  
**Status:** Ready for execution

