# FR-007: Database Schema for Run Outbox

**Status:** 📋 Todo  
**Priority:** P0 (Critical)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Small

---

## 📝 Description
Define `run_outbox` table for implementing outbox pattern to guarantee event ordering and reliable Redis publishing.

---

## 🎯 Acceptance Criteria
- [ ] `run_outbox` table created with columns:
  - `id` (BIGSERIAL, primary key)
  - `run_id` (UUID, foreign key to runs.id)
  - `event_type` (string)
  - `payload` (JSONB)
  - `created_at` (timestamp, default NOW())
  - `published_at` (timestamp, nullable)

- [ ] Index on `(published_at, id)` for efficient polling of unpublished events
- [ ] Index on `run_id` for per-run queries

---

## 🔗 Dependencies
- `runs` table (FR-006)
- Outbox publisher job (FR-005)

---

## 🧪 Testing Requirements
- [ ] Test: Insert event and query unpublished events
- [ ] Test: Update published_at after processing
- [ ] Performance test: Poll query on 100K rows < 50ms

---

## 📋 Technical Notes
**Migration File:** `backend/migrations/002_run_outbox.sql`

```sql
CREATE TABLE run_outbox (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP
);

CREATE INDEX idx_run_outbox_unpublished ON run_outbox(published_at, id) WHERE published_at IS NULL;
CREATE INDEX idx_run_outbox_run_id ON run_outbox(run_id);
```

**Why Separate from `run_events`?**
- Option A: Use same table with `published_at` column
- Option B: Separate `run_outbox` table (RECOMMENDED)

**Recommendation: Option B** for cleaner separation of concerns:
- `run_events` = immutable event log (source of truth)
- `run_outbox` = transient publishing queue
- Future cleanup: Archive published outbox events after 7 days

---

## 🏷️ Labels
`backend`, `database`, `schema`, `outbox`, `milestone-1`, `p0`
