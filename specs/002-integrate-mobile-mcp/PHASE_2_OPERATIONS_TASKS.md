# Phase 2+ Tasks: Operations Migration & Integration
**Input**: Phase 1 Complete (Device Provisioning) ✅  
**Output**: Full agent operations via mobile-mcp (Phase 2) → Cloud support (Phase 3+)  
**Planning Method**: Sequential Thinking (dependency analysis, parallelization, exit criteria)

---

## Overview

Phase 2 migrates agent operations (screenshot, tap/swipe, app lifecycle) from direct WebDriverIO/Appium to mobile-mcp APIs. This document continues from `tasks.md` (T001-T059) with Phase 2+ task definitions.

**Task Numbering**:
- T060-T089: Phase 2A - Screenshot Capture Migration
- T090-T119: Phase 2B - Input Operations Migration  
- T120-T149: Phase 2C - App Lifecycle Migration
- T150-T169: Phase 2D - Session Cleanup & Resource Management
- T170-T189: Phase 3A - Integration Testing & E2E Validation
- T190-T210: Phase 3B - Documentation & Handoff

**Total Tasks**: 151 (Phase 2+)  
**Estimated Duration**: 32-40 hours  
**Critical Path**: T060-T069 (Screenshot) → T150-T159 (Cleanup) → T170-T179 (E2E)

---

## Format Explained

```
[ID] [P?] [Component] [Priority] [Description]
```

- **[ID]**: Task number (T060-T210)
- **[P]**: Can run in Parallel (different files, no inter-dependencies)
- **[Component]**: perception, input, lifecycle, cleanup, integration
- **[Priority]**: P0=blocking, P1=blocking phase, P2=nice-to-have
- **[Description]**: What to implement + exact file paths

---

## Phase 2A: Screenshot Capture Migration (T060-T089)

**Goal**: Replace Appium screenshot with mobile-mcp API  
**Duration**: 8 hours  
**Feature Flag**: `ENABLE_MOBILE_MCP`  
**Rollback**: Switch to direct WebDriverIO if pixel output differs

### Setup & Analysis

- [ ] **T060** [P] Perception Read WebDriverIO perception adapter code (`backend/agent/adapters/appium/webdriverio/perception.adapter.ts:1-100`)
- [ ] **T061** [P] Perception Read mobile-mcp screenshot API spec (`backend/mobile/encore.service.ts:400-450`)
- [ ] **T062** Perception Document comparison plan: Appium vs mobile-mcp output format (base64, dimensions, timing)
- [ ] **T063** Perception Create performance benchmark baseline: `time curl /perception/screenshot` (WebDriverIO)

### Implementation

- [ ] **T064** Perception Create mobile perception adapter: `backend/agent/adapters/mobile/perception.adapter.ts`
- [ ] **T065** [P] Perception Implement `captureScreenshot()` method wrapping `mobile.captureScreenshot()`
- [ ] **T066** [P] Perception Add base64 → PNG validation
- [ ] **T067** [P] Perception Add try-catch for network/device failures
- [ ] **T068** Perception Update perception port to support dual backends (WebDriverIO | mobile-mcp)
- [ ] **T069** Perception Wire mobile adapter into agent ports (feature flag gate)

### Testing & Validation

- [ ] **T070** [P] Perception Create unit test for mobile screenshot adapter
- [ ] **T071** [P] Perception Mock mobile-mcp response (base64 PNG)
- [ ] **T072** Perception Create comparison test: screenshot dimensions match WebDriverIO
- [ ] **T073** Perception Run against live emulator: `cd backend && encore test agent/adapters/mobile/perception.adapter.test.ts`
- [ ] **T074** Perception Benchmark performance: mobile vs Appium timing (target: <2s)
- [ ] **T075** [P] Perception Add screenshot to operation log: `mobile_operations_log.operation_type = 'screenshot'`

### Integration

- [ ] **T076** [P] Perception Update agent perception node to use mobile adapter when flag ON
- [ ] **T077** [P] Perception Add fallback: if mobile fails, retry with Appium
- [ ] **T078** Perception Add structured logging: `logger.info("screenshot captured", { source: "mobile|appium", durationMs, width, height })`
- [ ] **T079** Perception Create E2E test: full run with mobile screenshots only
- [ ] **T080** Perception Update `backend/mobile/STATUS.md`: Screenshot migration complete

### Quality & Docs

- [ ] **T081** [P] Perception Run linter: `cd backend && bun run lint agent/adapters/mobile/perception.adapter.ts`
- [ ] **T082** [P] Perception Type check: `tsc --noEmit`
- [ ] **T083** Perception Update `backend/agent/README.md`: perception adapter dual-backend support
- [ ] **T084** [P] Perception Add code comments: why mobile-mcp instead of WebDriverIO
- [ ] **T085** Perception Document rollback procedure: `ENABLE_MOBILE_MCP=false` if issues

### Exit Criteria (Phase 2A)

- [ ] Mobile screenshot adapter compiles (`tsc --noEmit`)
- [ ] All unit tests pass (`encore test agent/adapters/mobile/perception.adapter.test.ts`)
- [ ] Live emulator test passes (screenshot captured successfully)
- [ ] Performance ≤2s (same as Appium baseline)
- [ ] Feature flag gates implementation (flag OFF = uses WebDriverIO)
- [ ] No regressions in existing Appium tests

**Checkpoint**: Screenshot migration complete and validated ✅

---

## Phase 2B: Input Operations Migration (T090-T119)

**Goal**: Replace Appium/WebDriverIO tap/swipe with mobile-mcp APIs  
**Duration**: 8 hours  
**Dependencies**: Phase 2A optional (can run parallel)  
**Feature Flag**: `ENABLE_MOBILE_MCP`

### Setup & Analysis

- [ ] **T090** [P] Input Read WebDriverIO input adapter code (`backend/agent/adapters/appium/webdriverio/input-actions.adapter.ts:1-150`)
- [ ] **T091** [P] Input Read mobile-mcp input APIs: `tapAtCoordinates()`, `swipe()`, `typeText()` (`backend/mobile/encore.service.ts:500-700`)
- [ ] **T092** Input Document API mapping: WebDriverIO → mobile-mcp (coordinate systems, durations, callbacks)
- [ ] **T093** Input Validate coordinate bounds (0-100% of screen) for abstraction

### Implementation - Tap & Long Press

- [ ] **T094** Input Create mobile input adapter: `backend/agent/adapters/mobile/input.adapter.ts`
- [ ] **T095** [P] Input Implement `tapAtCoordinates(x, y)` wrapping `mobile.tapAtCoordinates()`
- [ ] **T096** [P] Input Implement `longPress(x, y, durationMs)` wrapping `mobile.longPressAtCoordinates()`
- [ ] **T097** [P] Input Implement `doubleTap(x, y)` wrapping `mobile.doubleTapAtCoordinates()`
- [ ] **T098** [P] Input Add bounds validation (0-1.0 range or pixel absolute)

### Implementation - Swipe & Text Input

- [ ] **T099** [P] Input Implement `swipe(direction, distance, durationMs)` wrapping `mobile.swipe()`
- [ ] **T100** [P] Input Implement `typeText(text, submitFlag)` wrapping `mobile.typeText()`
- [ ] **T101** [P] Input Add error handling: device unresponsive, element not found, timeout
- [ ] **T102** Input Update input port to support dual backends (WebDriverIO | mobile-mcp)

### Testing & Validation

- [ ] **T103** [P] Input Create unit tests for mobile input adapter (mock responses)
- [ ] **T104** [P] Input Mock tap at center of screen (500, 1000)
- [ ] **T105** [P] Input Mock swipe directions (up, down, left, right)
- [ ] **T106** Input Create comparison test: tap behavior matches WebDriverIO
- [ ] **T107** Input Run against live emulator: `cd backend && encore test agent/adapters/mobile/input.adapter.test.ts`
- [ ] **T108** Input Benchmark performance: mobile vs Appium action timing

### Integration

- [ ] **T109** Input Update agent action execution to use mobile adapter when flag ON
- [ ] **T110** [P] Input Add fallback: if mobile action fails, retry with WebDriverIO
- [ ] **T111** [P] Input Add operation logging: `mobile_operations_log.operation_type = 'tap|swipe|type'`
- [ ] **T112** Input Create E2E test: full run with mobile input actions only
- [ ] **T113** Input Update `backend/mobile/STATUS.md`: Input migration complete

### Quality & Docs

- [ ] **T114** [P] Input Run linter: `cd backend && bun run lint agent/adapters/mobile/input.adapter.ts`
- [ ] **T115** [P] Input Type check: `tsc --noEmit`
- [ ] **T116** Input Update `backend/agent/README.md`: input adapter dual-backend support
- [ ] **T117** [P] Input Add code comments: coordinate mapping, direction enums, timeout logic
- [ ] **T118** Input Document action timing and retries in README
- [ ] **T119** Input Verify no conflicts between tap/swipe coordinate systems

### Exit Criteria (Phase 2B)

- [ ] Input adapter compiles (`tsc --noEmit`)
- [ ] All unit tests pass (`encore test agent/adapters/mobile/input.adapter.test.ts`)
- [ ] Live emulator test passes (tap, swipe, type actions work)
- [ ] Performance ≤500ms per action
- [ ] Feature flag gates implementation
- [ ] No regressions in existing input tests

**Checkpoint**: Input operations migration complete ✅

---

## Phase 2C: App Lifecycle Migration (T120-T149)

**Goal**: Replace Appium app lifecycle with mobile-mcp APIs  
**Duration**: 6 hours  
**Dependencies**: Phase 2A, 2B (can run parallel)  
**Feature Flag**: `ENABLE_MOBILE_MCP`

### Setup & Analysis

- [ ] **T120** [P] Lifecycle Read app lifecycle adapter (`backend/agent/adapters/appium/webdriverio/app-lifecycle.adapter.ts:1-200`)
- [ ] **T121** [P] Lifecycle Read mobile-mcp app APIs: `launchApp()`, `terminateApp()`, `installApp()` (`backend/mobile/encore.service.ts:200-300`)
- [ ] **T122** Lifecycle Document app state transitions (not-installed → installed → launched → terminated)
- [ ] **T123** Lifecycle Validate APK installation path handling (local vs remote storage)

### Implementation

- [ ] **T124** Lifecycle Create mobile app lifecycle adapter: `backend/agent/adapters/mobile/app-lifecycle.adapter.ts`
- [ ] **T125** [P] Lifecycle Implement `installApp(packageName, apkPath)` wrapping `mobile.installApp()`
- [ ] **T126** [P] Lifecycle Implement `launchApp(packageName)` wrapping `mobile.launchApp()`
- [ ] **T127** [P] Lifecycle Implement `terminateApp(packageName)` wrapping `mobile.terminateApp()`
- [ ] **T128** [P] Lifecycle Add app state tracking (installed vs running)
- [ ] **T129** Input Handle installation timeout (>5s) with structured logging
- [ ] **T130** Lifecycle Update app lifecycle port to support dual backends

### Testing & Validation

- [ ] **T131** [P] Lifecycle Create unit tests for app lifecycle adapter
- [ ] **T132** [P] Lifecycle Mock install success/failure scenarios
- [ ] **T133** [P] Lifecycle Mock launch and terminate operations
- [ ] **T134** Lifecycle Create comparison test: app state matches WebDriverIO
- [ ] **T135** Lifecycle Run against live emulator: `cd backend && encore test agent/adapters/mobile/app-lifecycle.adapter.test.ts`
- [ ] **T136** Lifecycle Benchmark performance: install <10s, launch <5s, terminate <2s

### Integration

- [ ] **T137** Lifecycle Update agent provision node to use mobile adapter when flag ON
- [ ] **T138** [P] Lifecycle Add fallback: if mobile fails, retry with WebDriverIO
- [ ] **T139** [P] Lifecycle Add operation logging: `mobile_operations_log.operation_type = 'install|launch|terminate'`
- [ ] **T140** Lifecycle Create E2E test: full run with mobile app lifecycle only
- [ ] **T141** Lifecycle Update `backend/mobile/STATUS.md`: App lifecycle migration complete

### Quality & Docs

- [ ] **T142** [P] Lifecycle Run linter: `cd backend && bun run lint agent/adapters/mobile/app-lifecycle.adapter.ts`
- [ ] **T143** [P] Lifecycle Type check: `tsc --noEmit`
- [ ] **T144** Lifecycle Update `backend/agent/README.md`: app lifecycle adapter dual-backend support
- [ ] **T145** [P] Lifecycle Add code comments: state transitions, timeout handling, error recovery
- [ ] **T146** Lifecycle Document APK storage paths (local, artifact store, AWS S3 future)
- [ ] **T147** Lifecycle Verify no app state conflicts between adapters

### Exit Criteria (Phase 2C)

- [ ] App lifecycle adapter compiles
- [ ] All unit tests pass
- [ ] Live emulator test passes (install/launch/terminate work)
- [ ] Performance within baseline
- [ ] Feature flag gates implementation
- [ ] No regressions

**Checkpoint**: App lifecycle migration complete ✅

---

## Phase 2D: Session Cleanup & Resource Management (T150-T169)

**Goal**: Ensure device released and session closed on run completion  
**Duration**: 4 hours  
**Dependencies**: Phases 2A-2C (must complete all)  
**Critical Path**: Unblocks Phase 3 integration

### Setup & Analysis

- [ ] **T150** [P] Cleanup Audit current run finalization in agent engine (`backend/agent/engine/xstate/machine.ts:1-100`)
- [ ] **T151** [P] Cleanup Review mobile session lifecycle: create → use → close (`backend/mobile/session-repo.ts:200-250`)
- [ ] **T152** Cleanup Document cleanup hooks: on-run-success, on-run-failure, on-timeout
- [ ] **T153** Cleanup Identify resource leaks: open device sessions, unreleased devices

### Implementation

- [ ] **T154** Cleanup Add `runFinalizer` hook to agent engine
- [ ] **T155** [P] Cleanup Implement success path: close mobile session, release device, log completion
- [ ] **T156** [P] Cleanup Implement failure path: close mobile session, mark device available, log error
- [ ] **T157** [P] Cleanup Implement timeout path: force-close session, release device, alert ops
- [ ] **T158** Cleanup Add state snapshot capture before finalization (for debugging)
- [ ] **T159** Cleanup Update `closeMobileDeviceSession()` in `backend/agent/adapters/mobile/session.adapter.ts`

### Testing & Validation

- [ ] **T160** [P] Cleanup Create unit test for cleanup scenarios (success/failure/timeout)
- [ ] **T161** [P] Cleanup Mock device session close (verify marked available)
- [ ] **T162** Cleanup Create test: concurrent runs with cleanup (2 runs, 2 devices, proper release)
- [ ] **T163** Cleanup Run cleanup tests: `cd backend && encore test agent/adapters/mobile/session.adapter.test.ts`
- [ ] **T164** Cleanup Query DB after run: verify device marked available, session closed

### Integration

- [ ] **T165** Cleanup Wire cleanup into agent finalizer (feature flag gate)
- [ ] **T166** [P] Cleanup Add operation logging: `operation_type = 'session_close'`, timestamp, reason
- [ ] **T167** [P] Cleanup Create E2E test: full run with cleanup validation
- [ ] **T168** Cleanup Verify no resource leaks (device stuck unavailable, orphaned sessions)
- [ ] **T169** Cleanup Update `backend/mobile/STATUS.md`: Cleanup complete

### Exit Criteria (Phase 2D)

- [ ] Cleanup hooks implemented and working
- [ ] All unit tests pass
- [ ] Session cleanup on run completion works
- [ ] Device availability restored
- [ ] No resource leaks detected
- [ ] Feature flag gates implementation

**Checkpoint**: Phase 2 Operations Complete ✅ (T060-T169)

---

## Phase 3A: Integration Testing & E2E Validation (T170-T189)

**Goal**: Full agent run using only mobile-mcp (no direct WebDriverIO)  
**Duration**: 4 hours  
**Dependencies**: Phase 2 complete (T060-T169)  
**Test**: `cd backend && encore test agent/tests/metrics.test.ts` (with flag ON)

### E2E Run Flow

- [ ] **T170** [P] Integration Create full E2E test scenario (app install → launch → screenshot → tap → swipe → terminate)
- [ ] **T171** [P] Integration Test device provisioning: mobile-mcp session created
- [ ] **T172** [P] Integration Test app installation: APK pushed to device
- [ ] **T173** [P] Integration Test app launch: package in foreground
- [ ] **T174** [P] Integration Test screenshot: base64 PNG captured
- [ ] **T175** [P] Integration Test tap action: element responds
- [ ] **T176** [P] Integration Test swipe action: UI updates
- [ ] **T177** [P] Integration Test app termination: package killed

### Metrics & Validation

- [ ] **T178** Integration Run E2E with timing: capture agent run duration
- [ ] **T179** Integration Validate no Appium calls (pure mobile-mcp)
- [ ] **T180** Integration Check operation log: all operations recorded
- [ ] **T181** Integration Verify device marked available after run
- [ ] **T182** [P] Integration Performance baseline: screenshots <2s, taps <500ms
- [ ] **T183** [P] Integration No regressions: Spec 001 tests still pass (with flag OFF)

### Rollout Strategy

- [ ] **T184** Integration Document flag strategy: `ENABLE_MOBILE_MCP=true/false` behavior
- [ ] **T185** Integration Create runbook: how to enable/disable mobile-mcp
- [ ] **T186** Integration Create troubleshooting guide: common failures + fixes
- [ ] **T187** Integration Prepare rollback plan: if issues, revert to Appium

### Documentation

- [ ] **T188** Integration Update agent README: operations migration complete
- [ ] **T189** Integration Update `backend/mobile/STATUS.md`: Phase 3A E2E validation complete

### Exit Criteria (Phase 3A)

- [ ] E2E run completes successfully with mobile-mcp
- [ ] All operations executed via mobile service
- [ ] Performance acceptable
- [ ] No regressions
- [ ] Documentation updated
- [ ] Ready for Phase 4 (AWS Device Farm spike)

**Checkpoint**: Phase 3 E2E Validation Complete ✅

---

## Phase 3B: Documentation & Handoff (T190-T210)

**Goal**: Complete documentation for Phase 2 migration and prepare for merge  
**Duration**: 3 hours  
**Dependencies**: Phase 3A complete

### Architecture & Design Docs

- [ ] **T190** [P] Docs Create migration guide: `MIGRATION_GUIDE.md` (WebDriverIO → mobile-mcp)
- [ ] **T191** [P] Docs Document adapter architecture: why dual-backend approach
- [ ] **T192** [P] Docs Create API reference: mobile-mcp endpoints used by agent
- [ ] **T193** [P] Docs Document feature flag behavior: ENABLE_MOBILE_MCP=true/false

### Implementation Notes

- [ ] **T194** Docs Update `backend/mobile/README.md`: operations migration complete
- [ ] **T195** Docs Update `backend/agent/README.md`: dual-backend perception/input/lifecycle
- [ ] **T196** [P] Docs Add code comments to all mobile adapters (perception, input, lifecycle, session)
- [ ] **T197** [P] Docs Document session lifecycle: create → use → close → available
- [ ] **T198** [P] Docs Document cleanup hooks: when/how devices released

### Testing & Quality

- [ ] **T199** [P] Docs Update test documentation: integration tests for mobile adapters
- [ ] **T200** [P] Docs Create performance baseline: screenshot <2s, tap <500ms, install <10s
- [ ] **T201** Docs Document troubleshooting: common failures + debugging steps
- [ ] **T202** [P] Docs Add runbook: how to enable/test mobile-mcp

### Handoff

- [ ] **T203** Docs Update `backend/BACKEND_HANDOFF.md`: mobile service section (Phase 1-2 complete)
- [ ] **T204** Docs Update `specs/002-integrate-mobile-mcp/COMPLETION_SUMMARY.md`: Phase 2 results
- [ ] **T205** [P] Docs Update `backend/mobile/STATUS.md`: all phases complete status
- [ ] **T206** [P] Docs Create `specs/002-integrate-mobile-mcp/PHASE_2_COMPLETION.md`: what was done, metrics, lessons

### Future Work

- [ ] **T207** Docs Document AWS Device Farm next steps (Phase 4 spike)
- [ ] **T208** Docs Document BrowserStack integration (Phase 4 future)
- [ ] **T209** [P] Docs Note technical debt: WebDriverIO code still present (kept for fallback)
- [ ] **T210** Docs Prepare for Phase 3: cleanup and consolidation opportunities

### Exit Criteria (Phase 3B)

- [ ] All documentation updated
- [ ] Migration guide complete
- [ ] Handoff docs ready
- [ ] Branch ready for code review
- [ ] Prepared for merge to main

**Checkpoint**: Phase 3 Documentation Complete ✅

---

## Dependency Graph & Critical Path

```
Phase 2A (Screenshot)      [T060-T089]
       ↓
Phase 2B (Input)            [T090-T119] ← can parallel with 2A
       ↓
Phase 2C (Lifecycle)        [T120-T149] ← can parallel with 2A, 2B
       ↓
Phase 2D (Cleanup)          [T150-T169] ← MUST wait for 2A-2C
       ↓
Phase 3A (E2E Validation)   [T170-T189]
       ↓
Phase 3B (Documentation)    [T190-T210]
```

**Critical Path**: 2A → 2D → 3A → 3B (32 hours minimum)  
**Parallelization**: 2B and 2C can run while 2A completes (saves 8-12 hours if parallel)

---

## Template: Using Sequential Thinking for Task Creation

### When Creating New Task Batches:

1. **Understand Dependencies** (Sequential Thought #1)
   - What must complete first?
   - What can run in parallel?
   - What are the exit criteria?

2. **Decompose Into Granular Tasks** (Sequential Thought #2)
   - Break phase into sub-phases
   - Identify exact file paths
   - Define test commands

3. **Assign IDs & Priorities** (Sequential Thought #3)
   - Sequential numbering (T060+)
   - [P] for parallelizable
   - Priority labels

4. **Define Exit Criteria** (Sequential Thought #4)
   - Tests that must pass
   - No regressions
   - Feature flag verification

5. **Synthesize & Validate** (Sequential Thought #5)
   - Is dependency order correct?
   - Can tasks run in parallel?
   - Are all files covered?

---

## How to Track Phase 2+ in todo_write

Each Phase section creates a batch of todos:

```
Phase 2A Todos (T060-T085): Screenshot Capture
- T060 Read WebDriverIO perception adapter
- T061 Read mobile-mcp screenshot API
- ... etc
```

Use `todo_write` with:
- `merge: true` to add to existing todos
- Group by phase in description
- Link back to task.md line numbers
- Mark status: pending → in_progress → completed

---

**Status**: ✅ Phase 2+ Tasks Ready  
**Next**: Use todo_write to create todos for Phase 2A (T060-T089)  
**Then**: Assign to backend_vibe with @backend-development_skill

