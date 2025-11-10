---
name: backend-testing
description: Backend testing for Encore.ts - focused on integration tests that verify user-facing behavior. Covers the critical pattern of importing subscriptions/services into encore test, polling async flows, and debugging with structured logs. Use when writing or debugging backend tests.
---

# Backend Testing Skill

## Core Philosophy

**Test user-facing behavior, not implementation details.**

- ✅ Integration tests that verify complete flows
- ✅ Database state verification
- ✅ Async polling (not fixed delays)
- ❌ NO petty unit tests
- ❌ NO mocking internal functions
- ❌ NO testing framework internals

---

## The ONE Pattern You Need

### Integration Test with Encore

```typescript
// backend/run/start.integration.test.ts
import { describe, it, expect } from "vitest";
import { start } from "./start";
import db from "../db";

// ✅ CRITICAL: Import all services needed
import "../agent/orchestrator/subscription";  // Worker subscription
import "../artifacts/store";  // Artifacts storage
import "../artifacts/get";    // Artifacts retrieval  
import "../graph/encore.service.ts";  // Graph projector

describe("Integration: POST /run/start", () => {
  it("should discover at least 1 unique screen", async () => {
    // GIVEN: Test configuration
    const request = {
      apkPath: process.env.VITE_APK_PATH,
      appiumServerUrl: process.env.VITE_APPIUM_SERVER_URL || "http://127.0.0.1:4723/",
      packageName: process.env.VITE_PACKAGE_NAME,
      appActivity: ".*",
      maxSteps: 20,
    };

    // WHEN: Start run
    const response = await start(request);
    const { runId } = response;

    // THEN: Poll for completion (NOT fixed delay!)
    const maxWaitMs = 60_000;
    const pollIntervalMs = 2000;
    const startTime = Date.now();
    let runStatus = "queued";

    while (Date.now() - startTime < maxWaitMs) {
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
      
      const row = await db.queryRow<{ status: string }>`
        SELECT status FROM runs WHERE run_id = ${runId}
      `;
      
      runStatus = row?.status || "queued";
      
      if (runStatus === "completed" || runStatus === "failed") {
        break;
      }
    }

    // THEN: Should complete successfully
    expect(runStatus).toBe("completed");

    // THEN: Wait for graph projector (runs async)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // THEN: Verify screens discovered
    const screenCount = await db.queryRow<{ count: string }>`
      SELECT COUNT(*)::text as count
      FROM graph_persistence_outcomes
      WHERE run_id = ${runId} AND upsert_kind = 'discovered'
    `;
    
    const count = Number.parseInt(screenCount?.count || "0", 10);
    expect(count).toBeGreaterThanOrEqual(1);

    // Cleanup
    await db.exec`DELETE FROM graph_persistence_outcomes WHERE run_id = ${runId}`;
    await db.exec`DELETE FROM run_events WHERE run_id = ${runId}`;
    await db.exec`DELETE FROM runs WHERE run_id = ${runId}`;
  }, 90_000);
});
```

**Run it:**
```bash
cd backend && encore test ./run/start.integration.test.ts
```

---

## Critical Setup Requirements

### 1. Import Subscriptions in Tests

PubSub subscriptions DON'T auto-load in `encore test`. You MUST import them:

```typescript
// At top of test file
import "../agent/orchestrator/subscription";
```

**Why:** Encore only loads what's explicitly imported in test files.

### 2. Import Required Services

If your test calls other services (via generated clients), import them:

```typescript
import "../artifacts/store";  // For storage operations
import "../graph/encore.service.ts";  // For graph projection
```

### 3. Configure Path Aliases

**File:** `backend/vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "~encore": resolve(__dirname, "./encore.gen"),
    },
  },
  test: {
    testTimeout: 10000,
    env: process.env,
  },
});
```

**Why:** Allows `import { artifacts } from "~encore/clients"` to resolve correctly.

---

## Testing Async Flows

### ❌ DON'T: Fixed Delays

```typescript
await new Promise(r => setTimeout(r, 20000)); // Always waits 20s
const status = await getStatus(runId);
// If fails, no idea why (never started? crashed? just slow?)
```

### ✅ DO: Polling with Timeout

```typescript
const maxWaitMs = 60_000;
const pollIntervalMs = 2000;
const startTime = Date.now();

while (Date.now() - startTime < maxWaitMs) {
  const status = await getStatus(runId);
  console.log(`Status: ${status}`);  // Log progress
  
  if (status === "completed") break;
  
  await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
}

// Clear failure message if timeout
if (status !== "completed") {
  throw new Error(`Timeout: status=${status} after ${maxWaitMs}ms`);
}
```

**Benefits:**
- ⚡ Fast (finishes as soon as condition met)
- 🔍 Clear failures (exact timeout message)
- 📊 Progress visibility (console logs)
- 🎯 Reliable (adjusts to system speed)

---

## Common Issues & Solutions

### Issue 1: Worker Never Claims Run

**Symptom:** Run stays "queued" forever

**Fix:** Import subscription in test:
```typescript
import "../agent/orchestrator/subscription";
```

### Issue 2: Service Calls Hang

**Symptom:** Test times out calling artifacts/graph service

**Fix:** Import service endpoints:
```typescript
import "../artifacts/store";
import "../graph/encore.service.ts";
```

### Issue 3: Path Alias Not Found

**Symptom:** `Error: Failed to load ~encore/clients`

**Fix:** Add alias to `vitest.config.ts`:
```typescript
alias: { "~encore": resolve(__dirname, "./encore.gen") }
```

### Issue 4: Graph Projector Returns 0 Screens

**Symptom:** Agent completes but `projectedScreens: 0`

**Fix:** Wait for async projection:
```typescript
await new Promise(resolve => setTimeout(resolve, 5000));
```

### Issue 5: Database Column Not Found

**Symptom:** `ERROR: column "sequence" does not exist`

**Fix:** Use correct column names from schema:
- ✅ `seq` not `sequence`
- ✅ `upsert_kind = 'discovered'` not `'screen_discovered'`

---

## Test Structure

### Minimal Integration Test

```typescript
import "../agent/orchestrator/subscription";
import "../artifacts/store";
import "../graph/encore.service.ts";

it("tests user behavior", async () => {
  // 1. Call API
  const { runId } = await start({ ... });
  
  // 2. Poll for completion
  while (status !== "completed") { await poll(); }
  
  // 3. Wait for async processing
  await sleep(5000);
  
  // 4. Verify database state
  const result = await db.queryRow`...`;
  expect(result).toBeDefined();
  
  // 5. Cleanup
  await db.exec`DELETE FROM ...`;
}, 90_000);
```

---

## Debugging Failed Tests

### 1. Check Run Status
```sql
SELECT run_id, status, stop_reason
FROM runs
WHERE run_id = '<runId>';
```

### 2. Check Events Emitted
```sql
SELECT seq, kind, created_at
FROM run_events
WHERE run_id = '<runId>'
ORDER BY seq;
```

### 3. Check Graph Projection
```sql
SELECT outcome_id, upsert_kind, screen_id, created_at
FROM graph_persistence_outcomes
WHERE run_id = '<runId>';
```

### 4. Check Agent State
```sql
SELECT snapshot
FROM run_state_snapshots
WHERE run_id = '<runId>'
ORDER BY step_ordinal DESC
LIMIT 1;
```

---

## What NOT to Test

❌ **Avoid these:**
- Internal helper functions (like `countUniqueScreensDiscovered`)
- Database query syntax
- Type checking (TypeScript does this)
- Framework behavior (Encore handles this)
- Edge cases that don't affect users
- Mocked/stubbed flows

✅ **Instead test:**
- Complete user workflows end-to-end
- Real async flows (PubSub → Worker → Agent)
- Database state after operations
- Error handling for user-facing failures

---

## Task Commands

```bash
# Run all backend tests
cd backend && encore test

# Run specific test
cd backend && encore test ./run/start.integration.test.ts

# Via Task command
cd .cursor && task backend:test
```

---

## Key Learnings

### 1. Services Must Be Explicitly Loaded

In `encore test`, nothing auto-loads. Import what you need:

```typescript
import "../agent/orchestrator/subscription";  // ← Makes worker run
import "../artifacts/store";  // ← Makes storage work
import "../graph/encore.service.ts";  // ← Makes projector run
```

### 2. Polling > Fixed Delays

Always poll with timeout, never use fixed delays.

### 3. Graph Projection is Async

Even after run completes, projector needs time:

```typescript
expect(runStatus).toBe("completed");
await new Promise(r => setTimeout(r, 5000));  // Wait for projector
const screens = await queryDiscoveredScreens(runId);
```

### 4. Database Schema Matters

Use exact column names from migrations:
- `seq` not `sequence`
- `upsert_kind` not `outcome_kind`
- `'discovered'` not `'screen_discovered'`

---

## Testing Strategy Summary

| What to Test | How | Duration |
|--------------|-----|----------|
| **User flows** | Integration tests with `encore test` | 10-20s |
| **Async processing** | Poll with timeout | Variable |
| **Database state** | Direct queries | <1s |
| **Error handling** | Test failure paths | 5-10s |

**ONE focused test > many petty tests**

---

## Related Skills

- **backend-debugging** - For debugging test failures with Encore MCP
- **webapp-testing** - For E2E tests spanning backend + frontend
- **graphiti-mcp-usage** - For documenting test discoveries
