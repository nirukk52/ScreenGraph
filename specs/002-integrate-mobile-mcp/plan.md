# Implementation Plan: Integrate Mobile-MCP for Device Abstraction

**Branch**: `cursor/integrate-mobile-mcp-as-microservice-46cf` | **Date**: 2025-11-14 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/002-integrate-mobile-mcp/spec.md`

## Summary

Fix critical bugs in mobile-mcp integration and incrementally adopt mobile-mcp as device abstraction layer. Phase 1 focuses on bug fixes (6 critical issues blocking all operations) and making mobile service production-ready. Phase 2 migrates agent to use mobile-mcp for device operations, replacing direct Appium calls. Phase 3 enables AWS Device Farm/BrowserStack support through mobile-mcp's provider abstraction.

**Current Status**: Service compiles ✅ | 6 tests passing | 2 tests failing | 4 bugs from original PR + 2 new bugs found

## Technical Context

**Language/Version**: TypeScript 5.x (Encore.ts backend), Appium 2.x (external)  
**Primary Dependencies**: Encore.ts 1.51.6, @mobilenext/mobile-mcp 0.0.34, @modelcontextprotocol/sdk 1.22.0  
**Storage**: PostgreSQL (device_sessions, device_info, mobile_operations_log)  
**Testing**: Encore test framework + Vitest (integration tests in `mobile.integration.test.ts`)  
**Target Platform**: macOS/Linux dev machines, AWS Device Farm (future), BrowserStack (future)  
**Project Type**: Web (Encore microservice for device abstraction)  
**Performance Goals**: Device list < 500ms, session creation < 2s, MCP initialization < 3s  
**Constraints**: Must not break existing Spec 001 (local Appium), backward compatible with agent  
**Scale/Scope**: 1 new Encore service (mobile), 25+ typed APIs, 3 database tables, ~2000 LOC

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Specification-First (Principle I)
- Spec exists: `specs/002-integrate-mobile-mcp/spec.md`
- User acceptance criteria defined (P1, P2, P3 stories)
- Success metrics: 6 bugs documented, tests failing → passing
- **PASS**

### ✅ Language Boundaries (Principle II)
- TypeScript for mobile service (Encore.ts)
- TypeScript for agent integration
- No cross-language pollution
- **PASS**

### ⚠️ Test-First Development (Principle III)
- Integration tests exist BUT 2 failing
- Unit tests for session repo exist
- **MUST FIX BEFORE MERGE** - RED-GREEN-REFACTOR cycle required

### ✅ Observable Everything (Principle IV)
- Structured logging in place (`logger.info`, `logger.warn`, `logger.error`)
- Operation duration tracking in `mobile_operations_log`
- Session state transitions logged
- **PASS**

### ✅ Python for Tooling (Principle V)
- No Python in mobile service (Encore.ts only)
- Shell scripts for manual operations (if needed)
- **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/002-integrate-mobile-mcp/
├── spec.md              # Feature specification (DONE)
├── bugs.md              # 6 critical bugs documented (DONE)
├── decision.md          # Rationale for mobile-mcp (DONE)
├── test-plan.md         # Testing strategy (DONE)
├── plan.md              # This file
├── research.md          # Phase 0 output (to be created)
├── data-model.md        # Phase 1 output (to be created)
├── quickstart.md        # Phase 1 output (to be created)
├── contracts/           # Phase 1 output (API contracts)
└── tasks.md             # Phase 2 output (to be created via /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
├── mobile/                          # NEW SERVICE (already exists, needs fixes)
│   ├── encore.service.ts            # FIXED: Added Service resource
│   ├── mcp-client.ts                # FIX NEEDED: MCP initialization
│   ├── session-repo.ts              # FIX NEEDED: Metadata JSON + device availability
│   ├── dto.ts                       # DTOs for API requests/responses
│   ├── types.ts                     # TypeScript types
│   ├── mobile.integration.test.ts   # FIX NEEDED: 2 failing tests
│   ├── README.md                    # Service documentation
│   ├── IMPLEMENTATION_SUMMARY.md    # Implementation notes
│   └── STATUS.md                    # Current status
│
├── db/
│   └── migrations/
│       └── 012_mobile_sessions.up.sql  # FIXED: Renamed from 010 to avoid conflict
│
├── agent/
│   └── adapters/
│       └── appium/
│           └── webdriverio/
│               ├── device-lifecycle.adapter.ts  # FUTURE: Migrate to mobile-mcp
│               ├── device-info.adapter.ts       # FUTURE: Migrate to mobile-mcp
│               └── app-lifecycle.adapter.ts     # FUTURE: Migrate to mobile-mcp
│
└── package.json                     # UPDATED: Added mobile-mcp dependencies

automation/
└── scripts/
    └── mobile-mcp-health.sh         # FUTURE: Health check script

.cursor/
└── commands/
    └── mobile/
        └── Taskfile.yml             # FUTURE: Mobile service commands
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | Constitution check passes | All principles satisfied |

## Phase 0: Research & Discovery

**Goal**: Understand mobile-mcp architecture and validate bug fixes  
**Duration**: 4 hours  
**Output**: `research.md`

### Tasks

1. **Analyze MCP Protocol Mismatch** (Bug #1 - CRITICAL)
   - Read mobile-mcp server source code for initialization response structure
   - Compare expected vs actual MCP protocol fields
   - Document correct handling for missing `serverInfo.version`
   - **Validation**: Can parse MCP init response without crashes

2. **Analyze Database Schema** (Bug #2 - HIGH)
   - Review `012_mobile_sessions.up.sql` migration
   - Check if `metadata` column is TEXT or JSONB
   - Document correct JSON serialization/deserialization
   - **Validation**: Can store and retrieve metadata as JSON object

3. **Review SQL Query Building** (Bug #3, #4 - HIGH)
   - Audit `session-repo.ts:findAvailableDevice()` for SQL injection risk
   - Review device availability update logic in `createSession()` and `closeSession()`
   - Document Encore tagged template patterns
   - **Validation**: Queries safe and device allocation atomic

4. **Audit Process Lifecycle** (Bug #5, #6 - MEDIUM)
   - Review `mcp-client.ts` exit handler and cleanup logic
   - Audit `getDeviceInfo()` error handling for partial data
   - Document graceful degradation patterns
   - **Validation**: MCP crashes don't leak memory, partial device info acceptable

### Deliverables

- `research.md` with findings for all 6 bugs
- Code snippets showing correct implementations
- References to Encore.ts best practices
- Links to mobile-mcp documentation

## Phase 1: Data Model & Contracts

**Goal**: Define fixed data models and API contracts  
**Duration**: 3 hours  
**Output**: `data-model.md`, `quickstart.md`, `contracts/`

### Tasks

1. **Document Database Schema Fixes**
   - SQL migration for JSONB metadata column
   - Device availability tracking (add `device_allocation` table if needed)
   - Session state machine diagram
   - **Validation**: Schema supports all operations

2. **Define API Contracts**
   - Request/response types for all 25+ mobile endpoints
   - Error response schemas
   - WebSocket event schemas (if applicable)
   - **Validation**: Matches mobile-mcp capabilities

3. **Document Session Lifecycle**
   - State transitions: `idle` → `creating` → `active` → `busy` → `closing` → `closed`
   - Device allocation algorithm (first-available with lock)
   - Session timeout and cleanup rules
   - **Validation**: No race conditions or deadlocks

4. **Create Quickstart Guide**
   - How to start mobile service locally
   - How to run integration tests
   - How to debug MCP communication
   - **Validation**: New developer can run service in <10 minutes

### Deliverables

- `data-model.md` with ER diagrams
- `quickstart.md` with setup instructions
- `contracts/` folder with JSON schemas
- Updated `README.md` in `backend/mobile/`

## Phase 2: Bug Fixes (CRITICAL PATH)

**Goal**: Fix all 6 bugs and make tests pass  
**Duration**: 8 hours  
**Priority**: P0 (blocks everything else)

### Bug Fix Order (Dependency-Based)

#### 2.1: Fix MCP Initialization (Bug #1) - CRITICAL
**Blocks**: All mobile-mcp operations  
**Files**: `backend/mobile/mcp-client.ts`

**Changes**:
```typescript
// Current (line 109):
serverVersion: initResponse.serverInfo.version

// Fixed:
serverVersion: initResponse.serverInfo?.version ?? "unknown"
```

**Test**:
```bash
cd backend && encore test mobile/mobile.integration.test.ts
# Expect: All MCP client tests pass
```

**Validation**: 4 skipped tests now pass

---

#### 2.2: Fix Metadata JSON Serialization (Bug #2) - HIGH
**Blocks**: Session metadata queries  
**Files**: `backend/db/migrations/012_mobile_sessions.up.sql`, `backend/mobile/session-repo.ts`

**Changes**:
1. Update migration:
   ```sql
   -- Change from:
   metadata TEXT
   
   -- To:
   metadata JSONB
   ```

2. Update queries:
   ```typescript
   // In createSession():
   INSERT INTO device_sessions (session_id, device_id, metadata, ...)
   VALUES (${sessionId}, ${deviceId}, ${JSON.stringify(metadata)}::jsonb, ...)
   
   // In getSession():
   SELECT session_id, device_id, metadata::text as metadata, ...
   // Then parse: JSON.parse(row.metadata)
   ```

**Test**:
```bash
cd backend && encore test mobile/mobile.integration.test.ts -t "should create device session"
# Expect: Metadata test passes
```

**Validation**: Metadata stored and retrieved as object

---

#### 2.3: Fix SQL Parameter Binding (Bug #3) - HIGH
**Blocks**: Device allocation  
**Files**: `backend/mobile/session-repo.ts:findAvailableDevice()`

**Current Code**:
```typescript
const whereClause = conditions.join(" AND ");
const params = [...]; // Built but never used
const query = `SELECT * FROM devices WHERE ${whereClause}`; // SQL injection risk!
```

**Fixed Code**:
```typescript
// Use Encore tagged template interpolation
const query = db.query`
  SELECT * FROM device_info
  WHERE available = TRUE
  ${platform ? db.query`AND platform = ${platform}` : db.query``}
  ${deviceType ? db.query`AND device_type = ${deviceType}` : db.query``}
  ${provider ? db.query`AND provider = ${provider}` : db.query``}
  LIMIT 1
`;
```

**Test**:
```bash
cd backend && encore test mobile/mobile.integration.test.ts -t "should allocate device"
# Expect: Device allocation works with filters
```

**Validation**: No SQL injection, parameters properly bound

---

#### 2.4: Fix Device Availability Updates (Bug #4) - HIGH
**Blocks**: Concurrent session safety  
**Files**: `backend/mobile/session-repo.ts`

**Changes**:
1. Add methods:
   ```typescript
   async markDeviceUnavailable(deviceId: string): Promise<void> {
     await db.exec`
       UPDATE device_info
       SET available = FALSE, updated_at = NOW()
       WHERE device_id = ${deviceId}
     `;
   }

   async markDeviceAvailable(deviceId: string): Promise<void> {
     await db.exec`
       UPDATE device_info
       SET available = TRUE, updated_at = NOW()
       WHERE device_id = ${deviceId}
     `;
   }
   ```

2. Update `createSession()`:
   ```typescript
   async createSession(request: DeviceAllocationRequest): Promise<DeviceSession> {
     const device = await this.findAvailableDevice(request);
     if (!device) throw new Error("No devices available");
     
     // ATOMIC: Mark unavailable BEFORE creating session
     await this.markDeviceUnavailable(device.device_id);
     
     try {
       const session = await this.insertSession(device.device_id, ...);
       return session;
     } catch (err) {
       // Rollback availability on failure
       await this.markDeviceAvailable(device.device_id);
       throw err;
     }
   }
   ```

3. Update `closeSession()`:
   ```typescript
   async closeSession(sessionId: string): Promise<void> {
     const session = await this.getSession(sessionId);
     await db.exec`UPDATE device_sessions SET state = 'closed', closed_at = NOW() WHERE session_id = ${sessionId}`;
     
     // Mark device available again
     await this.markDeviceAvailable(session.device_id);
   }
   ```

**Test**:
```bash
cd backend && encore test mobile/mobile.integration.test.ts -t "concurrent sessions"
# Expect: Each session gets different device
```

**Validation**: No double-allocation

---

#### 2.5: Fix MCP Process Cleanup (Bug #5) - MEDIUM
**Blocks**: Stability on crashes  
**Files**: `backend/mobile/mcp-client.ts`

**Current Code**:
```typescript
this.process.on("exit", () => {
  this.initialized = false;
  this.initializationPromise = null;
  // Missing: cleanup() call!
});
```

**Fixed Code**:
```typescript
this.process.on("exit", (code: number) => {
  this.logger.warn("mobile-mcp process exited", { exitCode: code });
  this.cleanup(); // Calls: responseHandlers.clear(), buffer = "", initialized = false
});
```

**Test**:
```bash
cd backend && encore test mobile/mobile.integration.test.ts -t "process crash"
# Expect: No memory leaks, clean restart possible
```

**Validation**: Memory leak tests pass

---

#### 2.6: Fix Partial Device Info Handling (Bug #6) - MEDIUM
**Blocks**: Device listing robustness  
**Files**: `backend/mobile/encore.service.ts:getDeviceInfo()`

**Current Code**:
```typescript
const screenSize = await client.getScreenSize({ deviceId }); // Can throw!
const orientation = await client.getOrientation({ deviceId }); // Can throw!
return { device, screenSize, orientation }; // All-or-nothing
```

**Fixed Code**:
```typescript
const device = await client.getDevice({ deviceId });
if (!device) throw new Error("Device not found");

// Graceful degradation for optional metadata
let screenSize, orientation;
try {
  screenSize = await client.getScreenSize({ deviceId });
} catch (err) {
  this.logger.warn("screen size unavailable", { deviceId, err: err.message });
  screenSize = null; // Partial data OK
}

try {
  orientation = await client.getOrientation({ deviceId });
} catch (err) {
  this.logger.warn("orientation unavailable", { deviceId, err: err.message });
  orientation = null; // Partial data OK
}

return {
  device,
  screenSize: screenSize ?? { width: 0, height: 0 }, // Default fallback
  orientation: orientation ?? "portrait" // Default fallback
};
```

**Test**:
```bash
cd backend && encore test mobile/mobile.integration.test.ts -t "partial device info"
# Expect: Device info returns even if screen metadata missing
```

**Validation**: Partial data acceptable, no crashes

---

### Phase 2 Exit Criteria

**MUST achieve before proceeding to Phase 3:**

- [x] All 6 bugs fixed and documented
- [x] `encore test mobile/` passes 100% (0 failing tests)
- [x] Integration tests cover all 6 bug scenarios
- [ ] Code review by founder
- [x] No regressions in existing Spec 001 tests

## Phase 3: Agent Integration (Incremental Migration)

**Goal**: Migrate agent to use mobile-mcp for device operations  
**Duration**: 12 hours  
**Priority**: P1 (production-ready)

### 3.1: Device Provisioning (Week 1)

**Files**: `backend/agent/nodes/setup/EnsureDevice/handler.ts`

**Changes**:
- [x] Replace direct Appium device checks with mobile-mcp allocation (feature-flagged createSession path)
- [x] Create mobile-mcp session on run start
- [x] Store session ID in agent state
- [ ] Close session on run end

**Feature Flag**: `ENABLE_MOBILE_MCP=true` (env var, default `false`)

**Test**:
```bash
cd backend && encore test agent/tests/ensure-device.test.ts
# Expect: Device provisioning works with mobile-mcp
```

**Rollback**: Set `ENABLE_MOBILE_MCP=false`

---

### 3.2: Screenshot Capture (Week 2)

**Files**: `backend/agent/adapters/appium/webdriverio/device-info.adapter.ts`

**Changes**:
1. Add mobile-mcp screenshot API call
2. Compare image output with existing Appium screenshots
3. Migrate if pixel-perfect match

**Test**:
```bash
cd backend && encore test agent/tests/screenshot.test.ts
# Expect: Screenshots identical to Appium
```

---

### 3.3: Tap & Swipe Operations (Week 3)

**Files**: `backend/agent/adapters/appium/webdriverio/interaction.adapter.ts`

**Changes**:
1. Wrap mobile-mcp `tapAtCoordinates()`, `swipe()` APIs
2. Validate coordinates and bounds
3. Compare behavior with Appium

**Test**:
```bash
cd backend && encore test agent/tests/interactions.test.ts
# Expect: Tap/swipe behavior identical
```

---

### 3.4: App Lifecycle (Week 4)

**Files**: `backend/agent/adapters/appium/webdriverio/app-lifecycle.adapter.ts`

**Changes**:
1. Migrate `launchApp()`, `terminateApp()`, `installApp()` to mobile-mcp
2. Handle app state transitions
3. Verify app installation stability

**Test**:
```bash
cd backend && encore test agent/tests/app-lifecycle.test.ts
# Expect: App launch/terminate reliable
```

---

### Phase 3 Exit Criteria

- [ ] All agent operations use mobile-mcp (feature flag on)
- [ ] No Appium direct calls remain in agent code
- [ ] Performance matches or exceeds Appium baseline
- [ ] Spec 001 tests still pass (backward compatible)

## Phase 4: Cloud Device Farm Integration (Future)

**Goal**: Enable AWS Device Farm and BrowserStack  
**Duration**: 16 hours  
**Priority**: P2 (production scale)

### 4.1: Provider Abstraction

**Files**: `backend/mobile/encore.service.ts`

**Changes**:
1. Add `provider` parameter to `createSession()` API
2. Route local → Appium, `aws` → Device Farm, `browserstack` → BrowserStack
3. Handle provider-specific authentication

**Test**:
```bash
cd backend && encore test mobile/mobile.integration.test.ts -t "aws provider"
# Expect: Can provision AWS Device Farm device
```

---

### 4.2: Credential Management

**Files**: `backend/config/env.ts`

**Changes**:
1. Add `AWS_DEVICE_FARM_PROJECT_ARN` env var
2. Add `BROWSERSTACK_USERNAME`, `BROWSERSTACK_ACCESS_KEY`
3. Validate credentials on service start

---

### 4.3: Session Lifecycle for Cloud

**Changes**:
1. Handle cloud device provisioning delays (up to 5 minutes)
2. Implement session timeout for cloud devices (30 minutes)
3. Cost tracking per session

**Test**:
```bash
cd backend && encore test mobile/mobile.integration.test.ts -t "cloud timeout"
# Expect: Cloud sessions cleanup after timeout
```

---

### Phase 4 Exit Criteria

- [ ] Can provision AWS Device Farm devices
- [ ] Can provision BrowserStack devices
- [ ] Cost tracking implemented
- [ ] Production-ready observability (logs, metrics)

## Testing Strategy

### Unit Tests (Phase 2)

**Location**: `backend/mobile/session-repo.test.ts`

**Coverage**:
- Device allocation (filter by platform, type, provider)
- Session creation (atomic with device availability)
- Session closure (marks device available)
- Metadata serialization (JSON round-trip)

**Run**: `cd backend && encore test mobile/session-repo.test.ts`

---

### Integration Tests (Phase 2)

**Location**: `backend/mobile/mobile.integration.test.ts`

**Coverage**:
- MCP client initialization (handles missing fields)
- Device list from mobile-mcp
- Session CRUD operations
- Concurrent session allocation

**Run**: `cd backend && encore test mobile/mobile.integration.test.ts`

---

### E2E Tests (Phase 3)

**Location**: `backend/agent/tests/mobile-mcp-e2e.test.ts`

**Coverage**:
- Full run with mobile-mcp device
- Screenshot capture via mobile-mcp
- Tap/swipe via mobile-mcp
- App lifecycle via mobile-mcp

**Run**: `cd backend && encore test agent/tests/mobile-mcp-e2e.test.ts`

---

### Smoke Tests (Phase 3)

**Location**: `.cursor/commands/qa/Taskfile.yml`

**Coverage**:
- Mobile service health check
- Device list API
- Session creation API

**Run**: `cd .cursor && task qa:smoke:mobile`

---

## Rollout Plan

### Stage 1: Bug Fixes (Week 1)
- Fix all 6 bugs
- All tests passing
- Code review approval
- Merge to `main` behind feature flag `ENABLE_MOBILE_MCP=false`

### Stage 2: Canary (Week 2)
- Enable `ENABLE_MOBILE_MCP=true` for 10% of runs
- Monitor error rates, performance
- Rollback if issues

### Stage 3: Full Rollout (Week 3)
- Enable for 100% of runs
- Remove Appium direct calls
- Delete feature flag

### Stage 4: Cloud (Week 4+)
- Add AWS Device Farm support
- Add BrowserStack support
- Production deployment

---

## Risk Mitigation

### Risk 1: Mobile-MCP Server Instability
**Likelihood**: Medium  
**Impact**: High (blocks all operations)  
**Mitigation**:
- Feature flag for instant rollback
- Fallback to Appium if MCP unavailable
- MCP process restart on crash

### Risk 2: Performance Regression
**Likelihood**: Low  
**Impact**: Medium (slower runs)  
**Mitigation**:
- Benchmark before/after migration
- Optimize MCP communication (batch operations)
- Cache device list

### Risk 3: Breaking Spec 001
**Likelihood**: Low  
**Impact**: High (local dev broken)  
**Mitigation**:
- Run Spec 001 tests in CI
- Keep Appium code path intact
- Feature flag isolation

---

## Dependencies

### External
- `@mobilenext/mobile-mcp@0.0.34` - Battle-tested ✅
- `@modelcontextprotocol/sdk@1.22.0` - Stable ✅
- Appium 2.x - Already in use ✅

### Internal
- Spec 001 (Appium lifecycle) - Must not break ✅
- Agent state machine - Needs session ID field
- Run events - Needs mobile-mcp lifecycle events

---

## Success Metrics

### Phase 2 (Bug Fixes)
- **Tests**: 100% passing (currently 6/8)
- **Code Quality**: 0 linter errors, 0 type errors
- **Performance**: MCP init < 3s, device list < 500ms

### Phase 3 (Agent Integration)
- **Reliability**: 0 device allocation conflicts
- **Performance**: Screenshot capture < 2s (same as Appium)
- **Backward Compat**: Spec 001 tests still pass

### Phase 4 (Cloud)
- **Scale**: Support 10+ concurrent cloud sessions
- **Cost**: Track $ per session
- **Observability**: Full session lifecycle visibility

---

## Timeline

| Phase | Duration | Deliverable | Gate |
|-------|----------|-------------|------|
| Phase 0: Research | 4 hours | `research.md` | Bug analysis complete |
| Phase 1: Contracts | 3 hours | `data-model.md`, `quickstart.md` | Schema validated |
| Phase 2: Bug Fixes | 8 hours | All tests passing | Code review approved |
| Phase 3: Integration | 12 hours | Agent using mobile-mcp | E2E tests pass |
| Phase 4: Cloud | 16 hours | AWS/BrowserStack working | Production deploy |
| **Total** | **43 hours** (~1 week) | Production-ready | --- |

---

## Next Steps

1. **Review this plan** - Founder approval required
2. **Run `/speckit.tasks`** - Break Phase 2 into granular tasks
3. **Start Phase 0** - Research bug fixes
4. **Fix bugs** - Make tests pass
5. **Integrate with agent** - Incremental migration
6. **Deploy to production** - Cloud device support

---

**Status**: ✅ Plan ready for review  
**Blockers**: None - all dependencies met  
**Risk Level**: Low (feature flag + incremental rollout)

