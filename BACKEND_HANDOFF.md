# ScreenGraph – Cross-Agent Handoff (Living Document)

This document is the single place where agents leave status for each other. Always update this before switching tasks; always read this before editing code when there are uncommitted changes.

## Handoff Template
- **What I am doing**: <short paragraph>
- **What is pending**:
  - [ ] Code
  - [ ] Tests
  - [ ] Manual review
- **What I plan to do next**:
  - <bullet>
  - <bullet>
- **Modules I am touching**:
  - <module/path>
- **Work status rating (out of 5)**: <0–5>
- **Graphiti episode IDs**:
  - <name>: `<uuid>`
- **Related docs**: <path(s)>
- **Notes for next agent**: <optional section with immediate context and recommendations>

---

## Handoff #9 — Appium Service Implementation Complete

- **What I am doing**: ✅ **COMPLETED** - Implemented standalone Appium server startup solution for ScreenGraph agent. Created bash script (`backend/scripts/start-appium-service.sh`) that starts Appium server directly using `bunx appium` with `--allow-insecure=adb_shell` flag on `http://127.0.0.1:4723`. Experimented with WDIO Appium Service approach but determined it's not suitable for standalone server use (requires test execution). Fixed version compatibility issues between Appium 2.4.0 and appium-uiautomator2-driver 2.20.0. Added npm scripts: `appium` (bash script) and `appium:standalone` (direct command).

- **What is pending**:
  - [x] Code: Standalone Appium startup script complete
  - [x] Code: Package.json scripts added
  - [x] Code: Version compatibility fixed
  - [x] Tests: Manual verification - Appium server starts successfully
  - [ ] Manual review: End-to-end test with agent connecting to Appium server

- **What I plan to do next**:
  - Document device connection requirements more clearly
  - Consider adding device detection/pre-warming to startup script
  - Monitor agent connection success rate in production

- **Modules I am touching**:
  - `backend/scripts/start-appium-service.sh` (new - standalone Appium startup)
  - `backend/package.json` (added appium dependencies and scripts)
  - `backend/wdio.appium.conf.js` (created but not recommended for production)
  - `backend/tests/_appium-server.spec.js` (holder spec for WDIO approach)

- **Work status rating (out of 5)**: 5

- **Graphiti episode IDs**:
  - Appium Service Setup Implementation: `e75ea9c5-4b7a-4442-b55a-0afd5440c9e3`
  - Appium Standalone Server Startup Procedure: `21d58764-11ef-48e6-8465-cc75d9817236`
  - Appium Version Compatibility Configuration: `episode-queued`
  - WDIO Appium Service Limitation Discovery: `episode-queued`
  - Android Device Requirement for Appium Sessions: `episode-queued`

- **Related docs**:
  - `backend/scripts/start-appium-service.sh` (startup script)
  - `backend/scripts/dev-android-appium.sh` (existing helper script)

- **Notes for next agent**:
  - **Critical Requirement**: Android device must be online (via USB or emulator) before agent can create Appium sessions. Check with `adb devices`.
  - **Startup**: Use `bun run appium` to start standalone Appium server. Script automatically kills existing process on port 4723.
  - **Version Compatibility**: Appium 2.4.0 + appium-uiautomator2-driver 2.20.0 is the correct version pairing (verified compatible).
  - **WDIO Approach**: WDIO Appium Service (`@wdio/appium-service`) is NOT suitable for standalone server - it requires test execution. Documents created but not recommended.
  - **Security Flag**: `--allow-insecure=adb_shell` is required for agent's ADB shell commands.
  - **Logs**: Appium logs stored in `/tmp/appium-service.log`, PID in `/tmp/appium-service.pid`.
  - **Device Connection**: If agent fails with TimeoutError, ensure device is connected first using `adb devices` or start emulator.

---

## Handoff #8 — Appium Setup and Device Management Documentation

- **What I am doing**: ✅ **COMPLETED** - Documented comprehensive Appium setup procedures and Android device management workflows. Analyzed `bun run appium` command execution flow, device startup procedures, and security configuration requirements for ScreenGraph agent integration.

- **What is pending**:
  - [x] Code: No code changes - documentation only
  - [x] Tests: No testing required - analysis of existing scripts
  - [x] Manual review: Procedures documented and verified against existing scripts

- **What I plan to do next**:
  - Continue with other development tasks as assigned
  - Reference these procedures when working with Appium/device automation

- **Modules I am touching**:
  - `backend/scripts/start-appium-service.sh` (analyzed)
  - `backend/scripts/dev-android-appium.sh` (analyzed)
  - `backend/package.json` (scripts section analyzed)

- **Work status rating (out of 5)**: 5

- **Graphiti episode IDs**:
  - Appium Server Startup Procedure: `appium-server-startup-procedure`
  - Android Device Management Procedure: `android-device-management-procedure`
  - Appium Security Configuration Preference: `appium-security-configuration-preference`
  - Appium Service Architecture Facts: `appium-service-architecture-facts`

---

## Handoff #7 — Graph Projection Service (Iteration 1) Complete

- **What I am doing**: ✅ **COMPLETED** - Implemented background Graph Projection Service that consumes `run_events` and maintains derived graph tables (`screens`, `graph_persistence_outcomes`) while preserving single-sink architecture. Service auto-starts on Encore service init, polls every 300ms, tracks per-run cursors, projects `agent.event.screen_perceived` events into canonical screen records with deterministic IDs. Includes XML normalization, layout hashing, cursor-based replay, structured logging, and unit tests.

- **What is pending**:
  - [x] Code: Complete projection service implementation
  - [x] Tests: Unit tests for hashing utilities (hasher.test.ts)
  - [x] Migration: 007 adds graph_projection_cursors and source_run_seq
  - [ ] Integration: SSE stream integration (join graph outcomes with run_events by source_run_seq) - deferred to future iteration
  - [ ] Metrics: Encore metrics for projection latency/throughput - deferred to future iteration

- **What I plan to do next**:
  - Extend `/run/:id/stream` to emit `graph.screen.discovered` / `graph.screen.mapped` messages
  - Add projection lag monitoring and alerts (>2s)
  - Project action events to create labeled edges between screens

- **Modules I am touching**:
  - `backend/graph/` (new service: encore.service.ts, projector.ts, repo.ts, hasher.ts, types.ts)
  - `backend/db/migrations/007_graph_projection.up.sql` (cursors table + source_run_seq)
  - `backend/logging/logger.ts` (added MODULES.GRAPH, GRAPH_ACTORS.PROJECTOR)
  - `backend/encore.gen/clients/` (auto-generated graph service exports)

- **Work status rating (out of 5)**: 5

- **Graphiti episode IDs**:
  - Graph Projection Service - Single-Sink Architecture Pattern: `graph-projection-service-single-sink-architecture-pattern`
  - Graph Projection Implementation Procedure: `graph-projection-implementation-procedure`
  - Deterministic Screen ID Hashing Preference: `deterministic-screen-id-hashing-preference`
  - XML Normalization and Layout Hashing Procedure: `xml-normalization-layout-hashing-procedure`
  - Cursor-Based Background Projection Pattern: `cursor-based-background-projection-pattern`
  - Graph Projection Event Context Tracking: `graph-projection-event-context-tracking`
  - Graph Projection Logging Standard: `graph-projection-logging-standard`
  - Screen Discovery vs Mapping Outcome: `screen-discovery-vs-mapping-outcome`

- **Related docs**:
  - `GRAPH_PROJECTION_APPROACH.md` (approach evaluation document)
  - `session_summary_graph_projection_implementation.md` (comprehensive session summary)
  - `backend/graph/README.md` (operations documentation)
  - `.cursor/plans/graph-3de556e1.plan.md` (implementation plan)

- **Notes for next agent**:
  - **Architecture**: Preserves single-sink principle - agent writes `run_events` only, projection derives graph state
  - **Deterministic IDs**: Screen IDs use `sha256(appId::layoutHash)[:32]` for idempotency, not DB UUIDs
  - **Cursor Management**: `graph_projection_cursors` table enables fault-tolerant replay per run
  - **Event Context**: In-memory context tracks Perceive lifecycle (stepOrdinal, uiRefId) across distributed events
  - **XML Processing**: Normalizes UI hierarchy XML (strip declarations, collapse whitespace) before layout hash
  - **Fallback Logic**: Falls back to `perceptualHash64` if artifact download fails
  - **Outcome Tracking**: Records `discovered` (new) vs `mapped` (existing) in `graph_persistence_outcomes` with `source_run_seq` for SSE correlation
  - **Logging**: Module `graph`, actor `projector`, includes batch summaries (eventsProcessed, projectedScreens, durationMs)
  - **SSE Integration**: Next iteration should join `graph_persistence_outcomes` with `run_events` using `source_run_seq` to emit graph events on stream
  - **Testing**: Unit tests verify hashing determinism; integration tests deferred (verify via Encore logs per standard)

---

## Handoff #6 — XState v5 Orchestration Migration Complete

- **What I am doing**: ✅ **COMPLETED** - Successfully migrated entire agent orchestration from AgentRunner/NodeEngine to XState v5. Created single machine (`agent.machine.ts`) that handles all orchestration logic including retries, backtracks, budget enforcement, and state transitions. Removed 8 legacy files and simplified worker/subscription to thin infrastructure layers. All unit tests pass (4/4) with complete flow coverage.

- **What is pending**:
  - [x] Code: XState machine implementation complete
  - [x] Tests: All unit tests passing (nominal, cancellation, retries, budget exhaustion)
  - [x] Manual review: Machine transitions verified, architecture documented

- **What I plan to do next**:
  - Add missing main-loop nodes (EnumerateActions → ChooseAction → Act → Verify → DetectProgress → ShouldContinue)
  - Wire inspector server properly for full debugging support
  - End-to-end testing with real device

- **Modules I am touching**:
  - `backend/agent/engine/xstate/agent.machine.ts` (451 lines - single orchestration entry point)
  - `backend/agent/engine/xstate/types.ts` (extended context/decision types)
  - `backend/agent/orchestrator/worker.ts` (simplified to thin wrapper)
  - `backend/agent/orchestrator/subscription.ts` (simplified to claim/spawn only)
  - **DELETED**: 8 legacy files (agent-runner.ts, node-engine.ts, transition-policy.ts, router.ts, etc.)

- **Work status rating (out of 5)**: 5

- **Graphiti episode IDs**:
  - XState Migration Complete: `xstate-v5-agent-orchestration-migration-complete`
  - XState Machine Architecture Details: `xstate-machine-architecture-details`
  - XState Migration Files Modified: `xstate-migration-files-modified`

- **Related docs**:
  - `session_summary_xstate_migration_complete.md` (comprehensive session summary)
  - `backend/agent/engine/xstate/` (complete implementation)

- **Notes for next agent**:
  - **Architecture**: XState machine is now the single source of truth for orchestration. Executes node handlers directly, computes retry/backtrack/advance decisions internally, persists snapshots/events through worker callbacks
  - **Machine States**: idle → checkStop → executing → decide → finished/failed/stopped with retry delays
  - **Inspector**: URL logged in dev mode: `https://stately.ai/inspect?server=ws://localhost:5678` (inspect server needs to be started separately)
  - **No Legacy Code**: AgentRunner, NodeEngine, transition-policy.ts all removed. XState handles everything
  - **Preserved**: All node capsules unchanged; only orchestration layer migrated
  - **Testing**: All 4 unit tests pass covering complete flow scenarios

---

## Handoff #5 — XState v5 Orchestration Phase 2 Complete

- **What I am doing**: Completed Phase 2 of XState migration by moving retry/backoff/backtrack policy logic into XState guards/actions, extracting routing from SwitchPolicy into dedicated router, removing AgentRunner fallback entirely, and adding dev inspector URL logging. XState is now the only driver for agent orchestration.

- **What is pending**:
  - [ ] Tests: Expand machine tests for retry/backtrack/router; remove runner tests
  - [ ] Tests: End-to-end test with real device
  - [ ] Manual review: Verify retry timing, backtrack increments restartsUsed, and router flows correctly

- **What I plan to do next**:
  - Update `backend/agent/CLAUDE.md` to reflect Phase 2 changes
  - Add missing main-loop nodes (EnumerateActions → ChooseAction → Act → Verify → DetectProgress → ShouldContinue)
  - Wire inspector server properly for full debugging support

- **Modules I am touching**:
  - `backend/agent/engine/xstate/agent.machine.ts` (single orchestration entry point)
  - `backend/agent/engine/xstate/types.ts` (extended context/decision types)
  - `backend/agent/engine/types.ts` (retained handler + registry contracts)
  - `backend/agent/orchestrator/worker.ts` (thin wrapper that boots machine)
  - `backend/agent/orchestrator/subscription.ts` (wiring updates)
  - `backend/package.json` (added @statelyai/inspect)

- **Work status rating (out of 5)**: 5

- **Graphiti episode IDs**:
  - XState Phase 2 Migration Architecture: `xstate-phase2-architecture`
  - XState Phase 2 Files Modified: `xstate-phase2-files`
  - XState Inspector Integration and Bug: `xstate-inspector-integration`
  - XState Policy Module Implementation: `xstate-policy-module`
  - Router Extraction from SwitchPolicy: `router-extraction-switchpolicy`
  - Raw Execution API Implementation: `raw-execution-api`
  - AgentRunner Removal Complete: `agentrunner-removal`
  - XState Inspector Bug Report: `xstate-inspector-bug`

- **Related docs**:
  - `.cursor/plans/x-c5832686.plan.md`
  - `backend/agent/engine/xstate/` (complete Phase 2 implementation)

- **Notes for next agent**:
  - **Architecture**: XState machine executes node handlers directly, computes retry/backtrack/advance decisions, and persists snapshots/events through worker callbacks
  - **Routing**: Handler `onSuccess` values drive transitions; SwitchPolicy capsule still controls policy switches (BFS/DFS/etc)
  - **Inspector**: URL logged in dev mode: `https://stately.ai/inspect?server=ws://localhost:5678` (inspect server needs to be started separately)
  - **No AGENT_DRIVER env var**: XState is now the only driver; AgentRunner removed
  - **State machine**: `agent.machine.ts` uses execution/decision pattern where guards check `latestDecision.kind` (retry/backtrack/advance/terminalSuccess/terminalFailure)
  - **Preserved**: All node capsules unchanged; only orchestration layer migrated

---

## Handoff #4 — XState v5 Orchestration Phase 1 Complete

- **What I am doing**: Implemented XState v5 wrapper for agent orchestration preserving all existing node capsules, ports, adapters, handlers, and mappers. Created feature flag `AGENT_DRIVER` (default: "runner") to toggle between AgentRunner and XState driver without code changes. Achieved functional parity on green path with all unit tests passing.

- **What is pending**:
  - [ ] Code: Phase 2 - Move retry/backoff/backtrack policy from `transition-policy.ts` into XState guards
  - [ ] Code: Phase 2 - Fully replace AgentRunner and remove fallback path
  - [ ] Tests: End-to-end test with real device using `AGENT_DRIVER=xstate`
  - [ ] Manual review: Compare XState vs AgentRunner log traces in Encore dashboard

- **What I plan to do next**:
  - Phase 2: Refactor `backend/agent/engine/transition-policy.ts` logic into XState machine guards
  - Phase 2: Remove `AgentRunner` class entirely and update all references
  - Phase 2: Simplify `worker.ts` by removing driver branching once XState is stable
  - Consider moving SwitchPolicy routing logic into XState for true policy-based node transitions

- **Modules I am touching**:
  - `backend/agent/engine/xstate/` (new module)
  - `backend/agent/orchestrator/worker.ts` (feature flag + dual driver implementation)
  - `backend/package.json` (added xstate@^5.23.0)

- **Work status rating (out of 5)**: 5

- **Graphiti episode IDs**:
  - XState Phase 1 Implementation: `<episode-id-pending>`

- **Related docs**:
  - `.cursor/plans/phase-12e57602.plan.md`
  - `backend/agent/engine/xstate/machine.test.ts` (unit tests)
  - `backend/agent/CLAUDE.md` (agent subsystem context)

- **Notes for next agent**:
  - **Critical**: XState v5 requires inline `assign()` in `onDone` actions to access `event.output` - this pattern is already implemented in `machine.ts`
  - **Quick start**: Set `export AGENT_DRIVER=xstate` before running `encore run` to test XState driver
  - **Test coverage**: All three unit tests pass (nominal path, retry, cancellation). Green path completes: EnsureDevice → LaunchOrAttach → Perceive → WaitIdle → SwitchPolicy → finished
  - **Preserved structure**: All node capsules (handlers, mappers, policies, node executors) remain unchanged - only orchestration layer wrapped
  - **Phase 2 recommendation**: Refactor `transition-policy.ts` computeBackoffDelayMs and retry logic into XState guards/actions to eliminate boilerplate. Consider using XState's built-in delayed transitions for retry timeout.
  - **Architecture win**: SwitchPolicy currently routes to Stop node - this can be replaced with dynamic routing based on AgentState.policyVersion using XState guards
  - **Logging**: All encore.dev/log structured logging preserved. Check Encore dashboard for traces when testing live runs.

---

## Handoff #3 — Splash Capture Perceive Integration
- **What I am doing**: Wired a new Perceive capsule to capture the splash screen right after app launch with a 500ms delay, store artifacts via the Artifacts service, and then route to WaitIdle. Added SwitchPolicy + Stop capsules so the post-splash flow now proceeds WaitIdle → SwitchPolicy → Stop to avoid the previous WaitIdle ↔ Perceive loop. Updated ports, context, registry, and worker wiring accordingly.
- **What is pending**:
  - [ ] Code: Register additional main-loop nodes (EnumerateActions → ChooseAction → Act → Verify → DetectProgress → ShouldContinue) so the flow can continue past the SwitchPolicy → Stop stub
  - [ ] Tests: Run a local end-to-end to verify single splash capture then proceed
  - [ ] Manual review: Confirm event order and artifact refs in logs and DB
- **What I plan to do next**:
  - Replace the temporary SwitchPolicy → Stop bridge with the actual main-loop nodes (EnumerateActions → ChooseAction → Act → Verify → DetectProgress → ShouldContinue → WaitIdle) once their capsules are ready
  - Verify via Encore dashboard that steps advance and stepOrdinal stops increasing in a two-node loop
- **Modules I am touching**:
  - `backend/agent/nodes/main/Perceive/*`
  - `backend/agent/nodes/types.ts`
  - `backend/agent/nodes/context.ts`
  - `backend/agent/nodes/registry.ts`
  - `backend/agent/orchestrator/worker.ts`
  - `backend/agent/nodes/setup/LaunchOrAttach/handler.ts`
- **Work status rating (out of 5)**: 4
- **Graphiti episode IDs**:
  - Splash screen capture requirement: `splash-capture-post-launch-500ms`
  - Artifacts Storage Service Complete: `artifacts-storage-implementation-2025-10-28`
- **Related docs**:
  - `backend/artifacts/IMPLEMENTATION.md`
  - `backend/API_DOCUMENTATION.md` (Artifacts Service section)
  - `steering-docs/architecture-founder-generated/agent_setup_updated.md` (WaitIdle/Perceive specs)

---

## Handoff #2 — Artifacts Storage Service Implementation
- **What I am doing**: Implemented complete Encore-based artifacts storage service for persisting screenshots and UI XML dumps with deterministic references, database indexing, and agent integration.
- **What is pending**:
  - [ ] Code: Run `encore run` to start backend with new artifacts service
  - [ ] Tests: E2E test with Perceive node storing artifacts via EncoreStorageAdapter
  - [ ] Manual review: Verify bucket provisioning and client generation
- **What I plan to do next**:
  - Monitor Perceive node artifact storage in live runs
  - Add artifact retrieval endpoint if UI needs raw content access
  - Consider artifact lifecycle policies (retention, cleanup)
- **Modules I am touching**:
  - `backend/artifacts/` (new service)
  - `backend/agent/adapters/storage/encore-storage.adapter.ts`
  - `backend/agent/nodes/types.ts` (AgentPorts extension)
  - `backend/agent/orchestrator/worker.ts` (buildAgentPorts)
  - `backend/API_DOCUMENTATION.md`
- **Work status rating (out of 5)**: 5
- **Graphiti episode IDs**:
  - Artifacts Storage Service Complete: `artifacts-storage-implementation-2025-10-28`
- **Related docs**:
  - `backend/artifacts/IMPLEMENTATION.md`
  - `backend/API_DOCUMENTATION.md` (Artifacts Service section)

---

## Handoff #1 — ProvisionApp Implementation
- **What I am doing**: Implemented ProvisionApp node to perform real APK installation, reinstallation if older, version/signature verification, and emit app events; hands off to LaunchOrAttach.
- **What is pending**:
  - [ ] Code: Apply DB migration 006 on running instance
  - [ ] Tests: E2E run with POST /run and verify event stream
  - [ ] Manual review: Verify dumpsys parsing on target devices
- **What I plan to do next**:
  - Wire LaunchOrAttach + WaitIdle in main loop
  - Add negative tests for signature mismatch and version downgrade
  - Add artifact capture (APK info) on provision
- **Modules I am touching**:
  - `backend/agent/nodes/setup/ProvisionApp/*`
  - `backend/agent/adapters/appium/webdriverio/package-manager.adapter.ts`
  - `backend/agent/ports/appium/package-manager.port.ts`
  - `backend/agent/orchestrator/worker.ts`
  - `backend/db/migrations/006_add_app_events.up.sql`
  - `backend/run/start.ts`
- **Work status rating (out of 5)**: 4
- **Graphiti episode IDs**:
  - ProvisionApp Implementation Complete: `f56081f6-1bf9-47b1-89d8-a140c57b4814`
  - Database Constraint Fix for App Events: `72e0ed2f-e663-4eed-834f-f83c9e08bbac`
  - ProvisionApp Testing Configuration: `55391923-8aaf-462a-b024-0fd5ec68272e`
  - Architecture Compliance for ProvisionApp: `73d81caa-4b46-4921-8956-85e963016349`
  - WebDriverIO Real Implementation: `f20dfefb-a9f6-4580-a517-0ad02ece8ce6`
  - Files Modified in ProvisionApp Session: `dc16143b-ba42-410b-8465-99857256dee9`
- **Related docs**:
  - `steering-docs/hand-off-docs/session_summary_provisionapp_implementation.md`
