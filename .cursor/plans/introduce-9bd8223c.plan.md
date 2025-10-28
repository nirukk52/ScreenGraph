<!-- 9bd8223c-18d3-414b-8bde-e12a804120b3 c0bbdba4-afd7-42f1-bdea-baf5f63b09e0 -->
# Remove Phase Concept: Unified Node Capsules + AgentRunner

### Objective
Eliminate the phase layer and drive orchestration using a single runner over a unified node registry. Each node becomes a self-contained capsule (handler, mappers, policy, tests). The worker uses an AgentRunner to execute the graph via NodeEngine decisions (next, retry/backoff, backtrack) without any phase-specific wiring.

### What changes
- Remove `backend/agent/phases/**` and replace with:
  - `backend/agent/nodes/**` as node capsules
  - `backend/agent/nodes/registry.ts` building a single `NodeRegistry<AgentNodeName, AgentPorts, AgentContext>`
  - `backend/agent/nodes/context.ts` building a single `AgentContext` for all nodes
  - `backend/agent/engine/agent-runner.ts` reusable runner that loops until termination
- Keep `NodeEngine` and `TransitionPolicy` unchanged; policies live per-node.
- Worker constructs ports/context/registry once and calls `AgentRunner.run()`.

### Target structure (first pass)
- backend/agent/
  - engine/
    - node-engine.ts (existing)
    - agent-runner.ts (new)
    - types.ts (extend with Agent-level unions only if needed)
  - nodes/
    - types.ts (export `AgentNodeName` union and shared node type helpers)
    - context.ts (build `AgentContext` from run data)
    - registry.ts (import node capsules and compose the registry)
    - setup/
      - EnsureDevice/
        - node.ts (executor + typed DTOs)
        - handler.ts (wiring + onSuccess/Failure policy reference)
        - mappers.ts (input/output mapping)
        - policy.ts (TransitionPolicy)
        - tests/
      - ProvisionApp/ (same pattern)
    - policy/ (existing policy nodes can remain as capsules later)
    - recovery/, terminal/, main/ (future nodes)
  - orchestrator/
    - worker.ts (refactor to use AgentRunner)

### Execution semantics
- Entry node is provided by Worker (e.g., `"EnsureDevice"`).
- `AgentRunner` loop:
  - Calls `engine.runOnce({ currentNode })`
  - Persists events and snapshots via callbacks
  - If `retryDelayMs`, sleeps then repeats same node
  - If `nextNode`, moves to it
  - Terminates when `nextNode === null` or an explicit terminal node is reached, or budgets/cancel say stop

### Termination rules
- Stop when:
  - `nextNode === null` (engine indicates stop), or
  - a terminal node name is configured (optional list in runner options), or
  - budgets exhausted or user cancellation (provided via `shouldStop()` callback)

### Logging & typing
- Keep `encore.dev/log` with contextual fields `{ module, actor, runId, nodeName, stepOrdinal, iterationOrdinalNumber }`.
- Every node capsule defines explicit DTOs and comments on purpose.
- No `any`; use unions/enums for states and identifiers.

### Compatibility
- No API shape changes; internal movement only.
- Keep NodeEngine generic; only the registry, context, and worker wiring change.

### Acceptance criteria
- EnsureDevice SUCCESS transitions to ProvisionApp.
- EnsureDevice FAILURE retries up to 3 times with backoff, then backtrack/stop per policy.
- Worker logs show attempt counts and backoff timing.
- Removing phases does not change behavior, only structure.


### To-dos

- [x] Finalize node capsule structure and naming conventions
- [x] Create AgentRunner types in engine/agent-runner.ts
- [x] Create engine/agent-runner.ts implementing AgentRunner loop
- [x] Refactor orchestrator/worker.ts to use AgentRunner with callbacks
- [x] Create nodes/setup/EnsureDevice capsule (node, handler, mappers, policy)
- [x] Create nodes/setup/ProvisionApp capsule (node, handler, mappers, policy)
- [x] Create nodes/registry.ts importing handlers from node capsules
- [x] Create nodes/types.ts with AgentNodeName, AgentContext, AgentPorts
- [x] Create nodes/context.ts for AgentContext builder
- [x] Remove backend/agent/phases/** directory
- [x] Remove old node files from nodes/setup/
- [x] Add tests for AgentRunner: retry/backtrack/termination/budget/cancel
- [x] Update agent/CLAUDE.md to new architecture
- [x] Create NODE_CAPSULES_MIGRATION.md documentation
- [x] Create IMPLEMENTATION_COMPLETE.md summary
- [x] Fix CLI demo imports to use new capsule structure
- [x] Create FIXES_APPLIED.md documenting CLI demo fixes