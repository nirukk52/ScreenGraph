# Tasks: Auto-Managed Appium Lifecycle

**Input**: Design documents from `/specs/001-automate-appium-lifecycle/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: TDD approach - tests written FIRST, must FAIL before implementation (RED-GREEN-REFACTOR)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `backend/agent/`, `backend/run/`, `automation/`, `frontend/tests/`
- All backend changes in existing Encore.ts agent service
- No new microservices created

---

## Phase 1: Setup (Environment Configuration)

**Purpose**: Verify environment and prerequisites

- [ ] T001 Verify Appium binaries installed (`which appium`)
- [ ] T002 Verify `APPIUM_PORT` configured in `backend/config/env.ts` (already exists at 4723)
- [ ] T003 [P] Create test device configuration in `.env` for integration testsv

**Checkpoint**: Environment ready for development

---

## Phase 2: Foundational (Core Lifecycle Infrastructure)

**Purpose**: Core Appium lifecycle utilities that BOTH user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 [P] Implement `checkAppiumHealth()` in `backend/agent/nodes/setup/EnsureDevice/appium-lifecycle.ts`
- [ ] T005 [P] Implement `startAppium()` with PID tracking in `backend/agent/nodes/setup/EnsureDevice/appium-lifecycle.ts`
- [ ] T006 [P] Implement `checkDevicePrerequisites()` in `backend/agent/nodes/setup/EnsureDevice/device-check.ts`
- [ ] T007 [P] Add new event kinds to `backend/agent/domain/events.ts` (device_check, health_check, starting, ready, failed)
- [ ] T008 [P] Create event emission helpers in `backend/agent/nodes/setup/EnsureDevice/lifecycle-events.ts`
- [ ] T009 Create Appium stop script in `automation/scripts/appium-stop.sh`
- [ ] T010 Add `qa:appium:stop` task to `.cursor/commands/qa/Taskfile.yml`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User starts run without manual Appium (Priority: P1) 🎯 MVP

**Goal**: User clicks "Detect Drift" and run starts automatically with Appium lifecycle managed by agent

**Independent Test**: User clicks "Detect Drift" with device connected, run starts successfully, agent captures screenshots without manual Appium setup

### Tests for User Story 1 (TDD - Write FIRST, ensure FAIL)

> **RED ❌**: Write these tests FIRST, verify they FAIL before implementation

- [ ] T011 [P] [US1] Unit test for `checkDevicePrerequisites()` in `backend/agent/nodes/setup/EnsureDevice/device-check.test.ts`
- [ ] T012 [P] [US1] Unit test for `checkAppiumHealth()` in `backend/agent/nodes/setup/EnsureDevice/appium-lifecycle.test.ts`
- [ ] T013 [P] [US1] Unit test for `startAppium()` in `backend/agent/nodes/setup/EnsureDevice/appium-lifecycle.test.ts`
- [ ] T014 [US1] Integration test for `ensureDevice()` with lifecycle in `backend/agent/nodes/setup/EnsureDevice/node.test.ts`

### Implementation for User Story 1

> **GREEN ✅**: Implement minimal code to pass tests

- [ ] T015 [US1] Modify `ensureDevice()` in `backend/agent/nodes/setup/EnsureDevice/node.ts` to add pre-flight lifecycle check
- [ ] T016 [US1] Wire device check → health check → start flow in `backend/agent/nodes/setup/EnsureDevice/handler.ts`
- [ ] T017 [US1] Emit lifecycle events from `ensureDevice()` function
- [ ] T018 [US1] Add error handling for device offline scenario (fail fast within 10s)
- [ ] T019 [US1] Add error handling for Appium start timeout scenario (fail within 60s)
- [ ] T020 [US1] Add structured logging for lifecycle phases (module: "agent", actor: "orchestrator")

> **REFACTOR 🧹**: Improve code while tests stay green

- [ ] T021 [US1] Extract lifecycle orchestration logic into `AppiumLifecycleManager` class
- [ ] T022 [US1] Add timeout constants and configuration
- [ ] T023 [US1] Add type safety for lifecycle state transitions

### E2E Test for User Story 1

- [ ] T024 [US1] E2E test in `frontend/tests/e2e/run-page.spec.ts` - verify run starts without manual Appium, lifecycle events appear in UI timeline

**Checkpoint**: User Story 1 complete - users can start runs without manual Appium setup

---

## Phase 4: User Story 2 - Developer iterates without Appium management (Priority: P2)

**Goal**: Developer starts multiple test runs back-to-back during development without manually managing Appium between runs

**Independent Test**: Developer starts multiple runs in quick succession, each run handles Appium lifecycle automatically (reuses healthy instance)

### Tests for User Story 2 (TDD - Write FIRST, ensure FAIL)

> **RED ❌**: Write these tests FIRST, verify they FAIL before implementation

- [ ] T025 [P] [US2] Unit test for Appium health check retry logic in `backend/agent/nodes/setup/EnsureDevice/appium-lifecycle.test.ts`
- [ ] T026 [P] [US2] Unit test for unhealthy Appium restart logic in `backend/agent/nodes/setup/EnsureDevice/appium-lifecycle.test.ts`
- [ ] T027 [US2] Integration test for consecutive runs reusing healthy Appium in `tests/integration/ensure-device-lifecycle.test.ts`

### Implementation for User Story 2

> **GREEN ✅**: Implement minimal code to pass tests

- [ ] T028 [US2] Add health check retry logic (max 3 attempts with 500ms delay) in `backend/agent/nodes/setup/EnsureDevice/appium-lifecycle.ts`
- [ ] T029 [US2] Add unhealthy detection and restart logic in `backend/agent/nodes/setup/EnsureDevice/appium-lifecycle.ts`
- [ ] T030 [US2] Add Appium process kill logic for stale instances in `backend/agent/nodes/setup/EnsureDevice/appium-lifecycle.ts`
- [ ] T031 [US2] Modify lifecycle to reuse healthy Appium instead of always restarting
- [ ] T032 [US2] Add lifecycle events for health check pass (reuse scenario)
- [ ] T033 [US2] Add logging for reuse vs restart decisions

> **REFACTOR 🧹**: Improve code while tests stay green

- [ ] T034 [US2] Extract health check polling into reusable helper function
- [ ] T035 [US2] Add performance metrics tracking (phase durations)
- [ ] T036 [US2] Optimize health check timeout for fast iteration (< 5s for second run)

### E2E Test for User Story 2

- [ ] T037 [US2] E2E test in `frontend/tests/e2e/run-page.spec.ts` - verify back-to-back runs reuse healthy Appium, second run starts within 5s

**Checkpoint**: User Stories 1 AND 2 both work - users can start runs, developers can iterate quickly

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and final integration

- [ ] T038 [P] Update `README.md` - remove manual Appium start instructions, add automatic lifecycle explanation
- [ ] T039 [P] Update `vibes/backend_vibe.json` - reflect automatic Appium lifecycle behavior
- [ ] T040 [P] Update `CLAUDE.md` - document new Appium lifecycle management
- [ ] T041 [P] Update `backend/agent/CLAUDE.md` - document EnsureDevice node changes
- [ ] T042 Run `task founder:rules:check` - validate founder rules compliance (no console.log, no `any`, American spelling)
- [ ] T043 Run `task qa:smoke:all` - verify smoke tests pass
- [ ] T044 Run `task backend:test` - verify all backend tests pass
- [ ] T045 Run `task qa:e2e` - verify E2E tests pass
- [ ] T046 Verify lifecycle events visible in frontend UI timeline
- [ ] T047 Manual test: Start run with Appium stopped, verify automatic start
- [ ] T048 Manual test: Start run with Appium running, verify reuse
- [ ] T049 Manual test: Start run with device offline, verify fast fail with clear error
- [ ] T050 Update Graphiti with lifecycle architecture decisions

**Checkpoint**: Feature complete, documented, and validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - MVP delivery
- **User Story 2 (Phase 4)**: Depends on Foundational - Can run in parallel with US1 if staffed
- **Polish (Phase 5)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - No dependencies on US2
- **User Story 2 (P2)**: Independent - Extends US1 but doesn't break it

### Within Each User Story (TDD)

1. **RED ❌**: Write tests FIRST, verify they FAIL
2. **GREEN ✅**: Implement minimal code to pass tests
3. **REFACTOR 🧹**: Improve code while tests stay green
4. **E2E**: Verify user-facing behavior

### Parallel Opportunities

- **Foundational Phase**: All tasks marked [P] (T004-T008, T009-T010) can run in parallel
- **US1 Tests**: All tests (T011-T014) can be written in parallel (different test files)
- **US2 Tests**: All tests (T025-T027) can be written in parallel
- **Polish Phase**: Documentation tasks (T038-T041) can run in parallel
- **User Stories**: US1 and US2 can be worked on in parallel by different developers (after Foundational phase)

---

## Parallel Example: User Story 1 - Tests Phase

```bash
# Launch all unit tests for User Story 1 together (RED phase):
Task: "Unit test for checkDevicePrerequisites() in device-check.test.ts"
Task: "Unit test for checkAppiumHealth() in appium-lifecycle.test.ts"
Task: "Unit test for startAppium() in appium-lifecycle.test.ts"

# All tests should FAIL initially (RED ❌)
```

## Parallel Example: User Story 1 - Implementation Phase

```bash
# After tests written, implement in sequence:
Task: "Modify ensureDevice() to add pre-flight lifecycle check" (depends on tests)
Task: "Wire device check → health check → start flow" (depends on T015)
Task: "Emit lifecycle events" (depends on T016)

# Then refactor in parallel:
Task: "Extract lifecycle orchestration into class"
Task: "Add timeout constants"
Task: "Add type safety"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (~30 min)
2. Complete Phase 2: Foundational (~2-3 hours)
3. Complete Phase 3: User Story 1 (~4-6 hours with TDD)
4. **STOP and VALIDATE**: Test US1 independently
5. Demo: User clicks "Detect Drift", run starts without manual Appium

**Estimated MVP Time**: 1 day with TDD

### Incremental Delivery

1. Setup + Foundational (Day 1 morning) → Foundation ready
2. User Story 1 (Day 1 afternoon) → Test independently → **MVP DEMO** 🎉
3. User Story 2 (Day 2) → Test independently → Enhanced iteration experience
4. Polish (Day 2 afternoon) → Documentation and final validation

**Total Estimated Time**: 2 days with TDD

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together (Day 1 morning)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Day 1 afternoon)
   - **Developer B**: User Story 2 (Day 1 afternoon - can start in parallel)
3. Day 2: Polish together

**Parallel Time**: 1.5 days

---

## Success Metrics (from spec.md)

After implementation, verify:

- **SC-001**: 100% of runs ensure Appium running/healthy before device ops (< 60s start, reuse if healthy)
- **SC-002**: When device offline, 100% of runs fail fast within 10s with clear UI error
- **SC-003**: Second run starts within 5s (reusing healthy Appium)
- **SC-004**: Zero manual "start Appium" instructions in docs

---

## Notes

- **TDD mandatory**: Follow RED-GREEN-REFACTOR for all implementation
- **[P] tasks**: Different files, no dependencies - can parallelize
- **[Story] label**: Maps task to specific user story for traceability
- **Each user story independently testable**: Can demo US1 without US2
- **Commit after each checkpoint**: Enables easy rollback
- **Load `backend_vibe` before starting**: Provides Encore.ts patterns and agent architecture guidance
- **No new microservice**: All changes within existing agent service
- **No port/adapter pattern**: Simple utility functions, not abstracted interfaces

---

## Task Count Summary

- **Total Tasks**: 50
- **Setup (Phase 1)**: 3 tasks
- **Foundational (Phase 2)**: 7 tasks (BLOCKS all user stories)
- **User Story 1 (Phase 3)**: 14 tasks (MVP)
- **User Story 2 (Phase 4)**: 13 tasks
- **Polish (Phase 5)**: 13 tasks
- **Parallelizable Tasks**: 20 tasks marked [P]
- **Independent Stories**: 2 (US1 and US2 don't depend on each other)

