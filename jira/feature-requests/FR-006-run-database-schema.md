# FR-006: Database Schema for Runs & Events

**Status:** 📋 Todo  
**Priority:** P0 (Critical)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Small

---

## 📝 Description
Define Postgres schema for `runs` and `run_events` tables to store run metadata and event history.

---

## 🎯 Acceptance Criteria
- [ ] `runs` table created with columns:
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

- [ ] `run_events` table created with columns:
  - `id` (BIGSERIAL, primary key)
  - `run_id` (UUID, foreign key to runs.id)
  - `event_type` (string)
  - `payload` (JSONB)
  - `created_at` (timestamp, default NOW())

- [ ] Indexes:
  - `run_events(run_id, id)` for efficient event streaming
  - `runs(created_at)` for listing recent runs

- [ ] Migration script using Encore migration system

---

## 🔗 Dependencies
- Encore SQL Database setup

---

## 🧪 Testing Requirements
- [ ] Test: Insert run and query back
- [ ] Test: Insert 1000 events and verify sequential IDs
- [ ] Test: Foreign key constraint prevents orphaned events
- [ ] Performance test: Query 10K events by run_id < 100ms

---

## 📋 Technical Notes
**Migration File:** `backend/migrations/001_run_schema.sql`

```sql
CREATE TYPE run_status AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status run_status NOT NULL DEFAULT 'PENDING',
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

CREATE TABLE run_events (
  id BIGSERIAL PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_run_events_run_id ON run_events(run_id, id);
CREATE INDEX idx_runs_created_at ON runs(created_at DESC);
```

---

## 🏷️ Labels
`backend`, `database`, `schema`, `milestone-1`, `p0`
