# FR-001: POST /run Endpoint

**Status:** 📋 Todo  
**Priority:** P0 (Critical)  
**Milestone:** M1 - Stream Backbone  
**Owner:** TBD  
**Estimated Effort:** Medium

---

## 📝 Description
Create REST API endpoint to initiate a new run. The endpoint should accept configuration parameters, validate inputs, enqueue orchestrator job, and return run ID for tracking.

---

## 🎯 Acceptance Criteria
- [ ] `POST /run` endpoint defined in Encore service
- [ ] Request schema includes: `appPackage`, `deviceConfig`, `maxSteps`, `goal` (optional)
- [ ] Endpoint validates required fields and returns 400 on invalid input
- [ ] Creates `runs` database record with status `PENDING`
- [ ] Enqueues orchestrator job with run ID
- [ ] Returns `{ runId, status, createdAt }` response
- [ ] Returns 201 status code on success
- [ ] API documented in OpenAPI schema

---

## 🔗 Dependencies
- Database schema for `runs` table (FR-006)
- Encore queue configuration for orchestrator

---

## 🧪 Testing Requirements
- [ ] Unit test: Valid request creates DB record and enqueues job
- [ ] Unit test: Invalid request returns 400 with error details
- [ ] Integration test: End-to-end run initiation
- [ ] Test: Idempotency if same run ID submitted twice

---

## 📋 Technical Notes
**Request Schema:**
```typescript
interface StartRunRequest {
  appPackage: string;
  deviceConfig?: {
    platform: "android" | "ios";
    version?: string;
  };
  maxSteps?: number; // default 100
  goal?: string; // optional natural language goal
}
```

**Response Schema:**
```typescript
interface StartRunResponse {
  runId: string;
  status: "PENDING";
  createdAt: Date;
  streamUrl: string; // GET /run/:id/stream
}
```

---

## 🏷️ Labels
`api`, `backend`, `milestone-1`, `p0`
