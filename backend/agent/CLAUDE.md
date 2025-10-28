# Agent Subsystem Context

## Overview
The agent subsystem orchestrates mobile test automation through a deterministic node execution engine with persistent state snapshots.

## Flow
RunJob → Worker ↓ Worker creates: sessionPort, registry, context, engine ↓ Engine.runOnce(currentNode="EnsureDevice") ↓ Handler.buildInput(state, context) → EnsureDeviceInput ↓ Handler.execute(input, ports) → EnsureDeviceOutput + events ↓ Handler.applyOutput(state, output) → Updated AgentState ↓ Engine decides transition: SUCCESS → "ProvisionApp" ↓ Worker persists events and snapshot ↓ Repeat for next node...


## Architecture

### Core Components
- **`/engine`**: NodeEngine execution control, AgentRunner orchestration loop
- **`/nodes`**: Node capsules organized by category (setup, main, policy, recovery, terminal)
- **`/orchestrator`**: Worker coordination, Orchestrator persistence, Subscription Pub/Sub
- **`/ports`**: Abstract interfaces for Appium, DB, LLM, OCR, storage
- **`/adapters`**: Concrete implementations (WebDriverIO, fake mocks)
- **`/domain`**: Core types (state, events, entities, actions, perception)
- **`/persistence`**: Repository implementations for DB ports

## Key Files

### `/engine`
- **`node-engine.ts`**: NodeEngine for executing nodes and deciding transitions
- **`agent-runner.ts`**: AgentRunner loop for orchestrating next/retry/backtrack
- **`types.ts`**: Core engine types (NodeHandler, TransitionPolicy, etc.)
- **`transition-policy.ts`**: Retry/backtrack policy computation

### `/nodes`
- **`types.ts`**: AgentNodeName union, AgentContext, AgentPorts
- **`context.ts`**: AgentContext builder from run data
- **`registry.ts`**: Unified NodeRegistry builder for all nodes
- **`setup/EnsureDevice/`**: Node capsule (node.ts, handler.ts, mappers.ts, policy.ts)
- **`setup/ProvisionApp/`**: Node capsule (node.ts, handler.ts, mappers.ts, policy.ts)
- **`main/`, `policy/`, `recovery/`, `terminal/`**: Future node categories

### `/orchestrator`
- **`worker.ts`**: AgentWorker with AgentRunner integration, lease heartbeats, budgets
- **`orchestrator.ts`**: Persistence spine (IDs, events, snapshots)
- **`subscription.ts`**: Pub/Sub handler for run jobs
- **`README.md`**: Architecture overview and usage examples

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
4. Worker creates AgentRunner with NodeEngine, AgentPorts, AgentContext
5. AgentRunner loop: shouldStop check → engine.runOnce() → persist → handle retry/backtrack/next
6. NodeEngine: resolve handler → build input → execute → apply output → decide transition
7. Orchestrator: record events, save snapshot via callbacks
8. AgentRunner: loop until termination (retry with backoff, backtrack, or next node)
9. Worker: finalize run status

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

