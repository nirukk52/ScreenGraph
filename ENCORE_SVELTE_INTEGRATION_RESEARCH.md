# Encore.ts + Svelte 5 Integration Research
## CTO Perspective: Building Production-Ready Full-Stack TypeScript Applications

**Date**: November 17, 2025  
**Author**: CTO Research Team  
**Purpose**: Definitive guide for integrating Encore.ts backend with Svelte 5 frontend

---

## Executive Summary

**Stack**: Encore.ts microservices + SvelteKit 2 (Svelte 5) + PostgreSQL  
**Deployment**: Encore Cloud (backend) + Vercel (frontend)  
**Type Safety**: End-to-end via Encore-generated client  
**Real-Time**: Server-Sent Events (SSE) for live updates

**Key Insight**: This stack provides **full-stack type safety with zero manual API contracts**, real-time capabilities out-of-the-box, and deployment simplicity that rivals Next.js + Vercel but with **better separation of concerns**.

---

## Part 1: Architecture Overview

### Why This Stack?

**Encore.ts Benefits:**
- Infrastructure from code (databases, PubSub, secrets, cron)
- Built-in distributed tracing and observability
- Type-safe service definitions with auto-generated OpenAPI
- Testing environment with ephemeral resources (`encore test`)
- Cloud deployment with CI/CD built-in
- Microservices without the complexity (local development feels monolithic)

**Svelte 5 Benefits:**
- Smallest bundle sizes (no virtual DOM overhead)
- Runes system ($state, $derived, $effect) - true reactive primitives
- Compiler-optimized (no runtime reactivity library)
- SvelteKit provides file-based routing + SSR/SSG + API routes (remote functions)
- TypeScript-first with excellent DX

**Combined Power:**
- Encore generates TypeScript client → SvelteKit imports it → Full type safety
- Encore SSE endpoints → SvelteKit EventSource → Real-time updates with types
- Encore Remote Functions → SvelteKit server actions → Unified RPC layer
- PostgreSQL (Encore) → Typed queries → SvelteKit load functions → Typed props

---

## Part 2: Type-Safe API Integration

### The Golden Pattern: Encore Client Generation

**Backend (Encore.ts):**
```typescript
// backend/portfolio/encore.service.ts
import { api } from "encore.dev/api";

export interface Portfolio {
  id: string;
  userId: string;
  holdings: NormalizedHolding[];
  totalValue: number;
  lastSyncedAt: Date;
}

export const getPortfolio = api(
  { method: "GET", path: "/portfolio/:userId", auth: true },
  async ({ userId }: { userId: string }): Promise<Portfolio> => {
    // Implementation
  }
);
```

**Frontend Client Generation:**
```bash
# After ANY backend change
cd frontend && bun run gen
```

**Frontend (SvelteKit):**
```typescript
// frontend/src/routes/portfolio/[userId]/+page.ts
import { portfolio } from '~encore/clients';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  // Full type safety: portfolio.getPortfolio is typed!
  const data = await portfolio.getPortfolio({ userId: params.userId });
  return { portfolio: data };
};
```

**Component (Svelte 5):**
```svelte
<!-- frontend/src/routes/portfolio/[userId]/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  // data.portfolio is fully typed from Encore backend!
  const totalValue = $derived(data.portfolio.totalValue.toFixed(2));
</script>

<h1>Portfolio: {data.portfolio.userId}</h1>
<p>Total Value: ${totalValue}</p>
```

**🎯 Key Insight**: This is **better than tRPC** because:
1. No manual type exports
2. Works across separate repositories
3. Generates standard OpenAPI (portable)
4. Encore handles authentication/middleware automatically

---

## Part 3: Real-Time Data with SSE

### Server-Sent Events Pattern

**Backend (Encore.ts):**
```typescript
// backend/run/stream.ts
import { api, StreamOut } from "encore.dev/api";

export interface RunEvent {
  kind: "agent.state.changed" | "screen.discovered" | "edge.created";
  sequence: number;
  timestamp: Date;
  payload: Record<string, unknown>;
}

export const streamRunEvents = api(
  { method: "GET", path: "/run/:id/stream", auth: true },
  async ({ id }: { id: string }, stream: StreamOut<RunEvent>): Promise<void> => {
    // Encore handles SSE protocol automatically
    const events = await getRunEvents(id);
    
    for (const event of events) {
      await stream.send(event); // Type-safe send
    }
    
    // Can also use PubSub subscriptions to stream live events
    const subscription = await pubsub.subscribe("run.events");
    for await (const msg of subscription) {
      if (msg.runId === id) {
        await stream.send(msg.event);
      }
    }
  }
);
```

**Frontend (SvelteKit):**
```typescript
// frontend/src/lib/api.ts
import type { run } from '~encore/clients';

export async function* streamRunEvents(runId: string): AsyncGenerator<RunEvent> {
  const response = await fetch(`http://localhost:4000/run/${runId}/stream`, {
    headers: { Authorization: `Bearer ${getToken()}` }
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
        const json = line.slice(6);
        yield JSON.parse(json) as RunEvent;
      }
    }
  }
}
```

**Component (Svelte 5):**
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
</script>

<div>
  <h1>Run: {data.runId}</h1>
  <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
  
  {#each events as event (event.sequence)}
    <div class="event">{event.kind} - {event.timestamp}</div>
  {/each}
</div>
```

**🎯 Key Insight**: Encore's `StreamOut<T>` provides **type-safe streaming** without WebSocket complexity.

---

## Part 4: Database Integration Patterns

### Encore.ts Database Queries

**Backend (Encore.ts):**
```typescript
// backend/db/portfolio.repo.ts
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("portfolio", {
  migrations: "./migrations"
});

export async function getPortfolio(userId: string): Promise<Portfolio | null> {
  // Type-safe query with generic
  const row = await db.queryRow<{
    id: string;
    user_id: string;
    total_value: string; // PostgreSQL DECIMAL returns string!
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

**🎯 Key Insight**: PostgreSQL's `DECIMAL`/`NUMERIC` types return **strings** via Node.js `pg` driver. Always wrap with `Number()` before `.toFixed()` or arithmetic operations.

### Frontend Data Loading

**SvelteKit Load Function:**
```typescript
// frontend/src/routes/portfolio/+page.ts
import { portfolio } from '~encore/clients';
import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ fetch, params }) => {
  try {
    const data = await portfolio.getPortfolio({ userId: params.userId });
    return { portfolio: data };
  } catch (err) {
    throw error(500, 'Failed to load portfolio');
  }
};
```

**Component Consumption:**
```svelte
<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  // data.portfolio is typed from Encore + validated by SvelteKit
  const totalValue = $derived(Number(data.portfolio.totalValue).toFixed(2));
</script>

<p>Total: ${totalValue}</p>
```

---

## Part 5: Advanced Patterns

### 1. SvelteKit Remote Functions (RPC Layer)

**Why**: Unify backend calls + form actions in single server-side endpoint

**Backend (Encore.ts):**
```typescript
// backend/portfolio/sync.ts
export const syncPortfolio = api(
  { method: "POST", path: "/portfolio/sync", auth: true },
  async (): Promise<SyncResponse> => {
    // Implementation
  }
);
```

**Frontend (SvelteKit Remote Function):**
```typescript
// frontend/src/routes/portfolio/sync.ts
import { portfolio } from '~encore/clients';
import { remote } from '$app/server';

export const sync = remote('sync', async () => {
  const result = await portfolio.syncPortfolio();
  return result;
});
```

**Component:**
```svelte
<script lang="ts">
  import { sync } from './sync';
  
  async function handleSync() {
    const result = await sync();
    console.log('Synced:', result);
  }
</script>

<button onclick={handleSync}>Sync Portfolio</button>
```

**🎯 Key Insight**: Remote functions provide **progressive enhancement** - works without JS via form actions, upgrades to RPC when JS available.

### 2. Optimistic UI Updates

**Pattern**: Update UI immediately, rollback on error

```svelte
<script lang="ts">
  import { portfolio } from '~encore/clients';
  
  let holdings = $state<Holding[]>(data.holdings);
  
  async function deleteHolding(id: string) {
    // Optimistic update
    const previous = holdings;
    holdings = holdings.filter(h => h.id !== id);
    
    try {
      await portfolio.deleteHolding({ id });
    } catch (err) {
      // Rollback on failure
      holdings = previous;
      alert('Failed to delete');
    }
  }
</script>
```

### 3. Form Actions with Encore Backend

**Backend (Encore.ts):**
```typescript
export const createPortfolio = api(
  { method: "POST", path: "/portfolio", auth: true },
  async (req: CreatePortfolioRequest): Promise<Portfolio> => {
    // Validation with Zod
    const validated = createPortfolioSchema.parse(req);
    return await db.createPortfolio(validated);
  }
);
```

**Frontend (SvelteKit Form Action):**
```typescript
// frontend/src/routes/portfolio/+page.server.ts
import { portfolio } from '~encore/clients';
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const userId = data.get('userId') as string;
    
    try {
      const result = await portfolio.createPortfolio({ userId });
      return { success: true, portfolio: result };
    } catch (err) {
      return fail(400, { error: 'Failed to create portfolio' });
    }
  }
};
```

**Component:**
```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData } from './$types';
  
  let { form }: { form: ActionData } = $props();
</script>

<form method="POST" action="?/create" use:enhance>
  <input name="userId" required />
  <button type="submit">Create Portfolio</button>
  
  {#if form?.error}
    <p class="error">{form.error}</p>
  {/if}
</form>
```

---

## Part 6: Testing Strategy

### Backend Testing (Encore.ts)

**Unit Tests:**
```typescript
// backend/portfolio/portfolio.test.ts
import { describe, test, expect } from "vitest";
import { getPortfolio } from "./portfolio";

describe("Portfolio Service", () => {
  test("should return portfolio for valid user", async () => {
    const result = await getPortfolio({ userId: "test-user" });
    expect(result).toBeDefined();
    expect(result?.userId).toBe("test-user");
  });
});
```

**Integration Tests (with PubSub):**
```typescript
// backend/agent/tests/metrics.test.ts
import { describe, test, expect } from "vitest";

// ✅ CRITICAL: Import subscriptions for PubSub tests
import "../orchestrator/subscription";

describe("Agent Metrics", () => {
  test("should process run events", async () => {
    const { runId } = await run.start({ appId: "com.example" });
    
    // Poll for completion (not setTimeout)
    let status = "active";
    let attempts = 0;
    while (status !== "completed" && attempts < 30) {
      const result = await db.queryRow`
        SELECT status FROM runs WHERE run_id = ${runId}
      `;
      status = result?.status || "active";
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    expect(status).toBe("completed");
  });
});
```

**🎯 Key Insight**: `encore test` requires **explicit subscription imports** - without them, PubSub jobs stay "queued" forever.

### Frontend Testing (SvelteKit)

**Component Unit Test (Vitest + Testing Library):**
```typescript
// frontend/src/lib/components/Portfolio.test.ts
import { render, screen } from '@testing-library/svelte';
import { describe, test, expect, vi } from 'vitest';
import Portfolio from './Portfolio.svelte';

describe('Portfolio Component', () => {
  test('renders portfolio data', () => {
    const portfolio = {
      userId: 'test',
      totalValue: 100000,
      holdings: []
    };
    
    render(Portfolio, { props: { portfolio } });
    
    expect(screen.getByText(/100000/)).toBeInTheDocument();
  });
});
```

**E2E Test (Playwright):**
```typescript
// frontend/tests/portfolio.spec.ts
import { test, expect } from '@playwright/test';

test('portfolio page loads and displays data', async ({ page }) => {
  await page.goto('/portfolio/test-user');
  
  await expect(page.locator('h1')).toContainText('Portfolio');
  await expect(page.locator('.total-value')).toBeVisible();
});
```

---

## Part 7: Advanced Libraries & Tools

### Recommended Additions

**1. Zod - Runtime Type Validation**
```typescript
// Shared schema between backend and frontend
import { z } from 'zod';

export const portfolioSchema = z.object({
  userId: z.string().min(1),
  holdings: z.array(z.object({
    symbol: z.string(),
    quantity: z.number().positive()
  }))
});

// Backend: Validate incoming requests
export const createPortfolio = api(
  { method: "POST", path: "/portfolio" },
  async (req: unknown): Promise<Portfolio> => {
    const validated = portfolioSchema.parse(req); // Throws on invalid
    return await db.createPortfolio(validated);
  }
);

// Frontend: Validate API responses in tests
test('API returns valid portfolio', async () => {
  const data = await portfolio.getPortfolio({ userId: 'test' });
  expect(() => portfolioSchema.parse(data)).not.toThrow();
});
```

**Why**: Encore provides compile-time types, Zod provides **runtime validation** - critical for production robustness.

**2. TanStack Query (React Query for Svelte)**
```bash
bun add @tanstack/svelte-query
```

```svelte
<script lang="ts">
  import { createQuery } from '@tanstack/svelte-query';
  import { portfolio } from '~encore/clients';
  
  let userId = $state('test-user');
  
  const portfolioQuery = createQuery({
    queryKey: () => ['portfolio', userId],
    queryFn: () => portfolio.getPortfolio({ userId })
  });
</script>

{#if $portfolioQuery.isLoading}
  <p>Loading...</p>
{:else if $portfolioQuery.error}
  <p>Error: {$portfolioQuery.error.message}</p>
{:else}
  <Portfolio data={$portfolioQuery.data} />
{/if}
```

**Why**: Automatic caching, background refetching, optimistic updates, deduplication.

**3. Skeleton UI + Tailwind v4**
```bash
cd frontend
bun add -d tailwindcss@next @tailwindcss/vite@next
bun add @skeletonlabs/skeleton@next
```

**Why**: Production-ready component library that matches Svelte 5 + Tailwind v4 paradigm.

**4. AutoAnimate - Zero-config animations**
```bash
bun add @formkit/auto-animate
```

```svelte
<script lang="ts">
  import { autoAnimate } from '@formkit/auto-animate/svelte';
  
  let items = $state([1, 2, 3]);
</script>

<ul use:autoAnimate>
  {#each items as item (item)}
    <li>{item}</li>
  {/each}
</ul>
```

**Why**: Smooth enter/exit/move animations without writing CSS transitions.

**5. Date-fns - Date utilities**
```bash
bun add date-fns
```

```typescript
import { formatDistanceToNow } from 'date-fns';

const lastSynced = formatDistanceToNow(portfolio.lastSyncedAt, { addSuffix: true });
// "2 hours ago"
```

**Why**: Lightweight, tree-shakeable, better than moment.js.

**6. Valibot - Alternative to Zod (smaller bundle)**
```bash
bun add valibot
```

```typescript
import * as v from 'valibot';

const PortfolioSchema = v.object({
  userId: v.string(),
  totalValue: v.number()
});

type Portfolio = v.InferOutput<typeof PortfolioSchema>;
```

**Why**: **10x smaller** than Zod (1KB vs 14KB), faster validation.

---

## Part 8: Production Best Practices

### 1. Environment Management

**Backend (.env via Encore secrets):**
```bash
# Development
encore secret set --type dev DATABASE_URL

# Production
encore secret set --type prod DATABASE_URL
```

**Frontend (.env):**
```bash
# frontend/.env.local
VITE_API_BASE=http://localhost:4000

# frontend/.env.production
VITE_API_BASE=https://api.example.com
```

**Type-safe env access:**
```typescript
// frontend/src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE: z.string().url()
});

export const env = envSchema.parse(import.meta.env);
```

### 2. Error Handling

**Backend (Encore.ts):**
```typescript
import { APIError } from "encore.dev/api";

export const getPortfolio = api(
  { method: "GET", path: "/portfolio/:userId" },
  async ({ userId }: { userId: string }): Promise<Portfolio> => {
    const portfolio = await db.getPortfolio(userId);
    
    if (!portfolio) {
      throw APIError.notFound("Portfolio not found");
    }
    
    return portfolio;
  }
);
```

**Frontend (SvelteKit):**
```typescript
// frontend/src/routes/portfolio/[userId]/+page.ts
import { error } from '@sveltejs/kit';
import { portfolio } from '~encore/clients';

export const load: PageLoad = async ({ params }) => {
  try {
    const data = await portfolio.getPortfolio({ userId: params.userId });
    return { portfolio: data };
  } catch (err) {
    if (err.status === 404) {
      throw error(404, 'Portfolio not found');
    }
    throw error(500, 'Internal server error');
  }
};
```

**Error Page:**
```svelte
<!-- frontend/src/routes/+error.svelte -->
<script lang="ts">
  import { page } from '$app/state';
</script>

<h1>{$page.status}: {$page.error?.message}</h1>
```

### 3. Authentication Pattern

**Backend (Encore.ts):**
```typescript
// backend/auth/encore.service.ts
import { api, APIError, Header } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";

interface AuthParams {
  authorization: Header<"Authorization">;
}

export const auth = authHandler<AuthParams, { userId: string }>(
  async (params) => {
    const token = params.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("Missing token");
    }
    
    const userId = await verifyToken(token);
    return { userId };
  }
);

// Protected endpoint
export const getPortfolio = api(
  { method: "GET", path: "/portfolio", auth: true },
  async (): Promise<Portfolio> => {
    const { userId } = auth.data()!; // Typed user data
    return await db.getPortfolio(userId);
  }
);
```

**Frontend (SvelteKit Hooks):**
```typescript
// frontend/src/hooks.server.ts
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session_token');
  
  if (token) {
    event.locals.token = token;
    event.locals.userId = await verifyToken(token);
  }
  
  return resolve(event);
};
```

**Protected Route:**
```typescript
// frontend/src/routes/portfolio/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.userId) {
    throw redirect(303, '/login');
  }
  
  return { userId: locals.userId };
};
```

### 4. Logging & Observability

**Backend (Encore.ts):**
```typescript
import log from "encore.dev/log";

const logger = log.with({ module: "portfolio", actor: "service" });

export const syncPortfolio = api(
  { method: "POST", path: "/portfolio/sync" },
  async ({ userId }: { userId: string }): Promise<SyncResponse> => {
    logger.info("sync started", { userId });
    
    try {
      const result = await performSync(userId);
      logger.info("sync completed", { userId, holdingsCount: result.count });
      return result;
    } catch (err) {
      logger.error("sync failed", { userId, err: err.message });
      throw err;
    }
  }
);
```

**🎯 Key Insight**: Encore provides **distributed tracing** automatically - every API call gets a trace ID.

---

## Part 9: Deployment Architecture

### Production Setup

**Backend (Encore Cloud):**
```bash
# Deploy to staging
git push encore staging

# Deploy to production
git push encore main
```

**Infrastructure as Code:**
- Databases provisioned automatically
- Secrets managed via `encore secret set`
- Environments: dev, staging, production
- Automatic HTTPS, load balancing, autoscaling

**Frontend (Vercel):**
```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
cd frontend && vercel --prod
```

**Environment Variables:**
- Set `VITE_API_BASE` to Encore production URL
- Use Vercel Edge Functions for server-side auth

### CI/CD Pipeline

**GitHub Actions:**
```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: encoredev/setup-encore@v1
      - run: cd backend && encore test
  
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: cd frontend && bun install
      - run: cd frontend && bun run gen
      - run: cd frontend && bun run check
      - run: cd frontend && bun test
```

---

## Part 10: Migration Patterns

### From Next.js + tRPC

**Before (Next.js + tRPC):**
```typescript
// Shared types
export const getPortfolio = z.object({ userId: z.string() });

// Server
export const portfolioRouter = t.router({
  get: t.procedure.input(getPortfolio).query(async ({ input }) => {
    return await db.getPortfolio(input.userId);
  })
});

// Client
const portfolio = trpc.portfolio.get.useQuery({ userId: 'test' });
```

**After (Encore + SvelteKit):**
```typescript
// Backend (Encore)
export const getPortfolio = api(
  { method: "GET", path: "/portfolio/:userId" },
  async ({ userId }: { userId: string }): Promise<Portfolio> => {
    return await db.getPortfolio(userId);
  }
);

// Frontend (SvelteKit)
import { portfolio } from '~encore/clients';
const data = await portfolio.getPortfolio({ userId: 'test' });
```

**Benefits:**
- ✅ Separate repositories (better team boundaries)
- ✅ OpenAPI spec generated (portable)
- ✅ No shared type packages
- ✅ Smaller frontend bundle (no tRPC runtime)

---

## Part 11: Common Pitfalls & Solutions

### Pitfall 1: Forgetting Client Regeneration

**Problem:**
```typescript
// Backend added new endpoint
export const deletePortfolio = api(...);

// Frontend tries to use it
import { portfolio } from '~encore/clients';
portfolio.deletePortfolio({ id: '123' }); // TypeScript error: property doesn't exist
```

**Solution:**
```bash
cd frontend && bun run gen
```

**Prevention**: Add to git pre-commit hook or CI pipeline.

### Pitfall 2: PostgreSQL DECIMAL Type Coercion

**Problem:**
```typescript
// Backend returns DECIMAL as string
const row = await db.queryRow<{ total: number }>`SELECT total_value as total FROM portfolios`;
// row.total is actually string! ❌
const formatted = row.total.toFixed(2); // Runtime error
```

**Solution:**
```typescript
const row = await db.queryRow<{ total: string }>`SELECT total_value as total FROM portfolios`;
const total = Number(row.total);
const formatted = total.toFixed(2); // ✅
```

### Pitfall 3: PubSub Tests Not Running

**Problem:**
```typescript
// Test publishes event but worker never starts
test('should process event', async () => {
  await pubsub.publish('topic', { data: 'test' });
  // Worker never runs, test hangs
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

### Pitfall 4: SSR Hydration Mismatch

**Problem:**
```svelte
<script lang="ts">
  import { browser } from '$app/environment';
  
  let time = new Date().toISOString(); // Server and client times differ!
</script>

<p>{time}</p>
```

**Solution:**
```svelte
<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  let time = $state('');
  
  onMount(() => {
    time = new Date().toISOString(); // Only runs on client
  });
</script>

{#if browser}
  <p>{time}</p>
{/if}
```

### Pitfall 5: Encore Auth Handler Confusion

**Problem:**
```typescript
// Trying to use auth data outside API handler
const userId = auth.data()?.userId; // undefined ❌
```

**Solution:**
```typescript
// Only use auth.data() inside authenticated API handlers
export const getPortfolio = api(
  { method: "GET", path: "/portfolio", auth: true },
  async (): Promise<Portfolio> => {
    const { userId } = auth.data()!; // ✅ Works here
    return await db.getPortfolio(userId);
  }
);
```

---

## Part 12: Performance Optimization

### 1. SvelteKit Page Options

```typescript
// frontend/src/routes/portfolio/+page.ts
export const prerender = true; // Static generation
export const ssr = true; // Server-side rendering
export const csr = true; // Client-side rendering
```

**When to use:**
- `prerender: true` - Static pages (marketing, docs)
- `ssr: true, csr: false` - SEO-critical, no interactivity
- `ssr: false, csr: true` - Client-only apps (dashboards)

### 2. Encore Caching

```typescript
import { CacheKeyspace } from "encore.dev/storage/cache";

const portfolioCache = new CacheKeyspace<Portfolio>("portfolio", {
  defaultExpiry: 300 // 5 minutes
});

export const getPortfolio = api(
  { method: "GET", path: "/portfolio/:userId" },
  async ({ userId }: { userId: string }): Promise<Portfolio> => {
    const cached = await portfolioCache.get(userId);
    if (cached) return cached;
    
    const portfolio = await db.getPortfolio(userId);
    await portfolioCache.set(userId, portfolio);
    
    return portfolio;
  }
);
```

### 3. Frontend Asset Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['svelte', '@sveltejs/kit'],
          'client': ['~encore/clients']
        }
      }
    }
  }
});
```

---

## Part 13: Security Best Practices

### 1. Input Validation

```typescript
// Backend (always validate)
import { z } from 'zod';

const createPortfolioSchema = z.object({
  userId: z.string().min(1).max(100),
  holdings: z.array(z.object({
    symbol: z.string().regex(/^[A-Z]{1,5}$/),
    quantity: z.number().positive().max(1000000)
  })).max(100)
});

export const createPortfolio = api(
  { method: "POST", path: "/portfolio" },
  async (req: unknown): Promise<Portfolio> => {
    const validated = createPortfolioSchema.parse(req);
    return await db.createPortfolio(validated);
  }
);
```

### 2. SQL Injection Prevention

```typescript
// ✅ SAFE: Tagged template literals
const portfolio = await db.queryRow`
  SELECT * FROM portfolios WHERE user_id = ${userId}
`;

// ❌ UNSAFE: String interpolation
const portfolio = await db.queryRow(`
  SELECT * FROM portfolios WHERE user_id = '${userId}'
`);
```

### 3. XSS Protection (SvelteKit)

```svelte
<!-- ✅ SAFE: Escaped by default -->
<p>{userInput}</p>

<!-- ❌ UNSAFE: Raw HTML -->
{@html userInput}

<!-- ✅ SAFE: Sanitize first -->
<script>
  import DOMPurify from 'isomorphic-dompurify';
  const clean = DOMPurify.sanitize(userInput);
</script>
{@html clean}
```

---

## Part 14: Recommended Project Structure

```
project/
├── backend/
│   ├── auth/
│   │   ├── encore.service.ts    # Auth handler + endpoints
│   │   ├── auth.repo.ts         # Database queries
│   │   └── auth.test.ts         # Tests
│   ├── portfolio/
│   │   ├── encore.service.ts    # API endpoints
│   │   ├── portfolio.repo.ts    # Database layer
│   │   ├── portfolio.test.ts    # Unit tests
│   │   └── migrations/          # SQL migrations
│   ├── shared/
│   │   └── types.ts             # Shared types
│   └── encore.app               # Encore config
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── components/      # Reusable components
│   │   │   ├── encore-client.ts # Generated client
│   │   │   └── env.ts           # Type-safe env
│   │   ├── routes/
│   │   │   ├── +layout.svelte   # Root layout
│   │   │   ├── +page.svelte     # Home page
│   │   │   └── portfolio/
│   │   │       ├── +page.ts     # Load function
│   │   │       └── +page.svelte # Component
│   │   └── app.css              # Global styles
│   ├── tests/
│   │   └── portfolio.spec.ts    # E2E tests
│   ├── package.json
│   └── vite.config.ts
├── .cursor/
│   ├── commands/                # Task automation
│   └── rules/                   # Coding standards
└── README.md
```

---

## Conclusion

**The Encore.ts + Svelte 5 stack provides:**

1. **Full-Stack Type Safety** without manual contracts
2. **Real-Time Capabilities** via SSE with types
3. **Microservices Simplicity** with local monolith DX
4. **Production-Ready Deployment** with Encore Cloud + Vercel
5. **Best-in-Class Performance** (Svelte compiler + Encore optimization)
6. **Developer Experience** that rivals Next.js but with better separation

**When to choose this stack:**
- Building SaaS products with complex backend logic
- Need real-time features (dashboards, collaboration)
- Want microservices without Kubernetes complexity
- Team prefers separation between frontend and backend
- TypeScript end-to-end is non-negotiable
- Need built-in observability and tracing

**When NOT to choose:**
- Static content sites (use Astro + Encore)
- Simple CRUD apps (use Next.js + Prisma)
- Team unfamiliar with TypeScript (use Rails + Hotwire)
- Need mature ecosystem (Next.js has more plugins)

---

**Next Steps:**
1. Read `.claude-skills/encore-svelte_skill/SKILL.md` for implementation workflow
2. Review `vibes/backend_vibe.json` and `vibes/frontend_vibe.json` for development patterns
3. Study `DEBUGGING_TOOLKIT.md` for troubleshooting procedures
4. Check `specs/` directory for real-world implementation examples

**Resources:**
- Encore.ts Docs: https://encore.dev/docs
- Svelte 5 Docs: https://svelte.dev/docs
- SvelteKit Docs: https://kit.svelte.dev/docs
- ScreenGraph Repository: https://github.com/[your-repo]

---

**Version**: 1.0  
**Last Updated**: November 17, 2025  
**Maintained By**: CTO Office






