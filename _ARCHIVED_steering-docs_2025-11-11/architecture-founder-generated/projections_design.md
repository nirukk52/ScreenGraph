
# ScreenGraph — How Projections Happen (Single‑Sink `run_events`) 

**Version:** 1.0 (targets M6)  
**Scope:** “No code, only talk.” Detailed projection strategy so the Agent writes only to `run_events` and everything else is derived.

---

## Strategic Angle — Why projections [MVP]
- **Enterprise trust:** Read models are rebuildable from the event log; audits and incident replays are trivial.
- **Shipping speed:** Keep the loop simple; move complexity to replaceable projections.
- **Pricing levers:** Projections = SKUs (Coverage, Drift, PR bot). Turn features on/off per tenant without touching the loop.
- **Data gravity:** Same log feeds UI, analytics, and alerting; one ingestion path to secure and monitor.

---

## Architectural Direction — Projection Fabric [MVP]

### Core Idea
- **Agent = single writer** to `run_events`.  
- **Projections = consumers** that maintain their **own** read models and checkpoints.  
- **Guarantees:** at‑least‑once delivery; per‑run events are gapless and ordered by `seq`.

### Two consumption modes
1) **Per‑Run Tailer** (UI-facing / low-latency)  
   - Filters events by `run_id`, processes strictly in `seq` order.  
   - Powers `RunView` (`/runs/:id`) and SSE `?fromSeq=`.  
   - Checkpoint key: `(projection_name, run_id) → next_seq`.

2) **Global Fan‑in** (cross-run analytics)  
   - Reads batches of events across many runs (by insertion PK/ts), **groups by run_id**, and applies in‑order per group.  
   - Powers `GraphProjection`, `ArtifactIndex`, Coverage/Drift.  
   - Checkpoint key: `(projection_name) → last_event_pk` (plus in-memory per‑run `next_seq` guard).

### Projection Contracts
Each projection declares:
- **name / version** (semantic versioning).  
- **input_event_kinds** (e.g., Perceive/Verify/Persist).  
- **upserts** (the tables/keys it maintains).  
- **idempotency key** (usually `(run_id, seq)` *or* a natural domain key).  
- **error policy** (skip, quarantine, or stop).  
- **replay support** (full rebuild or targeted `run_id` backfill).

### Checkpoint Tables
- `projection_offsets(projection_name, run_id, next_seq, updated_at)` — per-run tailers.  
- `projection_global_offsets(projection_name, last_event_pk, updated_at)` — global fan‑in.  
- `projection_errors(projection_name, run_id, seq, reason, first_seen, last_seen, count)`.

### Idempotency Patterns
- **Upsert with natural keys:**  
  - Screens: `(tenant_id, app_id, layout_hash, phash)`  
  - Actions: `(screen_id, verb, target_key)`  
  - Edges: `(src_screen_id, dst_screen_id, verb, target_key)` → `evidence_count += 1` on duplicate.  
- **Run-scoped facts:** store `(run_id, seq)` for provenance; reprocessing is NOOP.  
- **Artifacts:** index by `content_hash` with unique constraint.

### Replay & Reindex
- **From scratch:** truncate read models and re-run from event 1..N (safe, deterministic).  
- **Targeted:** `replay(projection_name, run_id, from_seq=x)` for surgical repair.  
- **Warehouse:** nightly full replay to columnar storage with lineage back to `(run_id, seq)`.

### Schema Evolution
- Version the **event envelope** and **projection version**.  
- Projections must be tolerant to unknown fields; prefer additive changes.  
- Maintain a migration note in `steering-docs/projections/CHANGELOG.md`.

---

## Execution Plan — Vertical Slices

### Slice 1 — RunView (Per‑Run Tailer) [POC → MVP]
**Purpose:** Serve `/runs/:id` & SSE by reducing events into a compact run read model.  
**Consumes:** all node lifecycle events.  
**Maintains:**  
- `runs_view(run_id, status, started_at, finished_at, steps, budgets, last_seq)`  
- `agent_state_snapshots_view(run_id, last_step_ordinal, state_miniblob)` *(latest only; mini snapshot)*  
**Idempotency:** `(run_id, seq)`; recompute counters deterministically.  
**Why:** UI can display live progress with micro‑lag, no agent writes required.

### Slice 2 — ArtifactIndex (Global Fan‑in) [MVP]
**Purpose:** Make artifacts resolvable by hash and metadata.  
**Consumes:** Perceive/Verify with `payload.artifacts[]`.  
**Maintains:**  
- `artifacts_index(content_hash PK, mime, bytes, width, height, created_from_run_id, seq)`  
**Idempotency:** `content_hash` unique; reprocessing is NOOP.  
**Why:** Enables cheap de‑dupe and long‑term caching; foundational for replay.

### Slice 3 — GraphProjection (Global Fan‑in) [MVP]
**Purpose:** Persist the ScreenGraph as normalized tables.  
**Consumes:** Persist/Verify/Perceive (keys + confidence).  
**Maintains:**  
- `screens` keyed by `(tenant, app_id, layout_hash, phash)`  
- `actions` keyed by `(screen_id, verb, target_key)`  
- `edges` keyed by `(src, dst, verb, target_key)` with `evidence_count`  
- Optional `screen_latest_artifact(run_id, seq, content_hash)` for preview  
**Idempotency:** upserts; edges bump evidence on duplicates.  
**Why:** Powers coverage visualization and PR “affected flows.”

### Slice 4 — CoverageProjection (Global Fan‑in) [POST_MVP]
**Purpose:** KPIs like unique screens/100 steps, stall rate, time-to-coverage.  
**Consumes:** Verify/DetectProgress/Stop.  
**Maintains:** `coverage_metrics(tenant, app_id, run_id, …)` with rollups.

### Slice 5 — DriftProjection (Global Fan‑in) [POST_MVP → NORTHSTAR]
**Purpose:** Baseline structures/phashes and alert on material changes.  
**Consumes:** Perceive/Verify.  
**Maintains:** `drift_baselines`, emits `drift.alert` into a pub stream (publisher’s checkpoint is separate).

---

## Operational Model — How it runs [MVP]

- **Dispatcher:** lightweight worker that fetches event batches; for global fan‑in it groups by `run_id`, sorts by `seq`, and invokes projection handlers.  
- **Batching:** e.g., 500 events per poll; adaptive backoff when idle.  
- **Backpressure:** Each projection maintains its own offsets; slow ones do not block others.  
- **Observability:** counters (`events_processed`, `lag_seconds`), health checks, and dead-letter on persistent parse errors.  
- **Security:** projections run under least-privilege DB roles; write only to their tables.

---

## Clean Architecture Mapping
- **Domain:** projections are pure reducers over event payloads.  
- **Application:** dispatcher schedules, checkpoints, retries.  
- **Infra:** storage schemas for read models; object storage for artifacts; optional pub/sub for alerts.

---

## Risks + Mitigation

- **Cross-run ordering issues (global fan‑in):** group by run and sort by `seq` before reduce.  
- **Projection lag:** keep offsets independent; UI shows lag, SSE supports `fromSeq` recovery.  
- **Hot spot on `run_events`:** clustered index + partitioning; projections primarily read append‑only tail.  
- **Schema churn:** strict versioning + additive payload evolution; tolerant parsers.  
- **Rebuild time for large tenants:** periodic snapshots of projection state or sharded replays by tenant.

---

## Next Move
- **[POC]** Implement RunView (per‑run tailer) with deterministic counters and SSE.  
- **[MVP]** Bring up ArtifactIndex + GraphProjection with idempotent upserts and per‑projection offsets.  
- **[POST_MVP]** Add Coverage + Drift; start nightly warehouse replays.  
- **[NORTHSTAR]** Tenant‑scoped analytics SKU with lineage to `(run_id, seq)` for every chart.

---

## What this unlocks (GTM)
- **PR “Affected Flows”**: replay last N runs; diff edges; link directly from a PR comment.  
- **Compliance-ready audits**: every visualization explains itself via `(run_id, seq)` lineage.  
- **Config-free upgrades**: add a new projection, backfill from the same log; zero changes to the agent.
