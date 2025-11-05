## Graph Projection Service

- **Purpose:** Consume `run_events` and maintain derived screen graph tables (`screens`, `graph_persistence_outcomes`).
- **Runtime:** Background loop started from `encore.service.ts` via `startGraphProjector()`.
- **Data flow:**
  - Hydrates missing cursors from `run_events`.
  - Streams batches per run (200–300 ms cadence).
  - Tracks Perceive node context (`agent.node.started`, `agent.event.ui_hierarchy_captured`, `agent.event.screen_perceived`).
  - Downloads UI XML artifacts when available, normalizes, hashes, and upserts screens.
  - Records projection outcomes with deterministic IDs + `source_run_seq`.
- **Idempotency:**
  - Deterministic `screen_id` (`sha256(appId::layoutHash)` slice 32).
  - `graph_persistence_outcomes` keyed by `(run_id, step_ordinal)` to avoid duplicates.
- **Logging:**
  - Module `graph`, actor `projector`.
  - Emits per-screen log plus batch summary (`eventsProcessed`, `projectedScreens`, `durationMs`).
- **Metrics TODO:** Future iteration will export Encore metrics once we standardize naming. Current logs cover ops visibility.
- **Operations:**
  - To replay: run SQL `UPDATE graph_projection_cursors SET next_seq = 1 WHERE run_id = ...;` (helper on repo exposed via `resetCursor`).
  - Projection lag observed via logs (compare `eventSeq` vs `source_run_seq`).
- **Dependencies:** Requires `artifacts` service bucket for UI XML downloads and `runs` / `app_fg_contexts` rows for metadata.




