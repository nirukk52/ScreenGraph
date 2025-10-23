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
