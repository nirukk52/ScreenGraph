
# Graph Projection Service — Critical Updates (MVP+)

This addendum lists **high‑impact changes** to make the projection deterministic, scalable, and GTM‑ready. No code — only specs. Copy–paste into your steering docs.

---

## 1) Data Model Tightening

### 1.1 Canonical IDs & Multitenancy
- **Enforce tenancy everywhere**: Add `tenant_id`, `project_id`, and `app_id` **NOT NULL** on `actions`, `edges`, `graph_persistence_outcomes`, and `action_execution_coverage`. Keep them denormalized for fast filters; still foreign‑key to canonical `apps` table.
- **Device profile normalization**: Add `device_profile_id` (FK → `device_profiles`) on `runs` and propagate into `screens` (optional) and `edges` (optional) for replay guarantees.
- **App versioning**: Add `app_version_code`, `app_version_name`, `build_fingerprint` on `runs`; store a copy on `screens` as `first_seen_version_code/name` for drift triage across releases.

### 1.2 Screen Identity & Variants
- Keep `UNIQUE (app_id, layout_hash)` for canonical dedupe, **but add**:
  - `variant_key` (TEXT, nullable): hash of **dynamic-content‑neutral** layout (text stripped, ids kept). Useful to group screens that differ only by text/data.
  - `screen_aliases` (new table): `{ screen_id, alias_type, alias_value }` for stable “human names” (e.g., `Login`, `Cart`). Aliases are LLM‑assignable later, but scoped by `(tenant, project, app)`.
- Indexes:
  - `screens(app_id, layout_hash)` (unique)
  - `screens(app_id, variant_key)` (non‑unique)
  - `screens(first_seen_run_id)` and `screens(latest_seen_run_id)`

### 1.3 Run‑Scoped Observation Tables (Lightweight, pivotal)
- **`screen_observations`** (NEW): point‑in‑time observations used for replay and analytics.
  ```sql
  CREATE TABLE screen_observations (
    run_id TEXT NOT NULL,
    screen_id TEXT NOT NULL REFERENCES screens(screen_id),
    source_run_seq BIGINT NOT NULL,
    perceptual_hash64 TEXT,
    perceived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (run_id, source_run_seq)
  );
  ```
  *Why*: Avoids overloading canonical `screens` for per‑run queries; supports exact replays and evidence trails.

- **`edge_evidence`** (NEW): per‑run evidence for edges.
  ```sql
  CREATE TABLE edge_evidence (
    run_id TEXT NOT NULL,
    edge_id TEXT NOT NULL REFERENCES edges(edge_id),
    occurrences INTEGER NOT NULL DEFAULT 1,
    last_source_run_seq BIGINT NOT NULL,
    PRIMARY KEY (run_id, edge_id)
  );
  ```
  *Why*: Enables run‑scoped graph without recalculating from `edges` + outcomes every time.

- **`action_candidates`** (NEW): stable enumerations captured during Perceive/Enumerate.
  ```sql
  CREATE TABLE action_candidates (
    run_id TEXT NOT NULL,
    screen_id TEXT NOT NULL REFERENCES screens(screen_id),
    action_id TEXT NOT NULL REFERENCES actions(action_id),
    source_run_seq BIGINT NOT NULL,
    PRIMARY KEY (run_id, action_id, source_run_seq)
  );
  ```
  *Why*: Differentiates “available” vs “executed”; improves coverage math and LLM affordances.

### 1.4 Actions Schema — Replay Hardening
- Constrain `verb` and `origin` as enums (`action_verb`, `action_origin` domains).
- Add `bounds_norm` JSONB (normalized rect in 0..1 relative coordinates); keeps replay resilient to DPI/screen size.
- Add `target_signature` (TEXT): hash of selector + node snapshot to stabilize target identity across minor layout moves.
- Add indexes:
  - `actions(screen_id, verb, target_key)` (unique)
  - `actions(target_signature)`

### 1.5 Edges Schema — Determinism
- Keep `UNIQUE (from_screen_id, action_id, to_screen_id)`.
- Add `first_seen_run_id`, `latest_seen_run_id`, `first_seen_at`, `last_seen_at` for drift timelines.
- Index: `edges(from_screen_id)`, `edges(to_screen_id)`, `edges(action_id)`.

---

## 2) Event Model & Projection Engine

### 2.1 Event Minimums (producer contract)
Each event MUST include:
- `run_id`, `step_ordinal`, `seq`, `ts`
- `device_profile_id`
- For perception events: `artifact_xml_id`, optional `artifact_screenshot_id`, viewport dims
- For action events: `verb`, `target_key`, `coords?`, `selector_snapshot?`, `input_payload?`, `result { status, error_code?, latency_ms }`

### 2.2 Projector Concurrency & Sharding
- **Lease table** (NEW: `graph_projector_leases`) for horizontally scaling projector workers. Partition by `(tenant_id, project_id, run_id)`; use `SKIP LOCKED` pattern.
- **Exactly‑once per run**: per‑run transaction batches; on failure, cursor not advanced. Outcomes keep idempotency by `(run_id, step_ordinal)`.

### 2.3 Backpressure & Latency SLOs
- SLO: `p95 graph_projection_lag_seconds < 2s` for active runs.
- Drop batch size under sustained lag; increase cadence when idle.
- Dead‑letter queue (DLQ) table for events failing twice with normalized error codes.

---

## 3) API & Streaming Contracts

### 3.1 Snapshot API (`GET /graph/run/:runId`)
- **Add** `sinceSeq?` and `pageToken?` for incremental pulls (UI can sync without re‑downloading whole graph).
- **Add** `view=canonical|runScoped` (default `runScoped`); `canonical` returns full app graph subset that this run touched but with canonical counts.
- **Metadata** additions:
  - `seq_watermark` (last projected seq for the run)
  - `coverage: { screens_total, screens_seen, actions_total, actions_available, actions_attempted, actions_succeeded }`

### 3.2 SSE (`GET /graph/run/:runId/stream`)
- **Version the payload**: `event_version: 1`
- **Event envelope**:
  ```json
  {
    "type": "graph.edge.created",
    "event_version": 1,
    "run_id": "...",
    "seq_ref": 1234,
    "at": "2025-11-05T20:00:00Z",
    "payload": { ... }
  }
  ```
- **Heartbeat** every 2s with `graph.heartbeat` including `seq_watermark`.
- Support `filter=edges|screens|coverage` to reduce bandwidth (useful for the Run Review UI).

---

## 4) Coverage Math (clarified)
- **Available actions** = rows in `action_candidates` seen on any observed screen for the run.
- **Attempted** = `action_execution_coverage.attempted_count > 0` for the run.
- **Succeeded** = `...succeeded_count > 0` for the run.
- **Unexplored actions** = `available - attempted` (return sorted by heuristic priority e.g., “nav buttons first”).

---

## 5) Observability & Ops

### 5.1 Metrics (Encore)
- `graph_projection_lag_seconds` (histogram)
- `graph_projection_batch_ms` (histogram)
- `graph_projection_errors_total` (counter)
- `graph_screens_total` / `graph_edges_total` (gauges per app)
- `graph_stream_clients_gauge` (active SSE subscribers)

### 5.2 Logging Hygiene
- Outcome logs include `tenant_id`, `project_id`, `app_id`, `run_id`, `seq`, `step_ordinal`, `cursor_before`, `cursor_after`.
- For PII defense: never log raw XML; log `layout_hash` + node counts.

### 5.3 Retention & Cost
- **Artifacts**: configurable TTL; keep only a rolling window + “pinned” baselines.
- **Observations**: `screen_observations` and `edge_evidence` can be compacted into daily rollups per run after N days.

---

## 6) Security & Multitenancy
- Apply **Row-Level Security (RLS)** on all graph tables using `(tenant_id, project_id)` predicates.
- Require `x-tenant-id` and `x-project-id` on APIs; reject cross-tenant queries even if `run_id` is known.

---

## 7) Deterministic Replay Guardrails
- Snapshot **device_profile** with exact DPI, scale, rotation, locale, font scale.
- Validate replay by asserting next `layout_hash` matches expected; on mismatch, emit `graph.replay.verification_failed` with diffs (rect movement > threshold, node count delta, etc.).
- Provide **pre-run checklist**: same APK, same permissions, clean app data unless `state_seed` is provided.

---

## 8) Testing Blueprint
- **Property tests**: Normalization yields identical `layout_hash` under whitespace/attribute permutations.
- **Replay determinism**: Given a fixed event log + artifacts, projecting twice yields byte-identical snapshots.
- **Load**: 100 concurrent runs, each 2k events, projector keeps `p95 lag < 2s`.
- **Schema guard**: migrations add enums & indexes; ensure down migrations keep data shape readable.

---

## 9) LLM‑Facing Contracts (safe‑by‑default)
- Redact PII‑like texts in selectors before exposing to LLMs (hash tokens but keep structure).
- Provide only `action_verb`, `target_signature`, `bounds_norm`, `selector_snapshot (sanitized)`, and **never** raw XML.
- Rate-limit `GET /coverage` and SSE filters to prevent dataset scraping.

---

## 10) Small but mighty tweaks
- Add `created_by_projector_version` (TEXT) on outcomes to diagnose version drift after deploys.
- Compress stored XML (gzip) at rest; compute `layout_hash` on normalized plaintext pre‑compression.
- Include `relative_ts_ms` (from run start) in outcomes for better timelines in the UI.

---

## 11) Acceptance Criteria (MVP updated)
- **Snapshot** API returns stable `seq_watermark` and honors `sinceSeq` for incremental sync.
- **SSE** sends ordered `graph.*` events with `heartbeat` and closes on `graph.run.ended` if `?replay=false`.
- **Coverage** endpoint reflects deltas after a single projector tick (< 2s) under nominal load.
- **Replay** tool reproduces identical `layout_hash` sequences across two machines with the same `device_profile_id`.

---

## 12) Index Plan (quick reference)
- `screens`: (app_id, layout_hash) UNIQUE; (app_id, variant_key); (first_seen_run_id); (latest_seen_run_id)
- `actions`: (screen_id, verb, target_key) UNIQUE; (target_signature)
- `edges`: (from_screen_id); (to_screen_id); (action_id)
- `action_execution_coverage`: (run_id, action_id) PK
- `graph_persistence_outcomes`: (run_id, step_ordinal) UNIQUE; (run_id, source_run_seq)
- `screen_observations`: (run_id, source_run_seq) PK; (screen_id)
- `edge_evidence`: (run_id, edge_id) PK

---

**Why these updates?** They separate canonical identity from per‑run evidence, enforce tenant isolation, protect replay determinism, and give your UI incremental sync and low‑latency streaming — all while keeping the projector horizontally scalable and idempotent.
