---
name: backend-testing
description: This skill should be used when writing Encore.ts backend tests. Covers test environment boundaries (encore test vs encore run), testing patterns (unit, integration, PubSub, metrics), database testing with type-safe queries, and using Encore MCP for debugging. Use this when writing or improving backend tests.
---

# Backend Testing Skill

## Purpose

Comprehensive guide for writing, running, and debugging Encore.ts backend tests. This skill covers:

1. **Test Environment Boundaries**: Understanding `encore test` (isolated) vs `encore run` (full stack)
2. **Testing Patterns**: Unit, integration, PubSub, and metrics tests
3. **Database Testing**: Type-safe queries and validation
4. **PubSub Testing**: Worker subscriptions in test runtime
5. **Writing Integration Tests**: Structure, polling, and best practices
6. **Task Commands**: Running tests efficiently
7. **Encore MCP Integration**: Using MCP tools for debugging (see `backend-debugging` skill)

## When to Use This Skill

Use this skill when:
- Writing new backend tests
- Setting up integration tests with external dependencies
- Understanding `encore test` vs `encore run` differences
- Testing PubSub message flows
- Validating deterministic agent behavior
- Debugging test failures (use with `backend-debugging` skill)

## Test Environment Boundaries

### `encore test` — Isolated Testing ⭐ PRIMARY

**Purpose**: Isolated unit and integration tests with ephemeral resources

**Characteristics:**
- ✅ Isolated Encore runtime (clean slate each run)
- ✅ Ephemeral test database (auto-provisioned)
- ✅ Type-safe, fast feedback loop
- ✅ PubSub subscriptions work IF explicitly imported
- ✅ No `encore run` required
- ✅ Perfect for CI/CD
- ❌ Separate from `encore run` runtime

**When to use:**
- Unit tests for endpoints, repositories, domain logic
- Integration tests with imported subscriptions
- Fast feedback during development
- CI/CD pipelines

**Example:**
```bash
cd backend && encore test
cd backend && encore test agent/tests/metrics.test.ts
```

**Critical Rule for PubSub:**
```typescript
// Import subscription at top of test file to enable worker
import "../orchestrator/subscription";
```

### `encore run` — Full Stack Development

**Purpose**: Full backend for manual testing and debugging

**Characteristics:**
- ✅ All services with hot reload
- ✅ PubSub subscriptions active automatically
- ✅ Encore dashboard at `http://localhost:9400`
- ✅ Connected to external services
- ❌ NOT for automated tests

**When to use:**
- Manual API testing
- Debugging with Encore MCP tools (requires running instance)
- Integration with external services

**Example:**
```bash
cd backend && encore run
```

### Key Differences

| Feature | `encore test` | `encore run` |
|---------|--------------|-------------|
| **Database** | Ephemeral test DB | Persistent local DB |
| **PubSub** | Manual import required | Auto-loaded |
| **Purpose** | Automated tests | Manual development |
| **Isolation** | Full isolation | Shared state |
| **MCP Access** | Not available | Available |

## Testing Patterns

### Pattern 1: Unit Test (Endpoint)

**Purpose**: Test single endpoint without external dependencies

```typescript
import { describe, it, expect } from "vitest";
import { health } from "../run/health";

describe("health endpoint", () => {
  it("returns healthy status", async () => {
    const result = await health();
    expect(result.status).toBe("healthy");
    expect(result.timestamp).toBeDefined();
  });
});
```

**Run:**
```bash
cd backend && encore test run/health.test.ts
```

**Characteristics:**
- ✅ Fast (no external dependencies)
- ✅ Deterministic
- ✅ No database or PubSub required

### Pattern 2: Integration Test (Database)

**Purpose**: Test endpoint with database interaction

```typescript
import { describe, it, expect } from "vitest";
import { start } from "../run/start";
import db from "../db";

describe("start endpoint", () => {
  it("persists run to database", async () => {
    const result = await start({
      apkPath: "/path/to/test.apk",
      appiumServerUrl: "http://127.0.0.1:4723/",
      packageName: "com.example.test",
      appActivity: ".*",
    });
    
    expect(result.runId).toBeDefined();
    
    // Validate database persistence
    const row = await db.queryRow<{ run_id: string; status: string }>`
      SELECT run_id, status 
      FROM runs 
      WHERE run_id = ${result.runId}
    `;
    
    expect(row).toBeDefined();
    expect(row!.status).toBe("queued");
  });
});
```

**Run:**
```bash
cd backend && encore test run/start.test.ts
```

**Characteristics:**
- ✅ Tests database persistence
- ✅ Validates data integrity
- ✅ Ephemeral test database

### Pattern 3: Integration Test (PubSub)

**Purpose**: Test PubSub flow with worker subscription

```typescript
import { describe, it, expect } from "vitest";
import { start } from "../../run/start";
import db from "../../db";

// ⭐ CRITICAL: Import subscription to enable worker
import "../orchestrator/subscription";

describe("Run Flow with PubSub", () => {
  it("processes job via worker subscription", async () => {
    // Publish job
    const { runId } = await start({
      apkPath: "/path/to/test.apk",
      appiumServerUrl: "http://127.0.0.1:4723/",
      packageName: "com.example.test",
      appActivity: ".*",
    });
    
    // Poll for worker to process job
    let status = "queued";
    const maxWaitMs = 10000;
    const startTime = Date.now();
    
    while (status === "queued" && Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const row = await db.queryRow<{ status: string }>`
        SELECT status FROM runs WHERE run_id = ${runId}
      `;
      
      status = row!.status;
    }
    
    // Assert worker processed the job
    expect(status).not.toBe("queued");
  });
});
```

**Run:**
```bash
cd backend && encore test agent/tests/pubsub.test.ts
```

**Characteristics:**
- ✅ Tests full PubSub flow
- ✅ Validates worker processing
- ⚠️ Requires subscription import (line 6)

**Common Error:**
```
Run stayed in 'queued' status for 10s.
CAUSE: Subscription must be imported (import "../orchestrator/subscription")
```

### Pattern 4: Metrics Test (Deterministic E2E)

**Purpose**: Validate agent metrics against expected values from `.env`

**External Prerequisites (manual setup):**
- Appium server running (Appium Inspector)
- Android emulator/device connected (Android Studio)
- App installed from `.env`

```typescript
import { describe, it, expect } from "vitest";
import { start } from "../../run/start";
import db from "../../db";
import { EXPECTED_UNIQUE_SCREENS_DISCOVERED } from "../../config/env";
import "../orchestrator/subscription"; // ⭐ CRITICAL

describe("Metrics Test", () => {
  it(
    "discovers expected number of screens",
    async () => {
      // Step 1: Read config from .env
      const apkPath = process.env.VITE_APK_PATH;
      const appiumServerUrl = process.env.VITE_APPIUM_SERVER_URL || "http://127.0.0.1:4723/";
      const packageName = process.env.VITE_PACKAGE_NAME;
      const appActivity = process.env.VITE_APP_ACTIVITY || ".*";

      expect(apkPath).toBeDefined();
      expect(packageName).toBeDefined();

      // Step 2: Start run
      const { runId } = await start({
        apkPath: apkPath!,
        appiumServerUrl,
        packageName: packageName!,
        appActivity,
      });

      // Step 3: Poll for completion
      let status = "queued";
      const maxWaitMs = 5 * 60 * 1000; // 5 minutes
      const pollIntervalMs = 2000;
      const startTime = Date.now();

      while ((status === "queued" || status === "running") && Date.now() - startTime < maxWaitMs) {
        await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        
        const row = await db.queryRow<{ status: string }>`
          SELECT status FROM runs WHERE run_id = ${runId}
        `;
        
        status = row!.status;
      }

      expect(status).toBe("completed");

      // Step 4: Extract metrics from event
      const finishedEvent = await db.queryRow<{ payload: Record<string, unknown> }>`
        SELECT payload
        FROM run_events
        WHERE run_id = ${runId}
          AND kind = 'agent.run.finished'
        ORDER BY sequence DESC
        LIMIT 1
      `;

      const metrics = finishedEvent!.payload.metrics as Record<string, unknown>;
      const reportedScreenCount = metrics.uniqueScreensDiscoveredCount as number;

      // Step 5: Query actual screens from database
      const actualCount = await db.queryRow<{ count: string }>`
        SELECT COUNT(DISTINCT screen_id)::text as count
        FROM graph_persistence_outcomes
        WHERE run_id = ${runId}
          AND upsert_kind = 'discovered'
      `;

      const screenCount = Number.parseInt(actualCount!.count, 10);

      // Step 6: Assert consistency and expectation
      expect(reportedScreenCount).toBe(screenCount);
      expect(screenCount).toBe(EXPECTED_UNIQUE_SCREENS_DISCOVERED);
    },
    { timeout: 5 * 60 * 1000 }
  );
});
```

**Run:**
```bash
cd .cursor && task backend:integration:metrics
```

## Database Testing

### Type-Safe Queries

Always use type annotations:

```typescript
// ❌ BAD: No type safety
const row = await db.queryRow`SELECT * FROM runs WHERE run_id = ${runId}`;

// ✅ GOOD: Type-safe
const row = await db.queryRow<{ 
  run_id: string; 
  status: string; 
  stop_reason: string | null; 
}>`
  SELECT run_id, status, stop_reason 
  FROM runs 
  WHERE run_id = ${runId}
`;
```

### Common Database Queries

**Get run status:**
```typescript
const run = await db.queryRow<{ status: string; stop_reason: string | null }>`
  SELECT status, stop_reason 
  FROM runs 
  WHERE run_id = ${runId}
`;
```

**Get run events:**
```typescript
const events = await db.query<{ kind: string; payload: Record<string, unknown> }>`
  SELECT kind, payload 
  FROM run_events 
  WHERE run_id = ${runId}
  ORDER BY sequence
`;

for await (const event of events) {
  console.log(`Event: ${event.kind}`);
}
```

**Count discovered screens:**
```typescript
const result = await db.queryRow<{ count: string }>`
  SELECT COUNT(DISTINCT screen_id)::text as count
  FROM graph_persistence_outcomes 
  WHERE run_id = ${runId}
    AND upsert_kind = 'discovered'
`;

const screenCount = Number.parseInt(result!.count, 10);
```

### Validating Data Consistency

Always validate event payloads match database state:

```typescript
// Get metric from event
const finishedEvent = await db.queryRow<{ payload: Record<string, unknown> }>`
  SELECT payload 
  FROM run_events 
  WHERE run_id = ${runId} 
    AND kind = 'agent.run.finished'
`;

const eventMetric = (finishedEvent!.payload.metrics as Record<string, unknown>)
  .uniqueScreensDiscoveredCount as number;

// Get actual count from database
const dbCount = await db.queryRow<{ count: string }>`
  SELECT COUNT(DISTINCT screen_id)::text as count
  FROM graph_persistence_outcomes 
  WHERE run_id = ${runId}
`;

const actualCount = Number.parseInt(dbCount!.count, 10);

// Assert they match
expect(eventMetric).toBe(actualCount);
```

## PubSub Testing

### Critical Rule: Import Subscriptions

**In `encore test`, PubSub subscriptions are NOT auto-loaded.**

You MUST explicitly import:

```typescript
// ⭐ CRITICAL: Import subscription to enable worker
import "../orchestrator/subscription";
```

**Why:**
- Without import: Jobs stay "queued" forever
- With import: Worker processes jobs in test runtime

## Writing Integration Tests

### Test Structure

```typescript
import { describe, it, expect } from "vitest";
import "../orchestrator/subscription"; // If testing PubSub

describe("Feature Name", () => {
  it("should validate specific behavior", async () => {
    // 1. Setup: Create test data or call endpoint
    const result = await someEndpoint({ /* params */ });
    
    // 2. Action: Trigger behavior (may involve polling)
    
    // 3. Assert: Validate outcome
    expect(result.property).toBe(expectedValue);
    
    // 4. Verify: Query database to confirm persistence
    const dbRow = await db.queryRow`SELECT * FROM table WHERE id = ${result.id}`;
    expect(dbRow).toBeDefined();
  });
});
```

### Environment Configuration

**Add to `.env`:**
```bash
VITE_APK_PATH=/path/to/test-app.apk
VITE_PACKAGE_NAME=com.example.testapp
VITE_APP_ACTIVITY=.*
EXPECTED_UNIQUE_SCREENS_DISCOVERED=1
```

**Load in test:**
```typescript
import { EXPECTED_UNIQUE_SCREENS_DISCOVERED } from "../../config/env";
const apkPath = process.env.VITE_APK_PATH;
```

### Polling Pattern

For async operations:

```typescript
const maxWaitMs = 60000; // 60 seconds
const pollIntervalMs = 2000; // 2 seconds
const startTime = Date.now();
let status = "pending";

while (status === "pending" && Date.now() - startTime < maxWaitMs) {
  await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  
  const row = await db.queryRow<{ status: string }>`
    SELECT status FROM table WHERE id = ${id}
  `;
  
  status = row!.status;
}

expect(status).toBe("completed");
```

### Console Logging

Add helpful logs:

```typescript
console.log(`[Test] Starting run for ${packageName}`);
console.log(`[Test] Run started: ${runId}`);
console.log(`[Test] Poll #${pollCount} (${elapsed}s): status=${status}`);
console.log(`[Test] ✅ SUCCESS`);
```

## Task Commands

### Run All Backend Tests
```bash
cd .cursor && task backend:test
```

### Run Metrics Integration Test
```bash
cd .cursor && task backend:integration:metrics
```

**Manual Prerequisites:**
- Start Appium via Appium Inspector
- Start Android emulator via Android Studio
- Ensure app installed

### Run Specific Test
```bash
cd backend && encore test path/to/test.ts
```

## Best Practices

### 1. Structured Assertions

**❌ BAD:**
```typescript
expect(result).toBeTruthy();
```

**✅ GOOD:**
```typescript
expect(result, "Result should have runId").toHaveProperty("runId");
expect(result.runId).toMatch(/^[a-zA-Z0-9]+$/);
```

### 2. Console Logs

```typescript
console.log(`[Test] Starting: ${testName}`);
console.log(`[Test] Config:`, { apkPath, packageName });
console.log(`[Test] ✅ SUCCESS`);
```

### 3. Query Both Event and Database

```typescript
const eventMetric = event.payload.metrics.uniqueScreensDiscoveredCount;
const dbCount = await db.queryRow`SELECT COUNT(DISTINCT screen_id) ...`;
expect(eventMetric).toBe(dbCount);
```

### 4. Environment Variables

**❌ BAD:**
```typescript
const expectedScreens = 1; // Hardcoded
```

**✅ GOOD:**
```typescript
import { EXPECTED_UNIQUE_SCREENS_DISCOVERED } from "../../config/env";
expect(actualCount).toBe(EXPECTED_UNIQUE_SCREENS_DISCOVERED);
```

### 5. Import Subscriptions

**❌ BAD:**
```typescript
describe("Test", () => {
  it("should process job", async () => {
    await start({ /* ... */ });
    // Stays "queued" forever
  });
});
```

**✅ GOOD:**
```typescript
import "../orchestrator/subscription"; // ⭐ CRITICAL

describe("Test", () => {
  it("should process job", async () => {
    await start({ /* ... */ });
    // Worker processes job ✅
  });
});
```

### 6. Type-Safe Queries

**✅ GOOD:**
```typescript
const row = await db.queryRow<{ status: string; stop_reason: string | null }>`
  SELECT status, stop_reason FROM runs WHERE run_id = ${runId}
`;
```

### 7. Helpful Error Messages

**✅ GOOD:**
```typescript
expect(
  status, 
  `Run should complete within ${maxWaitMs / 1000}s, got: ${status}`
).toBe("completed");
```

## Debugging Failed Tests

When tests fail, use the **`backend-debugging` skill** with Encore MCP tools:

1. Query database state
2. Inspect run events
3. Check agent state snapshots
4. Analyze traces

See: `.claude-skills/backend-debugging_skill/SKILL.md`

## Common Issues

### Issue: "Run stayed in 'queued' status"

**Fix:** Import subscription
```typescript
import "../orchestrator/subscription";
```

### Issue: "Run failed with stop_reason: X"

**Fix:**
1. Check external dependencies (Appium, device)
2. Query database: `SELECT stop_reason FROM runs WHERE run_id = 'xxx'`
3. Use `backend-debugging` skill

### Issue: "Test timeout exceeded"

**Fix:**
1. Increase timeout: `{ timeout: 5 * 60 * 1000 }`
2. Verify external services running
3. Check subscription imported

## References

- **Backend Debugging**: `.claude-skills/backend-debugging_skill/SKILL.md`
- **Backend Coding Rules**: `.cursor/rules/backend_coding_rules.mdc`
- **Encore MCP Workflow**: `.claude-skills/ENCORE_MCP_TESTING_WORKFLOW.md`
- **Metrics Test Example**: `backend/agent/tests/metrics.test.ts`

---

**Last Updated**: 2025-11-09
