# FR-008: Timeline UI Component with SSE Integration

**Status:** 📋 Todo  
**Priority:** P0 (Critical)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Large

---

## 📝 Description
Build React timeline component that connects to SSE stream, displays run events in real-time, handles reconnection with backfill, and shows terminal states.

---

## 🎯 Acceptance Criteria
- [ ] Timeline component renders event list in chronological order
- [ ] SSE client connects to `/run/:id/stream` on mount
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
<RunTimeline runId={id}>
  <TimelineHeader status={status} />
  <EventList events={events} />
  <ConnectionStatus connected={connected} />
</RunTimeline>
```

**SSE Client Hook:**
```typescript
const useRunStream = (runId: string) => {
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const lastEventId = useRef<string | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(
      `/run/${runId}/stream?lastEventId=${lastEventId.current || ''}`
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
  }, [runId]);

  return { events, connected };
};
```

**Event Rendering:**
- `RUN_STARTED`: 🚀 "Run started"
- `NODE_START`: ⚙️ "Starting {nodeType}"
- `NODE_COMPLETE`: ✅ "{nodeType} completed"
- `PROCESSING`: 🔄 "Processing..."
- `RUN_COMPLETED`: 🎉 "Run completed successfully"
- `RUN_FAILED`: ❌ "Run failed: {error}"
- `RUN_CANCELLED`: 🚫 "Run cancelled"

**Virtualization:**
Use `react-window` or similar for efficient rendering of large event lists.

---

## 🏷️ Labels
`frontend`, `ui`, `sse`, `timeline`, `milestone-1`, `p0`
