# XState Phase 2 Migration Complete

## Overview
Successfully migrated agent orchestration from AgentRunner to XState v5 with deterministic retry/backoff/backtrack policy managed by state machine guards/actions.

## What Changed

### Architecture
- **Raw Execution API**: `NodeEngine.runNode()` returns only execution result (outcome, retryable, policy, events) without transition decisions
- **Policy Module**: `backend/agent/engine/xstate/policy.ts` computes retry/backtrack/advance decisions based on execution + state
- **Router**: `backend/agent/engine/xstate/router.ts` determines next node without SwitchPolicy in green path
- **State Machine**: Uses execution/decision pattern where guards check `latestDecision.kind`

### Key Files
- `backend/agent/engine/xstate/policy.ts` (new) - Transition decision logic
- `backend/agent/engine/xstate/router.ts` (new) - Routing decisions
- `backend/agent/engine/xstate/machine.ts` (refactored) - Uses decision pattern
- `backend/agent/engine/xstate/services.ts` (updated) - Calls raw API
- `backend/agent/engine/xstate/types.ts` (updated) - Added AgentTransitionDecision
- `backend/agent/engine/node-engine.ts` (updated) - Added runNode raw API
- `backend/agent/engine/types.ts` (updated) - Added EngineNodeExecutionResult
- `backend/agent/orchestrator/worker.ts` (refactored) - Removed AgentRunner
- `backend/package.json` (updated) - Added @statelyai/inspect

### Removed
- AgentRunner class and all references
- AGENT_DRIVER environment variable
- runWithRunner method in worker.ts

## XState Inspector

### URL
```
https://stately.ai/inspect?server=ws://localhost:5678
```

### Setup
1. Start backend: `cd backend && encore run`
2. Logs will show inspector URL in dev mode
3. Connect browser to inspector URL

### What You Can See
- Real-time state transitions
- Guard evaluations (shouldRetry, shouldBacktrack, hasNextNode)
- Action executions (prepareRetry, applyBacktrack, advanceToNextNode)
- State machine context (latestExecution, latestDecision, pendingStop)

## Testing Status
- [ ] Expand machine tests for retry/backtrack/router
- [ ] Remove runner tests
- [ ] End-to-end test with real device

## Next Steps
1. Update machine tests
2. Add missing main-loop nodes
3. Wire inspector server properly

