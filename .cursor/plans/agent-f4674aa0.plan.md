<!-- f4674aa0-f030-4f2a-9923-05cf81d3e017 8078fefb-5784-4544-aee2-25de8430be11 -->
# Orchestrating Agent Nodes with AgentState (forward/backtrack/retry)

### What we’ll build

- **Deterministic node engine**: `AgentWorker` drives the loop; `Orchestrator` persists events/snapshots and IDs.
- **Node registry**: Typed mapping of `nodeName` to executor, input/output mappers, and transitions.
- **Semantics**: Forward progression, bounded retries (max 3, exponential backoff), and backtracking (e.g., on `ProvisionApp` failure → `EnsureDevice`).
- **Initial path**: `EnsureDevice` → `ProvisionApp`.

### Roles & boundaries

- **Orchestrator (`backend/agent/orchestrator/orchestrator.ts`)**: Initialize from snapshot, generate IDs/sequences, record node start/finish + node-emitted events, save snapshots, finalize run (status, terminal event). Keep it—don’t replace with LangGraph; it owns persistence invariants.
- **Worker (`backend/agent/orchestrator/worker.ts`)**: Own the long-lived loop: cancellation/budgets, pick node, execute via registry, apply transitions, retry/backtrack, and delegate persistence to Orchestrator each step.
- **Nodes (`backend/agent/nodes/**`)**: Pure, typed executors. Input from state; output updates state and yields domain events. No cross-node calls; they only return output and events.

### AgentState semantics for control flow

- **nodeName**: Current node identity. Drives which executor runs next.
- **stepOrdinal**: Increment on every node attempt (including retries/backtracks). Guarantees total ordering.
- **iterationOrdinalNumber**: Attempt counter for the current node. Reset to 0 on node change; increment on retry/backtrack cycles touching that node again.
- **status/stopReason**: Updated only when run ends (completed/failed/canceled).
- **timestamps**: `updatedAt` bumped every step; `createdAt` immutable.
- **counters**: `errors++` on failure; `restartsUsed++` when backtracking to `EnsureDevice`; stop if `restartLimit` exhausted.
- **budgets**: Enforced each loop (maxSteps, maxTimeMs, maxTaps, outsideAppLimit, restartLimit).
- **randomSeed**: Advance each step using `Orchestrator.nextSeed()`; use for backoff jitter.

### Node registry & transitions

- **NodeName union** (example subset): `"EnsureDevice" | "ProvisionApp"` (extend later with setup/main nodes).
- **Registry entry**: `{ run(input, ports) -> { output, events }; onSuccess: nextNode; onFailure: { retry: { maxAttempts: 3, backoff: exp, jitter }, backtrackTo?: "EnsureDevice" } }`.
- **Input mappers**: Convert `AgentState` → `EnsureDeviceInput` / `ProvisionAppInput` (typed). Include required context (e.g., `deviceRuntimeContextId`).
- **Output appliers**: Apply `EnsureDeviceOutput` to `AgentState` (e.g., set `deviceRuntimeContextId`), apply `ProvisionAppOutput` fields to state as needed.

### Loop algorithm (high-level)

1. Check cancellation and budgets; end if violated.
2. From `state.nodeName`, fetch registry entry and build typed input from `AgentState`.
3. Emit `agent.node.started` (via Orchestrator), then run node executor.
4. Persist node-emitted events via Orchestrator; mark `agent.node.finished` with outcome.
5. Apply output to state; bump `stepOrdinal`, adjust `iterationOrdinalNumber`, advance `randomSeed`, update counters.
6. Transition:

- **Success**: `nodeName = onSuccess` and reset `iterationOrdinalNumber = 0`.
- **Failure**: If attempts < 3 and `retryable`, retry same node with exponential backoff (jittered). Else, if `backtrackTo` present, set `nodeName = backtrackTo`, `restartsUsed++`, `iterationOrdinalNumber++`. Else, mark run failed.

7. Save snapshot each step via Orchestrator; loop until end.

### Example: EnsureDevice → ProvisionApp

- **Start**: `nodeName = "EnsureDevice"`; run with `driverReusePolicy: REUSE_OR_CREATE`.
- **On success**: store `deviceRuntimeContextId` in state; next `nodeName = "ProvisionApp"`.
- **ProvisionApp failure**:
- Attempt retry (up to 3, exp backoff, jitter). If still failing:
- Backtrack: `nodeName = "EnsureDevice"`, `restartsUsed++`, then proceed forward again to `ProvisionApp`.
- If `restartLimit` hit or total steps/time exceeded, end with `status = failed`, `stopReason = no_progress` or `crash`.

### Persistence & events

- Use Orchestrator to:
- Emit `agent.node.started/finished` per node.
- Append every node-emitted domain event.
- Save snapshot after each step (with latest sequence) for resume/backtrack determinism.

### Cancellation & completion

- Cancellation: Check at loop head; if requested, set `status = canceled`, `stopReason = user_cancelled`, persist, and exit.
- Completion: When main graph’s terminal condition is reached (later LangGraph), call `Orchestrator.finalizeRun` with `stopReason = success`.

### LangGraph guidance

- **Don’t replace Orchestrator** (it owns IDs, events, snapshots, CAS updates). Instead, **swap the registry’s transition logic for a LangGraph runner** later. Keep the Worker loop and Orchestrator unchanged; adapt a LangGraph executor to produce the same typed transitions and outputs.

### Initial transitions to implement now

- `EnsureDevice (success) → ProvisionApp`
- `ProvisionApp (failure, after retries) → EnsureDevice`
- `ProvisionApp (success) → LaunchOrAttach` (stub target; can be added later)

### Stop conditions

- `budgets.maxSteps` or `budgets.maxTimeMs` exceeded
- `budgets.restartLimit` exceeded during backtracking
- `errors` over a safety threshold (optional)

### Acceptance criteria

- Can run a single loop where `EnsureDevice` executes, persists, and transitions to `ProvisionApp`.
- On induced `ProvisionApp` failure, observe retry (3 attempts) with backoff, then backtrack to `EnsureDevice`, then forward again.
- Snapshots and events present for each step; `stepOrdinal` strictly increasing; `iterationOrdinalNumber` reflects attempts.

### To-dos

- [ ] Create NodeEngine types and registry for node executors and transitions
- [ ] Add typed input mappers and output appliers for EnsureDevice/ProvisionApp
- [ ] Replace executeAgentLoop body to drive registry with budgets/cancel checks
- [ ] Implement per-node retry (max 3, exponential backoff with jitter)
- [ ] Add backtrack path: ProvisionApp failure → EnsureDevice; increment restartsUsed
- [ ] Persist node start/finish and node-emitted events; save snapshot each step
- [ ] Run demo path EnsureDevice→ProvisionApp with induced failure and observe behavior