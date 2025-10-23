# FR-005: Outbox Publisher Job

**Status:** 📋 Todo  
**Priority:** P0 (Critical)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Medium

---

## 📝 Description
Implement background job that polls `run_outbox` table every 200ms and publishes unpublished events to Redis Pub/Sub in order, ensuring deterministic streaming.

---

## 🎯 Acceptance Criteria
- [ ] Encore cron job or separate worker that runs every 200ms
- [ ] Query: `SELECT * FROM run_outbox WHERE published_at IS NULL ORDER BY id ASC LIMIT 100`
- [ ] For each event: Publish to Redis topic `run:{runId}`
- [ ] After successful publish: Update `published_at` timestamp
- [ ] Handle Redis publish failures with retry (max 3 attempts)
- [ ] Log metrics: events published, latency, failures
- [ ] Graceful shutdown: Finish current batch before stopping

---

## 🔗 Dependencies
- Redis Pub/Sub setup
- `run_outbox` table (FR-007)
- Orchestrator must write to outbox (FR-004)

---

## 🧪 Testing Requirements
- [ ] Unit test: Publishes events in order
- [ ] Unit test: Marks events as published after success
- [ ] Unit test: Retries on Redis failure
- [ ] Integration test: Events appear in SSE stream within 500ms
- [ ] Load test: Handles 1000 events/second across multiple runs
- [ ] Test: No duplicate publications

---

## 📋 Technical Notes
**Why Outbox Pattern?**
- Decouples orchestrator (write to DB) from streaming (publish to Redis)
- Guarantees event ordering (sequential DB inserts)
- Enables replay from source of truth (DB)
- Handles Redis downtime gracefully (events queued in outbox)

**Publisher Logic:**
```typescript
async function publishBatch() {
  const events = await db.query(
    'SELECT * FROM run_outbox WHERE published_at IS NULL ORDER BY id ASC LIMIT 100'
  );
  
  for (const event of events) {
    try {
      await redis.publish(`run:${event.run_id}`, JSON.stringify(event.payload));
      await db.query('UPDATE run_outbox SET published_at = NOW() WHERE id = ?', [event.id]);
    } catch (err) {
      // Log and continue (retry next poll)
    }
  }
}
```

**Polling Interval Rationale:**
- 200ms = Max 200ms latency for events to reach UI
- Balances responsiveness vs DB load
- Batch size 100 = Can handle 500 events/sec per poll cycle

---

## 🏷️ Labels
`backend`, `worker`, `outbox`, `redis`, `milestone-1`, `p0`
