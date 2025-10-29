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
