# Implementation Plan: Auto-Managed Appium Lifecycle

**Branch**: `001-automate-appium-lifecycle` | **Date**: 2025-11-12 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/001-automate-appium-lifecycle/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement automatic Appium lifecycle management within the agent's `EnsureDevice` node to eliminate manual Appium setup before runs. The agent will check device connectivity, verify or start Appium health, and emit run events for UI visibility. Users click "Detect Drift" and runs start immediately without manual Appium management.

## Technical Context

**Language/Version**: TypeScript 5.x (Encore.ts backend)  
**Primary Dependencies**: Encore.ts 1.x, Appium 2.x (external), @wdio/cli (existing)  
**Storage**: PostgreSQL (existing - for run events)  
**Testing**: Encore test framework (backend), Playwright (E2E)  
**Target Platform**: macOS/Linux development machines, CI environments  
**Project Type**: Web + Mobile (backend service + agent orchestration)  
**Performance Goals**: Appium health check < 2s, startup < 60s, run start within 5s if Appium already healthy  
**Constraints**: Must not block run start >10s on device failures, must emit events visible in UI timeline  
**Scale/Scope**: Single agent node enhancement (`EnsureDevice`), ~3-5 new functions, 2-3 run event types

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Specification-First (Principle I)
- Spec exists: `specs/001-automate-appium-lifecycle/spec.md`
- User acceptance criteria defined (P1, P2 stories)
- Success metrics measurable
- **PASS**

### ✅ Language Boundaries (Principle II)
- TypeScript for backend agent logic (EnsureDevice node)
- Shell for manual stop command (automation/scripts/)
- No cross-language pollution
- **PASS**

### ✅ Test-First Development (Principle III)
- Tests to be written during implementation (RED-GREEN-REFACTOR)
- Integration tests for EnsureDevice node
- E2E tests for run flow
- **PASS - will be enforced during implementation**

### ✅ Observable Everything (Principle IV)
- Run events emitted for each lifecycle phase
- Structured logging with required fields (module, actor, runId)
- UI visibility through timeline
- **PASS**

### ✅ Python for Tooling (Principle V)
- No Python in agent business logic
- Shell script for manual Appium stop command
- **PASS**

## Project Structure

### Documentation (this feature)

```text
specs/001-automate-appium-lifecycle/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (see below)
├── data-model.md        # Phase 1 output (see below)
├── quickstart.md        # Phase 1 output (see below)
├── contracts/           # Phase 1 output (run event schemas)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created yet)
```

### Source Code (repository root)

```text
backend/
├── agent/
│   └── nodes/
│       └── setup/
│           └── EnsureDevice/
│               ├── node.ts                 # MODIFY: Add lifecycle logic
│               ├── handler.ts              # MODIFY: Add Appium management
│               ├── appium-lifecycle.ts     # NEW: Health check, start, stop
│               ├── device-check.ts         # NEW: Device prerequisite validation
│               └── lifecycle-events.ts     # NEW: Event emission helpers
│
├── run/
│   └── events/
│       ├── event-definitions.ts           # MODIFY: Add new event types
│       └── mappers.ts                     # MODIFY: Map lifecycle events
│
automation/
└── scripts/
    └── appium-stop.sh                     # NEW: Manual Appium stop command

.cursor/
└── commands/
    └── qa/
        └── Taskfile.yml                   # MODIFY: Add appium:stop task

tests/
└── integration/
    └── ensure-device-lifecycle.test.ts    # NEW: Integration tests
```

**Structure Decision**: Existing web application structure (backend + frontend). All changes scoped to backend agent architecture, specifically the `EnsureDevice` node within `backend/agent/nodes/setup/`. Run events visible in existing frontend UI timeline.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — constitution gates all passed.

---

## Phase 0: Research & Unknowns

**Prerequisites**: Constitution Check passed

### Research Tasks

1. **Appium Health Check API**
   - **Question**: What endpoint/method does Appium expose for health checks?
   - **Research**: Review Appium 2.x documentation for `/status` endpoint
   - **Output**: Document health check endpoint, expected response, timeout handling

2. **Process Management**
   - **Question**: How to reliably start/stop Appium programmatically from Node.js?
   - **Research**: Review child_process spawn/exec patterns, PID tracking, graceful shutdown
   - **Output**: Document spawn approach, signal handling (SIGTERM/SIGKILL), cleanup strategy

3. **Existing Device Check Logic**
   - **Question**: What device validation already exists in `EnsureDevice` node?
   - **Research**: Review current `backend/agent/nodes/setup/EnsureDevice/node.ts`
   - **Output**: Document current flow, identify integration points for lifecycle management

4. **Run Event Schema**
   - **Question**: How are run events currently structured and emitted?
   - **Research**: Review `backend/run/events/` for event patterns
   - **Output**: Document event schema format, emission patterns, UI consumption

5. **Appium Port Configuration**
   - **Question**: Where is Appium port configured? Is it environment-driven?
   - **Research**: Check `.env`, `backend/config/env.ts` for Appium config
   - **Output**: Document port configuration, environment variable usage

**Next**: Generate `research.md` with findings from these tasks.

---

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete with all unknowns resolved

### Data Model

**Entities to define in `data-model.md`:**

1. **AppiumLifecycleState**
   - States: `idle`, `checking_device`, `checking_health`, `starting`, `ready`, `failed`
   - Transitions between states
   - Timeout values per state

2. **DevicePrerequisite**
   - Device ID (from ADB)
   - Package name (from .env)
   - ADB visibility check result
   - Package presence check result

3. **LifecycleEvent** (Run Event Extension)
   - Event kind: `agent.appium.device_check`, `agent.appium.health_check`, `agent.appium.starting`, `agent.appium.ready`, `agent.appium.failed`
   - Payload: state, duration, error details
   - Timestamp, runId

### API Contracts

**No new HTTP endpoints** — this is agent internal logic. Run events follow existing PubSub patterns.

**Contracts to define in `/contracts/`:**

1. **lifecycle-events.schema.json**
   - Event types for Appium lifecycle phases
   - Payload schemas for each event type
   - Success/failure variants

### Quickstart

**To define in `quickstart.md`:**

1. Development workflow:
   - How to test Appium lifecycle locally
   - How to trigger device check failures
   - How to verify run events in UI

2. Testing approach:
   - Integration test setup
   - Mocking Appium responses
   - E2E test scenarios

3. Manual Appium management:
   - When to use `task qa:appium:stop`
   - Troubleshooting unhealthy Appium

**Next**: Generate `data-model.md`, `/contracts/lifecycle-events.schema.json`, `quickstart.md`.

---

## Phase 2: Task Breakdown

**Prerequisites**: Phase 1 complete, agent context updated

**This phase is executed by `/speckit.tasks` command** — not part of `/speckit.plan`.

Tasks will be generated based on:
- User stories (P1, P2)
- Functional requirements (FR-001 through FR-007)
- TDD approach (write tests first)
- Integration points identified in research

Expected task categories:
1. **Setup** — Update environment config, add Appium port
2. **Device Check** — Implement prerequisite validation
3. **Health Check** — Implement Appium health verification
4. **Lifecycle Start** — Implement Appium spawn logic
5. **Event Emission** — Implement run event publishing
6. **Integration** — Wire into EnsureDevice node
7. **Testing** — Integration and E2E tests
8. **Documentation** — Update README, vibes

---

## Next Steps

1. ✅ **DONE**: Constitution Check passed
2. **TODO**: Generate `research.md` (resolve 5 unknowns)
3. **TODO**: Generate `data-model.md` (3 entities)
4. **TODO**: Generate `/contracts/lifecycle-events.schema.json`
5. **TODO**: Generate `quickstart.md`
6. **TODO**: Update agent context (`.cursor/mcp.local.json` or similar)
7. **TODO**: Run `/speckit.tasks` to generate task breakdown

**Plan Status**: Ready for Phase 0 research
