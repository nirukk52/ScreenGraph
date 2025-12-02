# Type Safety Rules

## Golden Rules

1. **NEVER use `any` type** - Use `unknown` and validate, or define proper types
2. **Always regenerate client after backend changes** - `cd frontend && bun run gen`
3. **PostgreSQL DECIMAL returns string** - Wrap with `Number()` before `.toFixed()`
4. **Svelte 5 runes need `let` not `const`** - Use `let` for `$state`, `$derived` that mutate
5. **Import PubSub subscriptions in tests** - Without import, workers never start

---

## Backend Type Safety

### Endpoint Types

```typescript
// ✅ GOOD: Explicit types
export interface CreatePortfolioRequest {
  userId: string;
  name: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  totalValue: number;
}

export const createPortfolio = api(
  { method: "POST", path: "/portfolio" },
  async (req: CreatePortfolioRequest): Promise<Portfolio> => {
    return await db.createPortfolio(req);
  }
);
```

```typescript
// ❌ BAD: Implicit any
export const createPortfolio = api(
  { method: "POST", path: "/portfolio" },
  async (req) => { // Implicit any ❌
    return await db.createPortfolio(req);
  }
);
```

### Database Queries

```typescript
// ✅ GOOD: Typed query result
const row = await db.queryRow<{
  id: string;
  user_id: string;
  total_value: string; // PostgreSQL DECIMAL
  created_at: Date;
}>`
  SELECT id, user_id, total_value, created_at
  FROM portfolios
  WHERE id = ${id}
`;

// Convert DECIMAL string to number
const portfolio: Portfolio = {
  id: row.id,
  userId: row.user_id,
  totalValue: Number(row.total_value),
  createdAt: row.created_at
};
```

```typescript
// ❌ BAD: Untyped query
const row = await db.queryRow`
  SELECT * FROM portfolios WHERE id = ${id}
`; // row is any ❌

const total = row.total_value.toFixed(2); // Runtime error! ❌
```

### Literal Unions (NOT Indexed Access)

```typescript
// ✅ GOOD: Explicit literal union (Encore parser compatible)
export type Status = "pending" | "active" | "completed";
export const STATUSES: readonly Status[] = ["pending", "active", "completed"];
```

```typescript
// ❌ BAD: Indexed access (Encore parser fails)
export const STATUSES = ["pending", "active", "completed"] as const;
export type Status = (typeof STATUSES)[number]; // ❌ Parser error
```

---

## Frontend Type Safety

### SvelteKit Load Functions

```typescript
// ✅ GOOD: Typed load function
import { portfolio } from '~encore/clients';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const data = await portfolio.getPortfolio({ userId: params.userId });
  return { portfolio: data }; // Typed return
};
```

```typescript
// ❌ BAD: Untyped load function
export const load = async ({ params }) => { // Missing PageLoad type ❌
  const data = await portfolio.getPortfolio({ userId: params.userId });
  return { portfolio: data };
};
```

### Svelte 5 Component Props

```typescript
// ✅ GOOD: $props() with type
<script lang="ts">
  import type { Portfolio } from '~encore/clients';
  
  interface Props {
    portfolio: Portfolio;
    editable?: boolean;
  }
  
  let { portfolio, editable = false }: Props = $props();
</script>
```

```typescript
// ❌ BAD: Untyped props
<script lang="ts">
  let { portfolio, editable } = $props(); // No type ❌
</script>
```

### Runes with Correct Mutability

```typescript
// ✅ GOOD: let for mutable state
<script lang="ts">
  let count = $state(0); // ✅ Can mutate
  count = count + 1;
  
  let doubled = $derived(count * 2); // ✅ Can recompute
</script>
```

```typescript
// ❌ BAD: const for mutable state
<script lang="ts">
  const count = $state(0); // ❌ Cannot reassign
  count = count + 1; // Error: Assignment to constant variable
</script>
```

---

## Runtime Validation with Zod

### Backend

```typescript
import { z } from 'zod';

const createPortfolioSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(3).max(100),
  initialCapital: z.number().positive().optional()
});

export const createPortfolio = api(
  { method: "POST", path: "/portfolio" },
  async (req: unknown): Promise<Portfolio> => {
    // Runtime validation
    const validated = createPortfolioSchema.parse(req);
    return await db.createPortfolio(validated);
  }
);
```

### Frontend

```typescript
// Validate API responses in tests
import { portfolioSchema } from '../schemas';

test('API returns valid portfolio', async () => {
  const data = await portfolio.getPortfolio({ userId: 'test' });
  
  // Runtime validation
  expect(() => portfolioSchema.parse(data)).not.toThrow();
});
```

---

## Type Guards

```typescript
// ✅ GOOD: Type guard for union types
type Event = 
  | { kind: "screen.discovered"; payload: ScreenPayload }
  | { kind: "edge.created"; payload: EdgePayload };

function isScreenEvent(event: Event): event is Extract<Event, { kind: "screen.discovered" }> {
  return event.kind === "screen.discovered";
}

if (isScreenEvent(event)) {
  console.log(event.payload.screenId); // Typed as ScreenPayload
}
```

---

## Common Type Errors

### Error 1: Type 'unknown' is not assignable

```typescript
// ❌ Problem
const data: unknown = await response.json();
console.log(data.userId); // Error: unknown type ❌

// ✅ Solution: Validate with Zod or type assertion
const validated = portfolioSchema.parse(data);
console.log(validated.userId); // ✅

// Or with type assertion (less safe)
const data = await response.json() as Portfolio;
```

### Error 2: Object is possibly 'null'

```typescript
// ❌ Problem
const portfolio = await db.getPortfolio(id);
console.log(portfolio.userId); // Error: possibly null ❌

// ✅ Solution: Check before use
if (!portfolio) {
  throw error(404, 'Portfolio not found');
}
console.log(portfolio.userId); // ✅
```

### Error 3: Property does not exist on type

```typescript
// ❌ Problem
const total = portfolio.totalValue.toFixed(2); // Error if totalValue is string ❌

// ✅ Solution: Convert to number
const total = Number(portfolio.totalValue).toFixed(2); // ✅
```

---

## Testing Type Safety

```typescript
// Frontend: Ensure Encore client is up-to-date
test('Encore client has expected methods', () => {
  expect(portfolio).toHaveProperty('getPortfolio');
  expect(portfolio).toHaveProperty('createPortfolio');
  expect(portfolio).toHaveProperty('updatePortfolio');
});

// Backend: Test types at compile time
import { expectType } from 'tsd';

test('API returns correct type', async () => {
  const result = await getPortfolio({ userId: 'test' });
  expectType<Portfolio>(result);
});
```

---

## Checklist

- [ ] No `any` types in codebase
- [ ] All API endpoints have explicit types
- [ ] Database queries use typed generics
- [ ] Frontend client regenerated after backend changes
- [ ] PostgreSQL DECIMAL values converted to numbers
- [ ] Svelte 5 runes use `let` for mutable state
- [ ] PubSub subscriptions imported in tests
- [ ] Runtime validation with Zod for external data
- [ ] Type guards used for union type narrowing
- [ ] Null checks before accessing properties






