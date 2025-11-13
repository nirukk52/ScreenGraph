# Feature Specification: Auto-Managed Appium Lifecycle

**Feature Branch**: `001-automate-appium-lifecycle`  
**Created**: 2025-11-12  
**Status**: Draft  
**Input**: User description: "Remove the manual Appium server prerequisite by introducing an auto-managed Appium lifecycle aligned with README expectations."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - User starts a run without manual Appium setup (Priority: P1)

A user wants to click "Detect Drift" and have the agent start exploring their app immediately, without needing to manually start Appium or troubleshoot device connectivity beforehand.

**Why this priority**: Eliminates the primary friction point in the user experience. Currently, users must manually start Appium before starting a run, which creates confusion and blocks the core workflow.

**Independent Test**: User clicks "Detect Drift" button with a device connected, and the run starts successfully with the agent capturing screenshots without any manual Appium setup.

**Acceptance Scenarios**:

1. **Given** Appium is not running and a device is connected, **When** the user starts a run, **Then** the agent's `EnsureDevice` node starts Appium automatically, waits for readiness, and proceeds with the run.
2. **Given** Appium is already running and healthy, **When** the user starts a run, **Then** the agent's `EnsureDevice` node verifies Appium health and proceeds with the run immediately.
3. **Given** no device is connected or device is offline, **When** the user starts a run, **Then** the agent detects the missing device and shows a clear error in the UI before attempting Appium startup.

---

### User Story 2 - Developer iterates on agent code without Appium management (Priority: P2)

A developer working on agent improvements wants to start multiple test runs in quick succession during development without manually managing Appium between runs.

**Why this priority**: Enables rapid development iteration on agent behavior. Currently, developers waste time starting/stopping Appium manually or dealing with stale Appium instances between test runs.

**Independent Test**: Developer starts multiple runs back-to-back during a development session, and each run handles Appium lifecycle automatically without manual intervention.

**Acceptance Scenarios**:

1. **Given** a developer starts the first run of a development session, **When** Appium is not running, **Then** the agent starts Appium automatically and proceeds with the run.
2. **Given** a developer starts a second run immediately after the first, **When** Appium is still healthy from the previous run, **Then** the agent reuses the existing Appium instance and proceeds immediately.
3. **Given** Appium becomes unhealthy between runs (crashed or stale), **When** the developer starts a new run, **Then** the agent detects the unhealthy state, restarts Appium, and proceeds with the run.

### Edge Cases

- Appium port bound by unhealthy/crashed process (agent detects via health check, kills it, starts fresh instance).
- Device prerequisites partially satisfied causing Appium to hang (agent fails fast with device check before Appium startup, shows error in UI).
- Appium binaries not installed or incompatible version (agent detects during startup attempt, shows clear installation guidance in UI).
- Device disconnects mid-run after Appium already started (run fails gracefully with device connectivity error shown to user).
- User wants to stop Appium manually between development sessions (use `task qa:appium:stop` command).

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The agent's `EnsureDevice` node MUST ensure Appium is running and healthy before proceeding with device operations; if Appium is already running and healthy, reuse it; otherwise start a fresh instance.
- **FR-002**: The `EnsureDevice` node MUST perform a health check on any existing Appium instance; if unhealthy or unresponsive, terminate it and start a fresh instance.
- **FR-003**: The `EnsureDevice` node MUST verify device connectivity and prerequisites (ADB visibility, package presence) BEFORE attempting to start Appium, failing the run fast with a clear error message if prerequisites are not met.
- **FR-004**: The `EnsureDevice` node MUST verify Appium readiness (port listening, health endpoint responding) after startup before proceeding with the run, failing with actionable messaging if readiness is not achieved within 60 seconds.
- **FR-005**: The agent MUST leave Appium running after runs complete (for reuse by subsequent runs); users can manually stop Appium when done or use a dedicated stop command.
- **FR-006**: The agent MUST emit structured lifecycle status updates (device check, Appium health check, start, readiness confirmation) through run events visible in the UI for user visibility.
- **FR-007**: Project documentation (README and relevant vibe configurations) MUST be updated to reflect that Appium lifecycle is now automatic during runs and remove manual Appium start instructions.

### Key Entities *(include if feature involves data)*

- **AppiumLifecycleManager**: Component within the `EnsureDevice` node that orchestrates the Appium lifecycle (check device → health check existing Appium → start if needed → verify ready).
- **DevicePrerequisiteCheck**: Validation that device is connected and app package is available before starting Appium.
- **LifecycleEvent**: Run events emitted during each phase for UI visibility (device check, health check, Appium start, readiness confirmation).

## Assumptions

- Appium binaries are already installed on developer machines and CI; this feature manages Appium lifecycle, not installation.
- A physical or virtual device must be connected before starting runs; the `EnsureDevice` node validates device presence but doesn't provision hardware.
- If Appium is already running and healthy, runs can reuse it; if not running or unhealthy, the agent starts a fresh instance.
- Appium lifecycle is managed by the agent runtime during actual runs, not by test frameworks.
- Manual Appium stop command (`task qa:appium:stop`) remains available for users who want to explicitly shut down Appium between development sessions.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: 100% of runs ensure Appium is running and healthy before device operations begin (starting if needed within 60 seconds, reusing if already healthy), measured by run event logs.
- **SC-002**: When device is offline or disconnected, 100% of runs fail fast within 10 seconds with a clear device error message displayed in the UI before attempting Appium startup.
- **SC-003**: Users can start multiple runs back-to-back during development without manually managing Appium, with the second run starting within 5 seconds (reusing healthy Appium).
- **SC-004**: Zero manual "start Appium" instructions remain in documentation; updated docs clarify that Appium is auto-managed by the agent during runs and device must be connected.

---

## Implementation Notes *(for assignee)*

**Recommended:**
- Load `backend_vibe` when implementing (provides Encore.ts patterns and agent architecture guidance)
- Implement lifecycle logic within `backend/agent/nodes/setup/EnsureDevice/` (device check, health check, Appium start/stop)
- Emit run events for each lifecycle phase visible in the UI timeline
- Create helper scripts in `automation/scripts/` for manual Appium management (`task qa:appium:stop`)
- Update docs to remove manual Appium instructions
