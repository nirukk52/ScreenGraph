CREATE TABLE runs (
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  run_id TEXT PRIMARY KEY,
  app_config_id TEXT NOT NULL,
  policy_version INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'running',
  stop_reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX runs_tenant_project ON runs(tenant_id, project_id);

CREATE TABLE run_events (
  run_id TEXT NOT NULL,
  seq BIGINT NOT NULL,
  type TEXT NOT NULL,
  node_name TEXT NULL,
  payload JSONB NULL,
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_id, seq)
);

CREATE INDEX run_events_by_time ON run_events(run_id, created_at);

CREATE TABLE run_outbox (
  run_id TEXT PRIMARY KEY,
  next_seq BIGINT NOT NULL DEFAULT 1,
  last_published_seq BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE agent_state_snapshots (
  run_id TEXT NOT NULL,
  step_ordinal INT NOT NULL,
  node_name TEXT NOT NULL,
  state_json JSONB NOT NULL,
  checksum TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (run_id, step_ordinal)
);

CREATE INDEX agent_state_snapshots_by_node ON agent_state_snapshots(run_id, node_name, step_ordinal);

CREATE TABLE driver_runtime_contexts (
  device_runtime_context_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  driver_meta JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX driver_runtime_contexts_run ON driver_runtime_contexts(run_id);

CREATE TABLE app_fg_contexts (
  application_fg_context_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  package_or_bundle_id TEXT NOT NULL,
  activity_or_route TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX app_fg_contexts_run ON app_fg_contexts(run_id);

CREATE TABLE artifacts_index (
  artifact_ref_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  byte_size BIGINT NULL,
  content_hash_sha256 TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX artifacts_index_run_kind ON artifacts_index(run_id, kind);

CREATE TABLE action_candidates (
  action_candidate_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_ordinal INT NOT NULL,
  screen_phash64 TEXT NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX action_candidates_run_step ON action_candidates(run_id, step_ordinal);

CREATE TABLE decisions (
  decision_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_ordinal INT NOT NULL,
  chosen_key TEXT NOT NULL,
  rationale_ref_id TEXT NULL,
  model_meta JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX decisions_run_step ON decisions(run_id, step_ordinal);

CREATE TABLE execution_outcomes (
  execution_outcome_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_ordinal INT NOT NULL,
  status TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 1,
  timings_ms JSONB NULL,
  trace_ref_id TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX execution_outcomes_run_step ON execution_outcomes(run_id, step_ordinal);

CREATE TABLE verification_assessments (
  verification_assessment_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_ordinal INT NOT NULL,
  method TEXT NOT NULL,
  delta_score NUMERIC NOT NULL,
  passed BOOLEAN NOT NULL,
  basis JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX verification_run_step ON verification_assessments(run_id, step_ordinal);

CREATE TABLE progress_evaluations (
  progress_evaluation_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_ordinal INT NOT NULL,
  verdict TEXT NOT NULL,
  basis JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX progress_run_step ON progress_evaluations(run_id, step_ordinal);

CREATE TABLE continuation_decisions (
  continuation_decision_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_ordinal INT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX continuation_run_step ON continuation_decisions(run_id, step_ordinal);

CREATE TABLE recovery_dispositions (
  recovery_disposition_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_ordinal INT NOT NULL,
  error_code TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX recovery_run_step ON recovery_dispositions(run_id, step_ordinal);

CREATE TABLE checkpoints_index (
  checkpoint_ref_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_ordinal INT NOT NULL,
  byte_size BIGINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX checkpoints_run_step ON checkpoints_index(run_id, step_ordinal);

CREATE TABLE screens (
  screen_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  layout_hash TEXT NOT NULL,
  ocr_stems_hash TEXT NULL,
  perceptual_hash64 TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX screens_by_project ON screens(tenant_id, project_id, app_id, layout_hash);

CREATE TABLE actions (
  action_id TEXT PRIMARY KEY,
  screen_id TEXT NOT NULL REFERENCES screens(screen_id),
  verb TEXT NOT NULL,
  target_key TEXT NOT NULL,
  bounds_norm JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (screen_id, verb, target_key)
);

CREATE INDEX actions_by_screen ON actions(screen_id);

CREATE TABLE edges (
  edge_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  from_screen_id TEXT NOT NULL REFERENCES screens(screen_id),
  action_id TEXT NOT NULL REFERENCES actions(action_id),
  to_screen_id TEXT NULL REFERENCES screens(screen_id),
  evidence_counter INT NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (from_screen_id, action_id, to_screen_id)
);

CREATE INDEX edges_by_from_action ON edges(from_screen_id, action_id);

CREATE TABLE graph_persistence_outcomes (
  graph_persistence_outcome_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_ordinal INT NOT NULL,
  screen_id TEXT NOT NULL,
  action_id TEXT NULL,
  to_screen_id TEXT NULL,
  upsert_kind TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_id, step_ordinal)
);

CREATE INDEX graph_outcomes_run_step ON graph_persistence_outcomes(run_id, step_ordinal);

CREATE TABLE policies (
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  policy_version INT NOT NULL,
  name TEXT NOT NULL,
  config_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, project_id, policy_version)
);

CREATE TABLE action_catalog (
  catalog_action_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  app_id TEXT NOT NULL,
  verb TEXT NOT NULL,
  target_key TEXT NOT NULL,
  hints JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, project_id, app_id, verb, target_key)
);
