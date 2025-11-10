# Encore MCP Testing Patterns

This reference provides detailed patterns for using Encore MCP tools during backend API testing.

## Pattern 1: Test-Driven API Development

**Workflow:** Write tests first, use MCP to verify implementation

```typescript
// 1. Write the test based on desired behavior
describe("Agent State API", () => {
  test("transitions from idle to planning", async () => {
    const state = await api.agent.transition({
      runId: "test-run",
      fromState: "idle",
      toState: "planning"
    });
    
    expect(state.status).toBe("planning");
    expect(state.transitionedAt).toBeDefined();
  });
});

// 2. Use MCP to verify endpoint exists
encore-mcp.get_services({
  services: ["agent"],
  include_endpoints: true
})

// 3. Check endpoint schema matches test expectations
encore-mcp.get_services({
  services: ["agent"],
  include_schemas: true
})

// 4. Run test and capture trace
encore test

// 5. Analyze trace if test fails
encore-mcp.get_traces({
  endpoint: "agent.transition",
  error: "true",
  limit: "1"
})
```

## Pattern 2: Trace-Driven Debugging

**Workflow:** Use traces to diagnose test failures systematically

```typescript
// Test fails with unclear error
test("create run with invalid app ID", async () => {
  await expect(
    api.run.start({ appId: "invalid", deviceId: "test" })
  ).rejects.toThrow();
});

// Step 1: Get error traces for this endpoint
const traces = encore-mcp.get_traces({
  endpoint: "run.start",
  error: "true",
  limit: "5"
});

// Step 2: Identify the trace ID from test run
// (Look at test output or recent traces)

// Step 3: Get detailed spans
const spans = encore-mcp.get_trace_spans({
  trace_ids: ["<trace-id-from-test>"]
});

// Step 4: Analyze the spans to find:
// - Which service threw the error
// - What the error code was
// - Database query failures
// - Validation issues

// Step 5: Update test to match actual error behavior
test("create run with invalid app ID", async () => {
  try {
    await api.run.start({ appId: "invalid", deviceId: "test" });
    fail("Should have thrown");
  } catch (err) {
    expect(err.code).toBe(ErrCode.InvalidArgument);
    expect(err.message).toContain("app not found");
  }
});
```

## Pattern 3: Database State Verification

**Workflow:** Verify database operations during tests using MCP

```typescript
describe("Run Service", () => {
  test("persists run to database", async () => {
    // Call API
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // Verify via MCP database query
    const result = await encore-mcp.query_database({
      queries: [{
        database: "rundb",
        query: `SELECT * FROM runs WHERE id = '${run.id}'`
      }]
    });
    
    // Parse result and verify
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].status).toBe("active");
    expect(result.rows[0].app_id).toBe("com.example.app");
  });
  
  test("updates run status correctly", async () => {
    // Setup
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // Cancel run
    await api.run.cancel({ runId: run.id });
    
    // Verify database state
    const result = await encore-mcp.query_database({
      queries: [{
        database: "rundb",
        query: `SELECT status, canceled_at FROM runs WHERE id = '${run.id}'`
      }]
    });
    
    expect(result.rows[0].status).toBe("canceled");
    expect(result.rows[0].canceled_at).not.toBeNull();
  });
});
```

## Pattern 4: Service Contract Validation

**Workflow:** Verify service contracts match expectations

```typescript
// Use MCP to get service schemas
const services = await encore-mcp.get_services({
  services: ["agent"],
  include_schemas: true,
  include_endpoints: true
});

// Verify expected endpoints exist
const agentService = services.find(s => s.name === "agent");
const endpoints = agentService.endpoints.map(e => e.name);

expect(endpoints).toContain("getState");
expect(endpoints).toContain("transition");
expect(endpoints).toContain("reset");

// Verify endpoint schemas
const getStateEndpoint = agentService.endpoints.find(e => e.name === "getState");
expect(getStateEndpoint.request_schema).toMatchObject({
  runId: { type: "string", required: true }
});
expect(getStateEndpoint.response_schema).toMatchObject({
  status: { type: "string" },
  runId: { type: "string" },
  lastAction: { type: "object" }
});
```

## Pattern 5: Integration Flow Testing

**Workflow:** Test multi-service flows using traces

```typescript
describe("Complete Run Flow", () => {
  test("run creation triggers agent and graph initialization", async () => {
    // Start run
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // Get traces for this run
    const traces = await encore-mcp.get_traces({
      start_time: new Date(Date.now() - 5000).toISOString(), // Last 5s
      limit: "20"
    });
    
    // Filter traces related to this run
    const runTraces = traces.filter(t => 
      t.request?.runId === run.id || 
      t.path?.includes(run.id)
    );
    
    // Verify expected service calls occurred
    const servicesCalled = new Set(runTraces.map(t => t.service));
    expect(servicesCalled).toContain("run");
    expect(servicesCalled).toContain("agent");
    expect(servicesCalled).toContain("graph");
    
    // Verify call order (run → agent → graph)
    expect(runTraces[0].service).toBe("run");
    const agentTrace = runTraces.find(t => t.service === "agent");
    const graphTrace = runTraces.find(t => t.service === "graph");
    expect(agentTrace).toBeDefined();
    expect(graphTrace).toBeDefined();
    expect(agentTrace.timestamp < graphTrace.timestamp).toBe(true);
  });
});
```

## Pattern 6: Performance Testing with Metrics

**Workflow:** Use metrics to verify performance requirements

```typescript
describe("Performance Tests", () => {
  test("run start completes within 500ms", async () => {
    const startTime = Date.now();
    
    await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500);
    
    // Optional: Verify via metrics
    const metrics = await encore-mcp.get_metrics();
    const runStartMetric = metrics.find(m => 
      m.name === "run_start_duration" || 
      m.endpoint === "run.start"
    );
    
    if (runStartMetric) {
      expect(runStartMetric.p95).toBeLessThan(500);
    }
  });
});
```

## Pattern 7: Authentication Testing

**Workflow:** Test auth-protected endpoints

```typescript
describe("Authenticated Endpoints", () => {
  test("rejects unauthenticated requests", async () => {
    // Call without auth
    await expect(
      api.agent.getState({ runId: "test-run" })
    ).rejects.toThrow("unauthenticated");
    
    // Verify via trace
    const traces = await encore-mcp.get_traces({
      endpoint: "agent.getState",
      error: "true",
      limit: "1"
    });
    
    expect(traces[0].error_code).toBe("unauthenticated");
  });
  
  test("allows authenticated requests", async () => {
    // Setup auth handler first
    const authHandlers = await encore-mcp.get_auth_handlers();
    expect(authHandlers).toHaveLength(1);
    
    // Call with valid auth
    const response = await api.agent.getState(
      { runId: "test-run" },
      { auth: { userId: "test-user" } }
    );
    
    expect(response).toBeDefined();
  });
});
```

## Pattern 8: Pub/Sub Testing

**Workflow:** Test event-driven workflows

```typescript
describe("Event Handling", () => {
  test("run events trigger downstream handlers", async () => {
    // Get pub/sub topics
    const pubsub = await encore-mcp.get_pubsub();
    const runEventsTopic = pubsub.topics.find(t => t.name === "run-events");
    expect(runEventsTopic).toBeDefined();
    
    // Verify subscribers
    expect(runEventsTopic.subscriptions).toContain("agent-orchestrator");
    expect(runEventsTopic.subscriptions).toContain("graph-projector");
    
    // Publish event (via API that publishes)
    await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // Wait for event processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify handler execution via traces
    const traces = await encore-mcp.get_traces({
      start_time: new Date(Date.now() - 2000).toISOString(),
      limit: "50"
    });
    
    const handlerTraces = traces.filter(t => 
      t.endpoint?.includes("on-run-event")
    );
    
    expect(handlerTraces.length).toBeGreaterThan(0);
  });
});
```

## Pattern 9: Error Recovery Testing

**Workflow:** Test error handling and recovery

```typescript
describe("Error Recovery", () => {
  test("handles database connection failure", async () => {
    // Simulate database failure (in test env)
    // ...
    
    // Call endpoint
    try {
      await api.run.start({
        appId: "com.example.app",
        deviceId: "test-device"
      });
      fail("Should have thrown error");
    } catch (err) {
      expect(err.code).toBe(ErrCode.Unavailable);
    }
    
    // Verify error logged properly
    const traces = await encore-mcp.get_traces({
      error: "true",
      limit: "1"
    });
    
    const spans = await encore-mcp.get_trace_spans({
      trace_ids: [traces[0].id]
    });
    
    // Verify structured error logging
    const errorSpan = spans.find(s => s.error);
    expect(errorSpan.logs).toContainEqual(
      expect.objectContaining({
        level: "error",
        message: expect.stringContaining("database")
      })
    );
  });
});
```

## Pattern 10: Cron Job Testing

**Workflow:** Test scheduled job handlers

```typescript
describe("Scheduled Jobs", () => {
  test("cleanup job removes old runs", async () => {
    // Get cron jobs
    const jobs = await encore-mcp.get_cronjobs();
    const cleanupJob = jobs.find(j => j.title.includes("cleanup"));
    expect(cleanupJob).toBeDefined();
    expect(cleanupJob.endpoint).toBe("run.cleanup");
    
    // Manually trigger the job endpoint
    await encore-mcp.call_endpoint({
      service: "run",
      endpoint: "cleanup",
      method: "POST",
      path: "/run/cleanup",
      payload: "{}"
    });
    
    // Verify cleanup happened
    const result = await encore-mcp.query_database({
      queries: [{
        database: "rundb",
        query: `SELECT COUNT(*) as count FROM runs 
                WHERE status = 'completed' 
                AND completed_at < NOW() - INTERVAL '7 days'`
      }]
    });
    
    expect(result.rows[0].count).toBe(0);
  });
});
```

## Best Practices Summary

1. **Use MCP for introspection before writing tests** - Understand the API surface
2. **Capture traces for every test failure** - Systematic debugging saves time
3. **Verify database state with queries** - Don't assume API responses reflect DB
4. **Test service contracts explicitly** - Prevent breaking changes
5. **Trace integration flows end-to-end** - Verify service orchestration
6. **Monitor metrics during performance tests** - Real data over timers
7. **Test authentication explicitly** - Security is critical
8. **Verify pub/sub subscriptions** - Event-driven systems need event tests
9. **Test error recovery paths** - Failures are part of the flow
10. **Test cron jobs manually** - Don't wait for schedule

## Common MCP Commands Quick Reference

```bash
# Discovery
encore-mcp.get_services({ include_endpoints: true, include_schemas: true })
encore-mcp.get_databases({ include_tables: true })
encore-mcp.get_pubsub()
encore-mcp.get_metrics()

# Testing
encore-mcp.call_endpoint({ service, endpoint, method, path, payload })
encore-mcp.query_database({ queries: [{ database, query }] })

# Debugging
encore-mcp.get_traces({ endpoint, error, start_time, limit })
encore-mcp.get_trace_spans({ trace_ids })
encore-mcp.get_auth_handlers()
encore-mcp.get_cronjobs()
```

