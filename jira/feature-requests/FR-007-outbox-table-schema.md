# FR-007: Database Schema for Crawl Outbox

**Status:** 📋 Todo  
**Priority:** P0 (Critical)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Small

---

## 📝 Description
Define `crawl_outbox` table for implementing outbox pattern to guarantee event ordering and reliable Redis publishing.

---

## 🎯 Acceptance Criteria
- [ ] `crawl_outbox` table created with columns:
  - `id` (BIGSERIAL, primary key)
  - `crawl_id` (UUID, foreign key to crawl_runs.id)
  - `event_type` (string)
  - `payload` (JSONB)
  - `created_at` (timestamp, default NOW())
  - `published_at` (timestamp, nullable)

- [ ] Index on `(published_at, id)` for efficient polling of unpublished events
- [ ] Index on `crawl_id` for per-crawl queries

---

## 🔗 Dependencies
- `crawl_runs` table (FR-006)
- Outbox publisher job (FR-005)

---

## 🧪 Testing Requirements
- [ ] Test: Insert event and query unpublished events
- [ ] Test: Update published_at after processing
- [ ] Performance test: Poll query on 100K rows < 50ms

---

## 📋 Technical Notes
**Migration File:** `backend/migrations/002_crawl_outbox.sql`

```sql
CREATE TABLE crawl_outbox (
  id BIGSERIAL PRIMARY KEY,
  crawl_id UUID NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX idx_crawl_outbox_unpublished ON crawl_outbox(published_at, id) WHERE published_at IS NULL;
CREATE INDEX idx_crawl_outbox_crawl_id ON crawl_outbox(crawl_id);
```

**Why Separate from `crawl_events`?**
- Option A: Use same table with `published_at` column
- Option B: Separate `crawl_outbox` table (RECOMMENDED)

**Recommendation: Option B** for cleaner separation of concerns:
- `crawl_events` = immutable event log (source of truth)
- `crawl_outbox` = transient publishing queue
- Future cleanup: Archive published outbox events after 7 days

---

## 🏷️ Labels
`backend`, `database`, `schema`, `outbox`, `milestone-1`, `p0`
