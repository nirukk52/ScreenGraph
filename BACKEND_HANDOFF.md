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

## Handoff #11 — Architecture Review Living Document (2025-11-07)

- **What I am doing**: ✅ **COMPLETED** – Authored root-level `ARCHITECTURE_REVIEW.md` as the living system overview tying Encore services and SvelteKit client flows together (run lifecycle, artifacts persistence, graph projection, cancellation, critiques, evolution plan). Updated Cursor skill guides with the new evidence-capture pattern.

- **What is pending**:
  - [x] Code implementation
  - [x] Tests written/passing (documentation only)
  - [x] Manual testing completed (browser/Chrome capture of timeline + graph flows)

- **What I plan to do next**:
  - Keep ARCHITECTURE_REVIEW.md aligned as backend/fronted changes land (update flows + references each time services shift)
  - Monitor Graphiti queue for the remaining architecture-review episodes and add IDs once available
  - Socialize evidence capture loop with frontend team for upcoming UI work

- **Modules I am touching**:
  - `ARCHITECTURE_REVIEW.md`
  - `.claude-skills/cursor-browser-mastery/SKILL.md`
  - `.claude-skills/cursor-chrome-window-mastery/SKILL.md`
  - `BACKEND_HANDOFF.md`

- **Work status rating (out of 5)**: 4

- **Graphiti episode IDs**:
  - Architecture Review Rule 2025-11-07: `09220eea-3e54-4b0d-90a8-1fbaa58bed1e`
  - Architecture Review Fact 2025-11-07: *(queued – id pending)*
  - Architecture Review Procedure 2025-11-07: *(queued – id pending)*
  - Architecture Review Preference 2025-11-07: *(queued – id pending)*

- **Related docs**:
  - `ARCHITECTURE_REVIEW.md`
  - `.claude-skills/cursor-browser-mastery/SKILL.md`
  - `.claude-skills/cursor-chrome-window-mastery/SKILL.md`
  - `.cursor/commands/update_handoff`

- **Notes for next agent**:
  - Keep capturing live evidence (screenshots + console/network logs) whenever ARCHITECTURE_REVIEW.md is updated; link artifacts in the document references.
  - Once Graphiti returns IDs for Fact/Procedure/Preference episodes, update this entry and future handoffs with the UUIDs.
  - If new backend endpoints modify flows, run `bun run gen` on frontend before updating the doc to guarantee type safe references.

---

## Handoff #10 — American English Spelling Standardization Rule

- **What I am doing**: ✅ **COMPLETED** - Established and documented American English spelling as a non-negotiable coding rule after discovering runtime errors caused by spelling mismatch between database enum (British 'cancelled') and TypeScript code (American 'canceled'). Updated founder rules with new "Spelling & Language" section requiring American English exclusively across all code, schemas, types, comments, and documentation.

- **What is pending**:
  - [x] Code: Founder rules updated (.cursor/rules/founder_rules.mdc)
  - [x] Tests: No tests required - documentation and rule enforcement
  - [ ] Manual review: Database migration needed to fix run_status_enum spelling
  - [ ] Code: Create new migration to change enum 'cancelled' → 'canceled'
  - [ ] Tests: End-to-end test with run cancellation after migration

- **What I plan to do next**:
  - Create migration to safely modify run_status_enum from British to American spelling
  - Test run cancellation flow end-to-end
  - Audit codebase for any remaining British spellings
  - Consider adding linter rules to catch British spelling in future code

- **Modules I am touching**:
  - `.cursor/rules/founder_rules.mdc` (added Spelling & Language section)
  - `backend/db/migrations/` (need to create new migration for enum fix)
  - `BACKEND_HANDOFF.md` (this file)

- **Work status rating (out of 5)**: 3

- **Graphiti episode IDs**:
  - American English Spelling Standardization Rule: `queued-position-1`
  - PostgreSQL Enum Value Change Procedure: `queued-position-1`
  - Database Schema Refactoring Issues Encountered: `queued-position-2`
  - Migration Files Deleted After Revert: `queued-position-3`
  - Founder Rules Location and Management: `queued-position-4`

- **Related docs**:
  - `.cursor/rules/founder_rules.mdc` (founder rules with new spelling section)
  - `FOUNDERS.md` (also contains spelling rule reference)
  - `.cursor/commands/update_handoff` (handoff procedure documentation)

- **Notes for next agent**:
  - **Critical Issue**: Database enum `run_status_enum` currently uses British spelling `'cancelled'` but TypeScript code uses American `'canceled'`. This causes SQL errors when updating run status to canceled.
  - **Migration Strategy**: To safely change enum values in use: 1) Convert column to TEXT, 2) Drop old enum with CASCADE, 3) Create new enum with correct spelling, 4) Update existing data, 5) Convert column back to new enum type with CAST.
  - **Previous Migration Files Deleted**: Migrations 009, 010, 011 were created but deleted after local database reset. They contained: re-adding reverted columns, fixing app_package constraint, and standardizing spelling.
  - **Spelling Examples**: "canceled" not "cancelled", "color" not "colour", "optimize" not "optimise"
  - **Scope**: This rule applies to: variable names, function names, enum values, database columns, type names, comments, documentation
  - **Founder Rule Location**: The authoritative founder rules are in `.cursor/rules/founder_rules.mdc` with `alwaysApply: true` in frontmatter
  - **Testing**: After applying enum migration, test full run lifecycle including cancellation to verify no errors

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

---

## Handoff #11 — Graph Stream Endpoint Retro & Infra Notes

- **What I am doing**: Captured retro for `/graph/run/:runId/stream` availability. Frontend wiring is correct; connection fails until backend restart. Local `encore run` is blocked because Docker daemon is not running.

- **What is pending**:
  - [ ] Infra: Start Docker desktop/daemon locally
  - [ ] Backend: Restart with `cd backend && encore run`
  - [ ] Verify: Endpoint registered (API Explorer) and WebSocket upgrades (101)
  - [ ] Logs: Confirm "Client connected" with `module:graph actor:api`

- **What I plan to do next**:
  - After Docker is up, run backend, then test `GET /graph/run/:runId/stream`
  - Regenerate frontend client (`cd frontend && bun run gen`) if types changed

- **Modules I am touching**:
  - `backend/graph/encore.service.ts`
  - `backend/graph/stream.ts`
  - `backend/graph/stream.test.ts`

- **Work status rating (out of 5)**: 3

- **Related docs**:
  - `jira/feature-requests/FR-009-graph-stream-endpoint.md`
  - `backend/.claude-skills/backend-debugging/SKILL.md`

- **Notes for next agent**:
  - Terminal output shows: "The docker daemon is not running. Start it first." → Encore requires Docker for Postgres/PubSub
  - After restart, verify endpoint in API Explorer and check WebSocket status 101 from browser
  - Ports 4000/9400 were closed per ops request; bring services back when ready

---

## Handoff #12 — Run Defaults Config Endpoint (Proposed)

- **What I am doing**: Proposed centralized defaults endpoint `GET /config/run-defaults` to eliminate frontend/backend drift. Values will be sourced from Encore config/secrets with per-environment overrides. No changes to `POST /run` schema; only default provider.

- **What is pending**:
  - [ ] Code: Implement config provider and typed endpoint in `backend/run`
  - [ ] Tests: Unit tests for loader + endpoint serialization
  - [ ] Manual review: Verify values match environment config

- **What I plan to do next**:
  - Create `backend/run/config.ts` (DTO + loader + endpoint)
  - Document config keys and defaults in `API_DOCUMENTATION.md`
  - Coordinate with frontend to consume via generated client

- **Modules I am touching**:
  - `backend/run/` (new `config.ts`)
  - `backend/run/encore.service.ts` (export service if needed)
  - `backend/API_DOCUMENTATION.md`

- **Work status rating (out of 5)**: 3

- **Graphiti episode IDs**:
  - Run Default Config Centralization (FR-010): `episode-queued`
  - Graph Stream Debugging Resolution: `episode-queued`

- **Related docs**:
  - `jira/feature-requests/FR-010-run-default-config-sync.md`
  - `CODE_REVIEW.md`

- **Notes for next agent**:
  - Use `encore.dev/config` for env overrides; avoid hardcoding paths/URLs
  - Keep enums/literal unions for statuses (no magic strings)
  - After endpoint is live, notify frontend to regenerate client

---

## Handoff #13 — Port Management for Cursor Worktrees (Proposed)

- **What I am doing**: Drafted a feature request to introduce a lightweight, robust port management strategy per Cursor worktree to prevent port collisions for backend (4000+), dashboard (9400+), frontend (5173+), and Appium (4723+). This is documentation-only at this stage to guide implementation.

- **What is pending**:
  - [ ] Code: Implement `scripts/port-coordinator.mjs` (JSON registry at `~/.screengraph/ports.json`, availability checks, stable assignment)
  - [ ] Code: Add `scripts/ports.sh` helpers (`who`, `pick`, `assign`) with macOS/Linux branches
  - [ ] Backend: Respect `BACKEND_PORT`, `ENCORE_DASHBOARD_PORT`; print resolved ports at startup
  - [ ] Frontend: Read `VITE_BACKEND_BASE_URL` first; fallback to existing probe
  - [ ] Tests: Start two worktrees and verify unique, stable port assignment; verify frontend connects correctly
  - [ ] Manual review: DX flow and docs in CLAUDE.md

- **What I plan to do next**:
  - Implement the coordinator (node) and helpers (shell)
  - Wire backend/ frontend pre-start to resolve ports and export envs
  - Update docs and add troubleshooting

- **Modules I am touching**:
  - `jira/feature-requests/FR-011-port-management-worktrees.md`
  - (planned) `scripts/port-coordinator.mjs`
  - (planned) `scripts/ports.sh`

- **Work status rating (out of 5)**: 3

- **Graphiti episode IDs**: N/A (planning-only)

- **Related docs**:
  - `jira/feature-requests/FR-011-port-management-worktrees.md`
  - Cursor Worktrees: https://cursor.com/docs/configuration/worktrees

- **Notes for next agent**:
  - Keep the solution simple and local-first; do not auto-kill processes. Assign stable ports per worktree via registry, then fall back to probing next free port. Respect env overrides at all times.

---

## Handoff #14 — FR-011 Port Management Implementation & Worktree Init

- **What I am doing**: ✅ **COMPLETED** — Implemented deterministic port management for Cursor worktrees and automatic worktree initialization. Added coordinator scripts, dev wrappers, CORS updates, and frontend/backend wiring. Ensures each agent runs on its own port block; main tree defaults remain reserved.

- **What is pending**:
  - [x] Code: Port coordinator + dev scripts + worktree init
  - [x] Tests: Manual verification for ScreenGraph worktree (backend=4007, frontend=5180, dashboard=9407, appium=4730)
  - [x] Docs: Founder rules updated with index + worktree isolation
  - [ ] Scale: Expand ranges for 20+ worktrees (capacity currently 10–11)
  - [ ] Appium: Integrate APPIUM_PORT into dev-android-appium.sh flow
  - [ ] Dashboard: Investigate overriding Encore dashboard port (940x)

- **What I plan to do next**:
  - Increase `width` in coordinator for 20 concurrent worktrees
  - Add `ports:show` and `ports:clear` npm scripts
  - Wire APPIUM_PORT into `backend/scripts/dev-android-appium.sh`
  - Document Chrome profile isolation per worktree

- **Modules I am touching**:
  - `backend/scripts/port-coordinator.mjs` (new)
  - `backend/scripts/dev-with-ports.sh` (new)
  - `backend/encore.app` (CORS: allow 5173–5183)
  - `.cursor/worktree-init.sh` (root — worktree auto init)
  - `frontend/src/lib/getEncoreClient.ts` (env-first base URL)
  - `frontend/vite.config.ts` (reads FRONTEND_PORT)
  - `frontend/package.json` (dev script uses coordinator)
  - `.cursor/rules/founder_rules.mdc` (restored, indexed, isolation rules)

- **Work status rating (out of 5)**: 5

- **Graphiti episode IDs**:
  - Rules: `FR-011 Rules - Worktree Isolation & Ports` (queued)
  - Facts: `FR-011 Facts - Implementation Artifacts` (queued)
  - Procedures: `FR-011 Procedures - Start/Verify/Close` (queued)
  - Preferences: `FR-011 Preferences - Design choices` (queued)

- **Related docs**:
  - `FR-011-PLAN.md`
  - `@feature-requests/FR-011-port-management-worktrees/IMPLEMENTATION_STATUS.md`
  - `.cursor/rules/founder_rules.mdc`

- **Notes for next agent**:
  - Use worktree mode. Start services only via `./scripts/dev-with-ports.sh` (backend/frontend).
  - Verify backend is NOT 4000 and frontend is NOT 5173 in worktrees.
  - Main tree defaults (4000/5173/9400/4723) are reserved for Local mode.
  - Coordinator registry: `~/.screengraph/ports.json`. Snapshot: `.cursor/worktree.env`.

---

## Handoff #15 — Update Commands for Ticket-Level Handoff Documentation

- **What I am doing**: ✅ **COMPLETED** - Created three new Cursor commands (@update-bug-doc, @update-feature-doc, @update-tech-debt) that add handoff entries to individual ticket folders. These commands list existing tickets, let users select one, and append structured handoff entries to a per-ticket handoff.md file. Also created TEMPLATE-handoff.md templates in bugs/, feature-requests/, and tech-debt/ directories.

- **What is pending**:
  - [x] Code: Three update commands created and made executable
  - [x] Templates: TEMPLATE-handoff.md created for all three ticket types
  - [x] Manual review: Script logic tested (interactive folder selection, handoff numbering)
  - [x] Docs: Graphiti memory episodes created

- **What I plan to do next**:
  - Test the commands in a real workflow (e.g., when working on a bug or feature)
  - Consider adding similar commands for milestone tracking if needed
  - Monitor command usage and refine prompts based on agent feedback

- **Modules I am touching**:
  - `.cursor/commands/update-bug-doc` (new executable script)
  - `.cursor/commands/update-feature-doc` (new executable script)
  - `.cursor/commands/update-tech-debt` (new executable script)
  - `jira/bugs/TEMPLATE-handoff.md` (new template)
  - `jira/feature-requests/TEMPLATE-handoff.md` (new template)
  - `jira/tech-debt/TEMPLATE-handoff.md` (new template)
  - `BACKEND_HANDOFF.md` (this file)

- **Work status rating (out of 5)**: 5

- **Graphiti episode IDs**:
  - Update Commands Created - Handoff Documentation System: `queued-position-1`
  - Handoff Templates Created: `queued-position-1`
  - Handoff Documentation Pattern: `queued-position-2`
  - Bash Script Implementation - Interactive Folder Selection: `queued-position-3`

- **Related docs**:
  - `.cursor/commands/create-bug`, `create-feature`, `create-techdebt` (corresponding create commands)
  - `.cursor/commands/update_handoff` (main handoff command)
  - `jira/bugs/TEMPLATE-*.md` (all bug templates)
  - `jira/feature-requests/TEMPLATE-*.md` (all feature templates)
  - `jira/tech-debt/TEMPLATE-*.md` (all tech debt templates)

- **Notes for next agent**:
  - **Usage Pattern**: When working on a ticket, run the appropriate @update-*-doc command to log a handoff entry. The command will list available tickets and let you select which one to update.
  - **Handoff Numbering**: Commands auto-increment handoff numbers by counting "## Handoff #" patterns in the existing handoff.md file.
  - **First-Time Creation**: If handoff.md doesn't exist for a ticket, the command creates it from the template with proper ID/title substitution.
  - **Structured Format**: Each handoff entry captures: what you're doing, pending items, next steps, modules touched, work rating, and notes for next agent.
  - **Complements Global Handoffs**: These ticket-level handoffs complement BACKEND_HANDOFF.md and FRONTEND_HANDOFF.md by providing granular, ticket-specific context.
  - **Interactive Prompts**: Commands prompt for: what doing, pending items (comma-separated), next steps, modules (comma-separated paths), rating (0-5), and notes.
  - **Comma-Separated Inputs**: Pending items and modules use comma-separated format which gets auto-converted to markdown lists.
  - **Consistency**: All three commands follow identical patterns, just with different paths (bugs/, feature-requests/, tech-debt/) and prefixes (BUG-, FR-, TD-).

---

## Handoff #16 — Code Review Best Practices Plan for Update Commands

- **What I am doing**: Documented a phased plan to bring `.cursor/commands/update-bug-doc`, `update-feature-doc`, and `update-tech-debt` up to code review best practices: input validation with retries, preview/confirm, backups, error handling, constants (no magic values), help/dry-run flags, atomic writes, bash safety, colored output, exit codes, optional verbose/debug modes, and de-duplication via a shared library (`handoff-common.sh`).

- **What is pending**:
  - [ ] Phase 1 (Critical): Input validation with retry; preview + confirmation; backup creation; constants; basic error handling; `--help`
  - [ ] Phase 2 (High): Shared library to remove duplication; `--dry-run`; atomic writes; `set -euo pipefail` + quoting; colored output; standardized exit codes
  - [ ] Phase 3 (Nice): Verbose/debug modes; multi-line inputs; edit-before-confirm; rich summary; optional git auto-stage; concurrent edit detection; malformed file detection

- **What I plan to do next**:
  - Implement Phase 1 across all three commands, then reassess UX and error paths
  - Prepare shared library skeleton and migrate common logic (Phase 2)

- **Modules I am touching**:
  - `.cursor/commands/update-bug-doc`
  - `.cursor/commands/update-feature-doc`
  - `.cursor/commands/update-tech-debt`
  - (planned) `.cursor/commands/lib/handoff-common.sh`

- **Work status rating (out of 5)**: 3

- **Graphiti episode IDs**:
  - Bash CLI Handoff Commands – Code Review Best Practices: `queued-position-1`
  - Phased Implementation Plan – Update Commands: `queued-position-2`

- **Related docs**:
  - `.cursor/commands/update_handoff`
  - `CODE_REVIEW.md`

- **Notes for next agent**:
  - Prioritize Phase 1 for safety/UX; keep prompts consistent with other commands (flags: -h/--help, -n/--dry-run, -y/--yes, -v/--verbose)
  - Use atomic writes (temp + mv) and create timestamped backups before modifications
  - Prefer shared library to eliminate duplication while preserving simple @-command UX
  - Quote all variables, use `[[ ... ]]`, and `read -r` throughout; trap errors and clean up temps

---

## Handoff #17 — Plane Integration Feature Requests Scoped

- **What I am doing**: ✅ **COMPLETED** — Created two feature requests to integrate Plane while preserving `/jira` as the planning source of truth: (1) FR-012 microservice to host a self-contained Plane instance with documented ops; (2) FR-013 integration endpoint to sync a `/jira/**` folder into Plane (idempotent upsert, dry-run diffs). Added citations to upstream docs.

- **What is pending**:
  - [ ] Infra: Decide deployment mode (AIO vs Compose/Swarm) and reserve ports per worktree
  - [ ] Ops: Author `scripts/plane/` helpers (start/stop/logs/backup/upgrade) + README
  - [ ] Backend: Implement `POST /integrations/plane/sync { path, dryRun? }` with strict path allowlist
  - [ ] Docs: `/jira` → Plane mapping (fields, labels), security notes, env/secrets
  - [ ] Tests: Unit (parsing), integration (dry-run stability), E2E (idempotent upsert)

- **What I plan to do next**:
  - Implement FR-012 ops scaffold (local dev recipe + persistence)
  - Implement FR-013 endpoint with typed DTOs and structured logging

- **Modules I am touching**:
  - `jira/feature-requests/FR-012-plane-microservice-hosting/FR-012-main.md`
  - `jira/feature-requests/FR-013-jira-path-managed-plane/FR-013-main.md`

- **Work status rating (out of 5)**: 4

- **Graphiti episode IDs**:
  - FR-012 Plane Microservice Hosting Plan: `queued`
  - FR-013 /jira Path to Plane Sync Plan: `queued`

- **Related docs**:
  - Plane Docs: https://docs.plane.so/
  - Plane OSS: https://github.com/makeplane/plane?tab=readme-ov-file

- **Notes for next agent**:
  - Keep backend/frontend isolation; treat Plane as an external service we operate (no imports)
  - Enforce worktree port isolation; do not use reserved main-tree ports
  - Validate `path` stays within `jira/**`; derive idempotency key from folder name

