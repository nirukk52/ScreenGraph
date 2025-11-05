CREATE TABLE graph_projection_cursors (
  run_id TEXT PRIMARY KEY,
  next_seq BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE graph_persistence_outcomes
  ADD COLUMN source_run_seq BIGINT NOT NULL DEFAULT 0;




