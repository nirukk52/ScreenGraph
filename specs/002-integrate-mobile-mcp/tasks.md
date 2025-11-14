# Tasks: Integrate Mobile-MCP for Device Abstraction

**Input**: Design documents from `/specs/002-integrate-mobile-mcp/`  
**Prerequisites**: plan.md ✅, spec.md ✅, bugs.md ✅, decision.md ✅, test-plan.md ✅

**Tests**: TDD approach - fix bugs, make tests pass (RED → GREEN → REFACTOR)

**Organization**: Tasks grouped by bug priority (CRITICAL → HIGH → MEDIUM) to unblock operations quickly.

## Format: `[ID] [P?] [Bug#] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Bug#]**: Which bug this task fixes (Bug1-Bug6)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `backend/mobile/`, `backend/db/migrations/`
- All changes in mobile Encore service
- No agent changes until Phase 3

---

## Phase 1: Setup (Environment Verification)

**Purpose**: Verify mobile service environment and test infrastructure

- [x] T001 Verify mobile-mcp dependencies installed (`@mobilenext/mobile-mcp@0.0.34`, `@modelcontextprotocol/sdk@1.22.0`)
- [x] T002 Verify mobile service compiles (`encore test mobile/` shows service loads)
- [x] T003 Verify database migration applied (012_mobile_sessions.up.sql in migrations/)
- [x] T004 Run integration tests baseline (`encore test mobile/mobile.integration.test.ts` - expect 2 failures)

**Checkpoint**: Environment ready, baseline established (6 passing, 2 failing)

---

## Phase 2: CRITICAL Bug Fixes (Blocks All Operations)

**Purpose**: Fix bugs that completely block mobile-mcp usage

**⚠️ CRITICAL**: Must fix these FIRST before any other work

### Bug #1: MCP Initialization Response Missing Fields

**Impact**: BLOCKS ALL device operations - mobile-mcp APIs unusable

- [ ] T005 [Bug1] Read mobile-mcp server source to understand initialization response structure
- [ ] T006 [Bug1] Add graceful handling for missing `serverInfo.version` in `backend/mobile/mcp-client.ts:109`
- [ ] T007 [Bug1] Add optional chaining: `initResponse.serverInfo?.version ?? "unknown"`
- [ ] T008 [Bug1] Verify MCP client initialization test passes (`encore test mobile/mobile.integration.test.ts -t "Mobile MCP Client"`)

**Checkpoint**: 4 skipped MCP client tests now passing

---

## Phase 3: HIGH Priority Bug Fixes (Data Integrity)

**Purpose**: Fix bugs causing data corruption and security issues

### Bug #2: Metadata JSON Serialization

**Impact**: Data loss/corruption - cannot query sessions by metadata  

- [ ] T009 [P] [Bug2] Update migration `backend/db/migrations/012_mobile_sessions.up.sql` - change `metadata TEXT` to `metadata JSONB`
- [ ] T010 [P] [Bug2] Update `createSession()` in `backend/mobile/session-repo.ts` - cast to `::jsonb` when inserting
- [ ] T011 [Bug2] Update `getSession()` in `backend/mobile/session-repo.ts` - parse `metadata::text` back to object
- [ ] T012 [Bug2] Run database reset: `cd backend && encore db reset`
- [ ] T013 [Bug2] Verify metadata test passes (`encore test mobile/mobile.integration.test.ts -t "should create device session"`)

**Checkpoint**: Metadata stored and retrieved as JSON object

---

### Bug #3: SQL Parameter Binding Failure

**Impact**: Device allocation queries fail, SQL injection risk

- [ ] T014 [Bug3] Rewrite `findAvailableDevice()` in `backend/mobile/session-repo.ts` using Encore tagged template interpolation
- [ ] T015 [Bug3] Replace `whereClause` string building with conditional `db.query` fragments
- [ ] T016 [Bug3] Remove unused `params` array
- [ ] T017 [Bug3] Add unit test for device allocation with filters (`platform`, `deviceType`, `provider`)
- [ ] T018 [Bug3] Verify device allocation test passes

**Checkpoint**: SQL queries safe, parameters properly bound

---

### Bug #4: Device Availability Never Updated

**Impact**: Multiple concurrent sessions can grab same physical device (race condition)

- [ ] T019 [P] [Bug4] Add `markDeviceUnavailable(deviceId)` method to `backend/mobile/session-repo.ts`
- [ ] T020 [P] [Bug4] Add `markDeviceAvailable(deviceId)` method to `backend/mobile/session-repo.ts`
- [ ] T021 [Bug4] Update `createSession()` - call `markDeviceUnavailable()` AFTER finding device, BEFORE inserting session
- [ ] T022 [Bug4] Add try-catch in `createSession()` - rollback availability on session creation failure
- [ ] T023 [Bug4] Update `closeSession()` - call `markDeviceAvailable()` after marking session closed
- [ ] T024 [Bug4] Add unit test for concurrent session allocation (2 runs, 2 devices, no conflicts)
- [ ] T025 [Bug4] Verify concurrent session test passes

**Checkpoint**: Device allocation is atomic, no double-allocation possible

---

## Phase 4: MEDIUM Priority Bug Fixes (Stability)

**Purpose**: Fix bugs causing memory leaks and partial failures

### Bug #5: MCP Process Cleanup Leaks

**Impact**: Memory leaks and state corruption on MCP crashes  

- [ ] T026 [Bug5] Update process exit handler in `backend/mobile/mcp-client.ts` to call `this.cleanup()`
- [ ] T027 [Bug5] Verify `cleanup()` method clears `responseHandlers` map and resets buffer
- [ ] T028 [Bug5] Add structured logging to exit handler: `logger.warn("mobile-mcp process exited", { exitCode })`
- [ ] T029 [Bug5] Add unit test for MCP process crash scenario
- [ ] T030 [Bug5] Verify memory leak test passes

**Checkpoint**: MCP crashes handled cleanly, no memory leaks

---

### Bug #6: Incomplete Data Causes Total Failure

**Impact**: Valid devices reported as errors when screen metadata temporarily unavailable  

- [ ] T031 [Bug6] Update `getDeviceInfo()` in `backend/mobile/encore.service.ts` to wrap `getScreenSize()` in try-catch
- [ ] T032 [Bug6] Update `getDeviceInfo()` to wrap `getOrientation()` in try-catch
- [ ] T033 [Bug6] Add structured logging for partial data: `logger.warn("screen size unavailable", { deviceId, err })`
- [ ] T034 [Bug6] Return default fallbacks: `screenSize: { width: 0, height: 0 }`, `orientation: "portrait"`
- [ ] T035 [Bug6] Add unit test for partial device info scenario
- [ ] T036 [Bug6] Verify partial device info test passes

**Checkpoint**: Device info returns even if screen metadata missing

---

## Phase 5: Integration Testing (Validation)

**Purpose**: Verify all bugs fixed and system stable

- [ ] T037 Run full integration test suite: `cd backend && encore test mobile/mobile.integration.test.ts`
- [ ] T038 Verify 100% test pass rate (0 failures, 0 skipped)
- [ ] T039 Run full backend test suite: `cd backend && encore test`
- [ ] T040 Verify no regressions in other services (agent, run, graph)
- [ ] T041 Verify Spec 001 tests still pass: `cd backend && encore test agent/tests/`

**Checkpoint**: All tests passing, no regressions

---

## Phase 6: Code Quality & Documentation

**Purpose**: Polish code and update documentation

- [ ] T042 [P] Run linter: `cd backend && bun run lint`
- [ ] T043 [P] Run type check: `cd backend && tsc --noEmit`
- [ ] T044 [P] Update `backend/mobile/STATUS.md` with bug fix status
- [ ] T045 [P] Update `backend/mobile/README.md` with fixed functionality
- [ ] T046 Update `specs/002-integrate-mobile-mcp/bugs.md` - mark all bugs as FIXED ✅
- [ ] T047 Add code comments explaining bug fixes for future maintainers

**Checkpoint**: Code clean, documentation up-to-date

---

## Phase 7: Smoke Testing & Deployment Prep

**Purpose**: Validate mobile service in real environment

- [ ] T048 Start backend: `cd backend && encore run`
- [ ] T049 Verify mobile service appears in Encore dashboard (http://localhost:9400)
- [ ] T050 Test mobile service health endpoint manually
- [ ] T051 Test device list endpoint manually (requires device connected)
- [ ] T052 Test session creation manually
- [ ] T053 Stop backend and verify clean shutdown

**Checkpoint**: Mobile service works in real environment

---

## Phase 8: Git & Handoff

**Purpose**: Prepare for code review and merge

- [ ] T054 Stage all changes: `git add backend/mobile/ backend/db/migrations/012_mobile_sessions.up.sql specs/002-integrate-mobile-mcp/`
- [ ] T055 Commit with descriptive message: `fix: resolve 6 critical bugs in mobile-mcp integration`
- [ ] T056 Push branch: `git push origin cursor/integrate-mobile-mcp-as-microservice-46cf`
- [ ] T057 Update `specs/002-integrate-mobile-mcp/bugs.md` with final test results
- [ ] T058 Document in Graphiti: `add_memory()` with bug fix solutions and gotchas
- [ ] T059 Run after-task workflow: `.cursor/commands/after-task.md`

**Checkpoint**: Ready for founder review and merge

---

## Task Summary

**Total Tasks**: 59  
**Estimated Time**: 8-12 hours (matches plan.md Phase 2 estimate)  
**Critical Path**: T005-T008 (Bug #1) must complete first  
**Parallel Work**: Bugs #2-#6 can be fixed in parallel after Bug #1

---

## Dependencies

```
T001-T004 (Setup)
    ↓
T005-T008 (Bug #1 - CRITICAL, blocks everything)
    ↓
T009-T036 (Bugs #2-#6 - can run in parallel)
    ↓
T037-T041 (Integration Testing)
    ↓
T042-T047 (Code Quality)
    ↓
T048-T053 (Smoke Testing)
    ↓
T054-T059 (Git & Handoff)
```

---

## Exit Criteria

**MUST achieve before marking complete:**

- [ ] All 6 bugs fixed and tested
- [ ] `encore test mobile/` shows 100% pass rate (0 failures)
- [ ] No regressions in existing Spec 001 tests
- [ ] Code review approval from founder
- [ ] Documentation updated (bugs.md, STATUS.md, README.md)
- [ ] Graphiti memory created with solutions
- [ ] Branch pushed and ready for merge

---

**Status**: ✅ Phase 1 Complete (T001-T059) - All bugs fixed, tests passing, feature flag working  
**Phase 2+**: See `PHASE_2_OPERATIONS_TASKS.md` for Phase 2A-3B (T060-T210)  
**Next Phase**: Phase 2A - Screenshot Capture Migration (T060-T089)  
**Planning**: All task batches created using Sequential Thinking (dependency analysis, parallelization)  
**Blockers**: None - ready to start Phase 2A immediately
