## Founder's Mental Model: Deterministic, Self-Healing ScreenGraph (2-pager)

### 1) Core Idea
Single-sink events → deterministic projection → canonical graph → run-scoped views → live/replay streams. We never write business state twice; we derive it from the event log and can always rebuild.

Self-healing means: if projection logic evolves, we can replay events and heal the graph without touching the agent. Determinism means: actions contain enough facts to reproduce the run exactly.

### 2) Data Flow (What happens)
1. Agent perceives a screen → emits `agent.event.screen_perceived` with artifacts + hashes
2. Projector tails `run_events` → normalizes XML → computes `layout_hash`
3. Projector upserts `screens`; records `graph_persistence_outcomes` with `source_run_seq`
4. When actions are executed, projector records/updates:
   - `actions` (provenance, selectors, coordinates)
   - `edges` (from → action → to) and increments evidence
   - `action_execution_coverage` per run
5. API surfaces run-scoped graph via REST and SSE (live or replay)

Result: A canonical, replayable map of the app with coverage stats that guide exploration.

### 3) Code Flow (How it’s implemented)
- Projector loop:
  - Read events since `graph_projection_cursors.next_seq`
  - For each `screen_perceived` → compute `layout_hash` → upsert `screens` → write outcome with `source_run_seq`
  - For action-related events → upsert `actions` (provenance), update `action_execution_coverage`, upsert `edges`
  - Advance cursor and log batch summary

- Endpoints:
  - `GET /graph/run/:runId` → Join canonical tables filtered to run; compute metadata (counts, coverage)
  - `GET /graph/run/:runId/stream` → Interleave `graph.*` with `source_run_seq`; replay then live tail; close on run end

### 4) What “Full Coverage” Means Here
- Screen coverage: have we discovered all reachable screens (to our heuristics)?
- Action coverage: on each screen, have we attempted all discernible actions at least once? Did they succeed?
- Unexplored actions are the backlog for the planner; the stream feeds the UI and the planner simultaneously.

### 5) Deterministic Replay Requirements
- Every action carries: origin (xml|llm|heuristic), selector snapshot, optional (x,y) coordinates, and input payload
- Replay preconditions: same device class/resolution, same seed; verify next state by `layout_hash`
- If verification fails → log with `stopReason` and attach diffs for diagnosis

### 6) LLM Hook (Future)
- Provide last visited screens/actions and current screen affordances as a typed payload
- LLM selects next action → agent executes → projector updates coverage; loop continues
- We can measure exploration efficiency and convergence (coverage over time)

### 7) Why This Scales
- Canonical, cross-run storage eliminates duplication
- Run-scoped views and streams support concurrent explorers
- Rebuild-on-demand (projection replay) de-risks schema/algorithm evolution

### 8) Non-Negotiables
- Single-sink: agent writes only to `run_events`
- Deterministic: rich action facts for replay
- Typed APIs: no `any`, no magic strings
- Observability: structured logs by module/actor with correlation IDs


