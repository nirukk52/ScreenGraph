# Coding Standards

**Status**: Active  
**Last Updated**: 2025-10-23  
**Enforcement**: CI + Manual Review

---

## Core Principles

1. **Clarity over cleverness** — code should be obvious, not impressive
2. **Small files, small functions** — stay under limits
3. **Type safety first** — leverage TypeScript's full power
4. **Test at the right level** — unit for logic, integration for flows, E2E for critical paths
5. **Performance by default** — don't optimize prematurely, but don't write obviously slow code

---

## File Size Limits

- **Maximum file length**: 300 lines (excluding imports/exports)
- **Ideal file length**: 100-150 lines
- **Break up**: When file exceeds 200 lines, extract modules

**Why**: Large files hide complexity, slow reviews, and reduce comprehension.

---

## Function Size Limits

- **Maximum function length**: 50 lines
- **Ideal function length**: 10-20 lines
- **Extract**: When function exceeds 30 lines, look for extraction opportunities

**Why**: Small functions are testable, readable, and composable.

---

## TypeScript Rules

### Strict Mode
```typescript
// tsconfig.json must include
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

### Type Over Any
- **Never use `any`** — use `unknown` or proper types
- **Exception**: Third-party library with no types (wrap in typed facade)

### Explicit Return Types
```typescript
// ✅ Good
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad — implicit return type
export function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### No Default Exports
```typescript
// ✅ Good
export const UserService = { ... };

// ❌ Bad
export default UserService;
```

**Why**: Named exports are greppable and refactor-safe.

---

## Naming Conventions

See `rules/naming-conventions.md` for complete guide.

**Quick reference**:
- Files: `kebab-case.ts`
- Functions: `camelCase`
- Types/Interfaces: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Private fields: `_prefixed`

---

## Logging

### Log Levels
- **error**: System failures, exceptions, data loss
- **warn**: Degraded performance, retries, fallbacks
- **info**: Business events, state transitions
- **debug**: Detailed flow information (dev only)

### Structured Logging
```typescript
// ✅ Good
logger.info("agent_crawl_started", {
  agentId,
  sessionId,
  appPackage,
  timestamp: Date.now()
});

// ❌ Bad
console.log(`Agent ${agentId} started crawling ${appPackage}`);
```

### Sensitive Data
- **Never log**: Passwords, API keys, tokens, PII
- **Hash if needed**: User IDs, session IDs (for correlation)

---

## Error Handling

### Always Use Typed Errors
```typescript
// ✅ Good
export class CrawlFailedError extends Error {
  constructor(
    public agentId: string,
    public reason: string,
    public retryable: boolean
  ) {
    super(`Crawl failed: ${reason}`);
  }
}

// ❌ Bad
throw new Error("Crawl failed");
```

### Handle Errors at the Right Level
- **Low-level**: Catch, log, and rethrow with context
- **High-level**: Catch, handle recovery, and continue
- **API layer**: Convert to user-facing error response

---

## Performance Discipline

### Async/Await Best Practices
```typescript
// ✅ Good — parallel execution
const [users, posts] = await Promise.all([
  fetchUsers(),
  fetchPosts()
]);

// ❌ Bad — sequential when parallel is possible
const users = await fetchUsers();
const posts = await fetchPosts();
```

### Database Queries
- **Always use indexes** for WHERE/JOIN columns
- **Batch operations** when processing multiple items
- **Limit result sets** — never `SELECT *` without LIMIT
- **Use prepared statements** to prevent SQL injection

### Memory Management
- **Stream large files** — don't load entire file into memory
- **Clear intervals/timeouts** — prevent memory leaks
- **Dispose resources** — close DB connections, file handles

---

## Comments

### When to Comment
- **Complex algorithms**: Explain the "why", not the "what"
- **Business rules**: Link to requirements or docs
- **Workarounds**: Explain why the hack exists
- **TODO/FIXME**: Include ticket number or date

### When NOT to Comment
- **Obvious code**: `// increment counter` is noise
- **Function names**: Let names be self-documenting
- **Version history**: Use Git, not file headers

```typescript
// ✅ Good
// Retry with exponential backoff to handle transient network failures
// See: https://docs.screengraph.io/procedures/retry-strategy
const result = await retryWithBackoff(fetchData, { maxRetries: 3 });

// ❌ Bad
// This function retries
const result = await retryWithBackoff(fetchData, { maxRetries: 3 });
```

---

## Linting

### ESLint Configuration
- **Airbnb base** + TypeScript overrides
- **Prettier integration** for formatting
- **No warnings in CI** — treat warnings as errors

### Pre-commit Hooks
- Run `eslint --fix` and `prettier --write`
- Run type checking with `tsc --noEmit`
- Run affected tests (fast unit tests only)

---

## Import Organization

```typescript
// 1. Node/external packages
import { api } from "encore.dev/api";
import { v4 as uuid } from "uuid";

// 2. Internal absolute imports
import type { Agent } from "~backend/agent/types";
import backend from "~backend/client";

// 3. Relative imports (same service)
import { CrawlEngine } from "./crawl-engine";
import { parseScreenshot } from "./utils/parse-screenshot";
```

---

## React/Frontend Specific

### Component Size
- **Maximum**: 200 lines per component
- **Extract**: Custom hooks, sub-components, utilities

### Hooks Rules
- **Always follow Rules of Hooks** (ESLint will enforce)
- **Extract complex logic** into custom hooks
- **Name custom hooks** with `use` prefix

### State Management
- **Local state**: `useState` for component-only data
- **Shared state**: React Context or Zustand
- **Server state**: React Query (`@tanstack/react-query`)

---

## Violation Handling

### Warning
- First occurrence → team discussion
- Document why rule can't be followed
- Create ticket to refactor later

### Error
- Blocks PR merge
- Must fix before shipping
- No exceptions without founder approval

---

**Remember**: These rules exist to maintain velocity and reliability. When in doubt, optimize for readability and future maintainability.
