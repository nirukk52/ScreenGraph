# ScreenGraph Backend API Documentation

**Version:** 1.0.0  
**Base URL:** `https://steering-wheel-documentation-65b2.encr.app`  
**WebSocket Base:** `wss://steering-wheel-documentation-65b2.encr.app`

---

## Overview

The ScreenGraph backend provides APIs for running autonomous agents on mobile applications. It supports real-time event streaming and document management for the steering system.

---

## Authentication

Currently no authentication required. All endpoints are public with CORS configured for:
- `http://localhost:5173` (development)
- `http://localhost:3000` (development)
- `https://screengraph.vercel.app` (production)
- `https://*.vercel.app` (Vercel preview environments)

---

## Endpoints

### 1. Start Run

**POST** `/run`

Start a new agent run on a mobile application.

**Request Body:**
```typescript
{
  apkPath: string;              // Path to APK file
  appiumServerUrl: string;     // Appium server URL
  maxSteps?: number;            // Maximum steps (default: 100)
  goal?: string;                // Optional goal description
}
```

**Response:** `200 OK`
```typescript
{
  runId: string;                // Unique run identifier
  status: "PENDING";            // Initial status
  createdAt: Date;              // Creation timestamp
  streamUrl: string;            // WebSocket stream URL
}
```

**Example:**
```bash
curl -X POST https://steering-wheel-documentation-65b2.encr.app/run \
  -H "Content-Type: application/json" \
  -d '{
    "apkPath": "/path/to/app.apk",
    "appiumServerUrl": "http://localhost:4723",
    "maxSteps": 50,
    "goal": "Navigate to settings"
  }'
```

---

### 2. Stream Run Events

**WebSocket** `/run/:id/stream?lastEventSeq=0`

Stream real-time events for a running agent.

**Path Parameters:**
- `id` (string): Run ID from start response

**Query Parameters:**
- `lastEventSeq` (number, optional): Last seen event sequence number for backfill

**Message Format:**
```typescript
{
  seq: number;                  // Event sequence number
  type: string;                 // Event type
  data: any;                    // Event data
  timestamp: string;            // ISO timestamp
}
```

**Event Types:**
- `agent.step.completed` - Agent completed a step
- `agent.state.changed` - Agent state changed
- `agent.run.finished` - Run completed successfully (terminal)
- `agent.run.failed` - Run failed (terminal)
- `agent.run.canceled` - Run canceled (terminal)

**Terminal Events:**
Connection closes automatically after receiving any terminal event (`finished`, `failed`, `canceled`).

**Example:**
```typescript
const ws = new WebSocket('wss://steering-wheel-documentation-65b2.encr.app/run/abc123/stream');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(`Event ${message.seq}: ${message.type}`, message.data);
};
```

---

### 3. Cancel Run

**POST** `/run/:id/cancel`

Cancel a running agent.

**Path Parameters:**
- `id` (string): Run ID

**Response:** `200 OK`
```typescript
{
  runId: string;
  status: "CANCELLED";
  cancelledAt: Date;
}
```

**Example:**
```bash
curl -X POST https://steering-wheel-documentation-65b2.encr.app/run/abc123/cancel
```

---

### 4. Health Check

**GET** `/health`

Check service health status.

**Response:** `200 OK`
```typescript
{
  status: "healthy" | "degraded" | "unhealthy";
  database: "connected" | "disconnected";
  timestamp: string;
}
```

**Example:**
```bash
curl https://steering-wheel-documentation-65b2.encr.app/health
```

---

### 5. List Documentation

**GET** `/steering/docs`

List all available documentation categories and files.

**Response:** `200 OK`
```typescript
{
  categories: [
    {
      name: string;
      files: [
        {
          filename: string;
          title: string;
        }
      ]
    }
  ]
}
```

---

### 6. Get Documentation

**GET** `/steering/docs/:category/:filename`

Retrieve a specific documentation file.

**Path Parameters:**
- `category` (string): Documentation category
- `filename` (string): File name

**Response:** `200 OK`
```typescript
{
  content: string;
  category: string;
  filename: string;
}
```

---

### 7. Update Documentation

**PATCH** `/steering/docs/:category/:filename`

Update a documentation file.

**Path Parameters:**
- `category` (string): Documentation category
- `filename` (string): File name

**Request Body:**
```typescript
{
  content: string;
}
```

**Response:** `200 OK`
```typescript
{
  success: boolean;
}
```

---

## Error Responses

All endpoints return standard error responses:

```typescript
{
  code: string;                 // Error code
  message: string;              // Human-readable message
  details?: any;                // Additional error details
}
```

**Common Error Codes:**
- `invalid_argument` (400) - Invalid request parameters
- `not_found` (404) - Resource not found
- `internal` (500) - Internal server error

---

## Rate Limiting

Currently no rate limiting applied. Consider adding if public access increases.

---

## WebSocket Best Practices

1. **Reconnection Logic:** Implement exponential backoff for reconnections
2. **Backfill:** Use `lastEventSeq` to avoid missing events during disconnects
3. **Terminal Events:** Close connection when receiving terminal events
4. **Heartbeat:** Monitor connection health and reconnect if idle

**Example Reconnection:**
```typescript
let ws: WebSocket;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connect() {
  ws = new WebSocket(`wss://steering-wheel-documentation-65b2.encr.app/run/${runId}/stream`);
  
  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      setTimeout(() => {
        reconnectAttempts++;
        connect();
      }, Math.pow(2, reconnectAttempts) * 1000);
    }
  };
}

connect();
```

---

## TypeScript Client

Generated TypeScript types available at:
```
encore.gen/clients/typescript/
```

Import usage:
```typescript
import { run } from './encore.gen/clients/typescript';

const response = await run.start({
  apkPath: '/path/to/app.apk',
  appiumServerUrl: 'http://localhost:4723'
});
```

---

## Frontend Integration Example

```typescript
// SvelteKit example
const API_BASE = import.meta.env.PUBLIC_API_BASE;
const WS_BASE = import.meta.env.PUBLIC_API_BASE.replace(/^http/, 'ws');

export async function startRun(request: StartRunRequest) {
  const response = await fetch(`${API_BASE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  return response.json();
}

export function streamRunEvents(runId: string, onEvent: (event: RunEvent) => void) {
  const ws = new WebSocket(`${WS_BASE}/run/${runId}/stream`);
  ws.onmessage = (e) => onEvent(JSON.parse(e.data));
  return ws;
}
```

---

---

## Logging & Observability

### Structured Logging

All components use Encore's structured logging (`encore.dev/log`) with consistent context fields for correlation.

### Log Context Fields

Every log includes standard fields for filtering and correlation:

- `actor`: Source actor (`agent.subscription`, `agent.worker`, `agent.orchestrator`, `api.run`)
- `runId`: Always included for run correlation
- `workerId`: Included in worker/subscription logs
- `nodeName`: Included when node context available
- `stepOrdinal`: Included when step context available
- `eventSeq`: Included for event logging
- `retryAttempt`, `retryDelayMs`: Optional retry tracking

### Encore Dashboard Log Search

Use these query patterns in the Encore dashboard to filter logs:

**Filter by Run:**
```
runId:01ABC123XYZ
```

**Filter by Worker:**
```
workerId:worker-localhost-1234567890
```

**Filter by Actor:**
```
actor:agent.worker
actor:agent.orchestrator
actor:api.run
```

**Filter Failures:**
```
level:ERROR
```

**Filter by Node:**
```
nodeName:EnsureDevice
nodeName:ProvisionApp
```

**Combined Filters:**
```
runId:01ABC123XYZ AND actor:agent.worker
runId:01ABC123XYZ AND level:ERROR
```

### Example Log Flow

A typical run produces logs in this sequence:

1. **API Request** (`actor:api.run`): Request received, validation, DB insert, publish
2. **Subscription** (`actor:agent.subscription`): Job received, run claimed, worker started
3. **Worker** (`actor:agent.worker`): Execution begin, loop iterations, budget checks, completion
4. **Orchestrator** (`actor:agent.orchestrator`): Initialize, record events, save snapshots, finalize
5. **Worker** (`actor:agent.worker`): Heartbeat stopped, reset complete

All logs share the same `runId` for full trace correlation.

**Last Updated:** 2025-01-16
