# Agent Orchestration: NodeEngine + Worker Loop

## Overview

The orchestration system coordinates agent node execution with forward progression, bounded retries, and backtracking. It preserves deterministic control flow through persistent snapshots and typed transitions.

## Components

### 1. NodeEngine (`node-engine.ts`)

**PURPOSE**: Pure control plane for node execution and transition decisions.

**Key Types**:
- `NodeRegistry`: Maps node names to handlers (buildInput/execute/applyOutput)
- `TransitionPolicy`: Retry (maxAttempts, baseDelayMs, maxDelayMs) and optional backtrackTo
- `NodeHandler<InputT, OutputT, N>`: Typed executor contract

**Responsibilities**:
- Execute nodes via registry
- Compute retry delays (exponential backoff with deterministic jitter)
- Decide transitions: success → nextNode, failure → retry or backtrackTo
- Terminal failures → set status="failed", stopReason="crash"

**Backtracking Example**:
```typescript
// ProvisionApp failure after 3 retries → EnsureDevice
if (attempt >= retry.maxAttempts && backtrackTo) {
  return {
    state: {
      ...updated,
      nodeName: backtrackTo,
      iterationOrdinalNumber: 0,
      counters: { ...updated.counters, restartsUsed: updated.counters.restartsUsed + 1 },
    },
    nextNode: backtrackTo,
    backtracked: true,
  };
}
```

### 2. NodeRegistry (`node-registry.ts`)

**PURPOSE**: Factory wiring EnsureDevice → ProvisionApp handlers.

**Exports**:
- `buildNodeRegistry(sessionPort, generateId)`: Returns registry with both handlers
- `createNodeEngine(sessionPort, generateId)`: Returns ready-to-use engine

**Handler Pattern**:
```typescript
{
  name: "EnsureDevice",
  buildInput(state, ctx) { /* AgentState → EnsureDeviceInput */ },
  async execute(input, ports) { /* call node function */ },
  applyOutput(prev, output) { /* mutate state fields */ },
  onSuccess: "ProvisionApp",
  onFailure: { retry: {...}, backtrackTo: undefined },
}
```

### 3. Orchestrator (`orchestrator.ts`)

**PURPOSE**: Persistence spine (IDs, events, snapshots).

**New Methods**:
- `saveSnapshot(state)`: Persists AgentState for current stepOrdinal

**Uses**:
- `agentStateDb.saveSnapshot()` (upsert semantics via ON CONFLICT)
- Enables deterministic resume/backtracking from snapshots

### 4. AgentWorker (`worker.ts`)

**PURPOSE**: Long-lived loop with lease heartbeats, cancellation, budget enforcement.

**Updated Loop**:
```typescript
// Minimal scaffold: budgets + cancel checks; engine ready for wire-up
const engine = new NodeEngine(createEmptyRegistry());
await orchestrator.saveSnapshot(state);

const budgetExceeded =
  state.counters.stepsTotal >= budgets.maxSteps ||
  elapsedMs >= budgets.maxTimeMs ||
  state.counters.restartsUsed >= budgets.restartLimit;

if (budgetExceeded) {
  state = { ...state, status: "failed", stopReason: "budget_exhausted" };
  await orchestrator.saveSnapshot(state);
  return { state, status: "failed", stopReason: state.stopReason };
}
```

## Usage Example (Planned)

```typescript
// In subscription handler:
const sessionPort = new WebDriverIOSessionAdapter();
const engine = createNodeEngine(sessionPort, orchestrator.generateId.bind(orchestrator));

const ctx: EngineContext = {
  ensureDevice: { deviceConfiguration: job.deviceConfig, driverReusePolicy: "REUSE_OR_CREATE" },
  provisionApp: { installationPolicy: "INSTALL_IF_MISSING", applicationUnderTestDescriptor: job.appDescriptor },
};

// In worker loop:
const result = await engine.runOnce({ state, nowIso, seed, ports: { sessionPort }, ctx });
await orchestrator.recordNodeEvents(state, result.nodeName, result.events);
await orchestrator.saveSnapshot(result.state);
```

## Next Steps

1. Wire engine in Worker (replace `createEmptyRegistry()` with `buildNodeRegistry()`)
2. Pass `EngineContext` from subscription (device config, APK descriptor)
3. Implement full loop with `engine.runOnce()` calls
4. Add retry sleep when `retryDelayMs > 0`
5. Emit `agent.node.started/finished` around each `runOnce()` call

## Architecture Notes

- **Orchestrator**: Persistence only (no business logic)
- **Worker**: Lifecycle (cancel, budgets, heartbeats)
- **NodeEngine**: Control flow (transitions, retries, backtracking)
- **Nodes**: Pure executors (no orchestration awareness)

This separation ensures testability and deterministic resumption.

