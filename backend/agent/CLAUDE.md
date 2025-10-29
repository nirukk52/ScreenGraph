# Agent Subsystem Context

## Overview
The agent subsystem orchestrates mobile test automation through a deterministic XState machine backed by persistent state snapshots.

## Flow
RunJob → Worker ↓ Worker creates: sessionPort, registry, context, machine ↓ Machine.run(currentNode="EnsureDevice") ↓ Handler.buildInput(state, context) → EnsureDeviceInput ↓ Handler.execute(input, ports) → EnsureDeviceOutput + events ↓ Handler.applyOutput(state, output) → Updated AgentState ↓ Machine decides transition: SUCCESS → "ProvisionApp" ↓ Worker persists events and snapshot ↓ Repeat for next node...


## Architecture

### Core Components
- **`/engine`**: XState agent machine (`xstate/agent.machine.ts`) plus shared types
- **`/nodes`**: Node capsules organized by category (setup, main, policy, recovery, terminal)
- **`/orchestrator`**: Worker coordination, Orchestrator persistence, Subscription Pub/Sub
- **`/ports`**: Abstract interfaces for Appium, DB, LLM, OCR, storage
- **`/adapters`**: Concrete implementations (WebDriverIO, fake mocks)
- **`/domain`**: Core types (state, events, entities, actions, perception)
- **`/persistence`**: Repository implementations for DB ports

## Key Files

### `/engine`
- **`xstate/agent.machine.ts`**: Primary orchestration state machine wiring handlers → retries/backtracks → persistence
- **`xstate/types.ts`**: Core machine types (context, decisions, callbacks)
- **`types.ts`**: Node handler and registry contracts shared across nodes

### `/nodes`
- **`types.ts`**: AgentNodeName union, AgentContext, AgentPorts
- **`context.ts`**: AgentContext builder from run data
- **`registry.ts`**: Unified NodeRegistry builder for all nodes
- **`setup/EnsureDevice/`**: Node capsule (node.ts, handler.ts, mappers.ts, policy.ts)
- **`setup/ProvisionApp/`**: Node capsule (node.ts, handler.ts, mappers.ts, policy.ts)
- **`main/`, `policy/`, `recovery/`, `terminal/`**: Future node categories

### `/orchestrator`
- **`worker.ts`**: Thin AgentWorker that boots the machine, maintains lease heartbeats, evaluates cancellation
- **`orchestrator.ts`**: Persistence spine (IDs, events, snapshots)
- **`subscription.ts`**: Pub/Sub handler for run jobs
- **`README.md`**: Architecture overview and usage examples

### `/ports`
- **`appium/`**: SessionPort, AppLifecyclePort, PerceptionPort, InputActionsPort, etc.
- **`db-ports/`**: RunDbPort, RunEventsDbPort, AgentStateDbPort, RunOutboxDbPort
- **`llm.port.ts`**: LLM interface for decision nodes
- **`ocr.port.ts`**: OCR for screen text extraction
- **`storage.ts`**: Artifact storage (screenshots, XML)

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
4. Worker instantiates the agent machine with registry, ports, context, persistence callbacks
5. Machine loop: shouldStop check → resolve handler → build input → execute → apply output → compute transition decision → persist events/snapshot → transition
6. Machine guards: check decision.kind (retry/backtrack/advance/terminalSuccess/terminalFailure)
7. Worker: finalize run status when machine reaches terminal state

## State Management
- **AgentState**: Single source of truth (stepOrdinal, iterationOrdinalNumber, nodeName, counters, budgets, status)
- **Snapshots**: Saved after every step for deterministic resume
- **Events**: Append-only log with monotonic sequence
- **Transitions**: Forward (success), Retry (bounded attempts), Backtrack (to recovery node)

## Retry/Backtrack
- **Integrated policy**: `agent.machine.ts` computes retry/backtrack/advance decisions using handler policies and deterministic backoff
- **Max 3 attempts** per node with exponential backoff (1s base, 5s max)
- **Deterministic jitter** using `randomSeed` from execution result
- **Backtracking**: ProvisionApp → EnsureDevice after retries exhausted
- **Counters**: `restartsUsed` incremented on backtrack via machine decision application

## Routing
- **On-success targets**: Handlers declare `onSuccess` transition; machine reads registry to determine next node
- **SwitchPolicy**: Remains for explicit policy switches (BFS/DFS/MaxCoverage/Focused/GoalOriented)
- **Green path**: EnsureDevice → ProvisionApp → LaunchOrAttach → Perceive → WaitIdle → SwitchPolicy → Stop

## Logging
- **Module**: "agent"
- **Actors**: "orchestrator", "worker", "subscription"
- **Context**: Always include `runId`, `workerId`, `nodeName`, `stepOrdinal`
- **Snapshots**: Log full AgentState for debugging

## Budget Enforcement
- **maxSteps**: Total step limit enforced in-machine
- **maxTimeMs**: Wall-clock time limit computed via machine `now()` dependency
- **maxTaps**: Interaction limit
- **outsideAppLimit**: Off-app action limit
- **restartLimit**: Backtrack/restart limit

## Testing
- Nodes are pure functions (testable in isolation)
- Machine unit tests reside in `engine/xstate/machine.test.ts`
- Integration testing via log verification in Encore dashboard
- Use fake adapters for unit tests

## XState Inspector (Dev)
- URL: `https://stately.ai/inspect?server=ws://localhost:5678`
- Start inspect server separately in development
- View real-time state transitions, guards, and actions

## Future Work
- Wire LangGraph.js for main loop nodes
- Implement full policy switching (BFS/DFS/MaxCoverage/Focused/GoalOriented)
- Add recovery dispositions
- Complete terminal node conditions

