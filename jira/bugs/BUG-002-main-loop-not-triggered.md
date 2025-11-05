## BUG-002 — Main loop not triggered after Perceive node completes

### Summary
After a run successfully executes the setup phase (EnsureDevice → ProvisionApp → LaunchOrAttach → WaitIdle) and captures the initial splash screen via the Perceive node, the agent does not transition into the main exploration loop. The run emits `agent.event.screen_perceived` but then halts without continuing to EnumerateActions, ChooseAction, Act, or Verify nodes.

### Severity / Impact
- **Severity**: Critical (P0) — Blocks graph population and exploration
- **Impact**: 
  - Agent runs terminate after a single Perceive step
  - Graph tables remain empty (only one screen discovered, no actions or edges)
  - Frontend cannot render dynamic graph evolution
  - Main loop nodes (8 nodes) are never exercised

### Environment
- **Backend**: `encore run` (local dev)
- **Agent Version**: Current main branch
- **XState Machine**: `backend/agent/engine/xstate/agent.machine.ts`
- **Node Handlers**: Setup nodes complete successfully; main loop nodes not invoked

### Steps to Reproduce
1. Start backend: `cd backend && encore run`
2. Trigger a run via `POST /run` with valid APK and Appium server
3. Observe logs:
   - Setup nodes execute: `EnsureDevice` → `ProvisionApp` → `LaunchOrAttach` → `WaitIdle` → `Perceive`
   - Events emitted: `agent.event.screenshot_captured`, `agent.event.ui_hierarchy_captured`, `agent.event.screen_perceived`
   - Graph projector receives events and writes to `screens` table (single screen)
4. Check run status: `completed` or `running` indefinitely
5. Query `run_events`: no `EnumerateActions` or subsequent main loop events

### Expected Result
- After Perceive completes, agent should transition to `EnumerateActions` node
- Main loop should cycle: Perceive → EnumerateActions → ChooseAction → Act → Verify → DetectProgress → ShouldContinue
- Run should continue until budget exhausted (maxSteps) or terminal condition met
- Graph should accumulate screens, actions, and edges over multiple iterations

### Actual Result
- Perceive executes once and run stops
- No main loop nodes are invoked
- Only 1 screen persisted in `screens` table; `actions` and `edges` remain empty
- Graph projector has nothing to project beyond initial Perceive event
- Frontend graph stream shows only splash screen discovery, then silence

### Suspected Root Cause
Potential causes (to investigate):
1. **Missing transition logic**: XState machine may not have proper `onSuccess` target from Perceive → EnumerateActions
2. **ShouldContinue routing**: After setup, the decision node may route to STOP instead of CONTINUE
3. **Handler registration**: EnumerateActions handler may not be registered in NodeRegistry
4. **Budget check**: maxSteps budget may be exhausted prematurely (default too low?)
5. **Snapshot corruption**: State snapshot after Perceive may not propagate iteration counter correctly

### Attachments / Logs
Example log excerpt (expected but missing):
```
[agent] node.started { nodeName: "EnumerateActions", stepOrdinal: 5 }
[agent] node.finished { nodeName: "EnumerateActions", outcomeStatus: "SUCCESS" }
```

Actual last log:
```
[agent] node.finished { nodeName: "Perceive", stepOrdinal: 4, outcomeStatus: "SUCCESS" }
[agent] run.finished { runId: "...", status: "completed", stopReason: "???" }
```

### Proposed Fix / Next Steps
1. **Verify XState transitions**:
   - Check `backend/agent/engine/xstate/agent.machine.ts` for Perceive → next node routing
   - Confirm `onSuccess` target for Perceive handler points to EnumerateActions (or ShouldContinue)
2. **Check NodeRegistry**:
   - Ensure all main loop nodes (EnumerateActions, ChooseAction, Act, Verify, DetectProgress, ShouldContinue) are registered
   - Verify handlers exist in `backend/agent/nodes/main/`
3. **Review ShouldContinue logic**:
   - Inspect decision logic in ShouldContinue node to confirm CONTINUE routing
   - Ensure iteration counter increments properly
4. **Budget validation**:
   - Check `maxSteps` default in policy (should be ≥50 for MVP)
   - Log counters at each step to trace exhaustion
5. **Add integration test**:
   - Test that verifies at least 3 iterations of main loop execute
   - Assert that `run_events` contains EnumerateActions, Act events

### Owner / Requestor
- **Reported by**: Founder QA
- **Suggested Owner**: Agent orchestration team (backend)
- **Priority**: P0 (blocks graph MVP and FR-009)

---

### Notes
- This bug blocks FR-009 (Graph Stream Endpoint) from being useful, as graph will only ever have 1 screen
- Main loop implementation is stubbed per README; may need wiring to real LLM/action ports
- Related: Agent README states "Main Loop (Stubbed - 3 iterations)" — need to un-stub and wire handlers

