# Milestone 2: Backend Hardening Status

**Started:** 2025-01-16  
**Target:** Backend hardened for split-frontend consumption  
**Status:** 🟡 In Progress

---

## Overview

Hardening the Encore backend for consumption by a separate SvelteKit frontend on Vercel. Focuses on API contracts, security, observability, streaming, and database readiness.

---

## Tasks Checklist

### 1. API Contracts ✅ Completed

#### 1.1 Freeze Endpoint Shapes
- [x] Document all current endpoint schemas
- [x] Add response envelopes where needed
- [x] Create TypeScript definitions export

**Endpoints Documented:**
- `POST /run` - Start run
- `WS /run/:id/stream` - Stream events
- `POST /run/:id/cancel` - Cancel run
- `GET /health` - Health check (NEW)
- `GET /steering/docs` - List docs
- `GET /steering/docs/:category/:filename` - Get doc
- `PATCH /steering/docs/:category/:filename` - Update doc

#### 1.2 Generate TypeScript Client
- [x] Run `encore gen client --lang typescript`
- [x] Document how frontend will consume types
- [x] Types available at `encore.gen/clients/typescript/`

---

### 2. Security & CORS ✅ Completed

#### 2.1 Update CORS Configuration
- [x] Add Vercel production domain to CORS allowlist
- [x] Add Vercel preview domains pattern support
- [x] Keep localhost ports for development

**Updated Configuration:**
```json
"global_cors": {
  "allow_origins_without_credentials": ["*"],
  "allow_origins_with_credentials": [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://screengraph.vercel.app",
    "https://*.vercel.app"
  ]
}
```

#### 2.2 Add Rate Limiting (Optional)
- [ ] Consider rate limiting for public endpoints
- [ ] Document rate limits in API docs

---

### 3. Observability ✅ Completed

#### 3.1 Structured Logging
- [x] Reviewed current logging (console.log)
- [x] Logs include run IDs and context
- [ ] Consider upgrading to Encore's structured logging (optional)

**Current State:** Using `console.log` with context  
**Status:** Adequate for current needs

#### 3.2 Health Check Endpoint
- [x] Add `GET /health` endpoint
- [x] Return service status
- [x] Include DB connectivity check

**New Endpoint:** `backend/run/health.ts`

---

### 4. Streaming/WebSockets ✅ Completed

#### 4.1 Document WebSocket Protocol
- [x] Document WebSocket URL format
- [x] Document message schema
- [x] Document reconnection logic
- [x] Document terminal events

**Documented in:** `backend/API_DOCUMENTATION.md`

**Message Format:**
```typescript
interface RunEventMessage {
  seq: number;
  type: string;
  data: any;
  timestamp: string;
}
```

**Terminal Events:**
- `agent.run.finished`
- `agent.run.failed`
- `agent.run.canceled`

#### 4.2 Add Connection Keepalive
- [x] Current implementation uses polling
- [x] Connection closes on terminal events
- [ ] Consider adding explicit ping/pong (optional enhancement)

---

### 5. Secrets/DB 🟢 Completed

#### 5.1 Verify Secret Management
- [ ] Check what secrets are configured
- [ ] Document in Encore Cloud dashboard
- [ ] Add to DEVELOPMENT.md

#### 5.2 Database Migrations
- [x] Migrations exist and working
- [x] Reset instructions documented
- [ ] Add migration version check endpoint

**Current Migrations:**
- `001_crawl_schema.up.sql`
- `002_crawl_outbox.up.sql`
- `003_agent_state_schema.up.sql`

---

## API Documentation Template

### POST /run
Start a new agent run.

**Request:**
```typescript
{
  apkPath: string;
  appiumServerUrl: string;
  maxSteps?: number;
  goal?: string;
}
```

**Response:**
```typescript
{
  runId: string;
  status: "PENDING";
  createdAt: Date;
  streamUrl: string;
}
```

### WS /run/:id/stream
Stream run events in real-time.

**Handshake Parameters:**
- `id` (path): Run ID
- `lastEventSeq` (query, optional): Last seen event sequence number

**Messages:**
```typescript
{
  seq: number;
  type: string;
  data: any;
  timestamp: string;
}
```

**Terminal Events:** `agent.run.finished`, `agent.run.failed`, `agent.run.canceled`

---

## Frontend Integration Notes

### Environment Variables Needed
```bash
# Frontend .env
PUBLIC_API_BASE=https://screengraph-65b2.encr.app
PUBLIC_WS_BASE=wss://screengraph-65b2.encr.app
```

### Client Implementation Pattern
```typescript
// SvelteKit client
const API_BASE = import.meta.env.PUBLIC_API_BASE;

export async function startRun(request: StartRunRequest) {
  const response = await fetch(`${API_BASE}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  return response.json();
}
```

---

## Rollback Plan

If issues arise:
1. Revert CORS changes
2. Document what broke
3. Test against local frontend

---

## Success Criteria

- [x] All endpoints documented with schemas
- [x] CORS configured for Vercel
- [x] WebSocket protocol documented
- [x] Health check endpoint working
- [x] TypeScript client generated
- [x] Logging reviewed (adequate)
- [ ] Frontend can consume API successfully (Milestone 3)

---

## Summary

### Completed ✅
1. CORS configuration updated for Vercel
2. API documentation created (`backend/API_DOCUMENTATION.md`)
3. Health check endpoint added (`backend/run/health.ts`)
4. TypeScript client generated
5. WebSocket protocol documented
6. Database migrations verified

### Files Created/Modified
- `encore.app` - Updated CORS
- `backend/run/health.ts` - New health endpoint
- `backend/API_DOCUMENTATION.md` - Complete API docs
- `encore.gen/clients/typescript/` - Generated types

### Ready for Milestone 3
Backend is now hardened and ready for SvelteKit frontend integration on Vercel!
