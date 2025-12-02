# Server-Sent Events (SSE) Patterns

## Basic SSE Stream

### Backend: StreamOut

```typescript
import { api, StreamOut } from "encore.dev/api";

export interface Event {
  type: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export const streamEvents = api(
  { method: "GET", path: "/events/stream" },
  async (params: {}, stream: StreamOut<Event>): Promise<void> => {
    // Send events
    for (let i = 0; i < 10; i++) {
      await stream.send({
        type: 'counter',
        timestamp: new Date(),
        data: { count: i }
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
);
```

### Frontend: EventSource Alternative

```typescript
export async function* streamEvents(): AsyncGenerator<Event> {
  const response = await fetch(`${API_BASE}/events/stream`);
  
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        yield JSON.parse(line.slice(6));
      }
    }
  }
}
```

### Component

```svelte
<script lang="ts">
  import { streamEvents } from '$lib/api';
  
  let events = $state<Event[]>([]);
  
  $effect(() => {
    const stream = streamEvents();
    
    (async () => {
      for await (const event of stream) {
        events = [...events, event];
      }
    })();
    
    return () => stream.return?.();
  });
</script>

{#each events as event (event.timestamp)}
  <div>{event.type}: {JSON.stringify(event.data)}</div>
{/each}
```

---

## Run Events Stream (Real-World Example)

### Backend

```typescript
export interface RunEvent {
  kind: "agent.state.changed" | "screen.discovered" | "edge.created";
  sequence: number;
  timestamp: Date;
  payload: Record<string, unknown>;
}

export const streamRunEvents = api(
  { method: "GET", path: "/run/:id/stream" },
  async ({ id }: { id: string }, stream: StreamOut<RunEvent>): Promise<void> => {
    // Historical events
    const events = await db.query<RunEvent>`
      SELECT kind, sequence, timestamp, payload
      FROM run_events
      WHERE run_id = ${id}
      ORDER BY sequence ASC
    `;
    
    for await (const event of events) {
      await stream.send(event);
    }
    
    // Live events via PubSub
    const subscription = await runEvents.subscribe(id);
    for await (const msg of subscription) {
      await stream.send(msg);
    }
  }
);
```

### Frontend: Reconnecting Stream

```typescript
export async function* streamRunEvents(
  runId: string,
  options: { maxRetries?: number } = {}
): AsyncGenerator<RunEvent> {
  const { maxRetries = 3 } = options;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(`${API_BASE}/run/${runId}/stream`);
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            yield JSON.parse(line.slice(6));
          }
        }
      }
      
      break; // Success, exit retry loop
    } catch (err) {
      retries++;
      if (retries >= maxRetries) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * retries));
    }
  }
}
```

### Component with Connection Status

```svelte
<script lang="ts">
  import { streamRunEvents } from '$lib/api';
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let events = $state<RunEvent[]>([]);
  let status = $state<'connecting' | 'connected' | 'disconnected'>('connecting');
  
  $effect(() => {
    const stream = streamRunEvents(data.runId);
    status = 'connecting';
    
    (async () => {
      try {
        for await (const event of stream) {
          if (status !== 'connected') status = 'connected';
          events = [...events, event];
        }
      } catch (err) {
        console.error('Stream error:', err);
      } finally {
        status = 'disconnected';
      }
    })();
    
    return () => {
      stream.return?.();
    };
  });
  
  const latestEvent = $derived(events[events.length - 1]);
</script>

<div class="run-stream">
  <div class="status" class:connected={status === 'connected'}>
    {status === 'connected' ? '🟢' : '🔴'} {status}
  </div>
  
  {#if latestEvent}
    <div class="latest">{latestEvent.kind}</div>
  {/if}
  
  <div class="events">
    {#each events as event (event.sequence)}
      <div class="event">{event.kind} at {event.timestamp}</div>
    {/each}
  </div>
</div>
```

---

## Graph Stream (Filtered Events)

### Backend

```typescript
export const streamGraphEvents = api(
  { method: "GET", path: "/graph/:runId/stream" },
  async ({ runId }: { runId: string }, stream: StreamOut<GraphEvent>): Promise<void> => {
    // Only send graph-related events
    const subscription = await runEvents.subscribe(runId);
    
    for await (const msg of subscription) {
      if (msg.kind.startsWith('screen.') || msg.kind.startsWith('edge.')) {
        await stream.send({
          type: msg.kind,
          payload: msg.payload,
          timestamp: msg.timestamp
        });
      }
    }
  }
);
```

---

## Progress Updates

### Backend

```typescript
export const streamProgress = api(
  { method: "GET", path: "/job/:id/progress" },
  async ({ id }: { id: string }, stream: StreamOut<ProgressEvent>): Promise<void> => {
    for (let progress = 0; progress <= 100; progress += 10) {
      await stream.send({
        jobId: id,
        progress,
        message: `Processing... ${progress}%`,
        timestamp: new Date()
      });
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
);
```

### Frontend

```svelte
<script lang="ts">
  let progress = $state(0);
  let message = $state('');
  
  $effect(() => {
    const stream = streamProgress(jobId);
    
    (async () => {
      for await (const event of stream) {
        progress = event.progress;
        message = event.message;
      }
    })();
    
    return () => stream.return?.();
  });
</script>

<progress value={progress} max="100"></progress>
<p>{message}</p>
```

---

## Best Practices

1. **Always cleanup**: Return cleanup function from `$effect()`
2. **Handle reconnection**: Implement exponential backoff
3. **Buffer management**: Clear buffer between messages to prevent memory leaks
4. **Type safety**: Use generated types from Encore client
5. **Error boundaries**: Wrap async streams in try-catch
6. **Status indicators**: Show connection status to user
7. **Historical + Live**: Send historical events first, then subscribe to live






