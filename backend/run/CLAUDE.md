# Run Service Context

## Overview
The run service exposes API endpoints for run lifecycle management and coordinates with the agent orchestrator via Pub/Sub.

## Core Files
- **`encore.service.ts`**: Service declaration for Encore
- **`start.ts`**: POST /run endpoint, run creation, Pub/Sub publish
- **`cancel.ts`**: POST /run/:id/cancel endpoint
- **`stream.ts`**: GET /run/:id/stream endpoint (SSE)
- **`health.ts`**: GET /health endpoint
- **`types.ts`**: Request/response DTOs
- **`outbox-publisher.ts`**: Background publisher for run events

## API Endpoints

### POST /run (start.ts)
Creates a new run and publishes RunJob to topic.

**Request:**
```typescript
interface StartRunRequest {
  apkPath: string;
  appiumServerUrl: string;
  packageName: string;
  appActivity: string;
  maxSteps?: number;
  goal?: string;
}
```

**Response:**
```typescript
interface StartRunResponse {
  runId: string;
  status: "PENDING";
  createdAt: Date;
  streamUrl: string;
}
```

**Flow:**
1. Validate inputs (apkPath, appiumServerUrl required)
2. Generate runId with `ulid()`
3. Insert runs record (status: "queued")
4. Publish RunJob to `run-job` topic
5. Return runId and streamUrl

**Logging:**
- Module: `MODULES.RUN`
- Actor: `RUN_ACTORS.START`
- Log validation, DB insert, topic publish

### POST /run/:id/cancel (cancel.ts)
Requests cancellation of a running job.

**Response:**
```typescript
interface CancelRunResponse {
  runId: string;
  status: "CANCELLED";
  cancelledAt: Date;
}
```

**Flow:**
1. Set `cancel_requested_at` timestamp
2. Worker detects cancellation on next loop iteration
3. Worker marks run as canceled and exits

### GET /run/:id/stream (stream.ts)
Server-Sent Events stream of run events.

**Response:** SSE stream
```
event: run.started
data: {"runId":"...","ts":"..."}

event: agent.node.started
data: {"nodeName":"EnsureDevice","stepOrdinal":0}

event: agent.node.finished
data: {"nodeName":"EnsureDevice","stepOrdinal":0,"outcomeStatus":"SUCCESS"}
```

**Flow:**
1. Query run_events table
2. Stream events as SSE with `event:` and `data:` fields
3. Client reconnects on disconnect

### GET /health (health.ts)
Health check endpoint.

**Response:**
```typescript
{
  timestamp: string;
  status: "healthy";
  database: "connected";
}
```

## Pub/Sub Integration

### run-job Topic
```typescript
export const runJobTopic = new Topic<RunJob>("run-job", {
  deliveryGuarantee: "at-least-once",
});
```

**Published by:** `start.ts` after run creation
**Consumed by:** `agent/orchestrator/subscription.ts`

### RunJob Type
```typescript
interface RunJob {
  runId: string;
  apkPath: string;
  appiumServerUrl: string;
  packageName: string;
  appActivity: string;
  maxSteps?: number;
}
```

## Database Schema

### runs Table
- `run_id`: Unique identifier (ULID)
- `tenant_id`: Tenant identifier
- `project_id`: Project identifier
- `app_config_id`: JSON config (temporary, should be separate table)
- `status`: "queued" | "running" | "completed" | "failed" | "canceled"
- `created_at`, `updated_at`: Timestamps
- `processing_by`: Worker ID (for lease)
- `lease_expires_at`: Lease expiration timestamp
- `heartbeat_at`: Last heartbeat timestamp
- `started_at`, `finished_at`: Lifecycle timestamps
- `cancel_requested_at`: Cancellation request timestamp
- `stop_reason`: Why run ended

## Logging Standards

### Module/Actor
- **Module**: `MODULES.RUN`
- **Actors**: `RUN_ACTORS.START`, `RUN_ACTORS.CANCEL`, `RUN_ACTORS.STREAM`, `RUN_ACTORS.HEALTH`

### Required Fields
- `runId`: Always include in run-related logs
- `status`: Run status at log time
- `stopReason`: On completion/failure

### Example
```typescript
import { loggerWith, MODULES, RUN_ACTORS } from "../logging/logger";

const logger = loggerWith(MODULES.RUN, RUN_ACTORS.START, {});

logger.info("Starting new run", { 
  apkPath: req.apkPath,
  appiumServerUrl: req.appiumServerUrl 
});

logger.info("Created run", { runId, status: "queued" });
logger.info("Publishing run job", { runId });
```

## Error Handling
- Validation errors → `APIError.invalidArgument(message)`
- DB errors → `APIError.internal(message)`
- Not found → `APIError.notFound(message)`

## Testing & QA
Verify via Encore dashboard logs:
```
module:"run" AND actor:"start" AND runId:<ID>
module:"run" AND actor:"cancel" AND runId:<ID>
module:"run" AND actor:"stream" AND runId:<ID>
```

## Future Enhancements
- Move app_config_id to separate table
- Add pagination to /stream endpoint
- Implement run pause/resume
- Add run query/list endpoints
- Support multiple tenants/projects

