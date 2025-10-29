# XState Consolidation Complete

## Overview
Successfully consolidated agent orchestration into a single XState machine, eliminating NodeEngine, AgentRunner, router, and transition-policy layers.

## Target Achieved
- **Single machine**: `backend/agent/engine/xstate/agent.machine.ts` is the orchestration source of truth
- **Thin worker**: `backend/agent/orchestrator/worker.ts` boots interpreter, heartbeats, awaits terminal
- **Thin subscription**: `backend/agent/orchestrator/subscription.ts` claims run and spawns worker
- **Kept**: `nodes/*` capsules, `ports/*`, `persistence/*`, logging
- **Removed**: `engine/node-engine.ts`, `engine/agent-runner.ts`, `engine/transition-policy.ts`, `engine/xstate/router.ts`, `engine/xstate/policy.ts`, `engine/xstate/services.ts`, `engine/xstate/machine.ts` (replaced by agent.machine.ts)

## Key Changes

### Machine Design
- **Context**: `AgentState` + execution tracking (latestExecution, latestDecision, pendingStop)
- **States**: `idle` → `checkStop` → `evaluateStop` → `executing` → `decide` → terminal (`finished`/`failed`/`stopped`) or retry/backtrack loop
- **Actors**: `runNode` (executes handler → compute decision → persist), `shouldStop` (worker cancellation/budget check)
- **Guards**: `hasRetryDecision`, `hasBacktrackDecision`, `hasAdvanceDecision`, `hasTerminalSuccess`, `hasTerminalFailure`
- **Actions**: `storeExecutionResult`, `cacheStopDecision`, `markStopDisposition`

### Handler Execution Flow
1. Resolve handler from registry
2. `buildInput(state, ctx)` → node input
3. `execute(input, ports)` → output + events
4. `advanceStep` → increment stepOrdinal
5. `applyOutput` → apply state mutations
6. Compute transition decision (SUCCESS → advance/terminalSuccess, FAILURE → retry/backtrack/terminalFailure)
7. Persist snapshot + events via worker callbacks

### Retry/Backtrack Integration
- Handler `onFailure` policy specifies `{ retry: { maxAttempts, baseDelayMs, maxDelayMs }, backtrackTo }`
- Machine evaluates retry eligibility (attempt < maxAttempts && retryable !== false)
- Exponential backoff with deterministic jitter via `randomSeed`
- Backtrack increments `restartsUsed` counter
- Routing driven by handler `onSuccess` values

### Budget Enforcement
- In-machine guards check `maxSteps`, `maxTimeMs`, `outsideAppLimit`, `restartLimit`
- Budget exhaustion → `terminalFailure` with `stopReason: "budget_exhausted"`
- `shouldStop` actor checks worker-level cancellation

### Persistence & Callbacks
- `onPersist(state, events, nodeName)`: Orchestrator records events + saves snapshot
- `onAttempt(telemetry)`: Worker logs attempt metadata
- Both invoked synchronously after each node execution

## Files Created/Modified

### New
- `backend/agent/engine/xstate/agent.machine.ts` (451 lines) - unified orchestration entry point
- `backend/agent/engine/xstate/machine.test.ts` (382 lines) - stub-based machine tests

### Modified
- `backend/agent/engine/xstate/types.ts` - updated dependencies (registry vs engine, callbacks interface)
- `backend/agent/orchestrator/worker.ts` - removed NodeEngine usage, boots machine with thin wrapper
- `backend/agent/CLAUDE.md` - updated architecture docs
- `backend/agent/README.md` - updated NodeEngine references
- `backend/agent/HANDOFF.md` - updated Phase 2 handoff notes
- Legacy refactoring docs (marked as superseded)

### Deleted
- `backend/agent/engine/node-engine.ts`
- `backend/agent/engine/agent-runner.ts`
- `backend/agent/engine/transition-policy.ts`
- `backend/agent/engine/xstate/router.ts`
- `backend/agent/engine/xstate/policy.ts`
- `backend/agent/engine/xstate/services.ts`
- `backend/agent/engine/xstate/machine.ts`
- `backend/agent/tests/node-engine.test.ts`
- `backend/agent/tests/agent-runner.test.ts`

## Testing
- All 4 machine tests pass (nominal path, cancellation, retry, budget exhaustion)
- Tests use stub handlers with outcome scripts, no external dependencies
- Snapshot history captures all state transitions

## XState v5 Compatibility
- Used `fromPromise` wrapper for promise actors (required in v5)
- Type-safe event.output access via `"output" in event` checks
- Proper context/output typing throughout

## Benefits
- **Simpler**: Single machine replaces 4 files (NodeEngine, AgentRunner, router, policy)
- **Clearer**: All orchestration logic in one place
- **Testable**: Machine tests cover full flow, handlers remain pure
- **Deterministic**: Backoff jitter, budgets, retries all in-machine
- **Persistent**: Snapshots and events preserved

## Notes for Future Work
- Expand stub registry to cover main-loop nodes (EnumerateActions, ChooseAction, Act, Verify, DetectProgress, ShouldContinue)
- Consider recovery disposition nodes
- Wire LangGraph.js for complex policy decisions

