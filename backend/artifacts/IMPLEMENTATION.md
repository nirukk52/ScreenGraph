# Artifacts Storage Service - Implementation Summary

## Overview
Implemented a complete Encore-based artifacts storage service for persisting screenshots and UI XML dumps with deterministic references and database indexing.

## Service Structure

### Location
`backend/artifacts/`

### Files Created
1. **`encore.service.ts`** - Service declaration
2. **`bucket.ts`** - Object storage bucket resource
3. **`dto.ts`** - Request/response DTOs and enums
4. **`store.ts`** - POST /artifacts endpoint
5. **`get.ts`** - GET /artifacts/:refId endpoint
6. **`store.test.ts`** - Unit tests for hashing and idempotency

### Adapter
`backend/agent/adapters/storage/encore-storage.adapter.ts` - Implements `StoragePort` via generated Encore clients

## Key Features

### Deterministic Reference Format
```
obj://artifacts/{runId}/{kind}/{sha256}.{ext}
```

**Examples:**
- `obj://artifacts/01RUN123/screenshot/abc123...def.png`
- `obj://artifacts/01RUN123/ui_xml/def456...abc.xml`

### Idempotency
- Content-addressed refs ensure same content → same `refId`
- DB index uses `ON CONFLICT (artifact_ref_id) DO NOTHING`
- Multiple stores of identical content are safe

### Metadata Indexing
Uses existing `artifacts_index` table:
```sql
CREATE TABLE artifacts_index (
  artifact_ref_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  byte_size BIGINT NULL,
  content_hash_sha256 TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Endpoints

### POST /artifacts (Internal)
**Purpose:** Store artifact with deterministic ref

**Request:**
```typescript
{
  runId: string;
  kind: "screenshot" | "ui_xml";
  contentBase64: string;
  format?: "png" | "jpg";
  widthPx?: number;
  heightPx?: number;
  captureTimestampMs?: number;
}
```

**Response:**
```typescript
{
  refId: string;
  byteSize: number;
  contentHashSha256: string;
}
```

### GET /artifacts/:refId (Internal)
**Purpose:** Retrieve indexed metadata

**Response:**
```typescript
{
  refId: string;
  runId: string;
  kind: "screenshot" | "ui_xml";
  byteSize: number | null;
  contentHashSha256: string | null;
  createdAt: string;
}
```

## Integration

### Agent Wiring
1. **`AgentPorts`** extended with `storage: StoragePort` in `backend/agent/nodes/types.ts`
2. **`buildAgentPorts()`** in `worker.ts` instantiates `EncoreStorageAdapter`
3. **`perceive.ts`** node already uses `storage.storeArtifact()` for screenshots and XML

### Usage in Perceive Node
```typescript
const [screenshotResult, uiHierarchyResult] = await Promise.all([
  storage.storeArtifact(input.runId, "screenshot", screenshotData.base64Image, {
    format: screenshotData.format,
    widthPx: screenshotData.widthPx,
    heightPx: screenshotData.heightPx,
    captureTimestampMs,
  }),
  storage.storeArtifact(input.runId, "ui_hierarchy", uiHierarchyData.xmlContent, {
    captureTimestampMs: uiHierarchyData.captureTimestampMs,
  }),
]);
```

## Logging
- **Module:** `"artifacts"`
- **Actors:** `"store"`, `"getMeta"`
- **Context:** Always include `runId`, `kind`, `refId`

## Testing
Unit tests in `store.test.ts` verify:
- Deterministic hash generation
- RefId format compliance
- Idempotency contract
- Kind-to-extension mapping
- Content validation

## Deployment Notes

### Prerequisites
1. Run `encore run` to start backend with new service
2. Artifacts service will auto-provision bucket in local/cloud
3. Existing `artifacts_index` table migration already applied

### Client Generation
After first run, the Encore client will be auto-generated:
```bash
# Clients are generated automatically by Encore
# Access via: import { artifacts } from "~encore/clients"
```

### Cloud Deployment
- Encore Cloud CI will provision object storage bucket
- No manual infrastructure setup required
- Bucket config in `bucket.ts` (currently non-public)

## Architecture Benefits

1. **Type Safety:** Full end-to-end typing via Encore generated clients
2. **Idempotency:** Content-addressed refs prevent duplicates
3. **Determinism:** SHA-256 hashing ensures stable references
4. **Separation:** Clean port/adapter pattern for testability
5. **Observability:** Structured logs for all operations

## Next Steps (Optional)
- Add content retrieval endpoint if UI needs raw artifact access
- Implement artifact lifecycle policies (retention, cleanup)
- Add compression for large screenshots
- Support additional artifact kinds (e.g., logs, traces)

## Documentation
- API endpoints documented in `backend/API_DOCUMENTATION.md`
- Reference format and idempotency guarantees specified
- Internal-only endpoints (not exposed to public)

---

**Status:** ✅ Complete
**Date:** 2025-10-28

