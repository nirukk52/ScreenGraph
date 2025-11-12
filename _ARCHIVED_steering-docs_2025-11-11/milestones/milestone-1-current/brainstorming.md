# ScreenGraph Event Pipeline Architecture Evaluation

## Context
Building a deterministic event streaming system for mobile app exploration that provides:
- Replayable evidence of agent runs
- Live streaming with reconnect/backfill
- Exactly-once terminal event guarantee
- Multi-tenant isolation
- Visual timeline for analysts

## Architectural Approaches Evaluated

### Approach A: Monolithic Orchestrator + Outbox Pattern
**Architecture:**
- Single long-lived worker process per run
- Sequential node execution (Perceive → Enumerate → Choose → Act → Verify → Persist → Detect → Continue)
- All events appended to `run_events` table during execution
- Separate outbox publisher worker polls and publishes to Redis Pub/Sub
- SSE endpoint streams from Redis topic + backfill from DB

**Pros:**
- Simple mental model: one run = one worker job
- Natural transaction boundaries (node completion = batch of events)
- State transitions are in-memory between nodes
- Encore queue naturally handles crash recovery (requeue on failure)
- Clean separation: orchestrator writes, outbox reads
- Deterministic replay: events are serialized before publication

**Cons:**
- Long-lived workers hold resources during slow operations (LLM calls, device waits)
- Scaling limited by concurrent worker capacity
- If worker crashes mid-run, entire run must restart from checkpoint
- Memory footprint grows with run duration (unless state is pruned)

**Encore Fit:**
- ✅ Perfect match for Encore queue semantics
- ✅ Natural use of Postgres transactions
- ✅ Pub/Sub integration straightforward
- ⚠️ May need custom retry/checkpoint logic for long runs

---

### Approach B: Distributed Node Tasks (Event-Driven)
**Architecture:**
- Each node (Perceive, Enumerate, Choose, etc.) is a separate queue handler
- Events trigger the next node via Pub/Sub
- No long-lived orchestrator; state flows through events
- Each node reads previous state, emits events, triggers next node
- Outbox still handles publication ordering

**Pros:**
- Highly scalable: thousands of runs can execute different nodes concurrently
- Short-lived tasks minimize resource holding
- Natural backpressure: slow nodes don't block others
- Easy to add observability per node type
- Crash recovery is per-node, not per-run

**Cons:**
- Complex choreography: no central coordinator
- Harder to reason about full run lifecycle
- State must be materialized to DB between every node
- More database roundtrips (read state → process → write state)
- Debugging requires tracing across many async tasks
- Risk of event ordering bugs if not carefully designed

**Encore Fit:**
- ✅ Leverages Encore Pub/Sub event routing
- ⚠️ Requires careful event schema design
- ❌ Less natural fit for sequential dependencies
- ⚠️ More complex to guarantee deterministic ordering

---

### Approach C: Hybrid Orchestrator with Async Breakpoints
**Architecture:**
- Orchestrator worker for fast nodes (Perceive, Enumerate, Choose, Detect)
- Async delegation for slow operations (Act, LLM calls)
- Orchestrator emits events, then enqueues slow task
- Slow task completion triggers continuation event
- Outbox publishes all events in order
- State checkpointed at breakpoints

**Pros:**
- Best of both worlds: fast iteration + async scaling
- Orchestrator holds context for reasoning flow
- Slow operations don't block worker pool
- Clear breakpoints for crash recovery
- Can optimize fast-path vs slow-path differently

**Cons:**
- More complex implementation (two execution modes)
- Requires careful checkpoint/resume logic
- State must be serializable at breakpoints
- More edge cases to test (resume failures, partial completion)

**Encore Fit:**
- ✅ Leverages both queue patterns (long job + async task)
- ✅ Natural for LLM streaming (delegate, collect tokens)
- ⚠️ Requires custom orchestration state machine
- ✅ Outbox pattern still centralizes ordering

---

## Recommendation: **Approach A (Monolithic Orchestrator + Outbox)**

### Reasoning

**1. Alignment with Deterministic Goals**
- Sequential execution eliminates race conditions
- Single transaction boundary per node = atomic event batches
- Replay is trivial: re-run the same state machine
- Debugging is linear: follow the orchestrator logs

**2. Encore Service Graph Fit**
```
API Service → Queue (RunJob) → Orchestrator Worker
                                      ↓
                              run_events table
                                      ↓
                              Outbox Publisher → Redis Pub/Sub
                                                       ↓
                                                  SSE Stream
```
This is idiomatic Encore: services emit jobs, workers process deterministically, pub/sub broadcasts.

**3. Multi-Tenant Isolation**
- Topic pattern: `tenant:{tid}:run:{id}`
- Outbox worker can batch publish across tenants
- Postgres row-level security for tenant data
- Scale by adding worker concurrency (Encore auto-scales)

**4. Cost Efficiency**
- Most runs will be short (<5 min) → worker churn is acceptable
- Long runs can checkpoint state every N nodes
- Redis pub/sub is cheap for ephemeral streams
- DB queries are minimal (append events, poll outbox)

**5. State Diffs & Drift Detection**
- Each event includes `stateBefore` hash + `stateAfter` hash
- Future feature: diff two runs' event streams to find divergence
- Artifacts (screenshots, XML) stored in object storage, referenced by event
- Timeline UI can show side-by-side diffs

**6. Observability**
- Encore tracing captures full run as single trace span
- Each node is a child span with events as annotations
- Custom timeline is UI sugar over Encore's built-in trace
- Errors automatically surface in Encore dashboard

---

## Milestone Phasing

### M1: Stream Backbone (Current Focus)
**Goal:** Deterministic event pipeline with live streaming

**Deliverables:**
- API endpoints: `POST /runs`, `GET /runs/:id/stream`, `POST /runs/:id/cancel`
- Orchestrator worker with 3 demo nodes (Start → Process → Finish)
- Outbox publisher job (200ms poll interval)
- SSE stream with reconnect/backfill
- UI timeline showing live events

**Tech Debt Allowed:**
- Hardcoded tenant ID
- In-memory state (no checkpoints)
- Mock LLM responses
- No artifact storage

---

### M2: Device Integration & Artifacts
**Goal:** Real ADB/Appium actions with screenshot capture

**Deliverables:**
- `Act` node executes real device commands
- Screenshots stored in Encore Object Storage
- Events reference artifact URLs
- UI displays thumbnails in timeline
- Device pool management (acquire/release)

**Tech Debt Allowed:**
- Single device (no parallelization)
- No diff detection yet

---

### M3: Reasoning & LLM Streaming
**Goal:** Agent uses vision models to choose actions

**Deliverables:**
- `Perceive` node calls vision API with screenshot
- `ChooseAction` node streams LLM reasoning (token deltas)
- Events include reasoning traces
- UI shows thinking process in real-time
- Token usage metrics

**Tech Debt Allowed:**
- Simple action space (tap only)
- No long-term memory

---

### M4: Progress Detection & Graph Building
**Goal:** Build replayable state graph

**Deliverables:**
- `Persist` node writes to graph DB (nodes = screens, edges = actions)
- `DetectProgress` compares current screen to history
- Termination criteria (max steps, goal reached, stuck)
- UI shows graph visualization
- Replay mode: follow edge sequence

---

### M5: Drift Detection & Baseline Comparison
**Goal:** Compare runs to detect UI changes

**Deliverables:**
- Store baseline run as reference
- Diff engine compares event streams
- UI highlights divergence points
- Alert on unexpected state changes
- Screenshot diff viewer

---

## Open Questions for Next Steps

1. **Checkpoint Strategy:** How often should orchestrator checkpoint state to DB for crash recovery? Every node? Every 10 nodes?

2. **Artifact Retention:** How long to keep screenshots/XML? Lifecycle policy per tenant?

3. **Stream Scaling:** At what concurrency does single Redis pub/sub become bottleneck? Need sharding strategy?

4. **LLM Latency:** If vision calls take 10s, does orchestrator hold worker that long? Or delegate to async task (Approach C)?

5. **UI Pagination:** If run has 10,000 events, does timeline paginate or virtualize?

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-10-23 | Use Approach A (Monolithic Orchestrator) | Best fit for deterministic goals + Encore primitives |
| 2025-10-23 | Outbox polls every 200ms | Balance between latency and DB load |
| 2025-10-23 | Redis pub/sub for live stream | Cheap, ephemeral, scales horizontally |
| 2025-10-23 | SSE over WebSocket | Simpler client, auto-reconnect, HTTP/2 multiplexing |

---

## Next Actions

- [ ] Implement M1 orchestrator with 3 demo nodes
- [ ] Design `run_events` and `run_outbox` schema
- [ ] Build outbox publisher as Encore cron job
- [ ] Create SSE streaming endpoint with backfill
- [ ] UI timeline component with auto-reconnect
- [ ] Write integration test: start run → receive all events → terminal event
