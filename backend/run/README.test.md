# Run Service Tests

This directory contains integration tests for the run service endpoints.

## Test Files

### start.test.ts
Tests for the `POST /run` endpoint that creates new crawler runs.

**Test Coverage:**
- Creating runs with minimal required fields
- Creating runs with all optional fields (device config, maxSteps, goal)
- Validation error handling for missing required fields
- Default value handling (maxSteps defaults to 100)
- Multiple independent run creation

### stream.test.ts
Tests for the `GET /run/:id/stream` endpoint that streams run events.

**Test Coverage:**
- Database event storage and retrieval
- Event filtering by lastEventId
- Terminal event types (RUN_COMPLETED, RUN_FAILED, RUN_CANCELLED)

**Note:** Full streaming behavior testing requires more advanced setup to properly test the SSE (Server-Sent Events) streaming functionality. The current tests focus on validating the underlying data layer that powers the stream endpoint.

## Running Tests

```bash
cd backend
bun test
```

Or using Encore CLI:
```bash
encore test
```

## Test Database

Tests use a separate test database and clean up after each test run. The `beforeEach` hook ensures database isolation between tests:

```typescript
beforeEach(async () => {
  await db.exec`DELETE FROM run_events`;
  await db.exec`DELETE FROM runs`;
});
```

## Configuration

Test timeout is configured in `backend/vitest.config.ts` to allow for database operations.
