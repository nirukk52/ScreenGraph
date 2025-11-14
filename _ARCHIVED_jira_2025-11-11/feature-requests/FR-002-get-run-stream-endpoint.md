# FR-002: GET /run/:id/stream Endpoint

**Status:** 📋 Todo  
**Priority:** P0 (Critical)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Large

---

## 📝 Description
Create Server-Sent Events (SSE) endpoint for streaming run events in real-time with support for reconnection and backfill of missed events.

---

## 🎯 Acceptance Criteria
- [ ] `GET /run/:id/stream` endpoint with SSE response
- [ ] Returns 404 if run ID not found
- [ ] Streams events from Redis Pub/Sub topic `run:{id}`
- [ ] Supports `?lastEventId=X` query param for backfill
- [ ] Backfills missed events from `run_events` table on reconnect
- [ ] Each SSE message has unique event ID (sequential)
- [ ] Sends heartbeat every 30s to prevent connection timeout
- [ ] Closes stream after terminal event (`COMPLETED` or `FAILED`)
- [ ] Proper CORS headers for cross-origin requests
- [ ] Connection cleanup on client disconnect

---

## 🔗 Dependencies
- Redis Pub/Sub integration
- `run_events` table (FR-006)
- Outbox publisher (FR-005)

---

## 🧪 Testing Requirements
- [ ] Unit test: Stream sends events in order
- [ ] Unit test: Backfill fetches missed events correctly
- [ ] Integration test: Client reconnects and receives backfill
- [ ] Integration test: Stream closes after terminal event
- [ ] Load test: 50 concurrent SSE connections per run
- [ ] Test: Heartbeat keeps connection alive

---

## 📋 Technical Notes
**SSE Message Format:**
```
id: 42
event: run-event
data: {"type":"NODE_START","nodeType":"Perceive","timestamp":"2025-10-23T..."}

id: 43
event: run-event
data: {"type":"SCREENSHOT_CAPTURED","url":"https://...","timestamp":"..."}
```

**Backfill Logic:**
1. Client sends `Last-Event-ID` header or `?lastEventId=42` query param
2. Server queries `run_events` WHERE `id > 42` ORDER BY `id` ASC
3. Server sends buffered events before subscribing to live topic
4. Server switches to live Redis stream after backfill complete

**Event Types:**
- `RUN_STARTED`, `NODE_START`, `NODE_COMPLETE`, `SCREENSHOT_CAPTURED`, `ACTION_EXECUTED`, `ERROR`, `RUN_COMPLETED`, `RUN_FAILED`, `RUN_CANCELLED`

---

## 🏷️ Labels
`api`, `backend`, `sse`, `streaming`, `milestone-1`, `p0`
