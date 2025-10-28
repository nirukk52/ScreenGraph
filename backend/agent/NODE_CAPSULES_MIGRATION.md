# Node Capsules Architecture Migration

## Summary
Removed phase concept and refactored to node capsules with unified AgentRunner orchestration.

## Changes Made

### New Structure
- `backend/agent/nodes/types.ts` - AgentNodeName union, AgentContext, AgentPorts
- `backend/agent/nodes/context.ts` - AgentContext builder
- `backend/agent/nodes/registry.ts` - Unified NodeRegistry builder
- `backend/agent/nodes/setup/EnsureDevice/` - Node capsule with node.ts, handler.ts, mappers.ts, policy.ts
- `backend/agent/nodes/setup/ProvisionApp/` - Node capsule with node.ts, handler.ts, mappers.ts, policy.ts
- `backend/agent/engine/agent-runner.ts` - AgentRunner loop for orchestrating next/retry/backtrack

### Removed
- `backend/agent/phases/**` - Entire phase directory removed
- `backend/agent/nodes/setup/ensure-device.ts` - Moved to capsule
- `backend/agent/nodes/setup/provision-app.ts` - Moved to capsule
- Other old node files

### Refactored
- `backend/agent/orchestrator/worker.ts` - Now uses AgentRunner instead of inline loop
- `backend/agent/CLAUDE.md` - Updated architecture documentation

## Benefits
1. **Cohesion**: Each node capsule contains all related logic (executor, handler, mappers, policy, tests)
2. **Modularity**: Easy to add new nodes by creating a new capsule folder
3. **Type Safety**: Unified AgentNodeName, AgentContext, AgentPorts across all nodes
4. **Reusability**: AgentRunner is generic and handles retry/backtrack for any node graph
5. **Clarity**: No phase boundaries; nodes compose naturally via registry

## Key Components

### AgentRunner
```typescript
const runner = new AgentRunner(engine);
const result = await runner.run({
  state: initialState,
  entryNode: "EnsureDevice",
  ports, ctx, seed,
  shouldStop: async () => { /* budget/cancel check */ },
  callbacks: { onAttempt, onPersist }
});
```

### Node Capsule Pattern
Each node capsule exports:
- `node.ts` - Executor function with typed Input/Output DTOs
- `handler.ts` - Creates NodeHandler with mappers and policy reference
- `mappers.ts` - Input/output mapping functions
- `policy.ts` - TransitionPolicy for retry/backtrack behavior

### Example: EnsureDevice Capsule
```typescript
// handler.ts
export function createEnsureDeviceHandler(generateId: () => string) {
  return {
    name: "EnsureDevice",
    buildInput: buildEnsureDeviceInput,
    execute: async (input, ports) => ensureDevice(input, ports.sessionPort, generateId),
    applyOutput: applyEnsureDeviceOutput,
    onSuccess: "ProvisionApp",
    onFailure: EnsureDevicePolicy,
  };
}
```

## Migration Impact
- No API changes; internal refactoring only
- NodeEngine and TransitionPolicy unchanged
- Worker behavior preserved with cleaner orchestration
- Retry/backtrack logic now centralized in AgentRunner

## Next Steps
- Migrate remaining nodes (main, policy, recovery, terminal) to capsule pattern
- Add unit tests for node capsules
- Add AgentRunner integration tests



