# Feature Specification: Integrate Mobile-MCP for Device Abstraction

**Feature Branch**: `cursor/integrate-mobile-mcp-as-microservice-46cf` (DO NOT MERGE)  
**Created**: 2025-11-14  
**Closed**: 2025-11-14  
**Status**: ❌ ABANDONED - Unnecessary abstraction layer  
**Input**: ~~Need cloud device support for production. Mobile-mcp provides abstraction for local devices → AWS Device Farm migration.~~  
**Reality**: mobile-mcp is just a wrapper around existing tools (adb, Appium). Provides zero value. Spec 001 already solves local devices.

**See**: `retro.md` for full analysis of this fuckery.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent uses local device via mobile-mcp (Priority: P1)

Developer starts a run with local Android device/emulator, and agent automatically provisions device through mobile-mcp service instead of direct Appium.

**Why this priority**: Establishes mobile-mcp integration without cloud dependencies. Validates device abstraction layer works before AWS Device Farm.

**Independent Test**: Start run with local emulator connected. Agent provisions device via mobile-mcp, captures screenshots, performs taps through mobile-mcp APIs.

**Acceptance Scenarios**:
1. **Given** Android emulator running locally, **When** user starts run, **Then** agent creates mobile-mcp session and uses device successfully
2. **Given** mobile-mcp session active, **When** agent needs screenshot, **Then** mobile service provides screenshot via mobile-mcp
3. **Given** run completes, **When** session closes, **Then** device marked available for next run

---

### User Story 2 - Multiple runs share device pool via mobile-mcp (Priority: P2)

Developer runs multiple tests back-to-back. Mobile-mcp manages device allocation (first-available strategy), preventing conflicts.

**Why this priority**: Validates session management and device allocation logic before cloud scale.

**Independent Test**: Start two runs simultaneously with 2 local devices. Each run gets separate device, no conflicts.

**Acceptance Scenarios**:
1. **Given** 2 devices available, **When** 2 runs start, **Then** each gets different device
2. **Given** 1 device busy, **When** new run starts, **Then** allocates other available device
3. **Given** session closes, **When** device marked available, **Then** next run can use it

---

### User Story 3 - Agent provisions AWS Device Farm device (Priority: P3)

Production run requests cloud device. Mobile-mcp provisions AWS Device Farm device instead of local, using same agent code.

**Why this priority**: Enables production scale without rewriting agent logic.

**Independent Test**: Configure AWS Device Farm credentials. Start run with `provider: "aws"`. Agent provisions cloud device through mobile-mcp.

**Acceptance Scenarios**:
1. **Given** AWS Device Farm configured, **When** run requests cloud device, **Then** mobile-mcp provisions from AWS pool
2. **Given** cloud device active, **When** agent performs operations, **Then** all operations work identically to local
3. **Given** run completes, **When** session closes, **Then** AWS device released back to pool

---

### Edge Cases

- No devices available → clear error before run starts
- Device disconnects mid-session → graceful failure with retry
- Mobile-mcp process crashes → restart and recover
- SQL binding failures → fix parameter binding in queries
- Device allocation race → proper unavailable marking

---

## Requirements *(mandatory)*

### Functional Requirements

**Phase 1: Local Device Integration (P1)**
- **FR-001**: Mobile service MUST provision local Android devices/emulators through mobile-mcp
- **FR-002**: Agent MUST use mobile service for device operations (screenshot, tap, swipe, elements)
- **FR-003**: Device sessions MUST be tracked in database (session state, allocation, logs)
- **FR-004**: Device availability MUST be updated on allocation/release (fix race condition)
- **FR-005**: Mobile service MUST handle MCP process lifecycle (start, health check, cleanup)

**Phase 2: Cloud Device Support (P3)**
- **FR-006**: Mobile service MUST support AWS Device Farm provisioning via mobile-mcp
- **FR-007**: Agent code MUST work identically for local and cloud devices (transparent abstraction)
- **FR-008**: Device allocation strategy MUST prefer available devices before creating new sessions

### Critical Bug Fixes (P0)

- **BUG-001**: Fix SQL parameter binding in `findAvailableDevice()` query
- **BUG-002**: Mark devices unavailable on allocation, available on session close
- **BUG-003**: Cleanup responseHandlers and buffer in MCP exit handler
- **BUG-004**: Make screenSize/orientation optional in `getDeviceInfo()`

### Key Entities

- **MobileService** (`backend/mobile/`): Encore microservice wrapping mobile-mcp
- **DeviceSession**: Tracks active device sessions (session_id, device_id, state, timestamps)
- **DeviceInfo**: Cached device information for allocation (platform, type, availability)
- **MobileOperationsLog**: Audit trail of all mobile operations

---

## Assumptions

- Mobile-mcp already installed and functional (`@mobilenext/mobile-mcp`)
- Local devices available for P1 testing (Android emulator via Android Studio)
- AWS Device Farm credentials available for P3 (deferred for now)
- Appium still handles device drivers (mobile-mcp wraps Appium/ADB/simctl)
- Agent adapters will be migrated incrementally (start with device provisioning only)

---

## Success Criteria *(mandatory)*

### Phase 1: Local Devices (Measurable Outcomes)

- **SC-001**: 100% of runs provision local devices through mobile-mcp (no direct Appium session creation)
- **SC-002**: Agent captures screenshots via mobile service API in <2s (performance baseline)
- **SC-003**: Device allocation prevents conflicts (0 concurrent sessions on same device)
- **SC-004**: All 4 critical bugs fixed and validated (SQL binding, allocation, cleanup, partial data)

### Phase 2: Cloud Devices (Future)

- **SC-005**: Agent provisions AWS Device Farm device via mobile-mcp without code changes
- **SC-006**: Cloud device operations perform within 20% of local device latency
- **SC-007**: Device pool management supports 10+ concurrent cloud sessions

---

## Implementation Plan

### Phase 0: Fix Critical Bugs (2-4 hours)

1. **SQL Binding** - Rewrite `findAvailableDevice()` with proper parameter binding
2. **Device Availability** - Add `markDeviceUnavailable()` / `markDeviceAvailable()` calls
3. **MCP Cleanup** - Implement full cleanup in process exit handler
4. **Partial Data** - Make screen metadata optional in `getDeviceInfo()`

**Test**: Run mobile service integration tests, verify queries work

---

### Phase 1: Agent Integration - Device Provisioning (4-6 hours)

**Goal**: Use mobile-mcp for device selection, keep WebDriverIO for operations

1. **Create Mobile Adapter** - `backend/agent/adapters/mobile/session.adapter.ts`
   ```typescript
   import { mobile } from '~encore/clients';
   
   async createDeviceSession(): Promise<MobileSession> {
     const session = await mobile.createSession({
       platform: "android",
       deviceType: "emulator"
     });
     return session;
   }
   ```

2. **Update EnsureDevice Node** - Use mobile adapter for device provisioning
   ```typescript
   const mobileSession = await this.mobileAdapter.createDeviceSession();
   // Then create WebDriverIO session with device from mobile-mcp
   ```

3. **Wire into Agent** - Inject mobile adapter into agent router

**Test**: Start run, verify device provisioned through mobile-mcp, operations work via WebDriverIO

---

### Phase 2: Agent Integration - Operations Migration (6-8 hours)

**Goal**: Migrate all device operations to mobile-mcp APIs

1. **Perception Adapter** - Migrate to `mobile.captureScreenshot()`, `mobile.getUIElements()`
2. **Input Adapter** - Migrate to `mobile.tapAtCoordinates()`, `mobile.swipe()`
3. **Session Adapter** - Full mobile-mcp session lifecycle

**Test**: E2E run using only mobile-mcp APIs (no direct WebDriverIO)

---

### Phase 3: AWS Device Farm Integration (8-12 hours, deferred)

1. **AWS MCP Client** - Add aws-mcp dependency
2. **Provider Strategy** - `mobile.createSession({ provider: "aws" })`
3. **Credentials** - AWS Device Farm API keys
4. **Testing** - Provision real AWS device, run full agent test

**Test**: Production run on AWS Device Farm device

---

## Testing Strategy

### Unit Tests
```bash
cd backend && encore test mobile/
```
- Test device session creation
- Test device allocation logic
- Test operation logging
- Mock MCP client responses

### Integration Tests
```bash
# Requires local emulator
cd backend && encore test mobile/*.integration.test.ts
```
- Test mobile-mcp process lifecycle
- Test device listing
- Test session management
- Validate bug fixes

### E2E Tests
```bash
cd backend && encore test agent/tests/metrics.test.ts
```
- Full agent run through mobile-mcp
- Screenshot capture and comparison
- Input actions (tap, swipe)
- Session cleanup

---

## Rollout Plan

1. **Week 1**: Fix critical bugs, validate with integration tests
2. **Week 2**: Integrate device provisioning into agent (Phase 1)
3. **Week 3**: Migrate operations to mobile-mcp APIs (Phase 2)
4. **Week 4**: E2E validation, documentation updates
5. **Future**: AWS Device Farm integration (Phase 3)

---

## Documentation Updates

- `backend/mobile/README.md` - Already comprehensive
- `BACKEND_HANDOFF.md` - Add mobile service section
- `specs/002-integrate-mobile-mcp/` - This spec
- Agent adapter docs - Migration guide

---

## Dependencies

- `@mobilenext/mobile-mcp` - Already added
- `@modelcontextprotocol/sdk` - Already added
- AWS SDK (Phase 3) - Not yet added
- Android emulator for testing - Required

---

## Migration from Spec 001

**Spec 001 Status**: Completed (Appium lifecycle automation in EnsureDevice)

**Coexistence**:
- Spec 001 handles Appium server lifecycle (start/stop/health)
- Spec 002 handles device abstraction and provisioning
- Both work together: Spec 001 ensures Appium ready, Spec 002 provisions devices

**Long-term**: Mobile-mcp may replace Appium entirely, but incremental migration reduces risk.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| SQL bugs in production | Fix in Phase 0, validate with tests |
| Device allocation conflicts | Proper unavailable marking + tests |
| MCP process crashes | Cleanup handlers + health checks |
| Performance regression | Benchmark local devices before/after |
| AWS credentials missing | Phase 3 deferred until credentials ready |

---

## Owner

- **Implementation**: Remote agent (initial), Backend vibe (bugs + integration)
- **Testing**: QA vibe with local devices first
- **Cloud Integration**: Infra vibe (AWS Device Farm setup)

---

**Status**: Ready to fix bugs and begin Phase 1 testing
