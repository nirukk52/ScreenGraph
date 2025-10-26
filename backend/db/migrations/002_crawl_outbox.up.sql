-- Migration 002: Run Outbox cursor table
-- This table implements the outbox pattern for reliable event publishing
-- It tracks per-run publishing cursors (next_seq, last_published_seq)
CREATE TABLE run_outbox (
  run_id TEXT PRIMARY KEY,
  next_seq BIGINT NOT NULL DEFAULT 1,
  last_published_seq BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
