
# Run‑Scoped Evidence Layer: `screen_observations`, `edge_evidence`, `action_candidates`

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

Purpose: clarify **what each table captures**, **how it differs from canonical graph tables** (`screens`, `actions`, `edges`), and **why we need all three** to support deterministic replay, accurate coverage, and low‑latency UI streaming.

---

## 1) Why an “Evidence Layer”?
Canonical graph tables store **identity** and **stable relationships** across all runs. But the UI, coverage math, and replay need **per‑run, per‑moment evidence** (“what exactly did we see/try/confirm at seq=N?”).  
The Evidence Layer provides **run‑scoped, append‑optimized** facts that are:
- Easy to **stream** and **paginate** by run sequence,
- **Idempotent** under projector retries,
- Cheap to **compact/expire** without touching canon.

---

## 2) Definitions (one‑liners)
- **screen_observations** — A time‑ordered record of **which canonical screen** was perceived **at which run sequence** (with phash + timestamp). Think: *“At seq=314 we saw screen S.”*
- **edge_evidence** — Aggregated per‑run **evidence counts** that a canonical edge actually occurred (and when we last saw it). Think: *“In this run we confirmed edge E 3 times, last at seq=1021.”*
- **action_candidates** — The set of **available actions** enumerated on a specific observed screen during the run (even if never executed). Think: *“At seq=512, actions A1–A7 were available on S.”*

---

## 3) How they differ (side‑by‑side)
| Axis | screen_observations | edge_evidence | action_candidates |
|---|---|---|---|
| **Primary question** | What screen did we *actually* see at a given moment? | Which nav transitions did we *actually* traverse (and how often) in this run? | What actions were *available* on the observed screen, even if not executed? |
| **Row granularity** | 1 row per `(run_id, source_run_seq)` | 1 row per `(run_id, edge_id)` (aggregated counters) | 1 row per `(run_id, action_id, source_run_seq)` |
| **Time dimension** | Precise order via `source_run_seq` | Last seen order via `last_source_run_seq` (plus counts) | Precise availability moments via `source_run_seq` |
| **Relationship to canon** | Points to `screen_id` | Points to `edge_id` | Points to `action_id` (which points to `screen_id`) |
| **Used for** | Replay timeline, UI time‑slider, “where were we?” | Graph animation (reinforcements), coverage of transitions, Diff Mode | Coverage math “available vs attempted”, LLM affordances, next‑action planning |
| **Write pattern** | Append‑only per seq (idempotent on `(run_id, seq)`) | Upsert and increment counters per `(run_id, edge_id)` | Append‑only per seq (idempotent on `(run_id, action_id, seq)`) |
| **Retention** | Keep longer (drives replay & UI) | Moderate (small & aggregated) | Short/medium (can compact to last‑seen per action) |
| **SSE payloads** | `graph.screen.mapped/discovered` mirror | `graph.edge.created/reinforced` mirror | `graph.coverage.updated` / `graph.action.available` mirror |
| **Failure isolation** | Harmless duplicates prevented by PK | Counters resilient; increments replay‑safe | Harmless duplicates prevented by PK |

---

## 4) Relationship to canonical tables

- **screens (canonical)**: Stable identity for a layout (`layout_hash`).  
  **screen_observations**: Run‑time “we saw this canonical screen at seq=N” with `perceptual_hash64` + timestamp.  
  *Why separate?* Canon shouldn’t store every sighting; observations can be compacted.

- **actions (canonical)**: Stable affordance definition for a screen (`verb`, `target_key`, replay fields).  
  **action_candidates**: Specific *moments* those actions were **visible/available** to the agent.  
  *Why separate?* Availability is dynamic; canon shouldn’t fluctuate by run.

- **edges (canonical)**: Stable transitions (`from_screen_id` + `action_id` → `to_screen_id`).  
  **edge_evidence**: Per‑run confirmation counts and last seen sequence.  
  *Why separate?* Edges exist canonically even if unseen in a given run; evidence proves occurrence.

---

## 5) Lifecycle & idempotency (who writes what, when)

**During Perceive**  
1. Agent emits `ui_hierarchy_captured` and `screen_perceived` with `seq`.  
2. Projector normalizes XML → `layout_hash`, upserts `screens`.  
3. Projector writes **screen_observations(run_id, screen_id, source_run_seq, phash)**.  
   - PK `(run_id, source_run_seq)` ensures exact‑once per sequence.

**During Enumerate**  
4. Agent emits `actions_enumerated` with the candidate list.  
5. Projector upserts/attaches to canonical `actions`, then appends **action_candidates(run_id, action_id, source_run_seq)**.  
   - PK `(run_id, action_id, source_run_seq)` prevents dupes.

**During Act → Verify**  
6. Triplet correlation Perceive(A) → Act → Perceive(B).  
7. Projector upserts/strengthens canonical **edges** and increments **edge_evidence(run_id, edge_id).occurrences**; updates `last_source_run_seq`.  
   - PK `(run_id, edge_id)` with atomic increments is replay‑safe.

---

## 6) Coverage math — who contributes what

- **Available actions** = DISTINCT `action_id` from **action_candidates** for the run.  
- **Attempted / Succeeded / Failed** comes from **action_execution_coverage** (per run).  
- **Unexplored** = Available − Attempted (join `action_candidates` to coverage).  
- **Traversal confirmation** for the visual graph (thicker edges, animations) comes from **edge_evidence.occurrences**.

---

## 7) Typical queries each table powers

- **screen_observations**  
  - “Give me the last 50 screens with seq & phash for the time slider.”  
  - “Build the exact replay path and verify expected `layout_hash` continuity.”

- **edge_evidence**  
  - “Which edges did this run actually confirm and how many times?”  
  - “Animate edge thickness by evidence in the Run Review graph.”

- **action_candidates**  
  - “What could we do on the last screen that we haven’t tried yet?”  
  - “Feed LLM: only actions that were visible at `seq=N` with bounds and signatures.”

---

## 8) Retention, compaction, and cost control

- **screen_observations**: Keep full for active baselines; after N days, compact to checkpoints (e.g., every 10th seq) + always keep seqs around transitions.  
- **edge_evidence**: Already compact; minimal cost.  
- **action_candidates**: Compact to latest availability per action per screen or per 100 seqs; enough for coverage summaries.

---

## 9) Anti‑patterns (what not to do)

- Don’t infer **available actions** from canonical `actions` alone; availability is **situational** → use **action_candidates**.  
- Don’t recompute run paths from `edges` alone; you lose temporal order → use **screen_observations**.  
- Don’t use `edges` to count run traversals; counters live in **edge_evidence** (cheap to reset/replay).

---

## 10) Minimal schema sketch (shape only, not code)

- **screen_observations**: keyed by `(run_id, source_run_seq)` → `screen_id`, `perceptual_hash64`, `perceived_at`.  
- **edge_evidence**: keyed by `(run_id, edge_id)` → `occurrences`, `last_source_run_seq`.  
- **action_candidates**: keyed by `(run_id, action_id, source_run_seq)`.

All three include `tenant_id`, `project_id`, `app_id` for strict multitenancy and filter‑by‑app queries.

---

## 11) Acceptance checks (MVP)

- **Time slider** uses `screen_observations` only and matches replay order.  
- **Graph animation** thickness matches `edge_evidence.occurrences`.  
- **Coverage panel** reflects “Available vs Attempted vs Succeeded” using `action_candidates` + `action_execution_coverage`.  
- Reprojecting the same event log keeps these three tables **byte‑identical** (idempotency).

---

**Bottom line**:  
- `screen_observations` = **when/what we saw** (ordered timeline).  
- `edge_evidence` = **what we traversed** (counts per edge in this run).  
- `action_candidates` = **what we could do** (available affordances at that moment).  
They complement — not duplicate — the canonical graph, and together unlock deterministic replay, accurate coverage, and responsive UI streaming.
