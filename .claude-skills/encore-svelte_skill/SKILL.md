---
name: encore-svelte
description: Full-stack type-safe development workflow for Encore.ts backend + Svelte 5 (SvelteKit 2) frontend. Use when building API endpoints, integrating real-time streams, implementing data loading patterns, or debugging cross-stack issues. Covers client generation, SSE streaming, form actions, testing strategies, and common pitfalls.
---

# Encore.ts + Svelte 5 Integration Skill

## Mission

Ship type-safe full-stack features with Encore.ts microservices backend and SvelteKit 2 (Svelte 5 runes) frontend. This skill provides proven patterns for API integration, real-time data streaming, and cross-stack debugging.

---

## When to Use This Skill

- Building new API endpoints that frontend will consume
- Implementing real-time features (SSE streams, live updates)
- Creating data-driven pages with SvelteKit load functions
- Integrating form actions with backend services
- Debugging type mismatches between backend and frontend
- Setting up authentication flows
- Implementing database queries with frontend display
- Optimizing performance across the full stack

---

## Core Integration Pattern

### The Golden Workflow

```
1. Define Backend API (Encore.ts)
   ↓
2. Regenerate Frontend Client
   ↓
3. Implement SvelteKit Load Function
   ↓
4. Build Svelte 5 Component
   ↓
5. Test Full Flow
```

**Critical Rule**: After ANY backend API change, ALWAYS run `cd frontend && bun run gen` to regenerate the type-safe client.

---

## Part 1: API Endpoint Development

### Backend: Define Typed Endpoint

```typescript
// backend/portfolio/encore.service.ts
import { api } from "encore.dev/api";

/** Portfolio data with holdings and valuations */
export interface Portfolio {
  id: string;
  userId: string;
  holdings: Holding[];
  totalValue: number;
  lastSyncedAt: Date;
}

/** Get portfolio by user ID */
export const getPortfolio = api(
  { method: "GET", path: "/portfolio/:userId", auth: true },
  async ({ userId }: { userId: string }): Promise<Portfolio> => {
    const portfolio = await db.getPortfolio(userId);
    if (!portfolio) {
      throw APIError.notFound("Portfolio not found");
    }
    return portfolio;
  }
);
```

### Frontend: Regenerate Client

```bash
cd frontend && bun run gen
```

**What this does:**
- Fetches OpenAPI spec from Encore backend
- Generates TypeScript client with full type safety
- Updates `frontend/src/lib/encore-client.ts`

### Frontend: SvelteKit Load Function

```typescript
// frontend/src/routes/portfolio/[userId]/+page.ts
import { portfolio } from '~encore/clients';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params, fetch }) => {
  try {
    const data = await portfolio.getPortfolio({ userId: params.userId });
    return { portfolio: data };
  } catch (err) {
    if (err.status === 404) {
      throw error(404, 'Portfolio not found');
    }
    throw error(500, 'Failed to load portfolio');
  }
};
```

### Frontend: Svelte 5 Component

```svelte
<!-- frontend/src/routes/portfolio/[userId]/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  // data.portfolio is fully typed from Encore backend!
  const totalValue = $derived(data.portfolio.totalValue.toFixed(2));
  const holdingCount = $derived(data.portfolio.holdings.length);
</script>

<div class="portfolio">
  <h1>Portfolio: {data.portfolio.userId}</h1>
  <p class="total">Total Value: ${totalValue}</p>
  <p class="count">{holdingCount} holdings</p>
  
  {#each data.portfolio.holdings as holding (holding.id)}
    <div class="holding">
      <span>{holding.symbol}</span>
      <span>${holding.currentValue.toFixed(2)}</span>
    </div>
  {/each}
</div>
```

**Key Points:**
- ✅ Full type safety from backend to frontend
- ✅ `$props()` for component inputs (Svelte 5 runes)
- ✅ `$derived()` for computed values
- ✅ Keyed `{#each}` blocks for performance
- ✅ Error handling via SvelteKit error pages

---

## Part 2: Real-Time Data (SSE Streaming)

### Backend: StreamOut Endpoint

```typescript
// backend/run/stream.ts
import { api, StreamOut } from "encore.dev/api";

export interface RunEvent {
  kind: "agent.state.changed" | "screen.discovered" | "edge.created";
  sequence: number;
  timestamp: Date;
  payload: Record<string, unknown>;
}

/** Stream real-time run events via SSE */
export const streamRunEvents = api(
  { method: "GET", path: "/run/:id/stream", auth: true },
  async ({ id }: { id: string }, stream: StreamOut<RunEvent>): Promise<void> => {
    // Send historical events
    const events = await getRunEvents(id);
    for (const event of events) {
      await stream.send(event);
    }
    
    // Subscribe to live events via PubSub
    const subscription = await runEvents.subscribe(id);
    for await (const msg of subscription) {
      await stream.send(msg);
    }
  }
);
```

### Frontend: SSE Consumer

```typescript
// frontend/src/lib/api.ts
import type { run } from '~encore/clients';

/** Stream run events as async generator */
export async function* streamRunEvents(runId: string): AsyncGenerator<RunEvent> {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/run/${runId}/stream`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
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
        yield JSON.parse(line.slice(6)) as RunEvent;
      }
    }
  }
}
```

### Frontend: Reactive Component

```svelte
<!-- frontend/src/routes/run/[id]/+page.svelte -->
<script lang="ts">
  import { streamRunEvents } from '$lib/api';
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  let events = $state<RunEvent[]>([]);
  let isConnected = $state(false);
  
  $effect(() => {
    const stream = streamRunEvents(data.runId);
    isConnected = true;
    
    (async () => {
      for await (const event of stream) {
        events = [...events, event]; // Reactive update
      }
      isConnected = false;
    })();
    
    return () => {
      // Cleanup on unmount
      stream.return?.();
    };
  });
  
  const latestEvent = $derived(events[events.length - 1]);
</script>

<div class="run-stream">
  <div class="status">
    {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
  </div>
  
  <h2>Latest: {latestEvent?.kind}</h2>
  
  <div class="events">
    {#each events as event (event.sequence)}
      <div class="event">
        <span class="kind">{event.kind}</span>
        <span class="time">{event.timestamp}</span>
      </div>
    {/each}
  </div>
</div>
```

**Pattern Notes:**
- ✅ `$effect()` manages stream lifecycle
- ✅ Cleanup function prevents memory leaks
- ✅ Reactive array updates trigger UI re-renders
- ✅ `$derived()` for computed latest event
- ✅ Keyed `{#each}` for efficient list rendering

---

## Part 3: Form Actions + Backend Integration

### Backend: POST Endpoint

```typescript
// backend/portfolio/sync.ts
import { api } from "encore.dev/api";
import { z } from "zod";

const syncRequestSchema = z.object({
  userId: z.string().min(1),
  source: z.enum(["zerodha", "csv"])
});

export interface SyncResponse {
  portfolioId: string;
  holdingsCount: number;
  totalValue: number;
}

/** Sync portfolio from external source */
export const syncPortfolio = api(
  { method: "POST", path: "/portfolio/sync", auth: true },
  async (req: unknown): Promise<SyncResponse> => {
    // Runtime validation with Zod
    const validated = syncRequestSchema.parse(req);
    
    const result = await performSync(validated.userId, validated.source);
    return result;
  }
);
```

### Frontend: Form Action

```typescript
// frontend/src/routes/portfolio/+page.server.ts
import { portfolio } from '~encore/clients';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  sync: async ({ request, locals }) => {
    const data = await request.formData();
    const source = data.get('source') as string;
    
    try {
      const result = await portfolio.syncPortfolio({
        userId: locals.userId,
        source
      });
      
      return { success: true, result };
    } catch (err) {
      return fail(400, { error: err.message });
    }
  }
};
```

### Frontend: Form Component

```svelte
<!-- frontend/src/routes/portfolio/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';
  
  let { data, form }: { data: PageData; form: ActionData } = $props();
  
  let isSubmitting = $state(false);
</script>

<form 
  method="POST" 
  action="?/sync" 
  use:enhance={() => {
    isSubmitting = true;
    return async ({ result, update }) => {
      await update();
      isSubmitting = false;
    };
  }}
>
  <select name="source" required>
    <option value="zerodha">Zerodha</option>
    <option value="csv">CSV Upload</option>
  </select>
  
  <button type="submit" disabled={isSubmitting}>
    {isSubmitting ? 'Syncing...' : 'Sync Portfolio'}
  </button>
  
  {#if form?.success}
    <p class="success">Synced {form.result.holdingsCount} holdings!</p>
  {/if}
  
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
</form>
```

**Pattern Benefits:**
- ✅ Progressive enhancement (works without JS)
- ✅ Optimistic UI with `enhance` directive
- ✅ Type-safe form data handling
- ✅ Server-side validation + error messages
- ✅ Reactive loading states

---

## Part 4: Database Integration

### Backend: Typed Query

```typescript
// backend/portfolio/portfolio.repo.ts
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("portfolio", { migrations: "./migrations" });

/** Get portfolio with typed result */
export async function getPortfolio(userId: string): Promise<Portfolio | null> {
  const row = await db.queryRow<{
    id: string;
    user_id: string;
    total_value: string; // ⚠️ PostgreSQL DECIMAL returns string!
    last_synced_at: Date;
  }>`
    SELECT id, user_id, total_value, last_synced_at
    FROM portfolios
    WHERE user_id = ${userId}
  `;
  
  if (!row) return null;
  
  return {
    id: row.id,
    userId: row.user_id,
    totalValue: Number(row.total_value), // Convert to number
    lastSyncedAt: row.last_synced_at
  };
}
```

### Frontend: Display with Type Conversion

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  // Safe number formatting
  const totalValue = $derived(
    Number(data.portfolio.totalValue).toFixed(2)
  );
</script>

<p>Total: ${totalValue}</p>
```

**Critical Rule**: PostgreSQL `DECIMAL`/`NUMERIC` types return **strings** via Node.js `pg` driver. Always wrap with `Number()` before using `.toFixed()` or arithmetic operations.

---

## Part 5: Testing Patterns

### Backend Testing (Encore.ts)

```typescript
// backend/portfolio/portfolio.test.ts
import { describe, test, expect } from "vitest";
import { getPortfolio, syncPortfolio } from "./encore.service";

// ✅ Import subscriptions if testing PubSub
import "../events/subscription";

describe("Portfolio Service", () => {
  test("should return portfolio for valid user", async () => {
    const result = await getPortfolio({ userId: "test-user" });
    expect(result).toBeDefined();
    expect(result?.userId).toBe("test-user");
  });
  
  test("should sync portfolio with polling", async () => {
    const { portfolioId } = await syncPortfolio({
      userId: "test-user",
      source: "zerodha"
    });
    
    // Poll for completion (not setTimeout)
    let status = "pending";
    let attempts = 0;
    while (status === "pending" && attempts < 30) {
      const result = await db.queryRow`
        SELECT status FROM sync_jobs WHERE id = ${portfolioId}
      `;
      status = result?.status || "pending";
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    expect(status).toBe("completed");
  });
});
```

**Run with:**
```bash
cd backend && encore test
cd backend && encore test portfolio/portfolio.test.ts
```

### Frontend Testing (Vitest + Testing Library)

```typescript
// frontend/src/lib/components/Portfolio.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, test, expect } from 'vitest';
import Portfolio from './Portfolio.svelte';

describe('Portfolio Component', () => {
  test('renders portfolio data correctly', () => {
    const portfolio = {
      userId: 'test',
      totalValue: 100000,
      holdings: []
    };
    
    render(Portfolio, { props: { portfolio } });
    
    expect(screen.getByText(/100000/)).toBeInTheDocument();
    expect(screen.getByText(/test/)).toBeInTheDocument();
  });
});
```

### E2E Testing (Playwright)

```typescript
// frontend/tests/portfolio.spec.ts
import { test, expect } from '@playwright/test';

test('portfolio page loads and syncs', async ({ page }) => {
  await page.goto('/portfolio/test-user');
  
  await expect(page.locator('h1')).toContainText('Portfolio');
  
  // Test form submission
  await page.selectOption('select[name="source"]', 'zerodha');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('.success')).toBeVisible();
});
```

---

## Part 6: Common Pitfalls & Solutions

### Pitfall 1: Forgetting Client Regeneration

**Symptom:**
```typescript
import { portfolio } from '~encore/clients';
portfolio.newEndpoint({ ... }); // TypeScript error: property doesn't exist
```

**Solution:**
```bash
cd frontend && bun run gen
```

**Prevention**: Add to git pre-commit hook or CI pipeline.

---

### Pitfall 2: DECIMAL Type Coercion

**Symptom:**
```typescript
const formatted = row.total.toFixed(2); // Runtime error: toFixed is not a function
```

**Solution:**
```typescript
const row = await db.queryRow<{ total: string }>`SELECT total_value as total ...`;
const total = Number(row.total);
const formatted = total.toFixed(2); // ✅
```

---

### Pitfall 3: PubSub Tests Not Running

**Symptom:**
```typescript
// Test publishes event but worker never starts
test('should process event', async () => {
  await pubsub.publish('topic', { data: 'test' });
  // Hangs forever, worker never runs
});
```

**Solution:**
```typescript
// Import subscription at top of test file
import "../orchestrator/subscription"; // ✅ CRITICAL

test('should process event', async () => {
  await pubsub.publish('topic', { data: 'test' });
  // Now worker runs in encore test environment
});
```

---

### Pitfall 4: SSR Hydration Mismatch

**Symptom:**
```
Warning: Hydration mismatch - server HTML doesn't match client HTML
```

**Solution:**
```svelte
<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  let clientOnlyData = $state('');
  
  onMount(() => {
    clientOnlyData = new Date().toISOString(); // Only runs on client
  });
</script>

{#if browser}
  <p>{clientOnlyData}</p>
{/if}
```

---

### Pitfall 5: Svelte 5 Runes with `const`

**Symptom:**
```svelte
<script lang="ts">
  const count = $state(0); // ❌ Cannot reassign const
  count = count + 1; // Error!
</script>
```

**Solution:**
```svelte
<script lang="ts">
  let count = $state(0); // ✅ Use let for mutable runes
  count = count + 1; // Works!
</script>
```

**Rule**: `$state`, `$derived` that you mutate must use `let`, not `const`.

---

## Part 7: Debugging Workflows

### Backend Issue

```
1. Load backend_vibe (Encore MCP + backend-debugging skill)
2. Use encore-mcp.get_services to inspect endpoints
3. Use encore-mcp.get_traces to see request flow
4. Use encore-mcp.query_database to verify data
5. Check structured logs: task backend:logs
6. Run focused test: encore test path/to.test.ts
```

### Frontend Issue

```
1. Load frontend_vibe (Playwright MCP + frontend-debugging skill)
2. Use playwright.navigate to load page
3. Use playwright.snapshot to inspect DOM
4. Use playwright.console_messages for errors
5. Use svelte.autofixer to validate syntax
6. Check if client is up-to-date: bun run gen
7. Run E2E test: bun test
```

### Cross-Stack Issue

```
1. Verify backend endpoint with Encore MCP
2. Check client generation timestamp
3. Regenerate client: bun run gen
4. Test backend in isolation with encore.call_endpoint
5. Test frontend with mocked data (MSW)
6. Run full E2E test
7. Check network tab via Playwright MCP
```

---

## Part 8: Reference Library

### Quick Commands

```bash
# Backend
cd backend && encore run          # Start dev server
cd backend && encore test          # Run all tests
cd backend && encore db reset      # Reset database

# Frontend
cd frontend && bun run dev         # Start dev server
cd frontend && bun run gen         # Regenerate Encore client
cd frontend && bun run check       # TypeScript check
cd frontend && bun test            # Run tests

# Full Stack
bun run dev                        # Start both (Turborepo)
cd .cursor && task founder:servers:start  # Automated startup
```

### File References

- `references/api-patterns.md` - Complete API endpoint patterns
- `references/sse-patterns.md` - Real-time streaming patterns
- `references/testing-strategies.md` - Full testing guide
- `references/type-safety-rules.md` - Type safety best practices
- `references/performance-optimization.md` - Performance patterns

### Related Skills

- `backend-development_skill` - Encore.ts development patterns
- `backend-debugging_skill` - Systematic backend debugging
- `frontend-development_skill` - Svelte 5 + Skeleton UI patterns
- `frontend-debugging_skill` - SvelteKit debugging procedures
- `e2e-testing_skill` - Playwright E2E testing strategies

### External Resources

- Encore.ts Documentation: https://encore.dev/docs
- Svelte 5 Documentation: https://svelte.dev/docs
- SvelteKit Documentation: https://kit.svelte.dev/docs
- ScreenGraph Research: `ENCORE_SVELTE_INTEGRATION_RESEARCH.md`

---

## Quick Start Checklist

**Before Starting:**
- [ ] Loaded appropriate vibe (backend_vibe, frontend_vibe, or both)
- [ ] Searched Graphiti for similar patterns
- [ ] Reviewed related skills
- [ ] Both dev servers running (`task founder:servers:status`)

**During Development:**
- [ ] Backend endpoint defined with types
- [ ] Frontend client regenerated (`bun run gen`)
- [ ] SvelteKit load function implemented
- [ ] Svelte 5 component using runes correctly
- [ ] Error handling in place
- [ ] Tests written for critical paths

**After Completion:**
- [ ] Full stack smoke test passed
- [ ] Type safety verified (no `any` types)
- [ ] Performance checked (no unnecessary re-renders)
- [ ] Documented solution in Graphiti
- [ ] Updated handoff docs if significant

---

**Version**: 1.0  
**Last Updated**: November 17, 2025  
**Maintained By**: CTO Office






