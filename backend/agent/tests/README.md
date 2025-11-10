# Agent Test Suite

## Purpose
Backend tests for agent subsystem, focusing on deterministic run metrics validation.

## Test Files

### `metrics.test.ts` ⭐ PRIMARY TEST
**Purpose**: End-to-end test that starts a real run and validates metrics match `.env` expectations.

**What it tests**:
1. Starts agent run with app from `.env` (lines 7-9: `VITE_PACKAGE_NAME`, `VITE_APK_PATH`, `VITE_APP_ACTIVITY`)
2. Waits for run to complete (polls every 2s, max 5min)
3. Extracts metrics from `agent.run.finished` event
4. Queries actual screens from `graph_persistence_outcomes`
5. Asserts `uniqueScreensDiscoveredCount` == `EXPECTED_UNIQUE_SCREENS_DISCOVERED`

**Expected baseline (.env)**:
```bash
VITE_PACKAGE_NAME=com.jetbrains.kotlinconf
EXPECTED_UNIQUE_SCREENS_DISCOVERED=1
```

**Usage**:
```bash
# Prerequisites: Appium + device/emulator running
cd backend && encore test agent/tests/metrics.test.ts
```

**Why this matters**:
- **Deterministic testing**: Agent must consistently discover same screens for same app
- **Full pipeline validation**: Tests agent → events → projection → metrics
- **Primary QA metric**: If this passes, agent is working correctly

---

### `run-events-validation.test.ts`
**Purpose**: Validates run event stream invariants (single start/stop, proper ordering).

**What it tests**:
1. Exactly one `agent.run.started` event leads the log
2. Exactly one `agent.run.finished` event terminates the log
3. No duplicate terminal events
4. Final event is always `agent.run.finished`

---

### `idempotency.test.ts`
**Purpose**: Placeholder for future idempotency tests.

---

### `golden-run.test.ts`
**Purpose**: Placeholder for future golden run tests.

---

### `determinism.test.ts`
**Purpose**: Placeholder for future determinism tests.

---

## Running Tests

```bash
# All tests
cd backend && encore test

# Specific test
cd backend && encore test agent/tests/metrics.test.ts

# Watch mode (direct Vitest)
cd backend && bun run test:watch
```

---

## Test Philosophy

**Primary metric**: `uniqueScreensDiscoveredCount` from `agent.run.finished` event
- Must match actual graph database count
- Must match expected value from `.env`
- Validates entire agent pipeline end-to-end

**Determinism is critical**: If agent can't consistently discover same screens for same app, metrics are meaningless.

---

## Configuration

### `.env` Values
```bash
# App config (lines 7-9)
VITE_APK_PATH=/path/to/app.apk
VITE_PACKAGE_NAME=com.example.app
VITE_APP_ACTIVITY=.*

# Expected metrics
EXPECTED_UNIQUE_SCREENS_DISCOVERED=1
```

### Per-App Testing
Different apps have different expected screen counts:
```bash
# Simple single-screen app
EXPECTED_UNIQUE_SCREENS_DISCOVERED=1

# Login + Home app
EXPECTED_UNIQUE_SCREENS_DISCOVERED=2

# Multi-screen shopping app
EXPECTED_UNIQUE_SCREENS_DISCOVERED=10
```

---

## Debugging Failed Tests

### "Expected 1 but got 0"
Agent discovered no screens.

**Check**:
1. Run status: `SELECT status, stop_reason FROM runs WHERE run_id = '<runId>'`
2. Events: `SELECT * FROM run_events WHERE run_id = '<runId>' AND kind = 'agent.event.screen_perceived'`
3. Projector: `SELECT * FROM graph_persistence_outcomes WHERE run_id = '<runId>'`

### "Expected 1 but got 2+"
Agent explored beyond expected screens.

**Check**:
1. Which screens: `SELECT screen_id FROM graph_persistence_outcomes WHERE run_id = '<runId>' AND upsert_kind = 'discovered'`
2. Verify if new behavior or regression
3. Update `.env` if correct

### Test Timeout
Agent stuck or device not responding.

**Check**:
1. Agent logs: `module: "agent", actor: "worker"`
2. Device: `adb devices`
3. Appium logs

---

## Related Documentation
- [Backend Debugging Skill](/.claude-skills/backend-debugging_skill/SKILL.md)
- [Backend Coding Rules](/.cursor/rules/backend_coding_rules.mdc)
- [Agent Architecture](../ARCHITECTURE_SUMMARY.md)
- [Graph Service README](../../graph/README.md)
