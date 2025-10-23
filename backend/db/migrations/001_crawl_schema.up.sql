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
