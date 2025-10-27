# Testing Philosophy & Setup

## Philosophy

### High-Level Integration Over Petty Unit Tests

We follow Encore's recommended testing philosophy:

> **Integration tests better verify functionality than unit tests**

**Why?**
- Encore eliminates boilerplate → our code is mostly business logic
- Business logic involves databases, APIs, and inter-service calls
- Integration tests verify actual behavior, not implementation details
- Encore's test environment makes integration tests nearly as fast as unit tests

### What We Test

✅ **DO Test:**
- High-level control flow and transitions
- Core business logic with real dependencies
- API endpoints with database state
- Worker orchestration flows
- Pub/Sub message handling
- Error recovery and retry behavior

❌ **DON'T Test:**
- Petty assertions like "function was called X times"
- Low-level implementation details (ID generation, sequence counters)
- Pure getter/setter methods
- Framework/library behavior (Encore, Vitest already tested)

### Test Pyramid (Inverted)

```
    ┌─────────────────────┐
    │  Integration Tests  │ ← MOST tests here
    │   (with test DB)    │
    └─────────────────────┘
           ┌─────┐
           │Unit │            ← Minimal, only for pure logic
           └─────┘
```

---

## Current State

### ✅ What We Have

1. **NodeEngine Tests** (`backend/agent/tests/node-engine.test.ts`)
   - Tests success transitions, retry behavior, backtracking
   - Pure functional tests with minimal mocks
   - Verifies engine control flow without petty assertions

2. **Basic Vitest Setup**
   - Configured in `package.json`
   - Can run with `bun test`

### ❌ What We're Missing

1. **Encore Test Integration**
   - Not leveraging `encore test` command
   - Missing Vite config for Encore runtime
   - No test database setup

2. **Integration Tests**
   - No setup phase end-to-end tests
   - No worker orchestration flow tests
   - No API endpoint tests
   - No Pub/Sub subscription tests

3. **Test Utilities**
   - No shared test fixtures
   - No test database helpers
   - No fake adapters for integration tests

---

## Setup Instructions

### 1. Install Dependencies

Already configured in `backend/package.json`:
```json
{
  "devDependencies": {
    "vitest": "^2.0.0"
  },
  "scripts": {
    "test": "bunx vitest run",
    "test:watch": "bunx vitest"
  }
}
```

### 2. Configure Vite for Encore (NEEDED)

Create `backend/vite.config.ts`:
```typescript
/// <reference types="vitest" />
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "~encore": path.resolve(__dirname, "./encore.gen"),
    },
  },
  test: {
    testTimeout: 10000,
    fileParallelism: false, // Required for Encore runtime
  },
});
```

### 3. Set Encore Runtime Environment

For tests that need Encore runtime:
```bash
# Get runtime path
encore daemon env | grep ENCORE_RUNTIME_LIB | cut -d'=' -f2

# Set in your environment or test setup
export ENCORE_RUNTIME_LIB="/path/to/encore-runtime.node"
```

### 4. Run Tests

```bash
# Option 1: Via npm script (recommended)
cd backend && bun test

# Option 2: With Encore infrastructure (for integration tests)
cd backend && encore test

# Option 3: Watch mode
cd backend && bun test:watch

# Option 4: Specific test file
bunx vitest run agent/tests/node-engine.test.ts
```

---

## Writing Tests

### Good Test Example

```typescript
import { describe, it, expect } from "vitest";
import { NodeEngine } from "../engine/node-engine";

describe("NodeEngine", () => {
  it("advances to next node on success", async () => {
    const registry = createTestRegistry();
    const engine = new NodeEngine(registry);
    const state = createTestState("NodeA");

    const result = await engine.runOnce({
      state,
      nowIso: new Date().toISOString(),
      seed: 123,
      ports: {},
      ctx: {},
      currentNode: "NodeA",
    });

    // Test behavior, not implementation
    expect(result.outcome).toBe("SUCCESS");
    expect(result.nextNode).toBe("NodeB");
    expect(result.backtracked).toBe(false);
  });
});
```

**Why this is good:**
- Tests actual behavior (transitions)
- Minimal setup, no complex mocking
- Verifies high-level control flow
- No petty assertions about internal state

### Bad Test Example

```typescript
// ❌ DON'T DO THIS
it("should call generateId exactly 3 times", () => {
  const generateId = vi.fn();
  orchestrator.run(generateId);
  expect(generateId).toHaveBeenCalledTimes(3);
});

// ❌ DON'T DO THIS
it("should increment sequence counter", () => {
  orchestrator.nextSequence();
  expect(orchestrator.sequenceCounter).toBe(1);
});
```

**Why these are bad:**
- Test implementation details, not behavior
- Brittle (breaks when refactoring)
- No value (doesn't verify functionality)
- Petty assertions about internal mechanics

---

## Test Organization

```
backend/
├── agent/
│   ├── tests/
│   │   ├── node-engine.test.ts          # ✅ Pure engine logic
│   │   ├── setup-phase-flow.test.ts     # TODO: Integration test
│   │   ├── worker-orchestration.test.ts # TODO: Integration test
│   │   ├── determinism.test.ts          # SKIPPED (requires runtime)
│   │   ├── golden-run.test.ts           # SKIPPED (requires runtime)
│   │   └── idempotency.test.ts          # SKIPPED (low-level details)
│   └── test-utils/
│       ├── fakes.ts                     # TODO: Fake adapters
│       ├── fixtures.ts                  # TODO: Test data
│       └── helpers.ts                   # TODO: Test utilities
└── vitest.config.ts
```

---

## Recommended Improvements

### Phase 1: Complete Vitest Setup
1. Create `vite.config.ts` with Encore aliases
2. Add test utilities and fixtures
3. Create fake adapters for integration tests

### Phase 2: Integration Tests
1. **Setup Phase Flow Test**
   ```typescript
   it("executes setup phase nodes in sequence", async () => {
     const worker = createTestWorker();
     const result = await worker.runSetupPhase();
     
     expect(result.state.deviceRuntimeContextId).toBeDefined();
     expect(result.events).toContainEvent("agent.node.finished");
   });
   ```

2. **Worker Orchestration Test**
   ```typescript
   it("orchestrates full worker loop with snapshots", async () => {
     const run = await createTestRun();
     const worker = new AgentWorker({ run, ... });
     
     const result = await worker.run();
     
     expect(result.status).toBe("completed");
     expect(await getSnapshots(run.runId)).toHaveLength(3);
   });
   ```

3. **API Endpoint Test**
   ```typescript
   it("POST /run creates run and enqueues job", async () => {
     const response = await api.run.start({
       apkPath: "/test.apk",
       appiumServerUrl: "http://localhost:4723",
     });
     
     expect(response.runId).toBeDefined();
     expect(await db.getRun(response.runId)).toBeDefined();
   });
   ```

### Phase 3: E2E Tests
1. Full run lifecycle (start → worker → events → completion)
2. Cancellation flow
3. Error recovery and backtracking

---

## Verification Strategy

### Primary: Encore Dashboard Logs
- Most verification happens via structured logs in Encore dashboard
- Search by `module`, `actor`, `runId` for traceability
- Verify event sequences and state transitions

### Secondary: Vitest Integration Tests
- High-level flow verification
- Database state assertions
- Event emission verification

### Tertiary: Unit Tests
- Only for pure, isolated logic (engine transitions)
- Minimal mocks, maximum behavior verification

---

## CI/CD

```yaml
# .github/workflows/test.yml (example)
- name: Run tests
  run: |
    cd backend
    bun install
    bun test
```

For Encore-specific tests requiring runtime:
```yaml
- name: Run Encore tests
  run: encore test
```

---

## FAQ

**Q: Why skip idempotency/determinism tests?**
A: They test low-level implementation details and require Encore runtime. Integration tests verify the same guarantees at a higher level.

**Q: Should we test every mapper function?**
A: No. Mappers are tested implicitly through integration tests. If a mapper is complex enough to need isolated tests, it's probably too complex.

**Q: How do we test Appium adapters?**
A: Create fake adapters for integration tests. Real Appium tests belong in E2E suite with actual devices.

**Q: What about coverage metrics?**
A: Coverage is not a goal. We optimize for: (1) behavior verification, (2) confidence in deployments, (3) fast feedback loops.

---

## References

- [Encore Testing Docs](https://encore.dev/docs/ts/develop/testing)
- [Vitest Documentation](https://vitest.dev/)
- Founder's QA Methodology: `docs/FOUNDER_QA_METHODOLOGY.md`

