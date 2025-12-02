# API Integration Patterns

## GET Endpoints

### Simple GET

**Backend:**
```typescript
export const getUser = api(
  { method: "GET", path: "/user/:id" },
  async ({ id }: { id: string }): Promise<User> => {
    return await db.getUser(id);
  }
);
```

**Frontend:**
```typescript
import { user } from '~encore/clients';
const data = await user.getUser({ id: '123' });
```

### GET with Query Parameters

**Backend:**
```typescript
export const listPortfolios = api(
  { method: "GET", path: "/portfolios" },
  async ({ limit = 10, offset = 0 }: { limit?: number; offset?: number }): Promise<Portfolio[]> => {
    return await db.listPortfolios(limit, offset);
  }
);
```

**Frontend:**
```typescript
const portfolios = await portfolio.listPortfolios({ limit: 20, offset: 0 });
```

---

## POST Endpoints

### POST with Body

**Backend:**
```typescript
interface CreatePortfolioRequest {
  userId: string;
  name: string;
}

export const createPortfolio = api(
  { method: "POST", path: "/portfolio", auth: true },
  async (req: CreatePortfolioRequest): Promise<Portfolio> => {
    return await db.createPortfolio(req);
  }
);
```

**Frontend (SvelteKit Load):**
```typescript
const portfolio = await portfolio.createPortfolio({
  userId: 'user123',
  name: 'My Portfolio'
});
```

**Frontend (Form Action):**
```typescript
export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const result = await portfolio.createPortfolio({
      userId: data.get('userId') as string,
      name: data.get('name') as string
    });
    return { success: true, portfolio: result };
  }
};
```

---

## PUT/PATCH Endpoints

### Update with Path Parameter

**Backend:**
```typescript
export const updatePortfolio = api(
  { method: "PUT", path: "/portfolio/:id" },
  async ({ id, ...updates }: { id: string; name?: string; notes?: string }): Promise<Portfolio> => {
    return await db.updatePortfolio(id, updates);
  }
);
```

**Frontend:**
```typescript
const updated = await portfolio.updatePortfolio({
  id: 'port123',
  name: 'Updated Name'
});
```

---

## DELETE Endpoints

**Backend:**
```typescript
export const deletePortfolio = api(
  { method: "DELETE", path: "/portfolio/:id" },
  async ({ id }: { id: string }): Promise<void> => {
    await db.deletePortfolio(id);
  }
);
```

**Frontend:**
```typescript
await portfolio.deletePortfolio({ id: 'port123' });
```

---

## Authentication Patterns

### Auth Handler

**Backend:**
```typescript
import { authHandler } from "encore.dev/auth";

interface AuthParams {
  authorization: Header<"Authorization">;
}

export const auth = authHandler<AuthParams, { userId: string }>(
  async (params) => {
    const token = params.authorization?.replace("Bearer ", "");
    if (!token) throw APIError.unauthenticated("Missing token");
    
    const userId = await verifyToken(token);
    return { userId };
  }
);
```

### Protected Endpoint

**Backend:**
```typescript
export const getMyPortfolio = api(
  { method: "GET", path: "/portfolio/me", auth: true },
  async (): Promise<Portfolio> => {
    const { userId } = auth.data()!; // Typed user data
    return await db.getPortfolio(userId);
  }
);
```

**Frontend:**
```typescript
// SvelteKit handles auth via hooks
const portfolio = await portfolio.getMyPortfolio();
```

---

## Error Handling

### Backend

```typescript
import { APIError } from "encore.dev/api";

export const getPortfolio = api(
  { method: "GET", path: "/portfolio/:id" },
  async ({ id }: { id: string }): Promise<Portfolio> => {
    const portfolio = await db.getPortfolio(id);
    
    if (!portfolio) {
      throw APIError.notFound("Portfolio not found");
    }
    
    return portfolio;
  }
);
```

### Frontend

```typescript
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  try {
    const data = await portfolio.getPortfolio({ id: params.id });
    return { portfolio: data };
  } catch (err) {
    if (err.status === 404) {
      throw error(404, 'Portfolio not found');
    }
    throw error(500, 'Internal server error');
  }
};
```

---

## Validation with Zod

**Backend:**
```typescript
import { z } from 'zod';

const createPortfolioSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(3).max(100),
  holdings: z.array(z.object({
    symbol: z.string().regex(/^[A-Z]{1,5}$/),
    quantity: z.number().positive()
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

---

## Caching

**Backend:**
```typescript
import { CacheKeyspace } from "encore.dev/storage/cache";

const portfolioCache = new CacheKeyspace<Portfolio>("portfolio", {
  defaultExpiry: 300 // 5 minutes
});

export const getPortfolio = api(
  { method: "GET", path: "/portfolio/:id" },
  async ({ id }: { id: string }): Promise<Portfolio> => {
    const cached = await portfolioCache.get(id);
    if (cached) return cached;
    
    const portfolio = await db.getPortfolio(id);
    await portfolioCache.set(id, portfolio);
    
    return portfolio;
  }
);
```

---

## Pagination

**Backend:**
```typescript
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const listPortfolios = api(
  { method: "GET", path: "/portfolios" },
  async ({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number }): Promise<PaginatedResponse<Portfolio>> => {
    const offset = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      db.listPortfolios(pageSize, offset),
      db.countPortfolios()
    ]);
    
    return { items, total, page, pageSize };
  }
);
```

**Frontend:**
```svelte
<script lang="ts">
  let page = $state(1);
  let portfolios = $state<Portfolio[]>([]);
  
  async function loadPage(p: number) {
    const result = await portfolio.listPortfolios({ page: p, pageSize: 20 });
    portfolios = result.items;
    page = p;
  }
</script>

<button onclick={() => loadPage(page - 1)}>Previous</button>
<button onclick={() => loadPage(page + 1)}>Next</button>
```






