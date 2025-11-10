---
name: backend-testing
description: Minimal, integration-first testing pattern for Encore.ts backend services. Focuses on importing subscriptions/services into encore test, polling async flows, verifying database state, and cleaning up test data.
---

# Backend Testing Skill

## Core Principles

**Test user-facing behavior, not implementation detail.**

- ✅ Integration tests that cover the full flow
- ✅ Database state verification
- ✅ Polling with timeouts (no fixed sleeps)
- ❌ No petty unit tests
- ❌ No mocking internal functions
- ❌ No framework internals

---

## The Pattern

```typescript
// backend/run/start.integration.test.ts
import { describe, it, expect } from "vitest";
import { start } from "./start";
import db from "../db";

// ✅ Import everything the flow needs
import "../agent/orchestrator/subscription";  // Worker
import "../artifacts/store";                  // Storage
import "../artifacts/get";                    // Optional fetch helpers
import "../graph/encore.service.ts";          // Graph projector

describe("Integration: POST /run/start", () => {
  it("discovers at least one screen", async () => {
    const request = {
      apkPath: process.env.VITE_APK_PATH,
      appiumServerUrl: process.env.VITE_APPIUM_SERVER_URL ?? "http://127.0.0.1:4723/",
      packageName: process.env.VITE_PACKAGE_NAME,
      appActivity: ".*",
      maxSteps: 20,
    };

    const response = await start(request);
    const { runId } = response;

    // Poll until worker finishes (no fixed delay)
    const maxWaitMs = 60_000;
    const pollMs = 2_000;
    const startedAt = Date.now();
    let status = "queued";

    while (Date.now() - startedAt < maxWaitMs) {
      await new Promise((resolve) => setTimeout(resolve, pollMs));

      const row = await db.queryRow<{ status: string }>`
        SELECT status FROM runs WHERE run_id = ${runId}
      `;
      status = row?.status ?? "queued";

      if (status === "completed" || status === "failed") {
        break;
      }
    }

    expect(status).toBe("completed");

    // Graph projector runs async → wait a moment
    await new Promise((resolve) => setTimeout(resolve, 5_000));

    const screenCount = await db.queryRow<{ count: string }>`
      SELECT COUNT(*)::text AS count
      FROM graph_persistence_outcomes
      WHERE run_id = ${runId} AND upsert_kind = 'discovered'
    `;

    const discovered = Number.parseInt(screenCount?.count ?? "0", 10);
    expect(discovered).toBeGreaterThanOrEqual(1);

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

## Critical Setup

### 1. Import Subscriptions
`encore test` does **not** auto-register PubSub workers. Import them explicitly:
```typescript
import "../agent/orchestrator/subscription";
```

### 2. Import Services
Any service you call (directly or via generated client) must be imported:
```typescript
import "../artifacts/store";
import "../graph/encore.service.ts";
```

### 3. Configure Path Alias
Add alias once in `backend/vitest.config.ts`:
```typescript
resolve: {
  alias: {
    "~encore": resolve(__dirname, "./encore.gen"),
  },
},
```

---

## Polling > Fixed Sleep

```typescript
// ❌ wrong
await new Promise((r) => setTimeout(r, 20000));

// ✅ correct
for (let i = 0; i < 30; i++) {
  const status = await getStatus(runId);
  if (status === "completed") break;
  await new Promise((r) => setTimeout(r, 2000));
}
```

Benefits: faster, clearer failures, resilient.

---

## Database Checks

```sql
-- Run status
SELECT run_id, status, stop_reason FROM runs WHERE run_id = '<runId>';

-- Events emitted
SELECT seq, kind FROM run_events WHERE run_id = '<runId>' ORDER BY seq;

-- Screens discovered
SELECT upsert_kind, screen_id FROM graph_persistence_outcomes WHERE run_id = '<runId>';

-- Agent state snapshot
SELECT snapshot FROM run_state_snapshots WHERE run_id = '<runId>' ORDER BY step_ordinal DESC LIMIT 1;
```

---

## Cleanup Checklist

- `DELETE FROM graph_persistence_outcomes WHERE run_id = ?`
- `DELETE FROM run_events WHERE run_id = ?`
- `DELETE FROM runs WHERE run_id = ?`

Keep the test database clean.

---

## Common Issues

| Symptom | Fix |
|---------|-----|
| Run stuck in `queued` | Import subscription file |
| Service calls hang | Import service modules |
| `~encore/clients` not found | Add alias in `vitest.config.ts` |
| No screens discovered | Wait for projector (~5s) |
| Column `"sequence"` missing | Use `seq` and `upsert_kind = 'discovered'` |

---

## Multiservice Flows

Need multiple subscribers/services? Import them all at the top of the test:
```typescript
import "../agent/orchestrator/subscription";
import "../notifications/email-subscription";
import "../analytics/event-subscription";
import "../webhooks/delivery-subscription";

import "../notifications/encore.service.ts";
import "../analytics/encore.service.ts";
import "../webhooks/encore.service.ts";
```

The same polling + verification pattern scales to any number of services.

---

## Task Commands

```bash
# All backend tests
cd backend && encore test

# Focused integration test
cd backend && encore test ./run/start.integration.test.ts

# From automation layer
cd .cursor && task backend:test
```

---

## Related Skills

- **backend-debugging** – Deep dive debugging for Encore.ts backend failures
- **webapp-testing** – Playwright-first E2E test playbook
- **graphiti-mcp-usage** – Document discoveries in Graphiti

