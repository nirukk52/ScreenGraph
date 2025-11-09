---
name: backend-testing
description: Backend API testing skill using Encore MCP for introspection, validation, and debugging. This skill should be used when writing or debugging backend API tests, validating Encore.ts endpoints, testing service integrations, or diagnosing API failures using traces and metrics.
---

# Backend Testing

## Overview

This skill provides comprehensive guidance for testing Encore.ts backend APIs using the Encore MCP toolkit. It emphasizes API contract testing, service integration validation, and trace-driven debugging to ensure backend reliability and type safety.

## Core Testing Philosophy

Backend testing for ScreenGraph follows these principles:

1. **API-first testing** - Test complete request/response flows, not isolated functions
2. **Type safety validation** - Verify TypeScript types propagate correctly through API boundaries
3. **Deterministic behavior** - All tests must be repeatable with consistent results
4. **Flow reliability** - Focus on critical paths and service orchestration, not edge cases
5. **Trace-driven debugging** - Use Encore MCP traces to diagnose failures systematically

## When to Use This Skill

Use this skill when:
- Writing new API endpoint tests
- Debugging failing backend tests
- Validating API contracts after schema changes
- Testing service-to-service integrations
- Analyzing request traces for performance issues
- Verifying database operations in API flows
- Testing pub/sub event handling
- Validating authentication and authorization

## Testing Workflow

### Phase 1: Understand the API Surface

Before writing tests, use Encore MCP to introspect the backend:

**1. Map available services and endpoints:**

```typescript
// Use Encore MCP to discover services
encore-mcp.get_services({
  include_endpoints: true,
  include_schemas: true
})
```

**2. Review endpoint schemas:**

Examine request/response types to understand what to test:
- Required vs optional fields
- Path parameters and query strings
- Authentication requirements
- Expected error codes

**3. Check database dependencies:**

```typescript
// Inspect database schemas that endpoints depend on
encore-mcp.get_databases({
  include_tables: true
})
```

### Phase 2: Write API Tests

Use the standard Encore.ts testing approach with type-safe generated clients.

**Test Structure:**

```typescript
import { describe, test, expect } from "vitest";
import { api } from "~encore/clients";

describe("ServiceName API", () => {
  test("endpoint name - success case", async () => {
    // Arrange: Setup test data
    const request = { /* typed request */ };
    
    // Act: Call API endpoint
    const response = await api.service.endpoint(request);
    
    // Assert: Verify response
    expect(response).toMatchObject({
      // Expected fields
    });
  });
  
  test("endpoint name - error case", async () => {
    // Test error handling
    await expect(
      api.service.endpoint({ /* invalid data */ })
    ).rejects.toThrow(/* expected error */);
  });
});
```

**Best Practices:**

- Use generated clients from `~encore/clients` - never manual fetch
- Test complete request/response flows, not internal functions
- Include authentication context when `auth: true`
- Verify error codes match expected `APIError` types
- Test idempotency for non-GET endpoints
- Validate structured logging output (check `encore.dev/log` usage)

### Phase 3: Test Execution and Validation

**Run tests:**

```bash
# Backend tests
cd backend && encore test

# Or via Task command
cd .cursor && task backend:test
```

**Validate test coverage:**

Focus on:
- ✅ All public API endpoints have tests
- ✅ Success and failure paths covered
- ✅ Authentication/authorization tested
- ✅ Database operations verified
- ✅ Service-to-service calls tested

**NOT required:**
- ❌ Testing every possible edge case
- ❌ Mocking internal implementation details
- ❌ Testing framework internals (Encore handles this)

### Phase 4: Debug with Encore MCP

When tests fail, use Encore MCP for systematic debugging:

**1. Capture traces:**

```typescript
// Get traces for failed requests
encore-mcp.get_traces({
  endpoint: "service.endpoint",
  error: "true",
  limit: "10"
})
```

**2. Analyze trace details:**

```typescript
// Deep dive into specific trace
encore-mcp.get_trace_spans({
  trace_ids: ["<trace_id>"]
})
```

Look for:
- Slow database queries
- Service-to-service call failures
- Authentication issues
- Validation errors
- Panic/exception stack traces

**3. Query database state:**

```typescript
// Verify database state during test
encore-mcp.query_database({
  queries: [
    {
      database: "mydb",
      query: "SELECT * FROM table WHERE id = $1"
    }
  ]
})
```

**4. Check metrics:**

```typescript
// Identify performance bottlenecks
encore-mcp.get_metrics()
```

### Phase 5: Integration Testing

For multi-service workflows, test complete flows:

**Example: Run Creation Flow**

```typescript
describe("Run Integration Flow", () => {
  test("complete run lifecycle", async () => {
    // 1. Start run (run service)
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // 2. Verify agent state created (agent service)
    const agentState = await api.agent.getState({
      runId: run.id
    });
    expect(agentState.status).toBe("planning");
    
    // 3. Verify graph initialized (graph service)
    const graph = await api.graph.getProjection({
      runId: run.id
    });
    expect(graph.nodes).toHaveLength(1); // Initial screen
    
    // 4. Cancel run
    await api.run.cancel({ runId: run.id });
    
    // 5. Verify cleanup
    const finalState = await api.agent.getState({
      runId: run.id
    });
    expect(finalState.status).toBe("canceled");
  });
});
```

**Integration Test Best Practices:**

- Test realistic user workflows end-to-end
- Verify event propagation (pub/sub)
- Check artifact storage and retrieval
- Validate cleanup/cancellation flows
- Use Encore MCP traces to verify all service calls
- Keep tests deterministic (avoid time-based flakiness)

## Common Testing Patterns

### Pattern 1: Testing Authenticated Endpoints

```typescript
import { api } from "~encore/clients";

describe("Authenticated API", () => {
  test("requires auth", async () => {
    // Without auth, should fail
    await expect(
      api.service.protectedEndpoint({})
    ).rejects.toThrow("unauthenticated");
  });
  
  test("with valid auth", async () => {
    // Set auth context (test helper)
    const response = await api.service.protectedEndpoint(
      {},
      { auth: { userId: "test-user" } }
    );
    expect(response).toBeDefined();
  });
});
```

### Pattern 2: Testing Database Operations

```typescript
describe("Database-backed API", () => {
  beforeEach(async () => {
    // Setup: Clean test data
    await db.exec`DELETE FROM test_table`;
  });
  
  test("creates record", async () => {
    const response = await api.service.create({
      name: "Test Item"
    });
    
    // Verify in database
    const row = await db.queryRow`
      SELECT * FROM test_table WHERE id = ${response.id}
    `;
    expect(row?.name).toBe("Test Item");
  });
});
```

### Pattern 3: Testing Pub/Sub Handlers

```typescript
import { Topic } from "encore.dev/pubsub";

describe("Event Handler", () => {
  test("processes event correctly", async () => {
    // Publish event
    await myTopic.publish({
      userId: "test-user",
      action: "signup"
    });
    
    // Wait for processing (or use test helpers)
    await waitForEventProcessing();
    
    // Verify side effects via API
    const user = await api.users.get({ userId: "test-user" });
    expect(user.welcomeEmailSent).toBe(true);
  });
});
```

### Pattern 4: Testing Error Handling

```typescript
import { APIError, ErrCode } from "encore.dev/api";

describe("Error Handling", () => {
  test("returns proper error code", async () => {
    try {
      await api.service.endpoint({ invalid: "data" });
      fail("Should have thrown error");
    } catch (err) {
      expect(err).toBeInstanceOf(APIError);
      expect(err.code).toBe(ErrCode.InvalidArgument);
      expect(err.message).toContain("invalid field");
    }
  });
});
```

## Encore MCP Testing Commands

### Introspection Commands

```bash
# List all services and endpoints
encore-mcp.get_services({ include_endpoints: true })

# Get endpoint schemas
encore-mcp.get_services({
  services: ["run", "agent"],
  include_schemas: true
})

# List databases
encore-mcp.get_databases({ include_tables: true })

# Check pub/sub topics
encore-mcp.get_pubsub()

# List metrics
encore-mcp.get_metrics()

# View cron jobs
encore-mcp.get_cronjobs()

# Check auth handlers
encore-mcp.get_auth_handlers()
```

### Testing Commands

```bash
# Call endpoint directly
encore-mcp.call_endpoint({
  service: "run",
  endpoint: "start",
  method: "POST",
  path: "/run/start",
  payload: JSON.stringify({
    appId: "com.example.app",
    deviceId: "test-device"
  })
})

# Query database
encore-mcp.query_database({
  queries: [{
    database: "rundb",
    query: "SELECT * FROM runs WHERE status = 'active'"
  }]
})
```

### Debugging Commands

```bash
# Get recent traces
encore-mcp.get_traces({
  service: "agent",
  start_time: "2025-01-01T00:00:00Z",
  limit: "20"
})

# Get error traces only
encore-mcp.get_traces({
  endpoint: "run.start",
  error: "true"
})

# Analyze specific trace
encore-mcp.get_trace_spans({
  trace_ids: ["<trace-id>"]
})
```

## Testing Checklist

Before marking API tests complete, verify:

**Endpoint Coverage:**
- [ ] All public endpoints have success case tests
- [ ] Error cases tested (validation, auth, not found)
- [ ] Path parameters and query strings validated
- [ ] Request/response types match schemas

**Integration:**
- [ ] Service-to-service calls tested
- [ ] Database operations verified
- [ ] Pub/sub events tested (if applicable)
- [ ] Authentication/authorization validated

**Quality:**
- [ ] Tests are deterministic (no flakiness)
- [ ] Test data isolated (no shared state)
- [ ] Cleanup happens in teardown
- [ ] Structured logging validated (no console.log)
- [ ] Error codes match APIError types

**Documentation:**
- [ ] Complex test scenarios documented in comments
- [ ] Test patterns added to Graphiti for reuse
- [ ] API contracts documented (if new endpoint)

## Common Pitfalls

**❌ Avoid:**
- Testing internal implementation details
- Using manual `fetch()` instead of generated clients
- Hardcoding URLs or endpoints
- Ignoring error cases
- Writing non-deterministic tests (random data, time-based)
- Testing petty edge cases instead of critical flows
- Skipping cleanup in test teardown

**✅ Instead:**
- Test complete API request/response flows
- Use type-safe generated clients (`~encore/clients`)
- Let Encore handle routing and validation
- Test expected error codes explicitly
- Use fixed test data and deterministic mocks
- Focus on user-facing reliability
- Clean up test data properly

## References

This skill includes additional reference documentation:

- `references/encore_mcp_testing_patterns.md` - Detailed Encore MCP testing examples
- `references/api_testing_examples.md` - Common ScreenGraph API test scenarios
- `references/integration_test_patterns.md` - Multi-service testing strategies

Read these references when you need deeper examples or specific testing patterns.

## Task Commands

```bash
# Run backend tests
cd .cursor && task backend:test

# Run smoke tests
cd .cursor && task qa:smoke:backend

# Start backend for manual testing
cd .cursor && task backend:dev

# Check backend health
cd .cursor && task backend:health

# Run database migrations (test env)
cd .cursor && task backend:db:migrate
```

## Related Skills

- **backend-debugging** - For debugging complex backend issues
- **webapp-testing** - For E2E testing that spans frontend + backend
- **graphiti-mcp-usage** - For documenting test patterns and discoveries
