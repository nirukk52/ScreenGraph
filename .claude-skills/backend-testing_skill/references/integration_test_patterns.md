# Integration Test Patterns

This reference provides patterns for testing multi-service interactions and complete workflows in ScreenGraph.

## Pattern 1: Run Orchestration Flow

**Test:** Complete run lifecycle from start to completion

```typescript
import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { api } from "~encore/clients";

describe("Run Orchestration Integration", () => {
  let runId: string;
  let deviceId: string;
  
  beforeEach(async () => {
    // Setup device
    deviceId = `test-device-${Date.now()}`;
    await api.device.register({
      deviceId,
      platform: "android",
      osVersion: "14"
    });
  });
  
  afterEach(async () => {
    // Cleanup
    if (runId) {
      await api.run.cancel({ runId }).catch(() => {});
    }
  });
  
  test("run creation triggers agent and graph initialization", async () => {
    // 1. Start run
    const run = await api.run.start({
      appId: "com.example.testapp",
      deviceId,
      policy: "breadth"
    });
    runId = run.id;
    
    // 2. Verify run service state
    expect(run.status).toBe("active");
    
    // 3. Verify agent service initialized
    const agentState = await api.agent.getState({ runId });
    expect(agentState).toMatchObject({
      runId,
      status: "idle",
      screensExplored: 0
    });
    
    // 4. Verify graph service initialized
    const graph = await api.graph.getProjection({ runId });
    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].isRoot).toBe(true);
    
    // 5. Verify via traces that all services were called
    await waitFor(500); // Allow trace propagation
    
    const traces = await encore-mcp.get_traces({
      start_time: new Date(Date.now() - 5000).toISOString(),
      limit: "50"
    });
    
    const runTraces = traces.filter(t => 
      t.request?.runId === runId || t.path?.includes(runId)
    );
    
    const servicesCalled = new Set(runTraces.map(t => t.service));
    expect(servicesCalled).toContain("run");
    expect(servicesCalled).toContain("agent");
    expect(servicesCalled).toContain("graph");
  });
});
```

## Pattern 2: Agent State Machine Flow

**Test:** Agent state transitions through complete exploration cycle

```typescript
describe("Agent State Machine Integration", () => {
  let runId: string;
  
  beforeEach(async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    runId = run.id;
  });
  
  test("agent transitions through exploration states", async () => {
    // Initial state: idle
    let state = await api.agent.getState({ runId });
    expect(state.status).toBe("idle");
    
    // Transition: idle → planning
    state = await api.agent.transition({
      runId,
      fromState: "idle",
      toState: "planning"
    });
    expect(state.status).toBe("planning");
    
    // Transition: planning → acting
    state = await api.agent.transition({
      runId,
      fromState: "planning",
      toState: "acting"
    });
    expect(state.status).toBe("acting");
    
    // Simulate action completion → back to planning
    state = await api.agent.transition({
      runId,
      fromState: "acting",
      toState: "planning"
    });
    expect(state.status).toBe("planning");
    
    // Final transition: planning → completed
    state = await api.agent.transition({
      runId,
      fromState: "planning",
      toState: "completed"
    });
    expect(state.status).toBe("completed");
    
    // Verify run status also updated
    const run = await api.run.get({ runId });
    expect(run.status).toBe("completed");
  });
  
  test("agent handles cancellation at any state", async () => {
    // Transition to acting state
    await api.agent.transition({
      runId,
      fromState: "idle",
      toState: "planning"
    });
    
    await api.agent.transition({
      runId,
      fromState: "planning",
      toState: "acting"
    });
    
    // Cancel run while acting
    await api.run.cancel({ runId });
    
    // Verify agent state reflects cancellation
    const state = await api.agent.getState({ runId });
    expect(state.status).toMatch(/cancel/i);
    
    // Verify run status
    const run = await api.run.get({ runId });
    expect(run.status).toBe("canceled");
  });
});
```

## Pattern 3: Graph Projection Flow

**Test:** Graph builds correctly as agent explores screens

```typescript
describe("Graph Projection Integration", () => {
  let runId: string;
  let rootHash: string;
  
  beforeEach(async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    runId = run.id;
    
    // Get root screen hash
    const graph = await api.graph.getProjection({ runId });
    rootHash = graph.nodes[0].screenHash;
  });
  
  test("builds multi-level graph as screens are explored", async () => {
    // Level 1: Add two screens from root
    await api.graph.addScreen({
      runId,
      screenHash: "screen-1a",
      parentHash: rootHash,
      actionTaken: {
        type: "tap",
        coordinates: { x: 100, y: 200 },
        elementId: "button-1"
      }
    });
    
    await api.graph.addScreen({
      runId,
      screenHash: "screen-1b",
      parentHash: rootHash,
      actionTaken: {
        type: "tap",
        coordinates: { x: 300, y: 200 },
        elementId: "button-2"
      }
    });
    
    let graph = await api.graph.getProjection({ runId });
    expect(graph.nodes).toHaveLength(3); // root + 2
    expect(graph.edges).toHaveLength(2);
    
    // Level 2: Add screen from screen-1a
    await api.graph.addScreen({
      runId,
      screenHash: "screen-2a",
      parentHash: "screen-1a",
      actionTaken: {
        type: "swipe",
        coordinates: { x: 500, y: 500 }
      }
    });
    
    graph = await api.graph.getProjection({ runId });
    expect(graph.nodes).toHaveLength(4);
    expect(graph.edges).toHaveLength(3);
    
    // Verify graph structure
    const edge1a = graph.edges.find(e => e.to === "screen-1a");
    expect(edge1a?.from).toBe(rootHash);
    
    const edge2a = graph.edges.find(e => e.to === "screen-2a");
    expect(edge2a?.from).toBe("screen-1a");
  });
  
  test("handles cycles - same screen reached via different paths", async () => {
    // Path 1: root → screen-a
    await api.graph.addScreen({
      runId,
      screenHash: "screen-a",
      parentHash: rootHash,
      actionTaken: { type: "tap", coordinates: { x: 100, y: 100 } }
    });
    
    // Path 2: root → screen-b → screen-a (cycle back to screen-a)
    await api.graph.addScreen({
      runId,
      screenHash: "screen-b",
      parentHash: rootHash,
      actionTaken: { type: "tap", coordinates: { x: 200, y: 100 } }
    });
    
    await api.graph.addScreen({
      runId,
      screenHash: "screen-a", // Same screen again
      parentHash: "screen-b",
      actionTaken: { type: "tap", coordinates: { x: 300, y: 100 } }
    });
    
    const graph = await api.graph.getProjection({ runId });
    
    // Should have 3 unique nodes (root, screen-a, screen-b)
    expect(graph.nodes).toHaveLength(3);
    
    // Should have 3 edges (root→a, root→b, b→a)
    expect(graph.edges).toHaveLength(3);
    
    // Verify screen-a has two incoming edges
    const edgesToA = graph.edges.filter(e => e.to === "screen-a");
    expect(edgesToA).toHaveLength(2);
  });
});
```

## Pattern 4: Artifact Storage Flow

**Test:** Artifacts are stored and linked to graph nodes

```typescript
describe("Artifact Storage Integration", () => {
  let runId: string;
  
  beforeEach(async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    runId = run.id;
  });
  
  test("stores and retrieves artifacts for each screen", async () => {
    const screenHash = "screen-001";
    
    // Store screenshot
    const screenshot = await api.artifacts.store({
      runId,
      artifactType: "screenshot",
      data: Buffer.from("fake-png-data").toString("base64"),
      metadata: {
        screenHash,
        format: "png",
        width: 1920,
        height: 1080
      }
    });
    
    // Store hierarchy
    const hierarchy = await api.artifacts.store({
      runId,
      artifactType: "hierarchy",
      data: Buffer.from("<hierarchy>...</hierarchy>").toString("base64"),
      metadata: {
        screenHash,
        format: "xml"
      }
    });
    
    // Add screen to graph with artifact references
    await api.graph.addScreen({
      runId,
      screenHash,
      parentHash: "root",
      actionTaken: { type: "tap", coordinates: { x: 100, y: 100 } },
      artifacts: {
        screenshotId: screenshot.artifactId,
        hierarchyId: hierarchy.artifactId
      }
    });
    
    // Retrieve graph and verify artifacts linked
    const graph = await api.graph.getProjection({ runId });
    const node = graph.nodes.find(n => n.screenHash === screenHash);
    
    expect(node?.artifacts).toMatchObject({
      screenshotId: screenshot.artifactId,
      hierarchyId: hierarchy.artifactId
    });
    
    // Verify artifacts retrievable
    const retrievedScreenshot = await api.artifacts.retrieve({
      artifactId: screenshot.artifactId
    });
    expect(retrievedScreenshot.data).toBeDefined();
    
    const retrievedHierarchy = await api.artifacts.retrieve({
      artifactId: hierarchy.artifactId
    });
    expect(retrievedHierarchy.data).toBeDefined();
  });
});
```

## Pattern 5: Pub/Sub Event Flow

**Test:** Events propagate correctly between services

```typescript
describe("Pub/Sub Event Integration", () => {
  test("run events trigger downstream handlers", async () => {
    // Get initial pub/sub config
    const pubsub = await encore-mcp.get_pubsub();
    const runEventsTopic = pubsub.topics.find(t => t.name === "run-events");
    expect(runEventsTopic).toBeDefined();
    
    // Start run (should publish run.started event)
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // Wait for event processing
    await waitFor(500);
    
    // Verify handlers executed via traces
    const traces = await encore-mcp.get_traces({
      start_time: new Date(Date.now() - 2000).toISOString(),
      limit: "100"
    });
    
    // Look for subscription handler traces
    const handlerTraces = traces.filter(t => 
      t.subscription || t.endpoint?.includes("on-run-")
    );
    
    expect(handlerTraces.length).toBeGreaterThan(0);
    
    // Verify specific handlers ran
    const agentHandlerTrace = handlerTraces.find(t => 
      t.service === "agent" && t.endpoint?.includes("on-run-started")
    );
    expect(agentHandlerTrace).toBeDefined();
    
    const graphHandlerTrace = handlerTraces.find(t => 
      t.service === "graph" && t.endpoint?.includes("on-run-started")
    );
    expect(graphHandlerTrace).toBeDefined();
  });
  
  test("agent action events update graph", async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // Trigger agent action (should publish agent.action event)
    await api.agent.performAction({
      runId: run.id,
      actionType: "tap",
      target: { x: 100, y: 200 }
    });
    
    // Wait for event processing
    await waitFor(500);
    
    // Verify graph updated via event handler
    const graph = await api.graph.getProjection({ runId: run.id });
    
    // Should have new node from action
    expect(graph.nodes.length).toBeGreaterThan(1);
  });
});
```

## Pattern 6: Error Propagation Flow

**Test:** Errors propagate correctly through service boundaries

```typescript
describe("Error Propagation Integration", () => {
  test("device failure cancels run and notifies agent", async () => {
    // Start run
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // Simulate device disconnection
    await api.device.disconnect({ deviceId: "test-device" });
    
    // Wait for error propagation
    await waitFor(1000);
    
    // Verify run canceled
    const runState = await api.run.get({ runId: run.id });
    expect(runState.status).toBe("canceled");
    expect(runState.stopReason).toContain("device disconnected");
    
    // Verify agent notified
    const agentState = await api.agent.getState({ runId: run.id });
    expect(agentState.status).toMatch(/cancel|stopped/i);
    
    // Verify via traces
    const traces = await encore-mcp.get_traces({
      error: "true",
      start_time: new Date(Date.now() - 5000).toISOString(),
      limit: "20"
    });
    
    const deviceErrorTrace = traces.find(t => 
      t.service === "device" && t.error_message?.includes("disconnect")
    );
    expect(deviceErrorTrace).toBeDefined();
  });
  
  test("invalid agent action doesn't corrupt state", async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // Transition to acting state
    await api.agent.transition({
      runId: run.id,
      fromState: "idle",
      toState: "planning"
    });
    
    // Try invalid action
    try {
      await api.agent.performAction({
        runId: run.id,
        actionType: "invalid-action-type",
        target: { x: -1, y: -1 } // Invalid coordinates
      });
      fail("Should have thrown error");
    } catch (err) {
      expect(err.code).toBe("invalid_argument");
    }
    
    // Verify state not corrupted
    const state = await api.agent.getState({ runId: run.id });
    expect(state.status).toBe("planning"); // Still valid state
    
    // Verify graph not corrupted
    const graph = await api.graph.getProjection({ runId: run.id });
    expect(graph.nodes).toHaveLength(1); // Only root node
  });
});
```

## Pattern 7: Concurrent Operations

**Test:** Multiple operations can run concurrently without conflicts

```typescript
describe("Concurrent Operations Integration", () => {
  test("multiple runs can execute simultaneously", async () => {
    // Start 3 runs concurrently
    const runs = await Promise.all([
      api.run.start({
        appId: "com.example.app1",
        deviceId: "device-1"
      }),
      api.run.start({
        appId: "com.example.app2",
        deviceId: "device-2"
      }),
      api.run.start({
        appId: "com.example.app3",
        deviceId: "device-3"
      })
    ]);
    
    // Verify all runs active
    expect(runs).toHaveLength(3);
    runs.forEach(run => {
      expect(run.status).toBe("active");
      expect(run.id).toBeDefined();
    });
    
    // Verify each has independent agent state
    const states = await Promise.all(
      runs.map(run => api.agent.getState({ runId: run.id }))
    );
    
    states.forEach((state, i) => {
      expect(state.runId).toBe(runs[i].id);
      expect(state.status).toBe("idle");
    });
    
    // Verify each has independent graph
    const graphs = await Promise.all(
      runs.map(run => api.graph.getProjection({ runId: run.id }))
    );
    
    graphs.forEach((graph, i) => {
      expect(graph.runId).toBe(runs[i].id);
      expect(graph.nodes).toHaveLength(1);
    });
  });
  
  test("concurrent graph updates don't conflict", async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    const graph = await api.graph.getProjection({ runId: run.id });
    const rootHash = graph.nodes[0].screenHash;
    
    // Add 5 screens concurrently from root
    await Promise.all([
      api.graph.addScreen({
        runId: run.id,
        screenHash: "concurrent-1",
        parentHash: rootHash,
        actionTaken: { type: "tap", coordinates: { x: 100, y: 100 } }
      }),
      api.graph.addScreen({
        runId: run.id,
        screenHash: "concurrent-2",
        parentHash: rootHash,
        actionTaken: { type: "tap", coordinates: { x: 200, y: 100 } }
      }),
      api.graph.addScreen({
        runId: run.id,
        screenHash: "concurrent-3",
        parentHash: rootHash,
        actionTaken: { type: "tap", coordinates: { x: 300, y: 100 } }
      }),
      api.graph.addScreen({
        runId: run.id,
        screenHash: "concurrent-4",
        parentHash: rootHash,
        actionTaken: { type: "tap", coordinates: { x: 400, y: 100 } }
      }),
      api.graph.addScreen({
        runId: run.id,
        screenHash: "concurrent-5",
        parentHash: rootHash,
        actionTaken: { type: "tap", coordinates: { x: 500, y: 100 } }
      })
    ]);
    
    // Verify all screens added correctly
    const finalGraph = await api.graph.getProjection({ runId: run.id });
    expect(finalGraph.nodes).toHaveLength(6); // root + 5
    expect(finalGraph.edges).toHaveLength(5);
  });
});
```

## Pattern 8: Database Consistency

**Test:** Database state remains consistent across services

```typescript
describe("Database Consistency Integration", () => {
  test("run cancellation cascades to all related tables", async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // Perform some actions to create data across services
    await api.agent.transition({
      runId: run.id,
      fromState: "idle",
      toState: "planning"
    });
    
    await api.graph.addScreen({
      runId: run.id,
      screenHash: "screen-001",
      parentHash: "root",
      actionTaken: { type: "tap", coordinates: { x: 100, y: 100 } }
    });
    
    // Cancel run
    await api.run.cancel({ runId: run.id });
    
    // Verify consistency across all databases
    const results = await encore-mcp.query_database({
      queries: [
        {
          database: "rundb",
          query: `SELECT status FROM runs WHERE id = '${run.id}'`
        },
        {
          database: "agentdb",
          query: `SELECT status FROM agent_states WHERE run_id = '${run.id}'`
        },
        {
          database: "graphdb",
          query: `SELECT is_active FROM graphs WHERE run_id = '${run.id}'`
        }
      ]
    });
    
    // All should reflect cancellation
    expect(results[0].rows[0].status).toBe("canceled");
    expect(results[1].rows[0].status).toMatch(/cancel/i);
    expect(results[2].rows[0].is_active).toBe(false);
  });
});
```

## Integration Test Best Practices

1. **Test complete workflows** - From user action to final result
2. **Use Encore MCP traces** - Verify service call chains
3. **Check database consistency** - Query across service databases
4. **Test event propagation** - Verify pub/sub handlers execute
5. **Verify cleanup** - Cancel/cleanup resources in teardown
6. **Test concurrency** - Multiple operations don't conflict
7. **Test error paths** - Failures propagate correctly
8. **Use deterministic data** - Fixed test data, not random
9. **Wait for async operations** - Allow time for event processing
10. **Document complex flows** - Comment multi-step test logic

## Common Integration Test Utilities

```typescript
/** Wait for async operations */
export async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Poll until condition is true */
export async function waitUntil(
  condition: () => Promise<boolean>,
  timeoutMs: number = 5000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await condition()) return;
    await waitFor(100);
  }
  throw new Error("Timeout waiting for condition");
}

/** Setup complete test environment */
export async function setupTestEnvironment(): Promise<{
  deviceId: string;
  runId: string;
}> {
  const deviceId = `test-device-${Date.now()}`;
  await api.device.register({
    deviceId,
    platform: "android",
    osVersion: "14"
  });
  
  const run = await api.run.start({
    appId: "com.example.testapp",
    deviceId,
    policy: "breadth"
  });
  
  return { deviceId, runId: run.id };
}

/** Cleanup test environment */
export async function cleanupTestEnvironment(runId: string): Promise<void> {
  await api.run.cancel({ runId }).catch(() => {});
  // Add more cleanup as needed
}
```

