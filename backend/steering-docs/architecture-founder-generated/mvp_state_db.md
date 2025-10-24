
# ScreenGraph — DB Tables for MVP Agent State & Orchestration (Pseudocode)
**Version:** 1.0 (M6)  
**Scope:** Tables that back the ID‑first Agent State, event/outbox discipline, and ScreenGraph persistence.  
**Style:** Pseudocode schemas (Postgres‑flavored, but **not** runnable SQL). Queries are in **talk format** (what to do / how to filter / sort / join).

---

## 0) Conventions (Apply to all tables)
- **IDs:** `ulid` (string). Opaque, sortable.  
- **Time:** `timestamptz` in UTC, named `created_at` / `updated_at`.  
- **Tenancy:** `{tenant_id, project_id}` on top‑level entities.  
- **Run locality:** `run_id` on anything tied to a run.  
- **State snapshot key:** `(run_id, step_ordinal)` unique.  
- **Immutability:** Payload tables append‑only (soft‑delete via `deleted_at` if ever needed).  
- **Idempotency:** Upserts guarded by `(run_id, step_ordinal)` or `(run_id, seq)` as appropriate.  
- **JSON:** Use `jsonb` for payloads; keep **small** scalars indexed.

---

## 1) Runs & Orchestration Core

### 1.1 `runs`
```pseudocode
TABLE runs (
  tenant_id           TEXT NOT NULL,
  project_id          TEXT NOT NULL,
  run_id              ULID PRIMARY KEY,
  app_config_id              TEXT NOT NULL,
  policy_version      INT  NOT NULL DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'running',  -- running|completed|failed|canceled
  stop_reason         TEXT NULL,                        -- canonical values
  created_at          TIMESTAMPTZ NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL
);
INDEX runs_tenant_project (tenant_id, project_id);
```

### 1.2 `run_events` (ordered, append‑only)
```pseudocode
TABLE run_events (
  run_id              ULID NOT NULL,
  seq                 BIGINT NOT NULL,                  -- 1..N per run
  type                TEXT NOT NULL,                    -- RunStarted|NodeStarted|NodeFinished|RunFinished
  node_name           TEXT NULL,
  payload             JSONB NULL,                       -- tiny envelope
  published_at        TIMESTAMPTZ NULL,                 -- set when emitted
  created_at          TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (run_id, seq)
);
INDEX run_events_by_time (run_id, created_at);
```

### 1.3 `run_outbox` (publisher cursor per run)
```pseudocode
TABLE run_outbox (
  run_id              ULID PRIMARY KEY,
  next_seq            BIGINT NOT NULL DEFAULT 1,        -- next event seq to publish
  last_published_seq  BIGINT NOT NULL DEFAULT 0,
  updated_at          TIMESTAMPTZ NOT NULL
);
```

### 1.4 `agent_state_snapshots`
```pseudocode
TABLE agent_state_snapshots (
  run_id              ULID NOT NULL,
  step_ordinal        INT  NOT NULL,
  node_name           TEXT NOT NULL,
  state_json          JSONB NOT NULL,                   -- ID‑first state
  checksum            TEXT NULL,
  created_at          TIMESTAMPTZ NOT NULL,
  updated_at          TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (run_id, step_ordinal)
);
INDEX agent_state_snapshots_by_node (run_id, node_name, step_ordinal);
```

---

## 2) Context & Artifacts Index

### 2.1 `driver_runtime_contexts`
```pseudocode
TABLE driver_runtime_contexts (
  device_runtime_context_id ULID PRIMARY KEY,
  run_id                    ULID NOT NULL,
  platform                  TEXT NOT NULL,            -- android|ios|web
  driver_meta               JSONB NOT NULL,           -- caps, device info sans secrets
  created_at                TIMESTAMPTZ NOT NULL
);
INDEX driver_runtime_contexts_run (run_id);
```

### 2.2 `app_fg_contexts`
```pseudocode
TABLE app_fg_contexts (
  application_fg_context_id ULID PRIMARY KEY,
  run_id                    ULID NOT NULL,
  package_or_bundle_id      TEXT NOT NULL,
  activity_or_route         TEXT NULL,
  created_at                TIMESTAMPTZ NOT NULL
);
INDEX app_fg_contexts_run (run_id);
```

### 2.3 `artifacts_index`
```pseudocode
TABLE artifacts_index (
  artifact_ref_id       TEXT PRIMARY KEY,            -- e.g., obj://shots/01RUN/0005.png
  run_id                ULID NOT NULL,
  kind                  TEXT NOT NULL,               -- screenshot|xml|ocr|checkpoint
  byte_size             BIGINT NULL,
  content_hash_sha256   TEXT NULL,
  created_at            TIMESTAMPTZ NOT NULL
);
INDEX artifacts_index_run_kind (run_id, kind);
```

---

## 3) Decisions & Execution Chain (Per Step)

### 3.1 `action_candidates`
```pseudocode
TABLE action_candidates (
  action_candidate_id   ULID PRIMARY KEY,
  run_id                ULID NOT NULL,
  step_ordinal          INT  NOT NULL,                -- produced at this step
  screen_phash64        TEXT NOT NULL,                -- scalar for quick filters
  items                 JSONB NOT NULL,               -- array of candidates (targets, bounds, hints)
  created_at            TIMESTAMPTZ NOT NULL
);
INDEX action_candidates_run_step (run_id, step_ordinal);
```

### 3.2 `decisions`
```pseudocode
TABLE decisions (
  decision_id           ULID PRIMARY KEY,
  run_id                ULID NOT NULL,
  step_ordinal          INT  NOT NULL,                -- where it was taken
  chosen_key            TEXT NOT NULL,                -- stable key of chosen candidate
  rationale_ref_id      TEXT NULL,                    -- external filestore ref for explainability
  model_meta            JSONB NULL,                   -- model/version, temps, prompts (scrubbed)
  created_at            TIMESTAMPTZ NOT NULL
);
INDEX decisions_run_step (run_id, step_ordinal);
```

### 3.3 `execution_outcomes`
```pseudocode
TABLE execution_outcomes (
  execution_outcome_id  ULID PRIMARY KEY,
  run_id                ULID NOT NULL,
  step_ordinal          INT  NOT NULL,
  status                TEXT NOT NULL,                -- ok|timeout|notfound|blocked
  attempts              INT  NOT NULL DEFAULT 1,
  timings_ms            JSONB NULL,                   -- tap latency, settle time, etc.
  trace_ref_id          TEXT NULL,                    -- evt trace/log ref
  created_at            TIMESTAMPTZ NOT NULL
);
INDEX execution_outcomes_run_step (run_id, step_ordinal);
```

### 3.4 `verification_assessments`
```pseudocode
TABLE verification_assessments (
  verification_assessment_id ULID PRIMARY KEY,
  run_id                     ULID NOT NULL,
  step_ordinal               INT  NOT NULL,
  method                     TEXT NOT NULL,           -- phash|layout|ocr
  delta_score                NUMERIC NOT NULL,        -- normalized score
  passed                     BOOLEAN NOT NULL,
  basis                      JSONB NULL,              -- brief evidence
  created_at                 TIMESTAMPTZ NOT NULL
);
INDEX verification_run_step (run_id, step_ordinal);
```

### 3.5 `progress_evaluations`
```pseudocode
TABLE progress_evaluations (
  progress_evaluation_id ULID PRIMARY KEY,
  run_id                 ULID NOT NULL,
  step_ordinal           INT  NOT NULL,
  verdict                TEXT NOT NULL,               -- FORWARD|STALL
  basis                  JSONB NULL,                  -- short reasons (phash delta, new nodes)
  created_at             TIMESTAMPTZ NOT NULL
);
INDEX progress_run_step (run_id, step_ordinal);
```

### 3.6 `continuation_decisions`
```pseudocode
TABLE continuation_decisions (
  continuation_decision_id ULID PRIMARY KEY,
  run_id                   ULID NOT NULL,
  step_ordinal             INT  NOT NULL,
  action                   TEXT NOT NULL,             -- CONTINUE|SWITCH_POLICY|RESTART_APP|STOP
  created_at               TIMESTAMPTZ NOT NULL
);
INDEX continuation_run_step (run_id, step_ordinal);
```

### 3.7 `recovery_dispositions`
```pseudocode
TABLE recovery_dispositions (
  recovery_disposition_id ULID PRIMARY KEY,
  run_id                  ULID NOT NULL,
  step_ordinal            INT  NOT NULL,
  error_code              TEXT NOT NULL,
  action_taken            TEXT NOT NULL,              -- retry|restart|skip
  notes                   TEXT NULL,
  created_at              TIMESTAMPTZ NOT NULL
);
INDEX recovery_run_step (run_id, step_ordinal);
```

### 3.8 `checkpoints_index`
```pseudocode
TABLE checkpoints_index (
  checkpoint_ref_id      TEXT PRIMARY KEY,            -- obj://checkpoints/...
  run_id                 ULID NOT NULL,
  step_ordinal           INT  NOT NULL,
  byte_size              BIGINT NULL,
  created_at             TIMESTAMPTZ NOT NULL
);
INDEX checkpoints_run_step (run_id, step_ordinal);
```

---

## 4) ScreenGraph Persistence (Normalized)

### 4.1 `screens`
```pseudocode
TABLE screens (
  screen_id             ULID PRIMARY KEY,
  tenant_id             TEXT NOT NULL,
  project_id            TEXT NOT NULL,
  app_id                TEXT NOT NULL,
  layout_hash           TEXT NOT NULL,               -- layout fingerprint
  ocr_stems_hash        TEXT NULL,
  perceptual_hash64     TEXT NOT NULL,
  first_seen_at         TIMESTAMPTZ NOT NULL,
  last_seen_at          TIMESTAMPTZ NOT NULL
);
INDEX screens_by_project (tenant_id, project_id, app_id, layout_hash);
```

### 4.2 `actions` (unique, reusable action signatures per screen)
```pseudocode
TABLE actions (
  action_id             ULID PRIMARY KEY,
  screen_id             ULID NOT NULL REFERENCES screens(screen_id),
  verb                  TEXT NOT NULL,               -- tap|type|back|swipe
  target_key            TEXT NOT NULL,               -- stable target identity
  bounds_norm           JSONB NULL,                  -- [x,y,w,h] 0..1
  created_at            TIMESTAMPTZ NOT NULL,
  UNIQUE (screen_id, verb, target_key)
);
INDEX actions_by_screen (screen_id);
```

### 4.3 `edges` (graph edges: screen --action--> screen)
```pseudocode
TABLE edges (
  edge_id               ULID PRIMARY KEY,
  tenant_id             TEXT NOT NULL,
  project_id            TEXT NOT NULL,
  app_id                TEXT NOT NULL,
  from_screen_id        ULID NOT NULL REFERENCES screens(screen_id),
  action_id             ULID NOT NULL REFERENCES actions(action_id),
  to_screen_id          ULID NULL REFERENCES screens(screen_id),  -- may be unknown at first
  evidence_counter      INT  NOT NULL DEFAULT 1,                  -- observation count
  last_seen_at          TIMESTAMPTZ NOT NULL,
  UNIQUE (from_screen_id, action_id, to_screen_id)
);
INDEX edges_by_from_action (from_screen_id, action_id);
```

### 4.4 `graph_persistence_outcomes` (idempotent upserts per step)
```pseudocode
TABLE graph_persistence_outcomes (
  graph_persistence_outcome_id ULID PRIMARY KEY,
  run_id                       ULID NOT NULL,
  step_ordinal                 INT  NOT NULL,
  screen_id                    ULID NOT NULL,            -- resolved or created
  action_id                    ULID NULL,                -- if enumerated/decided/executed
  to_screen_id                 ULID NULL,                -- verified destination if known
  upsert_kind                  TEXT NOT NULL,            -- CREATE|UPDATE|NOOP
  created_at                   TIMESTAMPTZ NOT NULL,
  UNIQUE (run_id, step_ordinal)
);
INDEX graph_outcomes_run_step (run_id, step_ordinal);
```

---

## 5) Policy & Catalog (Optional for MVP, Useful Soon)

### 5.1 `policies`
```pseudocode
TABLE policies (
  tenant_id             TEXT NOT NULL,
  project_id            TEXT NOT NULL,
  policy_version        INT  NOT NULL,
  name                  TEXT NOT NULL,
  config_json           JSONB NOT NULL,               -- guardrails, sliders, thresholds
  created_at            TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, project_id, policy_version)
);
```

### 5.2 `action_catalog` (cross‑run action reuse)
```pseudocode
TABLE action_catalog (
  catalog_action_id     ULID PRIMARY KEY,
  tenant_id             TEXT NOT NULL,
  project_id            TEXT NOT NULL,
  app_id                TEXT NOT NULL,
  verb                  TEXT NOT NULL,
  target_key            TEXT NOT NULL,
  hints                 JSONB NULL,                   -- text/icon/role priors
  created_at            TIMESTAMPTZ NOT NULL,
  UNIQUE (tenant_id, project_id, app_id, verb, target_key)
);
```

---

## 6) Talk‑Format Queries (Describe intent, filters, order)

> **Latest snapshot for a run**  
> “Get the highest `step_ordinal` for `run_id = X`, return its `state_json`.”  
> Steps: filter `agent_state_snapshots` by run → order by `step_ordinal` desc → limit 1 → return `state_json`.

> **Next outbox batch to publish**  
> “For `run_id = X`, fetch `run_events` with `seq >= run_outbox.next_seq`, up to N rows, in seq order.”  
> Steps: read `run_outbox.next_seq` → select `run_events` where `seq >= next_seq` and `published_at IS NULL` → order by `seq` asc → limit N.

> **Mark events as published**  
> “Set `published_at = now()` for published seqs and bump `run_outbox` (`last_published_seq`, `next_seq`).”  
> Steps: transaction → update `run_events` for seq in batch → update `run_outbox` with `last_published_seq = max(seq)`, `next_seq = max(seq)+1`.

> **Resolve artifacts for a step**  
> “Given `run_id = X, step = S`, read snapshot, extract artifact ref IDs, and look them up in `artifacts_index` (or fetch from object store).”  
> Steps: get snapshot → parse `perception.*RefId` → query `artifacts_index` by `artifact_ref_id IN (...)`.

> **Candidates listed at a step**  
> “Load `action_candidates` for (`run_id`, `step_ordinal`) and return `items` array.”  
> Steps: filter `action_candidates` by (`run_id`, `step_ordinal`) → return `items` JSONB.

> **Decision & rationale for a step**  
> “Load `decisions` for (`run_id`, `step_ordinal`), then use `rationale_ref_id` to pull text from object store.”  
> Steps: query `decisions` by key → fetch rationale by ref.

> **Execution traces for a step**  
> “Load `execution_outcomes` for (`run_id`, `step_ordinal`); if `trace_ref_id` present, fetch logs.”  
> Steps: query outcomes → optionally fetch trace by ref.

> **Verification chain for a step**  
> “Load `verification_assessments` for (`run_id`, `step_ordinal`) ordered by `created_at`, show `passed`, `delta_score`.”  
> Steps: filter table → order by time → iterate.

> **Detect no‑progress streak**  
> “Count last K `progress_evaluations` with verdict=STALL for `run_id`.”  
> Steps: select by `run_id` → order by `step_ordinal` desc → limit K → count where STALL.

> **Graph upsert evidence bump**  
> “When we observe same `(from_screen_id, action_id, to_screen_id)`, increment `evidence_counter` and set `last_seen_at = now()`; else insert.”  
> Steps: try update by unique triple → if 0 rows affected, insert with counter=1.

> **Find screen by hash**  
> “Given `(tenant, project, app, layout_hash)`, return `screen_id` (or insert if missing).”  
> Steps: select by unique keys → if none, insert and return id.

> **Edges from a screen**  
> “List edges for `from_screen_id`, join actions for `verb/target_key`, order by `evidence_counter` desc.”  
> Steps: filter `edges` by from → join `actions` → order desc.

> **Replay from step N**  
> “Stream `agent_state_snapshots` where `run_id = X AND step_ordinal >= N` in ascending order; at each step resolve any needed IDs lazily.”  
> Steps: range query on snapshots → for each, resolve referenced IDs as requested by the UI.

> **Runs dashboard**  
> “For tenant/project, list last 50 runs with `status`, `stop_reason`, last state’s `node_name`, and `step_ordinal`.”  
> Steps: select `runs` by tenant/project → for each run join latest snapshot by `step_ordinal` → limit 50.

---

## 7) Minimal Index Plan (MVP)
- `run_events(run_id, seq)` PK (already ordered reads)  
- `agent_state_snapshots(run_id, step_ordinal)` PK + by `node_name`  
- `action_candidates(decisions/execution_outcomes/verification/...)(run_id, step_ordinal)` indexes  
- `screens` composite on `(tenant_id, project_id, app_id, layout_hash)`  
- `edges` composite on `(from_screen_id, action_id)`

---

## 8) Idempotency Notes (Critical)
- **Events:** enforce `(run_id, seq)` unique. Retries can re‑write same row safely.  
- **Snapshots:** `(run_id, step_ordinal)` unique; latest write wins (same payload expected).  
- **Graph outcomes:** unique on `(run_id, step_ordinal)`.  
- **Edges:** unique triple `(from_screen_id, action_id, to_screen_id)` implements evidence bump pattern.

---

## 9) What to Defer (POST_MVP)
- `artifact_tags` (labeling), `screen_labels`, `edge_labels` for analytics.  
- `feature_flags` for model/policy A/B.  
- `materialized views` for dashboards; keep MVP simple.

---

## 10) Quick Sanity Checklist
- Every ID in state has a **home table** above.  
- No heavy payloads in `agent_state_snapshots` beyond state JSON.  
- Replays require only: snapshots + selective ID resolves.  
- Outbox can always recover: `run_outbox.next_seq` ≤ max(`run_events.seq`) + 1.
