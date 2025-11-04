## ScreenGraph: Graph Projection and SSE Plan (evaluation + recommendation)

Purpose: evaluate how to persist screens/edges and surface per-Perceive updates on the stream; recommend the approach that best fits our single-sink design and existing schema.

### Current state (anchor points)
- Perceive emits `agent.event.screen_perceived` with artifact refs and a perceptual hash.
  - Source: `backend/agent/nodes/main/Perceive/node.ts` around the artifacts block and event push.
- SSE endpoint streams events from `run_events` only.
  - Source: `backend/run/stream.ts` — polls `run_events` and sends messages to the client.
- DB schema already contains graph tables (003 migration): `screens`, `actions`, `edges`, and `graph_persistence_outcomes`.
  - Source: `backend/db/migrations/003_agent_state_schema.up.sql` (tables start near the referenced lines).
- Architecture principle: Agent is the single writer to `run_events`; projections derive other state from that log.
  - Source: steering doc: Single-Sink Agent (Agent writes only to `run_events`).

### What we want
- Persist a canonical record per perceived screen and capture navigation edges over time.
- Have the stream produce one message per Perceive step that says:
  - whether the perceived screen mapped to an existing screen (hit) or was created (miss → discovered), and
  - optionally, later, a follow-up event when an edge (action → next screen) is established.
- Preserve single-sink: agent writes events; a projection service maintains the graph.

### Schema alignment
- Existing 003 tables are broadly suitable and already applied:
  - `screens(screen_id TEXT PK, tenant_id, project_id, app_id, layout_hash, perceptual_hash64, ...)`
  - `actions(action_id TEXT PK, screen_id FK, verb, target_key, ...)`
  - `edges(edge_id TEXT PK, from_screen_id, action_id, to_screen_id, evidence_counter, ...)`
  - `graph_persistence_outcomes(run_id, step_ordinal, screen_id, action_id, to_screen_id, upsert_kind, ...)`
- Founder notes propose `UUID` PKs and a `signature_hash` unique with `(app_id, signature_hash)`.
  - We can treat `layout_hash` as the structural signature and keep current TEXT PKs for now (no migration churn today).
  - If needed later, add a follow-up migration to switch to UUID PKs and to enforce `UNIQUE(app_id, layout_hash)`.

### Approaches considered
1) Agent persists graph directly (add a Persist node that writes `screens/edges` and emits `graph.*`).
   - Pros: immediate mapping on the same step; single SSE.
   - Cons: violates single-sink principle; couples agent to DB; larger blast radius. Not recommended.

2) New `/graph` projection service consumes `run_events` and writes `screens/edges`; SSE remains run-only.
   - Pros: pure projection; clean separation; easy replay; preserves single-sink; minimal change to existing SSE.
   - Cons: run stream won’t include mapping status unless frontend cross-queries or we add a second SSE.

3) Projection service as in (2) plus extend existing `/run/:id/stream` to also emit graph outcomes (without writing back to `run_events`).
   - Mechanism: projection writes to `graph_persistence_outcomes` (already in 003). `/run/:id/stream` interleaves those rows as `graph.*` messages.
   - Ordering: use `created_at` for interleave; include a `seqRef` back to the source `run_events.seq` (requires storing the source seq in outcomes ― small schema tweak).
   - Pros: single SSE URL; preserves single-sink; keeps clean responsibilities.
   - Cons: small increase in SSE complexity; need one additive column (`source_run_seq`) for reliable correlation.

4) Projection service writes `graph.*` back into `run_events` to share the same `seq` ordering.
   - Pros: one table, one sequence, simplest SSE.
   - Cons: breaks single-writer invariant; opens concurrency/idempotency concerns. Not recommended.

### Recommendation
- Choose (3):
  - Keep agent as the single writer to `run_events`.
  - Add a `/graph` projection service that tails `run_events` per run with its own projection cursor table.
  - Project `agent.event.screen_perceived` into `screens` and record a row in `graph_persistence_outcomes` for each upsert (`discovered` vs `matched`).
  - Later, when an action results in a transition, upsert `edges` and record an outcome (`edge_created`).
  - Update `/run/:id/stream` to also fetch new `graph_persistence_outcomes` and emit `graph.screen.discovered` / `graph.screen.mapped` / `graph.edge.created` messages.
  - Add one column `source_run_seq BIGINT NOT NULL` to `graph_persistence_outcomes` (follow-up migration) so each outcome correlates to its source event for stable interleaving.

Why it’s best now:
- Preserves the single-sink rule and keeps the agent deterministic and portable.
- Leverages already-applied 003 tables; minimal schema change (one additive column for correlation).
- Gives the frontend the “one message per Perceive” mapping signal on the same stream without a second SSE.

### Minimal initial scope (iteration 1)
1) Projection service
   - Background loop with per-run cursor (`graph_projection_cursors(run_id, next_seq, updated_at)`).
   - Consume `agent.event.screen_perceived` → compute `layout_hash` (normalize XML) and use `perceptual_hash64` as a secondary bucket.
   - Upsert `screens`; write `graph_persistence_outcomes` with `upsert_kind` = `discovered` or `mapped` and `source_run_seq`.
2) SSE join
   - Keep `/run/:id/stream` as the single endpoint.
   - After sending a batch of `run_events`, fetch any new `graph_persistence_outcomes` with `source_run_seq > lastSentSeq` and emit them as `graph.*` messages.
   - Document that `seq` refers to `run_events` sequence and `graph.*` messages carry `seqRef`.

### Future enhancements
- Add uniqueness on screens: `UNIQUE(app_id, layout_hash)`.
- Add `first_seen_run_id` / `latest_seen_run_id` on `screens` and corresponding fields on `edges` if analytics need them.
- Extend projection to consume action events to create labeled edges (`action_id` via `actions`).
- Derive coverage stats and emit a periodic `graph.updated` summary event.

### Frontend notes
- Current client uses `client.run.stream(runId, { lastEventSeq: 0 })`.
- With (3), no client change: the same stream will include `graph.*` messages in addition to `agent.*`.
- If we defer SSE-join (choose (2) first), keep client unchanged and add a second stream later (`/graph/:runId/stream`).

### Risks & mitigations
- Ordering ambiguity when interleaving: solved by storing `source_run_seq` in outcomes and emitting in order `(run_events.seq, outcomes.created_at)`.
- Projection lag: the joined messages may arrive a few hundred ms after `screen_perceived`. Acceptable; log latency histograms and alert if >2s.
- Hash correctness: if `layout_hash` normalization changes, version the hasher and include it in the row for safe evolution.



