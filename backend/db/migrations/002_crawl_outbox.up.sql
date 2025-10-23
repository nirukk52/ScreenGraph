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
