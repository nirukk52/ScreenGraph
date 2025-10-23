# FR-004: Orchestrator Worker with Demo Nodes

**Status:** 📋 Todo  
**Priority:** P0 (Critical)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Large

---

## 📝 Description
Implement core orchestrator worker that executes crawl runs using a sequential state machine with 3 demo nodes: Start → Process → Finish. Emit events at each node transition.

---

## 🎯 Acceptance Criteria
- [ ] Encore queue handler for `CrawlJob` messages
- [ ] State machine with 3 demo nodes:
  - `StartNode`: Emits `CRAWL_STARTED` event
  - `ProcessNode`: Waits 2 seconds, emits `PROCESSING` event
  - `FinishNode`: Emits `CRAWL_COMPLETED` event
- [ ] Each node writes events to `crawl_events` table with sequential IDs
- [ ] Each node transition is a single database transaction
- [ ] Worker checks `crawl_runs.cancelled_at` flag before each node
- [ ] On cancellation, emits `CRAWL_CANCELLED` and stops
- [ ] On error, emits `CRAWL_FAILED` event with error details
- [ ] Updates `crawl_runs.status` after each major transition
- [ ] Worker completion marks crawl as terminal state

---

## 🔗 Dependencies
- `crawl_runs` and `crawl_events` tables (FR-006)
- Encore queue configuration

---

## 🧪 Testing Requirements
- [ ] Unit test: State machine executes all nodes in order
- [ ] Unit test: Cancellation flag stops execution
- [ ] Unit test: Node error triggers `CRAWL_FAILED` event
- [ ] Integration test: Full crawl lifecycle with event verification
- [ ] Test: Events are written in sequential order
- [ ] Test: Worker retries on transient failures

---

## 📋 Technical Notes
**State Machine Pseudocode:**
```typescript
async function executeOrchestrator(crawlId: string) {
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
      emitEvent("CRAWL_CANCELLED");
    } else {
      emitEvent("CRAWL_FAILED", { error: err.message });
    }
  }
}
```

**Event Emission:**
Each `emitEvent()` call:
1. Inserts row into `crawl_events` with auto-increment ID
2. Returns event ID for potential use in next node
3. Does NOT publish to Redis (that's outbox job's responsibility)

**Future Nodes (M2+):**
- Perceive, Enumerate, Choose, Act, Verify, Persist, Detect, Continue

---

## 🏷️ Labels
`backend`, `orchestrator`, `worker`, `milestone-1`, `p0`
