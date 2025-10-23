# Architecture Rules

**Status**: Unstable — evolving during early development  
**Last Updated**: 2025-10-23  
**Enforcement**: Design Reviews + Tests

---

## Core Architecture Principles

1. **Clean Architecture** — domain logic isolated from infrastructure
2. **Event Sourcing** — append-only event log as source of truth
3. **Single Writer Principle** — one service owns one aggregate
4. **Outbox Pattern** — reliable event publishing
5. **Ports & Adapters** — external systems behind interfaces

---

## Service Boundaries

### Rule: One Service, One Aggregate Root

Each Encore.ts service owns **exactly one aggregate root** and its related entities.

```
✅ Good:
- agent/ owns Agent aggregate
- run/ owns Run aggregate
- analysis/ owns AnalysisReport aggregate

❌ Bad:
- shared-service/ owns Agent + Run
```

**Why**: Clear ownership, independent scaling, reduced coupling.

### Rule: Services Communicate via Events

- **Synchronous calls**: Only for queries (read-only)
- **Asynchronous events**: For state changes (write operations)
- **No direct DB access**: Across service boundaries

```typescript
// ✅ Good — async event
await publishEvent("agent.run.completed", {
  agentId,
  runId,
  screenshots: 42
});

// ❌ Bad — direct service call for state change
await backend.analysis.createReport({ sessionId });
```

---

## Event-Driven Architecture

### Event Naming Convention

See `rules/naming-conventions.md` for complete event naming guide.

**Pattern**: `<service>.<aggregate>.<action>`

```
Examples:
- agent.run.started
- agent.run.completed
- agent.run.failed
- analysis.report.created
- analysis.report.published
```

### Event Payload Structure

```typescript
export interface RunCompletedEvent {
  eventId: string;           // UUID for idempotency
  eventType: "agent.run.completed";
  timestamp: number;         // Unix epoch ms
  aggregateId: string;       // Entity ID (e.g., runId)
  version: number;           // Event schema version
  data: {
    agentId: string;
    runId: string;
    screenshotCount: number;
    duration: number;
    // ... domain-specific fields
  };
  metadata: {
    causationId?: string;    // Event that caused this
    correlationId: string;   // Request trace ID
    userId?: string;         // Actor (if applicable)
  };
}
```

### Event Versioning

- **Never remove fields** — add new fields with defaults
- **Increment version** when schema changes
- **Handle old versions** in consumers for backward compatibility

---

## Outbox Pattern (Reliable Events)

### Rule: Write to Outbox in Same Transaction

```typescript
// ✅ Good — atomic write
await db.transaction(async (tx) => {
  await tx.insert(agents).values(newAgent);
  await tx.insert(eventOutbox).values({
    eventType: "agent.created",
    payload: { agentId: newAgent.id }
  });
});

// ❌ Bad — separate writes (can fail)
await db.insert(agents).values(newAgent);
await publishEvent("agent.created", { agentId: newAgent.id });
```

### Outbox Processor

- **Background job** reads outbox table
- **Publishes to Pub/Sub** topic
- **Marks as published** after confirmation
- **Retries on failure** with exponential backoff

**Why**: Guarantees events are published even if Pub/Sub is temporarily down.

---

## Event Ordering

### Rule: Events Must Be Ordered Per Aggregate

Events for the same aggregate (e.g., same `sessionId`) must be processed **in order**.

```typescript
// ✅ Good — Pub/Sub subscription with ordering key
await topic.publish({
  orderingKey: runId,  // Ensures FIFO for this run
  payload: event
});

// ❌ Bad — no ordering guarantees
await topic.publish({ payload: event });
```

**Why**: Prevents race conditions where "completed" event arrives before "started".

---

## Database Rules

### Rule: Each Service Has Its Own Database

```
✅ Good:
- agent-db (owned by agent/)
- run-db (owned by run/)
- analysis-db (owned by analysis/)

❌ Bad:
- shared-db (accessed by agent/ and crawl/)
```

**Why**: Service autonomy, independent schema evolution, clear boundaries.

### Rule: Use Migrations for Schema Changes

```typescript
// migrations/001_create_agents.ts
import { db } from "../index";

export async function up() {
  await db.schema.createTable("agents", (table) => {
    table.uuid("id").primary();
    table.string("name").notNullable();
    table.timestamp("created_at").defaultNow();
  });
}

export async function down() {
  await db.schema.dropTable("agents");
}
```

- **Never edit existing migrations** — create new ones
- **Test rollback** (down) as well as forward (up)
- **Version control all migrations**

---

## Ports & Adapters (Hexagonal Architecture)

### Rule: Domain Logic Isolated from Infrastructure

```
backend/
  agent/
    domain/              # Pure business logic (no Encore, no DB)
      agent.ts
      events.ts
    adapters/            # Infrastructure implementations
      postgres-agent-repo.ts
      appium-driver.ts
    ports/               # Interfaces (contracts)
      agent-repository.ts
      device-driver.ts
    api/                 # Encore.ts API endpoints
      create-agent.ts
```

### Example: Repository Port

```typescript
// ports/agent-repository.ts
export interface AgentRepository {
  save(agent: Agent): Promise<void>;
  findById(id: string): Promise<Agent | null>;
  list(filters: AgentFilters): Promise<Agent[]>;
}

// adapters/postgres-agent-repo.ts
export class PostgresAgentRepository implements AgentRepository {
  constructor(private db: Database) {}
  
  async save(agent: Agent): Promise<void> {
    await this.db.insert(agents).values(agent);
  }
  // ... other methods
}

// domain/agent.ts (no DB knowledge)
export class Agent {
  start(repository: AgentRepository) {
    // Pure domain logic
    this.status = "running";
    await repository.save(this);
  }
}
```

**Why**: Testable domain logic, swappable infrastructure (mock DB in tests).

---

## Testing Architecture

### Unit Tests
- **Test domain logic** in isolation
- **Mock all dependencies** (repositories, external APIs)
- **Fast execution** (< 1ms per test)

### Integration Tests
- **Test adapters** with real infrastructure (DB, Redis)
- **Use test database** (seeded, cleaned after each test)
- **Medium speed** (< 100ms per test)

### E2E Tests
- **Test critical user flows** end-to-end
- **Real services, real events** (but isolated environment)
- **Slow execution** (1-5 seconds per test)

See `rules/testing-rules.md` for details.

---

## Dependency Rules

### Rule: Dependencies Point Inward

```
External Systems → Adapters → Ports → Domain
```

- **Domain** depends on nothing (pure TypeScript)
- **Ports** define interfaces (no implementations)
- **Adapters** depend on ports (implement interfaces)
- **API/UI** depends on ports and adapters (wires it together)

**Never**: Domain imports from adapters or API layer.

---

## API Design Rules

### Rule: RESTful Naming for Resources

```
✅ Good:
POST   /agents              # Create agent
GET    /agents/:id          # Get agent
PATCH  /agents/:id          # Update agent
DELETE /agents/:id          # Delete agent
POST   /agents/:id/start    # Agent action

❌ Bad:
POST   /createAgent
GET    /getAgent?id=123
POST   /updateAgent
```

### Rule: Use HTTP Status Codes Correctly

- **200 OK**: Successful GET/PATCH
- **201 Created**: Successful POST (resource created)
- **204 No Content**: Successful DELETE
- **400 Bad Request**: Invalid input
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Unhandled exception

---

## Exceptions and Error Handling

### Rule: Use Domain-Specific Errors

```typescript
// ✅ Good
export class AgentNotFoundError extends Error {
  constructor(public agentId: string) {
    super(`Agent ${agentId} not found`);
  }
}

// API layer converts to HTTP status
try {
  const agent = await repository.findById(id);
  if (!agent) throw new AgentNotFoundError(id);
} catch (err) {
  if (err instanceof AgentNotFoundError) {
    return { status: 404, error: err.message };
  }
  throw err; // 500 for unexpected errors
}
```

---

## Evolution Notes

**This document is unstable** during the early development phase (M1-M3). Expect frequent updates as we:
- Discover event patterns that work/don't work
- Refine service boundaries
- Optimize for developer velocity vs. long-term maintainability

**After M4**: Architecture should stabilize and this becomes a "hard rule" document.

---

**Remember**: Architecture rules prevent future pain. When in doubt, over-communicate boundaries and keep domain logic pure.
