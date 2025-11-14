# FR-004: Orchestrator Worker with Demo Nodes

**Status:** 📋 Todo  
**Priority:** P0 (Critical)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Large

---

## 📝 Description
Implement core orchestrator worker that executes runs using a sequential state machine with 3 demo nodes: Start → Process → Finish. Emit events at each node transition.

---

## 🎯 Acceptance Criteria
- [ ] Encore queue handler for `RunJob` messages
- [ ] State machine with 3 demo nodes:
  - `StartNode`: Emits `RUN_STARTED` event
  - `ProcessNode`: Waits 2 seconds, emits `PROCESSING` event
  - `FinishNode`: Emits `RUN_COMPLETED` event
- [ ] Each node writes events to `run_events` table with sequential IDs
- [ ] Each node transition is a single database transaction
- [ ] Worker checks `runs.cancelled_at` flag before each node
- [ ] On cancellation, emits `RUN_CANCELLED` and stops
- [ ] On error, emits `RUN_FAILED` event with error details
- [ ] Updates `runs.status` after each major transition
- [ ] Worker completion marks run as terminal state

---

## 🔗 Dependencies
- `runs` and `run_events` tables (FR-006)
- Encore queue configuration

---

## 🧪 Testing Requirements
- [ ] Unit test: State machine executes all nodes in order
- [ ] Unit test: Cancellation flag stops execution
- [ ] Unit test: Node error triggers `RUN_FAILED` event
- [ ] Integration test: Full run lifecycle with event verification
- [ ] Test: Events are written in sequential order
- [ ] Test: Worker retries on transient failures

---

## 📋 Technical Notes
**State Machine Pseudocode:**
```typescript
async function executeOrchestrator(runId: string) {
  try {
    checkCancellation();
    await executeNode("Start");
    
    checkCancellation();
    await executeNode("Process");
    
    checkCancellation();
    await executeNode("Finish");
    
    markComplete();
  } catch (err) {
    if (err instanceof CancellationError) {
      emitEvent("RUN_CANCELLED");
    } else {
      emitEvent("RUN_FAILED", { error: err.message });
    }
  }
}
```

**Event Emission:**
Each `emitEvent()` call:
1. Inserts row into `run_events` with auto-increment ID
2. Returns event ID for potential use in next node
3. Does NOT publish to Redis (that's outbox job's responsibility)

**Future Nodes (M2+):**
- Perceive, Enumerate, Choose, Act, Verify, Persist, Detect, Continue

---

## 🏷️ Labels
`backend`, `orchestrator`, `worker`, `milestone-1`, `p0`
