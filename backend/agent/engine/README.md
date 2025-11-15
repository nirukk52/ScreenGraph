# Agent Engine

## Overview
The Agent Engine is a deterministic XState-based orchestration system that executes mobile test automation through a graph of composable nodes. It manages state transitions, retry/backtrack logic, budget enforcement, and persistence across the agent execution lifecycle.

## Architecture

### Core Components
- **XState Machine** (`xstate/agent.machine.ts`) - Primary orchestration loop with guards, actions, and actors
- **Node Registry** (`../nodes/registry.ts`) - Type-safe collection of all node handlers
- **Node Handlers** (`../nodes/**/*.handler.ts`) - Individual node capsules with execution logic
- **Transition Engine** (`xstate/agent.transition.engine.ts`) - Computes retry/backtrack/advance decisions
- **Machine Executor** (`xstate/agent.machine.executor.ts`) - Handles node execution and decision computation

### Node Execution Flow
```
┌─────────────────────────────────────────────────────────────┐
│  XState Machine Loop                                        │
│                                                             │
│  1. checkStop → Evaluate cancellation/budget                │
│  2. executing → Run node via runNode actor                  │
│  3. decide → Compute transition (SUCCESS/FAILURE)           │
│  4. Guards check decision.kind                              │
│  5. Transition: retry/backtrack/advance/terminal            │
│  6. Persist events + snapshot                               │
│  7. Loop                                                    │
└─────────────────────────────────────────────────────────────┘
```

## Node Graph Diagram

### Setup Phase (Green Path)
```
┌──────────────┐    SUCCESS    ┌──────────────┐    SUCCESS    ┌──────────────────┐
│ EnsureDevice │──────────────▶│ ProvisionApp │──────────────▶│ LaunchOrAttach   │
│              │                │              │                │                  │
│ - Create or  │                │ - Install    │                │ - Launch or      │
│   reuse      │                │   APK if     │                │   attach to      │
│   Appium     │                │   missing    │                │   app process    │
│   session    │                │ - Verify     │                │                  │
└──────┬───────┘                │   version    │                └────────┬─────────┘
       │                        └──────┬───────┘                         │
       │ FAILURE                       │ FAILURE                         │ SUCCESS
       │ (max 3 retries)               │ (max 3 retries)                 │
       │ backtrack=null                │ backtrack=EnsureDevice          │
       └──────▶ RETRY                  └──────▶ BACKTRACK                ▼
                with exponential                                  ┌──────────────┐
                backoff                                           │   Perceive   │
                                                                  │              │
                                                                  │ - Capture    │
                                                                  │   screenshot │
                                                                  │ - Get UI     │
                                                                  │   hierarchy  │
                                                                  └──────┬───────┘
                                                                         │ SUCCESS
                                                                         ▼
                                                                  ┌──────────────┐
                                                                  │   WaitIdle   │
                                                                  │              │
                                                                  │ - Wait for   │
                                                                  │   UI to      │
                                                                  │   stabilize  │
                                                                  └──────┬───────┘
                                                                         │ SUCCESS
                                                                         ▼
                                                                  ┌──────────────┐
                                                                  │     Stop     │
                                                                  │              │
                                                                  │ - Terminal   │
                                                                  │   node       │
                                                                  └──────────────┘
```

### Main Loop Phase (Future - Not Yet Wired)
```
┌───────────────────────────────────────────────────────────────────────────┐
│                    Main Exploration Loop                                  │
│                                                                           │
│  ┌──────────────┐    SUCCESS    ┌──────────────┐    SUCCESS             │
│  │ ChooseAction │──────────────▶│     Act      │──────────────▶         │
│  │              │                │              │                         │
│  │ - LLM picks  │                │ - Execute    │                         │
│  │   next       │                │   selected   │                         │
│  │   action     │                │   action     │                         │
│  └──────────────┘                └──────────────┘                         │
│         ▲                                  │                              │
│         │                                  │ SUCCESS                      │
│         │                                  ▼                              │
│         │                          ┌──────────────┐    SUCCESS           │
│         │                          │    Verify    │──────────────▶       │
│         │                          │              │                       │
│         │                          │ - Check      │                       │
│         │                          │   action     │                       │
│         │                          │   outcome    │                       │
│         │                          └──────────────┘                       │
│         │                                  │                              │
│         │                                  │ SUCCESS                      │
│         │                                  ▼                              │
│         │                          ┌──────────────────┐                  │
│         │                          │ DetectProgress   │                  │
│         │                          │                  │                  │
│         │                          │ - Check graph    │                  │
│         │                          │ - Assess         │                  │
│         │                          │   coverage       │                  │
│         │                          └────────┬─────────┘                  │
│         │                                   │ SUCCESS                    │
│         │                                   ▼                            │
│         │                          ┌──────────────────┐                  │
│         └──────────────────────────│  SwitchPolicy    │                  │
│                                    │                  │                  │
│                                    │ - BFS/DFS/       │                  │
│                                    │   MaxCoverage    │                  │
│                                    └────────┬─────────┘                  │
│                                             │                            │
│                                             │ Continue → ChooseAction    │
│                                             │ Done → Stop                │
└───────────────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Node Handler Pattern
Every node follows a standardized capsule pattern:
```typescript
{
  name: "NodeName",                          // Unique identifier
  buildInput(state, ctx): Input,             // Map state → node input
  execute(input, ports): Promise<Output>,    // Core business logic
  applyOutput(state, output): AgentState,    // Update state with results
  onSuccess: "NextNode" | null,              // Success transition target
  onFailure: {                               // Failure policy
    retry: {                                 // Retry configuration
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 5000
    },
    backtrackTo: "FallbackNode" | undefined  // Recovery node
  }
}
```

### 2. Retry Logic
- **Max 3 attempts** per node with exponential backoff
- **Deterministic jitter** using `randomSeed` from execution
- **Base delay**: 1000ms, **Max delay**: 5000ms
- **Retryable flag**: Nodes can declare failures as non-retryable

### 3. Backtrack Mechanism
- **ProvisionApp** → **EnsureDevice** (recreate session on provision failure)
- **Increments `restartsUsed`** counter on backtrack
- **Backtrack target** defined in node's `onFailure.backtrackTo`

### 4. Budget Enforcement
Machine enforces limits in-flight:
- **maxSteps**: Total step count (default: 100)
- **maxTimeMs**: Wall-clock execution time (default: 300000ms)
- **maxTaps**: Total interaction limit (default: 50)
- **outsideAppLimit**: Off-app action count (default: 10)
- **restartLimit**: Backtrack/restart count (default: 3)

### 5. State Management
- **AgentState**: Single source of truth (stepOrdinal, nodeName, counters, budgets)
- **Snapshots**: Saved after every node execution for deterministic resume
- **Events**: Append-only log with monotonic sequence numbers
- **Context**: Immutable configuration (device config, APK descriptor, policies)

### 6. Persistence Callbacks
Worker provides two callbacks to the machine:
```typescript
onPersist(state, events, nodeName)  // Save events + snapshot after each node
onAttempt(telemetry)                // Log attempt metadata for debugging
```

## File Structure
```
engine/
├── README.md                      # This file
├── types.ts                       # Node handler contracts and types
├── xstate/
│   ├── agent.machine.ts          # Main entry: createAgentMachine()
│   ├── agent.machine.factory.ts  # Machine configuration builder
│   ├── agent.machine.executor.ts # Node execution orchestrator
│   ├── agent.transition.engine.ts# Transition decision computation
│   ├── inspector.ts              # XState dev inspector setup
│   ├── machine.test.ts           # Machine unit tests
│   └── types.ts                  # Machine-specific types
├── XSTATE_CONSOLIDATION_COMPLETE.md
└── REFACTORING_SUMMARY.md
```

## Testing

### Unit Tests
- **Location**: `xstate/machine.test.ts`
- **Coverage**: Nominal path, cancellation, retry, budget exhaustion
- **Strategy**: Stub handlers with outcome scripts, no external dependencies

### Integration Tests
- **Method**: Log-based verification via Encore dashboard
- **Search**: Filter by `module=agent`, `actor=worker`, `runId`

### XState Inspector (Dev Only)
- **URL**: `https://stately.ai/inspect?server=ws://localhost:5678`
- **Enabled**: Automatically when `NODE_ENV !== "production"`
- **Purpose**: Visualize state transitions, guards, actions in real-time

## Node Categories

### Setup Nodes
- **EnsureDevice**: Create/reuse Appium session
- **ProvisionApp**: Install/verify APK
- **LaunchOrAttach**: Launch or attach to app process
- **Perceive**: Capture screen state (screenshot + XML)
- **WaitIdle**: Wait for UI stabilization

### Main Loop Nodes (Stubbed)
- **ChooseAction**: LLM selects next action
- **DetectProgress**: Assess coverage and graph exploration
- **SwitchPolicy**: Change exploration strategy (BFS/DFS/MaxCoverage)

### Terminal Nodes
- **Stop**: Clean termination with success/failure disposition

## Usage Example

```typescript
// 1. Worker creates machine
const machine = createAgentMachine({
  registry: buildNodeRegistry(() => generateId()),
  ports: agentPorts,
  context: agentContext,
  snapshot: initialState,
  onPersist: async (state, events, nodeName) => {
    await orchestrator.persistEventsAndSnapshot(runId, events, state);
  },
  onAttempt: (telemetry) => {
    logger.info("node attempt", telemetry);
  },
});

// 2. Start interpreter
const actor = createActor(machine);
actor.start();

// 3. Await terminal state
const result = await toPromise(actor);

// 4. Result contains final state and disposition
logger.info("run complete", {
  status: result.agentState.agentStatus,
  stepsTaken: result.agentState.stepOrdinal,
  outcome: result.output.disposition,
});
```

## Future Work
- Wire main loop nodes (ChooseAction → Act → Verify → DetectProgress → SwitchPolicy)
- Implement full policy switching (BFS/DFS/MaxCoverage/Focused/GoalOriented)
- Add recovery nodes for error handling
- Integrate LangGraph.js for complex decision flows

