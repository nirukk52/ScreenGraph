# FR-003: POST /crawl/:id/cancel Endpoint

**Status:** 📋 Todo  
**Priority:** P1 (High)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Small

---

## 📝 Description
Create API endpoint to gracefully cancel a running crawl, stop orchestrator worker, and emit terminal `CRAWL_CANCELLED` event.

---

## 🎯 Acceptance Criteria
- [ ] `POST /crawl/:id/cancel` endpoint defined
- [ ] Returns 404 if crawl ID not found
- [ ] Returns 400 if crawl already in terminal state
- [ ] Updates `crawl_runs.status` to `CANCELLED`
- [ ] Signals orchestrator worker to stop (via Redis or DB flag)
- [ ] Orchestrator emits `CRAWL_CANCELLED` event
- [ ] Returns `{ crawlId, status: "CANCELLED", cancelledAt }` response
- [ ] Idempotent (multiple cancel requests return same result)

---

## 🔗 Dependencies
- Orchestrator worker must check cancellation flag (FR-004)
- `crawl_runs` table (FR-006)

---

## 🧪 Testing Requirements
- [ ] Unit test: Cancel request updates DB and returns 200
- [ ] Unit test: Cancel non-existent crawl returns 404
- [ ] Unit test: Cancel already-cancelled crawl is idempotent
- [ ] Integration test: Orchestrator stops within 5 seconds of cancel
- [ ] Test: Terminal event emitted after cancellation

---

## 📋 Technical Notes
**Cancellation Mechanism:**
Option 1: Set `crawl_runs.cancelled_at` timestamp, orchestrator polls DB  
Option 2: Publish `cancel:{crawlId}` Redis message, orchestrator subscribes  
Option 3: Use Encore queue cancellation API (if available)

**Recommended:** Option 1 (DB flag) for simplicity in M1.

**Response Schema:**
```typescript
interface CancelCrawlResponse {
  crawlId: string;
  status: "CANCELLED";
  cancelledAt: Date;
}
```

---

## 🏷️ Labels
`api`, `backend`, `milestone-1`, `p1`
