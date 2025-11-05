-- Migration 008: MVP Schema Refactor
-- PURPOSE: Simplifies database schema for MVP by removing unnecessary tables,
-- fixing naming conventions, using ENUMs for status fields, and removing multi-tenancy.
-- This migration focuses on the core domain: Runs → Events → Graph (Screens/Actions/Edges)

-- ============================================================================
-- STEP 1: Drop unnecessary tables for MVP
-- ============================================================================

-- Drop overly granular tracking tables (data available in events)
DROP TABLE IF EXISTS action_candidates CASCADE;
DROP TABLE IF EXISTS decisions CASCADE;
DROP TABLE IF EXISTS execution_outcomes CASCADE;
DROP TABLE IF EXISTS verification_assessments CASCADE;
DROP TABLE IF EXISTS progress_evaluations CASCADE;
DROP TABLE IF EXISTS continuation_decisions CASCADE;
DROP TABLE IF EXISTS recovery_dispositions CASCADE;
DROP TABLE IF EXISTS checkpoints_index CASCADE;

-- Drop granular context tables (simplify to single app_package field)
DROP TABLE IF EXISTS driver_runtime_contexts CASCADE;
DROP TABLE IF EXISTS app_fg_contexts CASCADE;

-- Drop advanced features not needed for MVP
DROP TABLE IF EXISTS action_catalog CASCADE;
DROP TABLE IF EXISTS policies CASCADE;

-- ============================================================================
-- STEP 2: Create proper ENUM types for status fields (no magic strings)
-- ============================================================================

CREATE TYPE run_status_enum AS ENUM (
  'queued',      -- Run created, waiting to start
  'running',     -- Run actively executing
  'completed',   -- Run finished successfully
  'failed',      -- Run terminated with error
  'canceled'     -- Run stopped by user request (American spelling)
);

-- ============================================================================
-- STEP 3: Recreate runs table with clean schema
-- ============================================================================

DROP TABLE IF EXISTS runs CASCADE;

CREATE TABLE runs (
  run_id TEXT PRIMARY KEY,
  app_package TEXT NOT NULL,
  status run_status_enum NOT NULL DEFAULT 'queued',
  stop_reason TEXT NULL,
  
  -- Worker lease management (simplified)
  worker_id TEXT NULL,
  lease_expires_at TIMESTAMPTZ NULL,
  
  -- Lifecycle timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ NULL,
  finished_at TIMESTAMPTZ NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX runs_by_status ON runs(status, created_at);
CREATE INDEX runs_by_lease ON runs(lease_expires_at) WHERE lease_expires_at IS NOT NULL;

COMMENT ON TABLE runs IS 'Tracks agent exploration runs. Each run explores one app and generates graph data.';
COMMENT ON COLUMN runs.run_id IS 'Unique identifier for the run (ulid format)';
COMMENT ON COLUMN runs.app_package IS 'Mobile app package identifier (e.g., com.example.app)';
COMMENT ON COLUMN runs.status IS 'Current run lifecycle status';
COMMENT ON COLUMN runs.stop_reason IS 'Reason for run termination (max_steps_reached, error, user_cancelled, etc.)';
COMMENT ON COLUMN runs.worker_id IS 'ID of orchestrator worker processing this run';
COMMENT ON COLUMN runs.lease_expires_at IS 'When the current worker lease expires (for distributed processing)';

-- ============================================================================
-- STEP 4: Recreate run_events table with clean schema
-- ============================================================================

DROP TABLE IF EXISTS run_events CASCADE;

CREATE TABLE run_events (
  run_id TEXT NOT NULL,
  seq BIGINT NOT NULL,
  kind TEXT NOT NULL,
  node_name TEXT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ NULL,
  PRIMARY KEY (run_id, seq)
);

CREATE INDEX run_events_by_created_at ON run_events(run_id, created_at);
CREATE INDEX run_events_by_kind ON run_events(run_id, kind);
CREATE INDEX run_events_unpublished ON run_events(run_id, seq) WHERE published_at IS NULL;

COMMENT ON TABLE run_events IS 'Immutable event log for all run state changes. Enables replay and audit trail.';
COMMENT ON COLUMN run_events.seq IS 'Sequential event number within the run (starts at 1)';
COMMENT ON COLUMN run_events.kind IS 'Event type (e.g., agent.run.started, agent.event.screenshot_captured)';
COMMENT ON COLUMN run_events.node_name IS 'Agent node that produced this event (if applicable)';
COMMENT ON COLUMN run_events.published_at IS 'When event was published to Pub/Sub (NULL = not yet published)';

-- Add CHECK constraint for valid event kinds
ALTER TABLE run_events
  ADD CONSTRAINT run_events_kind_valid CHECK (
    kind IN (
      'agent.run.started',
      'agent.run.finished',
      'agent.run.failed',
      'agent.run.canceled',
      'agent.run.continuation_decided',
      'agent.run.heartbeat',
      'agent.node.started',
      'agent.node.token_delta',
      'agent.node.finished',
      'agent.event.screenshot_captured',
      'agent.event.ui_hierarchy_captured',
      'agent.event.screen_perceived',
      'agent.event.actions_enumerated',
      'agent.event.action_selected',
      'agent.event.action_performed',
      'agent.event.action_verification_completed',
      'agent.run.progress_evaluated',
      'agent.policy.switched',
      'agent.app.install_checked',
      'agent.app.signature_verified',
      'agent.app.launch_started',
      'agent.app.launch_completed',
      'agent.app.launch_failed',
      'agent.app.restarted',
      'agent.run.recovery_applied',
      'agent.run.checkpoint_restored',
      'graph.screen.discovered',
      'graph.action.created',
      'graph.edge.created',
      'graph.updated'
    )
  );

-- ============================================================================
-- STEP 5: Rename tables for domain clarity
-- ============================================================================

-- agent_state_snapshots → run_state_snapshots (snapshots belong to runs)
DROP TABLE IF EXISTS run_state_snapshots CASCADE;
ALTER TABLE agent_state_snapshots RENAME TO run_state_snapshots;

COMMENT ON TABLE run_state_snapshots IS 'State snapshots at each step for replay and debugging.';

-- artifacts_index → run_artifacts (clearer ownership)
DROP TABLE IF EXISTS run_artifacts CASCADE;
ALTER TABLE artifacts_index RENAME TO run_artifacts;

COMMENT ON TABLE run_artifacts IS 'Index of all artifacts (screenshots, XML) stored in object storage.';

-- ============================================================================
-- STEP 6: Simplify screens table (remove multi-tenancy)
-- ============================================================================

DROP TABLE IF EXISTS screens CASCADE;

CREATE TABLE screens (
  screen_id TEXT PRIMARY KEY,
  app_package TEXT NOT NULL,
  layout_hash TEXT NOT NULL,
  perceptual_hash TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX screens_by_app ON screens(app_package, layout_hash);
CREATE INDEX screens_by_phash ON screens(app_package, perceptual_hash);

COMMENT ON TABLE screens IS 'Unique screens discovered across all runs. Deduplicated by layout and perceptual hash.';
COMMENT ON COLUMN screens.screen_id IS 'Unique identifier for the screen (derived from layout_hash)';
COMMENT ON COLUMN screens.app_package IS 'Mobile app package this screen belongs to';
COMMENT ON COLUMN screens.layout_hash IS 'Hash of normalized UI hierarchy XML (structural identity)';
COMMENT ON COLUMN screens.perceptual_hash IS 'Perceptual hash of screenshot (visual similarity)';

-- ============================================================================
-- STEP 7: Simplify actions table
-- ============================================================================

DROP TABLE IF EXISTS actions CASCADE;

CREATE TABLE actions (
  action_id TEXT PRIMARY KEY,
  screen_id TEXT NOT NULL,
  verb TEXT NOT NULL,
  target_selector TEXT NOT NULL,
  target_bounds JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (screen_id, verb, target_selector)
);

CREATE INDEX actions_by_screen ON actions(screen_id);

COMMENT ON TABLE actions IS 'All possible actions discoverable on a screen (tap, swipe, input).';
COMMENT ON COLUMN actions.action_id IS 'Unique identifier for the action';
COMMENT ON COLUMN actions.verb IS 'Action type (tap, swipe, input_text, etc.)';
COMMENT ON COLUMN actions.target_selector IS 'UI element selector (e.g., resource-id, xpath)';
COMMENT ON COLUMN actions.target_bounds IS 'Normalized bounding box {x, y, w, h} for the target element';

-- ============================================================================
-- STEP 8: Simplify edges table
-- ============================================================================

DROP TABLE IF EXISTS edges CASCADE;

CREATE TABLE edges (
  edge_id TEXT PRIMARY KEY,
  app_package TEXT NOT NULL,
  from_screen_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  to_screen_id TEXT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_screen_id, action_id, to_screen_id)
);

CREATE INDEX edges_by_from_screen ON edges(from_screen_id);
CREATE INDEX edges_by_action ON edges(action_id);
CREATE INDEX edges_by_app ON edges(app_package);

COMMENT ON TABLE edges IS 'Directed connections between screens via actions. Forms the app exploration graph.';
COMMENT ON COLUMN edges.edge_id IS 'Unique identifier for the edge';
COMMENT ON COLUMN edges.to_screen_id IS 'Destination screen (NULL if action leads to app exit or error)';

-- ============================================================================
-- STEP 9: Simplify graph_persistence_outcomes
-- ============================================================================

DROP TABLE IF EXISTS graph_persistence_outcomes CASCADE;

CREATE TABLE graph_persistence_outcomes (
  outcome_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_ordinal INT NOT NULL,
  source_event_seq BIGINT NOT NULL,
  screen_id TEXT NOT NULL,
  action_id TEXT NULL,
  edge_id TEXT NULL,
  upsert_kind TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_id, step_ordinal)
);

CREATE INDEX graph_outcomes_by_run ON graph_persistence_outcomes(run_id, step_ordinal);

COMMENT ON TABLE graph_persistence_outcomes IS 'Tracks graph updates made during each run step. Enables graph projection replay.';
COMMENT ON COLUMN graph_persistence_outcomes.upsert_kind IS 'Type of update (screen_discovered, action_created, edge_created)';
COMMENT ON COLUMN graph_persistence_outcomes.source_event_seq IS 'The run_events.seq that triggered this graph update';

-- ============================================================================
-- STEP 10: Keep essential support tables unchanged
-- ============================================================================

-- run_outbox (needed for event publishing)
-- graph_projection_cursors (needed for graph projector)
-- These tables remain as-is

-- ============================================================================
-- STEP 11: Add foreign key constraints
-- ============================================================================

-- Add FKs now that all tables are created
ALTER TABLE run_events ADD CONSTRAINT fk_run_events_run 
  FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE;

ALTER TABLE run_outbox ADD CONSTRAINT fk_run_outbox_run 
  FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE;

ALTER TABLE run_state_snapshots ADD CONSTRAINT fk_run_state_snapshots_run 
  FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE;

ALTER TABLE run_artifacts ADD CONSTRAINT fk_run_artifacts_run 
  FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE;

ALTER TABLE graph_persistence_outcomes ADD CONSTRAINT fk_graph_outcomes_run 
  FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE;

ALTER TABLE graph_projection_cursors ADD CONSTRAINT fk_graph_projection_cursors_run 
  FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE;

ALTER TABLE actions ADD CONSTRAINT fk_actions_screen 
  FOREIGN KEY (screen_id) REFERENCES screens(screen_id) ON DELETE CASCADE;

ALTER TABLE edges ADD CONSTRAINT fk_edges_from_screen 
  FOREIGN KEY (from_screen_id) REFERENCES screens(screen_id) ON DELETE CASCADE;

ALTER TABLE edges ADD CONSTRAINT fk_edges_action 
  FOREIGN KEY (action_id) REFERENCES actions(action_id) ON DELETE CASCADE;

ALTER TABLE edges ADD CONSTRAINT fk_edges_to_screen 
  FOREIGN KEY (to_screen_id) REFERENCES screens(screen_id) ON DELETE CASCADE;
