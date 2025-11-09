# ScreenGraph API Testing Examples

This reference provides concrete testing examples for ScreenGraph's main backend services.

## Run Service API Tests

### Test: Start Run

```typescript
import { describe, test, expect, beforeEach } from "vitest";
import { api } from "~encore/clients";

describe("Run Service - start", () => {
  test("starts run with valid app and device", async () => {
    const response = await api.run.start({
      appId: "com.example.testapp",
      deviceId: "test-device-001",
      policy: "breadth"
    });
    
    expect(response).toMatchObject({
      id: expect.any(String),
      appId: "com.example.testapp",
      deviceId: "test-device-001",
      status: "active",
      policy: "breadth",
      startedAt: expect.any(String)
    });
    
    // Verify in database
    const dbResult = await encore-mcp.query_database({
      queries: [{
        database: "rundb",
        query: `SELECT * FROM runs WHERE id = '${response.id}'`
      }]
    });
    
    expect(dbResult.rows).toHaveLength(1);
    expect(dbResult.rows[0].status).toBe("active");
  });
  
  test("rejects invalid app ID", async () => {
    await expect(
      api.run.start({
        appId: "",
        deviceId: "test-device",
        policy: "breadth"
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: "invalid_argument",
        message: expect.stringContaining("appId")
      })
    );
  });
  
  test("defaults to breadth policy if not specified", async () => {
    const response = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
      // policy omitted
    });
    
    expect(response.policy).toBe("breadth");
  });
});
```

### Test: Get Run

```typescript
describe("Run Service - get", () => {
  let runId: string;
  
  beforeEach(async () => {
    // Setup: Create a run
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    runId = run.id;
  });
  
  test("retrieves existing run", async () => {
    const response = await api.run.get({ runId });
    
    expect(response).toMatchObject({
      id: runId,
      appId: "com.example.app",
      deviceId: "test-device",
      status: "active"
    });
  });
  
  test("returns not found for invalid run ID", async () => {
    await expect(
      api.run.get({ runId: "invalid-run-id" })
    ).rejects.toThrow(
      expect.objectContaining({
        code: "not_found",
        message: expect.stringContaining("run not found")
      })
    );
  });
});
```

### Test: Cancel Run

```typescript
describe("Run Service - cancel", () => {
  test("cancels active run", async () => {
    // Setup
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // Cancel
    await api.run.cancel({ runId: run.id });
    
    // Verify status changed
    const updated = await api.run.get({ runId: run.id });
    expect(updated.status).toBe("canceled");
    expect(updated.canceledAt).toBeDefined();
    
    // Verify in database
    const dbResult = await encore-mcp.query_database({
      queries: [{
        database: "rundb",
        query: `SELECT status, canceled_at FROM runs WHERE id = '${run.id}'`
      }]
    });
    
    expect(dbResult.rows[0].status).toBe("canceled");
    expect(dbResult.rows[0].canceled_at).not.toBeNull();
  });
  
  test("idempotent - canceling twice succeeds", async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    
    // Cancel twice
    await api.run.cancel({ runId: run.id });
    await api.run.cancel({ runId: run.id });
    
    const final = await api.run.get({ runId: run.id });
    expect(final.status).toBe("canceled");
  });
});
```

## Agent Service API Tests

### Test: Get Agent State

```typescript
describe("Agent Service - getState", () => {
  let runId: string;
  
  beforeEach(async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    runId = run.id;
  });
  
  test("returns initial agent state", async () => {
    const state = await api.agent.getState({ runId });
    
    expect(state).toMatchObject({
      runId,
      status: "idle",
      screensExplored: 0,
      actionsPerformed: 0
    });
  });
  
  test("returns not found for non-existent run", async () => {
    await expect(
      api.agent.getState({ runId: "invalid-run" })
    ).rejects.toThrow(
      expect.objectContaining({
        code: "not_found"
      })
    );
  });
});
```

### Test: Transition Agent State

```typescript
describe("Agent Service - transition", () => {
  let runId: string;
  
  beforeEach(async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    runId = run.id;
  });
  
  test("transitions from idle to planning", async () => {
    const state = await api.agent.transition({
      runId,
      fromState: "idle",
      toState: "planning"
    });
    
    expect(state.status).toBe("planning");
    expect(state.lastTransition).toMatchObject({
      from: "idle",
      to: "planning",
      timestamp: expect.any(String)
    });
  });
  
  test("rejects invalid state transition", async () => {
    await expect(
      api.agent.transition({
        runId,
        fromState: "idle",
        toState: "completed" // Invalid: can't go idle -> completed
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: "failed_precondition",
        message: expect.stringContaining("invalid transition")
      })
    );
  });
  
  test("validates current state matches fromState", async () => {
    // Transition to planning
    await api.agent.transition({
      runId,
      fromState: "idle",
      toState: "planning"
    });
    
    // Try to transition from idle again (but current state is planning)
    await expect(
      api.agent.transition({
        runId,
        fromState: "idle",
        toState: "acting"
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: "failed_precondition",
        message: expect.stringContaining("current state is not idle")
      })
    );
  });
});
```

## Graph Service API Tests

### Test: Get Graph Projection

```typescript
describe("Graph Service - getProjection", () => {
  let runId: string;
  
  beforeEach(async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    runId = run.id;
  });
  
  test("returns initial graph with root node", async () => {
    const graph = await api.graph.getProjection({ runId });
    
    expect(graph).toMatchObject({
      runId,
      nodes: expect.arrayContaining([
        expect.objectContaining({
          screenHash: expect.any(String),
          isRoot: true
        })
      ]),
      edges: []
    });
    
    expect(graph.nodes).toHaveLength(1);
  });
  
  test("returns not found for invalid run", async () => {
    await expect(
      api.graph.getProjection({ runId: "invalid" })
    ).rejects.toThrow(
      expect.objectContaining({
        code: "not_found"
      })
    );
  });
});
```

### Test: Add Screen to Graph

```typescript
describe("Graph Service - addScreen", () => {
  let runId: string;
  
  beforeEach(async () => {
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId: "test-device"
    });
    runId = run.id;
  });
  
  test("adds new screen node to graph", async () => {
    const screenHash = "abc123def456";
    const parentHash = "root000000";
    
    await api.graph.addScreen({
      runId,
      screenHash,
      parentHash,
      actionTaken: {
        type: "tap",
        coordinates: { x: 100, y: 200 },
        elementId: "submit-button"
      }
    });
    
    // Verify graph updated
    const graph = await api.graph.getProjection({ runId });
    
    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
    
    const newNode = graph.nodes.find(n => n.screenHash === screenHash);
    expect(newNode).toBeDefined();
    
    const edge = graph.edges[0];
    expect(edge).toMatchObject({
      from: parentHash,
      to: screenHash,
      action: expect.objectContaining({
        type: "tap"
      })
    });
  });
  
  test("handles duplicate screen (deduplication)", async () => {
    const screenHash = "duplicate123";
    
    // Add same screen twice
    await api.graph.addScreen({
      runId,
      screenHash,
      parentHash: "root000",
      actionTaken: { type: "tap", coordinates: { x: 100, y: 200 } }
    });
    
    await api.graph.addScreen({
      runId,
      screenHash, // Same hash
      parentHash: "root000",
      actionTaken: { type: "tap", coordinates: { x: 100, y: 200 } }
    });
    
    const graph = await api.graph.getProjection({ runId });
    
    // Should still have only 2 nodes (root + duplicate, not 3)
    expect(graph.nodes).toHaveLength(2);
    
    // But may have 2 edges if same screen reached via different paths
    // (This depends on business logic - adjust expectation accordingly)
  });
});
```

## Artifacts Service API Tests

### Test: Store Artifact

```typescript
describe("Artifacts Service - store", () => {
  test("stores screenshot artifact", async () => {
    const runId = "test-run-123";
    const artifactData = Buffer.from("fake-image-data");
    
    const response = await api.artifacts.store({
      runId,
      artifactType: "screenshot",
      data: artifactData.toString("base64"),
      metadata: {
        screenHash: "abc123",
        timestamp: new Date().toISOString(),
        deviceResolution: "1920x1080"
      }
    });
    
    expect(response).toMatchObject({
      artifactId: expect.any(String),
      storedAt: expect.any(String),
      sizeBytes: artifactData.length
    });
  });
  
  test("stores hierarchy XML artifact", async () => {
    const runId = "test-run-456";
    const xmlData = "<hierarchy><node>...</node></hierarchy>";
    
    const response = await api.artifacts.store({
      runId,
      artifactType: "hierarchy",
      data: Buffer.from(xmlData).toString("base64"),
      metadata: {
        screenHash: "def456",
        timestamp: new Date().toISOString()
      }
    });
    
    expect(response.artifactId).toBeDefined();
  });
  
  test("rejects missing required fields", async () => {
    await expect(
      api.artifacts.store({
        runId: "",
        artifactType: "screenshot",
        data: "..."
      })
    ).rejects.toThrow(
      expect.objectContaining({
        code: "invalid_argument"
      })
    );
  });
});
```

### Test: Retrieve Artifact

```typescript
describe("Artifacts Service - retrieve", () => {
  let artifactId: string;
  let originalData: Buffer;
  
  beforeEach(async () => {
    originalData = Buffer.from("test-artifact-content");
    const response = await api.artifacts.store({
      runId: "test-run",
      artifactType: "screenshot",
      data: originalData.toString("base64")
    });
    artifactId = response.artifactId;
  });
  
  test("retrieves stored artifact", async () => {
    const artifact = await api.artifacts.retrieve({ artifactId });
    
    expect(artifact).toMatchObject({
      artifactId,
      artifactType: "screenshot",
      data: expect.any(String)
    });
    
    // Verify data integrity
    const retrievedData = Buffer.from(artifact.data, "base64");
    expect(retrievedData.equals(originalData)).toBe(true);
  });
  
  test("returns not found for invalid artifact ID", async () => {
    await expect(
      api.artifacts.retrieve({ artifactId: "invalid-id" })
    ).rejects.toThrow(
      expect.objectContaining({
        code: "not_found"
      })
    );
  });
});
```

## Device Service API Tests

### Test: Register Device

```typescript
describe("Device Service - register", () => {
  test("registers new device", async () => {
    const response = await api.device.register({
      deviceId: "test-device-001",
      platform: "android",
      osVersion: "14",
      capabilities: {
        screenResolution: "1920x1080",
        touchScreen: true,
        camera: true
      }
    });
    
    expect(response).toMatchObject({
      deviceId: "test-device-001",
      registeredAt: expect.any(String),
      status: "available"
    });
  });
  
  test("updates existing device on re-registration", async () => {
    const deviceId = "test-device-002";
    
    // Register
    await api.device.register({
      deviceId,
      platform: "ios",
      osVersion: "17"
    });
    
    // Re-register with updated info
    const updated = await api.device.register({
      deviceId,
      platform: "ios",
      osVersion: "18" // Updated
    });
    
    expect(updated.osVersion).toBe("18");
  });
});
```

### Test: Get Device Status

```typescript
describe("Device Service - getStatus", () => {
  beforeEach(async () => {
    await api.device.register({
      deviceId: "test-device",
      platform: "android",
      osVersion: "14"
    });
  });
  
  test("returns device status", async () => {
    const status = await api.device.getStatus({
      deviceId: "test-device"
    });
    
    expect(status).toMatchObject({
      deviceId: "test-device",
      status: "available",
      platform: "android",
      lastHeartbeat: expect.any(String)
    });
  });
  
  test("returns not found for unregistered device", async () => {
    await expect(
      api.device.getStatus({ deviceId: "unregistered" })
    ).rejects.toThrow(
      expect.objectContaining({
        code: "not_found"
      })
    );
  });
});
```

## Testing Checklist for Each API

When testing a new or modified API endpoint, ensure:

- [ ] **Success case**: Happy path with valid inputs
- [ ] **Validation**: Invalid inputs return `invalid_argument`
- [ ] **Not found**: Missing resources return `not_found`
- [ ] **Idempotency**: Repeating requests doesn't cause issues (for non-GET)
- [ ] **Database**: State persists correctly in database
- [ ] **Types**: Request/response types match generated client
- [ ] **Auth**: Protected endpoints reject unauthenticated requests
- [ ] **Errors**: Error codes and messages are helpful
- [ ] **Structured logs**: No `console.log`, only `encore.dev/log`
- [ ] **Traces**: Can be debugged via Encore MCP traces

## Common Test Utilities

```typescript
// Test helpers (create in test setup file)

/** Wait for async operations to complete */
export async function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Generate unique test ID */
export function testId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Clean up test run */
export async function cleanupRun(runId: string): Promise<void> {
  try {
    await api.run.cancel({ runId });
  } catch {
    // Already canceled or doesn't exist
  }
}

/** Setup test device */
export async function setupTestDevice(deviceId?: string): Promise<string> {
  const id = deviceId || testId("device");
  await api.device.register({
    deviceId: id,
    platform: "android",
    osVersion: "14"
  });
  return id;
}
```

## Integration Test Example

```typescript
describe("Complete Run Flow", () => {
  test("full run lifecycle", async () => {
    // 1. Setup device
    const deviceId = await setupTestDevice();
    
    // 2. Start run
    const run = await api.run.start({
      appId: "com.example.app",
      deviceId,
      policy: "breadth"
    });
    
    // 3. Verify agent initialized
    const agentState = await api.agent.getState({ runId: run.id });
    expect(agentState.status).toBe("idle");
    
    // 4. Verify graph initialized
    const graph = await api.graph.getProjection({ runId: run.id });
    expect(graph.nodes).toHaveLength(1);
    
    // 5. Simulate agent actions
    await api.agent.transition({
      runId: run.id,
      fromState: "idle",
      toState: "planning"
    });
    
    await api.graph.addScreen({
      runId: run.id,
      screenHash: "screen001",
      parentHash: graph.nodes[0].screenHash,
      actionTaken: {
        type: "tap",
        coordinates: { x: 100, y: 200 }
      }
    });
    
    // 6. Cancel run
    await api.run.cancel({ runId: run.id });
    
    // 7. Verify final state
    const finalRun = await api.run.get({ runId: run.id });
    expect(finalRun.status).toBe("canceled");
    
    const finalAgent = await api.agent.getState({ runId: run.id });
    expect(finalAgent.status).toContain("canceled");
  });
});
```

