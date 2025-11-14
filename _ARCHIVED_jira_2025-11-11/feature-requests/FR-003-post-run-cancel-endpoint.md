# FR-003: POST /run/:id/cancel Endpoint

**Status:** 📋 Todo  
**Priority:** P1 (High)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Small

---

## 📝 Description
Create API endpoint to gracefully cancel a running run, stop orchestrator worker, and emit terminal `RUN_CANCELLED` event.

---

## 🎯 Acceptance Criteria
- [ ] `POST /run/:id/cancel` endpoint defined
- [ ] Returns 404 if run ID not found
- [ ] Returns 400 if run already in terminal state
- [ ] Updates `runs.status` to `CANCELLED`
- [ ] Signals orchestrator worker to stop (via Redis or DB flag)
- [ ] Orchestrator emits `RUN_CANCELLED` event
- [ ] Returns `{ runId, status: "CANCELLED", cancelledAt }` response
- [ ] Idempotent (multiple cancel requests return same result)

---

## 🔗 Dependencies
- Orchestrator worker must check cancellation flag (FR-004)
- `runs` table (FR-006)

---

## 🧪 Testing Requirements
- [ ] Unit test: Cancel request updates DB and returns 200
- [ ] Unit test: Cancel non-existent run returns 404
- [ ] Unit test: Cancel already-cancelled run is idempotent
- [ ] Integration test: Orchestrator stops within 5 seconds of cancel
- [ ] Test: Terminal event emitted after cancellation

---

## 📋 Technical Notes
**Cancellation Mechanism:**
Option 1: Set `runs.cancelled_at` timestamp, orchestrator polls DB  
Option 2: Publish `cancel:{runId}` Redis message, orchestrator subscribes  
Option 3: Use Encore queue cancellation API (if available)

**Recommended:** Option 1 (DB flag) for simplicity in M1.

**Response Schema:**
```typescript
interface CancelRunResponse {
  runId: string;
  status: "CANCELLED";
  cancelledAt: Date;
}
```

---

## 🏷️ Labels
`api`, `backend`, `milestone-1`, `p1`
