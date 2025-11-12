
# ScreenGraph — **Single-Sink Agent** (Agent writes only to `run_events`) — MVP Design

**Version:** 1.0 (targets M6)  
**Principle:** *Agent module writes to exactly one datastore table: `run_events`.*  
All other state (`runs`, `snapshots`, `graph`, `coverage`, `dashboards`) is produced by **projections** that consume `run_events`.

---

## Strategic Angle [MVP]
**Why this is powerful for GTM and enterprise trust:**  
- **Audit & Explainability:** A single, append-only event log per run is a perfect audit trail and replay asset for proofs and RFPs.  
- **Determinism & Repro:** Replaying a run from `run_events` yields the same decisions and outcomes — effortless incident response and demo replays.  
- **Modularity for Pricing:** Projections become SKU-able features (e.g., “Coverage Map Projection” on Team tier, “Drift Alerts Projection” on Enterprise).  
- **Vendor safety:** No multi-table writes from the agent reduces blast radius and vendor-lock concerns; the agent remains portable.

---

## Architectural Direction [MVP]

### Single Writer
- **Agent Orchestrator (only writer)** appends to `run_events` with a **monotonic `seq` per `run_id`**.  
- **Artifacts (screenshots/XML)** are uploaded via a **port** and referenced by content-address (e.g., `sha256://...`). This is not a DB write and preserves the single-sink rule.

### Event Envelope (core fields)
```
run_id       : ULID
seq          : int (1..N gapless per run)
ts_logical   : int (monotonic logical clock, ms)
node         : enum (EnsureDevice|Perceive|Enumerate|ChooseAction|Act|Verify|Persist|DetectProgress|ShouldContinue|RestartApp|RecoverFromError|Stop)
kind         : enum (started|progress|finished|info|error|terminal)
policy_ver   : string (pinned at run start; copied in each event for audit)
reason       : string (human-readable, deterministic template)
payload      : jsonb (node-specific data: features, chosen_action_id, verification deltas, artifact refs, etc.)
checksum     : string (CRC32/xxhash of serialized envelope for tamper detection)
version      : int (event schema version)
```

**Terminality:** a single `kind=terminal` event (`agent.run.finished`) is the **only** terminalization; run status is derived by projections.

### Projections (separate services)
All read models are **append-only / idempotent** upserts with keys `(run_id, seq)` or domain natural keys. The Agent module does **not** write these.

1) **RunView Projection [MVP]**  
   - Builds `runs_view` (current status, counters, budgets) and `agent_state_snapshots_view` (latest state blob).  
   - Used by `/runs/:id` and SSE backfill.  
   - Idempotent by `(run_id, seq)`; can repair by replay.

2) **GraphProjection [MVP]**  
   - Consumes `Persist`, `Verify`, `Perceive` events to build `screens`, `actions`, `edges` with **evidence counters**.  
   - Keys: `(tenant, app_id, layout_hash, phash)` for screens; `(screen_id, verb, target_key)` for actions; `(src, dst, verb, target_key)` for edges.  
   - Upserts only; duplicates become evidence increments.

3) **ArtifactIndex Projection [MVP]**  
   - Indexes `payload.artifacts[]` into `artifacts_index` (content-address + metadata, not raw paths).

4) **CoverageProjection [POST_MVP]**  
   - Maintains coverage metrics: unique screens per 100 steps, stall rate, verification confidence.

5) **DriftProjection [POST_MVP/NORTHSTAR]**  
   - Baselines phashes & structures; emits `drift.alert` events for alerting and Slack/PR bots.

**Publisher:** If we publish to streams/SSE, a **Publisher** service advances its own checkpoint (not a column on `run_events`, preserving single-sink writes for the Agent).

### Idempotency & Replay
- Projections are **idempotent**: reprocessing `(run_id, seq)` is a NOOP or evidence bump.  
- A `replay` job can rebuild all views from `run_events` alone; artifacts resolved via content-address URIs.

---

## Execution Plan [POC → MVP]

### [POC] Single-table append with fakes
- Implement orchestrator to emit full node lifecycle events to `run_events` only.  
- Build **RunView Projection** to render `/runs/:id` and SSE.  
- Validate **gapless seq** and deterministic replays.

### [MVP] Real device + core projections
- Bring up artifact upload port (object store) and persist refs in event payloads.  
- Turn on **GraphProjection** and **ArtifactIndex** projections.  
- Provide `GET /runs/:id/events?fromSeq=` (SSE) powered solely by the projection or direct reads from `run_events`.

### [POST_MVP] Coverage & Alerts
- Add **CoverageProjection** and **DriftProjection**.  
- Optional **Publisher** to external buses with its own checkpoint table (kept outside Agent module).

### [NORTHSTAR] Multi-tenant analytics fabric
- Materialized, columnar analytics snapshots rebuilt nightly from `run_events` (BigQuery/Iceberg) with lineage back to seq numbers.

---

## Contracts — What Agent is allowed to emit [MVP]

- **Perceive:** `payload.perception = { screenshot_ref, ui_xml_ref, phash, bounds_digest, ... }`  
- **Enumerate:** `payload.candidates = [{id, verb, target_key, bounds, a11y_id, text_digest}]`  
- **ChooseAction:** `payload.decision = { candidate_id, policy_ver, seed, features, score, tie_break }`  
- **Act:** `payload.execution = { ok, latency_ms, driver_session_id, error? }`  
- **Verify:** `payload.verification = { delta_phash, new_screen?, confidence }`  
- **Persist:** `payload.persist = { graph_keys..., evidence_inc }`  
- **DetectProgress:** `payload.progress = { status: FORWARD|STALL|NOOP, basis }`  
- **ShouldContinue:** `payload.continue = { route: CONTINUE|RESTART|SWITCH|STOP, reason }`  
- **RestartApp/RecoverFromError:** `payload.recovery = { cause, retry_count }`  
- **Stop (terminal):** `payload.final = { stop_reason, metrics }`

**Note:** No other tables are touched by the Agent module.

---

## Encore Surface (thin) [MVP]
- `POST /runs:start` → allocates `run_id` and **immediately** appends `agent.run.started` event.  
- `POST /runs/:id:cancel` → appends `agent.run.cancel_requested` (terminalization handled by loop).  
- `GET /runs/:id/events?fromSeq=` → SSE producer reads directly from `run_events` (or via RunView).  
- `GET /runs/:id` → served by RunView Projection (no agent writes).

**Queues/Crons:** Orchestrator tick uses internal scheduling; projections subscribe to `run_events` via polling on `seq > last_seq` or logical replication. The Agent does not write any cursor fields.

---

## Risks + Mitigation

- **Query overhead on a single hot table.**  
  - Mitigate with `(run_id, seq)` clustered index and per-run partitioning.  
  - Projections keep their own read models for UI/analytics.

- **Projection lag.**  
  - Accept eventual consistency; show “streaming” badge and `fromSeq` for precise UI backfill.  
  - Projections checkpoint independently and can replay.

- **Terminalization races.**  
  - Single terminal `kind=terminal` event; projections treat any later seq as invalid (and raise an alert).

- **Artifact availability.**  
  - Content-address upload with retry; events reference immutable hashes, enabling re-fetch and caching.

---

## Next Move
- **[POC]** Implement orchestrator append-only pipeline and RunView Projection.  
- **[MVP]** Add GraphProjection & ArtifactIndex; wire SSE from event table.  
- **[POST_MVP]** Introduce Coverage & Drift projections and the external Publisher.  
- **[NORTHSTAR]** Nightly full-replay analytics with tenant-level product SKUs built on projections.

---

## Mapping to Clean Architecture
- **Domain:** node logic generates event payloads (pure), no DB writes.  
- **Application (Agent):** orchestrator serializes envelopes and appends to `run_events`.  
- **Infra:** projections, artifact storage, and publishers live outside the Agent module; they consume events and write their own read models.

This respects the **single-sink** rule while keeping us practical for UI, analytics, and GTM features.
