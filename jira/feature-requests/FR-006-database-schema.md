# FR-006: Database Schema for Crawl Runs & Events

**Status:** 📋 Todo  
**Priority:** P0 (Critical)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Small

---

## 📝 Description
Define Postgres schema for `crawl_runs` and `crawl_events` tables to store crawl metadata and event history.

---

## 🎯 Acceptance Criteria
- [ ] `crawl_runs` table created with columns:
  - `id` (UUID, primary key)
  - `status` (enum: PENDING, RUNNING, COMPLETED, FAILED, CANCELLED)
  - `app_package` (string)
  - `device_config` (JSONB, nullable)
  - `max_steps` (integer, default 100)
  - `goal` (text, nullable)
  - `created_at` (timestamp)
  - `started_at` (timestamp, nullable)
  - `completed_at` (timestamp, nullable)
  - `cancelled_at` (timestamp, nullable)
  - `error_message` (text, nullable)

- [ ] `crawl_events` table created with columns:
  - `id` (BIGSERIAL, primary key)
  - `crawl_id` (UUID, foreign key to crawl_runs.id)
  - `event_type` (string)
  - `payload` (JSONB)
  - `created_at` (timestamp, default NOW())

- [ ] Indexes:
  - `crawl_events(crawl_id, id)` for efficient event streaming
  - `crawl_runs(created_at)` for listing recent crawls

- [ ] Migration script using Encore migration system

---

## 🔗 Dependencies
- Encore SQL Database setup

---

## 🧪 Testing Requirements
- [ ] Test: Insert crawl run and query back
- [ ] Test: Insert 1000 events and verify sequential IDs
- [ ] Test: Foreign key constraint prevents orphaned events
- [ ] Performance test: Query 10K events by crawl_id < 100ms

---

## 📋 Technical Notes
**Migration File:** `backend/migrations/001_crawl_schema.sql`

```sql
CREATE TYPE crawl_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE crawl_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status crawl_status NOT NULL DEFAULT 'PENDING',
  app_package VARCHAR(255) NOT NULL,
  device_config JSONB,
  max_steps INTEGER NOT NULL DEFAULT 100,
  goal TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  error_message TEXT
);

CREATE TABLE crawl_events (
  id BIGSERIAL PRIMARY KEY,
  crawl_id UUID NOT NULL REFERENCES crawl_runs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crawl_events_crawl_id ON crawl_events(crawl_id, id);
CREATE INDEX idx_crawl_runs_created_at ON crawl_runs(created_at DESC);
```

---

## 🏷️ Labels
`backend`, `database`, `schema`, `milestone-1`, `p0`
