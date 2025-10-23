# Testing Rules

**Status**: Active  
**Last Updated**: 2025-10-23  
**Enforcement**: CI Pipeline + Code Review

---

## Testing Philosophy

1. **Test behavior, not implementation** — refactors shouldn't break tests
2. **Right test at right level** — unit for logic, integration for flows, E2E for critical paths
3. **Deterministic tests** — no flaky tests, no random values
4. **Fast feedback** — unit tests < 1ms, integration < 100ms, E2E < 5s
5. **Test as documentation** — tests should explain how code works

---

## Test Pyramid

```
        /\
       /E2E\       ← 5-10% of tests (critical user flows)
      /------\
     /  Int   \    ← 20-30% of tests (service boundaries, DB, events)
    /----------\
   /   Unit     \  ← 60-75% of tests (domain logic, pure functions)
  /--------------\
```

**Why**: Unit tests are fast and pinpoint failures. E2E tests are slow but verify real behavior.

---

## Unit Tests

### What to Test
- **Domain logic**: Business rules, calculations, validations
- **Pure functions**: Input → output transformations
- **Class methods**: Isolated behaviors with mocked dependencies

### What NOT to Test
- **Framework code**: Don't test Encore.ts internals
- **Getters/setters**: Trivial code doesn't need tests
- **Type definitions**: TypeScript compiler is the test

### Example
```typescript
// domain/agent.ts
export class Agent {
  canStart(): boolean {
    return this.status === "idle" && this.config.isValid();
  }
}

// domain/agent.test.ts
import { describe, it, expect } from "vitest";
import { Agent } from "./agent";

describe("Agent", () => {
  describe("canStart", () => {
    it("returns true when idle and config valid", () => {
      const agent = new Agent({ status: "idle", config: validConfig() });
      expect(agent.canStart()).toBe(true);
    });

    it("returns false when running", () => {
      const agent = new Agent({ status: "running", config: validConfig() });
      expect(agent.canStart()).toBe(false);
    });

    it("returns false when config invalid", () => {
      const agent = new Agent({ status: "idle", config: invalidConfig() });
      expect(agent.canStart()).toBe(false);
    });
  });
});
```

### Rules
- **Arrange-Act-Assert** pattern
- **One assertion per test** (or closely related assertions)
- **Descriptive test names** — "when X, then Y"
- **Mock all I/O** — no DB, no network, no filesystem

---

## Integration Tests

### What to Test
- **Repository implementations**: DB queries work correctly
- **Event publishing**: Outbox pattern works
- **External adapters**: Appium, API clients (with test doubles)
- **Service interactions**: API calls between services

### Test Database
```typescript
// Use separate test database
const TEST_DB_URL = "postgresql://localhost:5432/screengraph_test";

// Seed before each test, clean after
beforeEach(async () => {
  await db.migrate.latest();
  await seedTestData();
});

afterEach(async () => {
  await db.truncate.cascade();
});
```

### Example
```typescript
// adapters/postgres-agent-repo.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PostgresAgentRepository } from "./postgres-agent-repo";
import { setupTestDB, cleanupTestDB } from "../test-utils/db";

describe("PostgresAgentRepository", () => {
  let repo: PostgresAgentRepository;
  let db: TestDatabase;

  beforeEach(async () => {
    db = await setupTestDB();
    repo = new PostgresAgentRepository(db);
  });

  afterEach(async () => {
    await cleanupTestDB(db);
  });

  it("saves agent to database", async () => {
    const agent = createTestAgent({ name: "TestAgent" });
    await repo.save(agent);

    const found = await repo.findById(agent.id);
    expect(found).toEqual(agent);
  });

  it("returns null when agent not found", async () => {
    const found = await repo.findById("nonexistent");
    expect(found).toBeNull();
  });
});
```

### Rules
- **Real infrastructure** (DB, Redis), but isolated
- **Transaction rollback** or truncate after each test
- **No external APIs** — use test doubles or mocks
- **Parallel execution** safe (isolated data)

---

## E2E Tests

### What to Test
- **Critical user flows**: Login → create agent → start crawl → view results
- **Happy paths**: Most common user journeys
- **Error scenarios**: What happens when things fail

### What NOT to Test
- **Every edge case** — that's what unit tests are for
- **UI details** — test behavior, not pixels
- **Permutations** — pick representative scenarios

### Example
```typescript
// e2e/agent-crawl-flow.test.ts
import { describe, it, expect } from "vitest";
import backend from "~backend/client";

describe("Agent Crawl Flow", () => {
  it("completes full crawl workflow", async () => {
    // Create agent
    const agent = await backend.agent.create({
      name: "E2E Test Agent",
      appPackage: "com.example.testapp"
    });
    expect(agent.id).toBeDefined();

    // Start crawl
    const session = await backend.crawl.start({
      agentId: agent.id,
      maxScreens: 10
    });
    expect(session.status).toBe("running");

    // Wait for completion (with timeout)
    const completed = await waitForCrawlCompletion(session.id, {
      timeout: 30000
    });
    expect(completed.status).toBe("completed");
    expect(completed.screenshotCount).toBeGreaterThan(0);

    // Verify analysis created
    const analysis = await backend.analysis.getBySession(session.id);
    expect(analysis.screens.length).toBe(completed.screenshotCount);
  });
});
```

### Rules
- **Real services, real events** — full stack running
- **Isolated test environment** — no production data
- **Timeout protection** — use `waitFor` helpers with max wait
- **Cleanup after test** — delete test data to avoid pollution

---

## Test Structure

### File Organization
```
backend/
  agent/
    domain/
      agent.ts
      agent.test.ts          ← Unit test next to source
    adapters/
      postgres-agent-repo.ts
      postgres-agent-repo.test.ts  ← Integration test next to adapter
  e2e/
    agent-crawl-flow.test.ts       ← E2E tests in separate folder
```

### Naming
- **Unit tests**: `{name}.test.ts`
- **Integration tests**: `{name}.test.ts` (same pattern)
- **E2E tests**: `{flow-name}.test.ts`

---

## Deterministic Tests

### ❌ Bad: Random Values
```typescript
it("creates agent with random ID", () => {
  const agent = createAgent({ id: Math.random().toString() });
  // Test might pass/fail randomly due to ID collisions
});
```

### ✅ Good: Predictable Values
```typescript
it("creates agent with deterministic ID", () => {
  const agent = createAgent({ id: "test-agent-1" });
  // Always uses same ID, reproducible
});
```

### ❌ Bad: Time-Dependent
```typescript
it("session expires after 1 hour", async () => {
  const session = createSession({ createdAt: Date.now() });
  await sleep(3600000); // Wait 1 hour
  expect(session.isExpired()).toBe(true);
});
```

### ✅ Good: Inject Time
```typescript
it("session expires after 1 hour", () => {
  const now = 1234567890000;
  const oneHourLater = now + 3600000;
  const session = createSession({ createdAt: now });
  expect(session.isExpired(oneHourLater)).toBe(true);
});
```

---

## Mocking Guidelines

### Mock External Systems
```typescript
// ✅ Good — mock Appium driver
const mockDriver = {
  screenshot: vi.fn().mockResolvedValue(Buffer.from("fake-image")),
  tap: vi.fn().mockResolvedValue(undefined)
};

const engine = new CrawlEngine(mockDriver);
```

### Don't Mock Internal Logic
```typescript
// ❌ Bad — mocking own domain logic
const mockAgent = {
  canStart: vi.fn().mockReturnValue(true)
};

// ✅ Good — use real domain object
const agent = new Agent({ status: "idle", config: validConfig() });
expect(agent.canStart()).toBe(true);
```

### Mock at Ports, Not Adapters
```typescript
// ✅ Good — mock repository interface (port)
const mockRepo: AgentRepository = {
  save: vi.fn(),
  findById: vi.fn()
};

// ❌ Bad — mock specific adapter implementation
const mockPostgres = new PostgresAgentRepository(mockDB);
```

---

## Test Data Builders

Use builder pattern for complex test objects:

```typescript
// test-utils/agent-builder.ts
export function buildAgent(overrides?: Partial<Agent>): Agent {
  return {
    id: "test-agent-1",
    name: "Test Agent",
    status: "idle",
    config: buildValidConfig(),
    createdAt: 1234567890000,
    ...overrides
  };
}

// Usage in tests
const agent = buildAgent({ status: "running" });
const idleAgent = buildAgent(); // Uses defaults
```

---

## CI/CD Integration

### Pre-commit
- Run **unit tests only** (fast feedback)
- Should complete in < 5 seconds

### PR Pipeline
- Run **all tests** (unit + integration + E2E)
- Fail PR if any test fails
- No warnings allowed

### Post-merge
- Run **full test suite** again (paranoia check)
- Publish coverage report

---

## Coverage Goals

- **Unit tests**: 80%+ coverage of domain logic
- **Integration tests**: All repository methods, all event handlers
- **E2E tests**: All critical user flows (10-15 scenarios)

**But**: Coverage is a metric, not a goal. 100% coverage with bad tests is worse than 60% with good tests.

---

## Test Naming Conventions

```typescript
describe("{ClassName or functionName}", () => {
  describe("{methodName}", () => {
    it("{does what} when {condition}", () => {
      // Test
    });
  });
});

// Examples:
describe("Agent", () => {
  describe("canStart", () => {
    it("returns true when idle and config valid", () => { });
    it("returns false when already running", () => { });
  });
});
```

---

## Common Anti-Patterns

### ❌ Testing Implementation Details
```typescript
it("calls internal method", () => {
  const spy = vi.spyOn(agent, "_internalMethod");
  agent.start();
  expect(spy).toHaveBeenCalled();
});
```

### ❌ Brittle Snapshot Tests
```typescript
it("renders correctly", () => {
  expect(component).toMatchSnapshot(); // Breaks on any change
});
```

### ❌ Over-Mocking
```typescript
// Mocking everything makes test meaningless
const mockA = vi.fn();
const mockB = vi.fn();
const mockC = vi.fn();
// What are we even testing?
```

### ❌ Flaky Timeouts
```typescript
it("completes eventually", async () => {
  setTimeout(() => done(), 100); // Might fail on slow CI
});
```

---

## Remember

- **Write tests first** when fixing bugs (TDD for bug fixes)
- **Refactor tests** with production code (don't let them rot)
- **Delete obsolete tests** — dead test code is worse than no tests
- **Ask**: "If this test fails, do I know exactly what broke?"

---

**Enforcement**: CI fails if:
- Any test fails
- Coverage drops below threshold
- Tests take > 5 minutes total
