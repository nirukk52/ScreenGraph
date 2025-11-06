# FR-009: GET /graph/run/:runId/stream (Graph SSE)

**Status:** ✅ Done  
**Priority:** P0 (Unblock Frontend)  
**Milestone:** M1 - Graph MVP  
**Owner:** Backend Engineer  
**Estimated Effort:** Medium
**Completed:** 2025-11-05

---

## 📝 Description
Create a run-scoped Server-Sent Events (SSE) endpoint that streams ScreenGraph updates in real time. Emits `graph.screen.*` and `graph.edge.*` events derived from the projection. This unblocks the frontend to render an evolving graph even while the agent main loop is not fully implemented (initially only splash screen discovery).

---

## 🎯 Acceptance Criteria
- [x] `GET /graph/run/:runId/stream` SSE endpoint (Encore service: `backend/graph/`)
- [x] Query params: `replay?=true|false` (default true), `fromSeq?=number` (default 0)
- [x] Emits events in order using `source_run_seq` correlation
- [x] Event types: `graph.screen.discovered`, `graph.screen.mapped` with inline screenshots
- [x] Minimum viable data payloads documented (IDs, hashes, timestamps, screenshot dataUrl)
- [x] 404 if run not found
- [x] Heartbeat every 30s
- [x] CORS compatible with frontend dev
- [x] Stream closes on run end when `replay=true` and run is already ended
- [x] Type-safe DTOs; no `any` in backend
- [x] Structured logging with module=`graph`, actor=`api`

---

## 🔗 Dependencies
- `graph_persistence_outcomes.source_run_seq` (004 migration)
- Graph projector writing outcomes for `screen_perceived` (present) and edges (future)
- Evidence views are NOT required; base tables are sufficient

---

## 🧪 Testing Requirements
- [x] Unit: mapping outcomes → SSE payloads
- [x] Integration: replay-only on ended run (stream opens → replays → closes)
- [x] Integration: live tail on active run (heartbeat + new outcomes delivery)
- [x] Ordering: monotonic by `source_run_seq`
- [x] Load: 5+ concurrent SSE clients per run (tested via Encore runtime)

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
    perceptualHash: string,
    seqRef: number,
    ts: string,
    screenshot: {
      refId: string | null,
      dataUrl: string | null,  // "data:image/png;base64,..."
      width?: number,
      height?: number
    }
  }
}

// graph.screen.mapped
{
  type: "graph.screen.mapped",
  data: {
    runId: string,
    screenId: string,
    layoutHash: string,
    perceptualHash: string,
    seqRef: number,
    ts: string,
    screenshot: {
      refId: string | null,
      dataUrl: string | null,
      width?: number,
      height?: number
    }
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
**Backend** ✅ Completed
1) ✅ Implemented Encore stream endpoint in `backend/graph/stream.ts`
2) ✅ Query `graph_persistence_outcomes` with `run_id`, `source_run_seq > fromSeq`
3) ✅ Map rows → SSE payloads with inline screenshot dataUrls; send heartbeats; close per acceptance rules
4) ✅ Added DTOs and logging
5) ✅ Created comprehensive test suite in `backend/graph/stream.test.ts`

**Frontend** (Future work after backend is complete)
1) Wire an SSE client to update a local graph store
2) Render basic force-directed layout (or incremental list) of nodes/edges with screenshots
3) Add skeleton loader and empty state

---

## 🏷️ Labels
`api`, `backend`, `frontend`, `sse`, `graph`, `milestone-1`, `p0`

---

## 📝 Implementation Summary

### Files Created/Modified
1. **`backend/graph/stream.ts`** (NEW) - Complete SSE endpoint implementation
   - Type-safe DTOs with no `any` types
   - Structured logging with `module: "graph"`, `actor: "api"`
   - Screenshot fetching and inline data URL generation
   - Heartbeat mechanism (30s interval)
   - Replay and live tail modes
   - Graceful stream closure on run end

2. **`backend/graph/encore.service.ts`** (MODIFIED) - Registered stream endpoint

3. **`backend/graph/stream.test.ts`** (NEW) - Comprehensive test suite
   - Outcome ordering verification
   - Screenshot correlation tests
   - Run status detection tests
   - Event type mapping tests
   - Data URL MIME type tests

### Key Implementation Details
- **Screenshot correlation**: Finds nearest prior `agent.event.screenshot_captured` event by seq
- **Data URL generation**: Downloads from artifacts bucket, infers MIME type from extension, converts to base64
- **Ordering guarantee**: Strict monotonic ordering by `source_run_seq`
- **Heartbeat workaround**: Uses special marker event (`screenId: "__heartbeat__"`) since Encore SSE doesn't support custom event types
- **Error handling**: Graceful fallback to `null` screenshot if artifact fetch fails

### Usage Example
```bash
# Connect to stream (via browser or curl)
curl -N http://localhost:4000/graph/run/<runId>/stream?replay=true&fromSeq=0
```

### Frontend Integration Notes
Events include `screenshot.dataUrl` field ready for `<img src={dataUrl}>` rendering. No additional artifact fetching needed by frontend.

