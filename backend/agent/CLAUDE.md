# Agent Subsystem Context

## Overview
The agent subsystem orchestrates mobile test automation through a deterministic node execution engine with persistent state snapshots.

## Flow
RunJob → Worker ↓ Worker creates: sessionPort, registry, context, engine ↓ Engine.runOnce(currentNode="EnsureDevice") ↓ Handler.buildInput(state, context) → EnsureDeviceInput ↓ Handler.execute(input, ports) → EnsureDeviceOutput + events ↓ Handler.applyOutput(state, output) → Updated AgentState ↓ Engine decides transition: SUCCESS → "ProvisionApp" ↓ Worker persists events and snapshot ↓ Repeat for next node...


## Architecture

### Core Components
- **`/orchestrator`**: NodeEngine control plane, Worker loop, Orchestrator persistence
- **`/nodes`**: Pure node executors (setup, main, policy, recovery, terminal)
- **`/ports`**: Abstract interfaces for Appium, DB, LLM, OCR, storage
- **`/adapters`**: Concrete implementations (WebDriverIO, fake mocks)
- **`/domain`**: Core types (state, events, entities, actions, perception)
- **`/persistence`**: Repository implementations for DB ports

## Key Files

### `/orchestrator`
- **`node-engine.ts`**: NodeEngine, TransitionPolicy, retry/backtrack logic
- **`node-registry.ts`**: Factory for wiring typed node handlers
- **`orchestrator.ts`**: Persistence spine (IDs, events, snapshots)
- **`worker.ts`**: Long-lived loop with lease heartbeats, budgets, cancellation
- **`subscription.ts`**: Pub/Sub handler for run jobs
- **`README.md`**: Architecture overview and usage examples

### `/nodes`
- **`setup/`**: EnsureDevice, ProvisionApp, LaunchOrAttach, WaitIdle
- **`main/`**: Perceive, EnumerateActions, ChooseAction, Act, Verify, DetectProgress, ShouldContinue, Persist
- **`policy/`, `recovery/`, `terminal/`**: Future node categories

### `/ports`
- **`appium/`**: SessionPort, AppLifecyclePort, PerceptionPort, InputActionsPort, etc.
- **`db-ports/`**: RunDbPort, RunEventsDbPort, AgentStateDbPort, RunOutboxDbPort
- **`llm.port.ts`**: LLM interface for decision nodes
- **`ocr.port.ts`**: OCR for screen text extraction
- **`storage.port.ts`**: Artifact storage (screenshots, XML)

## Node Handler Pattern
```typescript
{
  name: "NodeName",
  buildInput(state: AgentState, ctx: EngineContext) { /* map state → input */ },
  async execute(input, ports) { /* call node function */ },
  applyOutput(prev: AgentState, output) { /* update state */ },
  onSuccess: "NextNode",
  onFailure: { retry: {...}, backtrackTo: "FallbackNode" }
}
```

## Orchestration Flow
1. Subscription receives RunJob from Pub/Sub topic
2. Worker claims run with lease
3. Orchestrator initializes from snapshot or creates initial state
4. Worker loop: cancel check → budget check → engine.runOnce() → persist
5. NodeEngine: resolve handler → build input → execute → apply output → decide transition
6. Orchestrator: record events, save snapshot
7. Worker: finalize or retry/backtrack

## State Management
- **AgentState**: Single source of truth (stepOrdinal, iterationOrdinalNumber, nodeName, counters, budgets, status)
- **Snapshots**: Saved after every step for deterministic resume
- **Events**: Append-only log with monotonic sequence
- **Transitions**: Forward (success), Retry (bounded attempts), Backtrack (to recovery node)

## Retry/Backtrack
- **Max 3 attempts** per node with exponential backoff (1s base, 5s max)
- **Deterministic jitter** using `randomSeed`
- **Backtracking**: ProvisionApp → EnsureDevice after retries exhausted
- **Counters**: `restartsUsed` incremented on backtrack

## Logging
- **Module**: `"agent"`
- **Actors**: `"orchestrator"`, `"worker"`, `"subscription"`
- **Context**: Always include `runId`, `workerId`, `nodeName`, `stepOrdinal`
- **Snapshots**: Log full AgentState for debugging

## Budget Enforcement
- **maxSteps**: Total step limit
- **maxTimeMs**: Wall-clock time limit
- **maxTaps**: Interaction limit
- **outsideAppLimit**: Off-app action limit
- **restartLimit**: Backtrack/restart limit

## Testing
- Nodes are pure functions (testable in isolation)
- Integration testing via log verification in Encore dashboard
- Use fake adapters for unit tests

## Future Work
- Wire LangGraph.js for main loop nodes
- Implement policy switching
- Add recovery dispositions
- Complete terminal node conditions

