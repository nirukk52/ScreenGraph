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
