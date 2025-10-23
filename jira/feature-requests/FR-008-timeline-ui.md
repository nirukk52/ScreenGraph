# FR-008: Timeline UI Component with SSE Integration

**Status:** 📋 Todo  
**Priority:** P0 (Critical)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Large

---

## 📝 Description
Build React timeline component that connects to SSE stream, displays crawl events in real-time, handles reconnection with backfill, and shows terminal states.

---

## 🎯 Acceptance Criteria
- [ ] Timeline component renders event list in chronological order
- [ ] SSE client connects to `/crawl/:id/stream` on mount
- [ ] Events appear in UI within 500ms of server emission (p95)
- [ ] Auto-reconnect on connection loss with exponential backoff
- [ ] Backfill uses `Last-Event-ID` header to fetch missed events
- [ ] Display terminal states: ✅ Completed, ❌ Failed, 🚫 Cancelled
- [ ] Loading state while connecting
- [ ] Error state on connection failure with retry button
- [ ] Event types rendered with distinct icons/colors
- [ ] Auto-scroll to latest event (with option to disable)
- [ ] Virtualized rendering for 1000+ events

---

## 🔗 Dependencies
- SSE endpoint (FR-002)
- Event schema from orchestrator (FR-004)

---

## 🧪 Testing Requirements
- [ ] Unit test: Component renders events from mock stream
- [ ] Unit test: Reconnection triggers backfill request
- [ ] Integration test: Display events from real SSE endpoint
- [ ] E2E test: Disconnect network, reconnect, verify backfill
- [ ] Performance test: Render 1000 events without lag
- [ ] Test: Terminal event stops reconnection attempts

---

## 📋 Technical Notes
**Component Structure:**
```typescript
<CrawlTimeline crawlId={id}>
  <TimelineHeader status={status} />
  <EventList events={events} />
  <ConnectionStatus connected={connected} />
</CrawlTimeline>
```

**SSE Client Hook:**
```typescript
const useCrawlStream = (crawlId: string) => {
  const [events, setEvents] = useState<CrawlEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const lastEventId = useRef<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(
      `/crawl/${crawlId}/stream?lastEventId=${lastEventId.current || ''}`
    );
    
    eventSource.onmessage = (e) => {
      const event = JSON.parse(e.data);
      setEvents(prev => [...prev, event]);
      lastEventId.current = e.lastEventId;
    };
    
    // Auto-reconnect with backfill on disconnect
    eventSource.onerror = () => {
      setConnected(false);
      // Reconnect after 2s with last event ID
    };
    
    return () => eventSource.close();
  }, [crawlId]);

  return { events, connected };
};
```

**Event Rendering:**
- `CRAWL_STARTED`: 🚀 "Crawl started"
- `NODE_START`: ⚙️ "Starting {nodeType}"
- `NODE_COMPLETE`: ✅ "{nodeType} completed"
- `PROCESSING`: 🔄 "Processing..."
- `CRAWL_COMPLETED`: 🎉 "Crawl completed successfully"
- `CRAWL_FAILED`: ❌ "Crawl failed: {error}"
- `CRAWL_CANCELLED`: 🚫 "Crawl cancelled"

**Virtualization:**
Use `react-window` or similar for efficient rendering of large event lists.

---

## 🏷️ Labels
`frontend`, `ui`, `sse`, `timeline`, `milestone-1`, `p0`
