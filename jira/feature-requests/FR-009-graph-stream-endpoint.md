# FR-009: GET /graph/run/:runId/stream (Graph SSE)

**Status:** 📋 Todo  
**Priority:** P0 (Unblock Frontend)  
**Milestone:** M1 - Graph MVP  
**Owner:** TBD  
**Estimated Effort:** Medium

---

## 📝 Description
Create a run-scoped Server-Sent Events (SSE) endpoint that streams ScreenGraph updates in real time. Emits `graph.screen.*` and `graph.edge.*` events derived from the projection. This unblocks the frontend to render an evolving graph even while the agent main loop is not fully implemented (initially only splash screen discovery).

---

## 🎯 Acceptance Criteria
- [ ] `GET /graph/run/:runId/stream` SSE endpoint (Encore service: `backend/graph/`)
- [ ] Query params: `replay?=true|false` (default true), `fromSeq?=number` (default 0)
- [ ] Emits events in order using `source_run_seq` correlation
- [ ] Event types: `graph.screen.discovered`, `graph.screen.mapped`, `graph.edge.created` (reinforced optional)
- [ ] Minimum viable data payloads documented (IDs, hashes, timestamps)
- [ ] 404 if run not found
- [ ] Heartbeat every 30s
- [ ] CORS compatible with frontend dev
- [ ] Stream closes on run end when `replay=true` and run is already ended
- [ ] Type-safe DTOs; no `any` in backend
- [ ] Structured logging with module=`graph`, actor=`api`

---

## 🔗 Dependencies
- `graph_persistence_outcomes.source_run_seq` (004 migration)
- Graph projector writing outcomes for `screen_perceived` (present) and edges (future)
- Evidence views are NOT required; base tables are sufficient

---

## 🧪 Testing Requirements
- [ ] Unit: mapping outcomes → SSE payloads
- [ ] Integration: replay-only on ended run (stream opens → replays → closes)
- [ ] Integration: live tail on active run (heartbeat + new outcomes delivery)
- [ ] Ordering: monotonic by `source_run_seq`
- [ ] Load: 25+ concurrent SSE clients per run

---

## 📋 Technical Notes
**Endpoint:** `GET /graph/run/:runId/stream?replay=true&fromSeq=0`

**Event union (examples):**
```
// graph.screen.discovered
{
  type: "graph.screen.discovered",
  data: {
    runId: string,
    screenId: string,
    layoutHash: string,
    seqRef: number,
    ts: string
  }
}

// graph.edge.created
{
  type: "graph.edge.created",
  data: {
    runId: string,
    edgeId: string,
    fromScreenId: string,
    actionId: string,
    toScreenId: string,
    evidenceCounter: number,
    seqRef: number,
    ts: string
  }
}
```

**Ordering:** `(run_events.seq, outcomes.created_at)` via `graph_persistence_outcomes.source_run_seq`.

**Heartbeat:** `event: ping` every 30s.

---

## 🧩 Frontend Notes (SvelteKit 2, Svelte 5)
- Initial target: render nodes and links as events arrive
- With Encore-generated client available: use the typed stream helper
- Temporary fallback (OK for SSE): `new EventSource(PUBLIC_API_BASE + "/graph/run/" + runId + "/stream?replay=true")`

Minimal example (store update):
```ts
import { writable } from 'svelte/store';
export const graphStore = writable<{ nodes: Record<string, { id: string }>; links: Array<{ from: string; to: string; actionId: string }> }>({ nodes: {}, links: [] });
```

---

## 🛠️ Work Breakdown
**Backend**
1) Implement Encore stream endpoint in `backend/graph/encore.service.ts`
2) Query `graph_persistence_outcomes` with `run_id`, `source_run_seq > fromSeq`
3) Map rows → SSE payloads; send heartbeats; close per acceptance rules
4) Add DTOs and logging

**Frontend**
1) Wire an SSE client to update a local graph store
2) Render basic force-directed layout (or incremental list) of nodes/edges
3) Add skeleton loader and empty state

---

## 🏷️ Labels
`api`, `backend`, `frontend`, `sse`, `graph`, `milestone-1`, `p0`

