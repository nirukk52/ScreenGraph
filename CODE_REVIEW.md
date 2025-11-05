# Code Review

**Date**: 2025-11-05  
**Reviewer**: AI Agent  
**Branch**: main  
**Status**: 🟡 In Progress - Schema Migration + Code Alignment Work

---

## Executive Summary

This review covers a major database schema refactoring (migration 008) and follow-up compatibility migrations (009-011), along with related code changes in the agent orchestrator, graph projector, and artifacts service. The work aims to simplify the MVP schema by removing multi-tenancy and unnecessary tracking tables.

**Overall Assessment**: 
- ✅ **Migration 008**: Well-designed schema simplification with good documentation
- ⚠️ **Migrations 009-011**: Compatibility patches that indicate code/schema drift
- 🔴 **Critical Issues**: Code still references removed columns, creating runtime risks

---

## Changes Under Review

### Staged Changes (Ready to Commit)
```
modified:   backend/agent/persistence/agent-state.repo.ts
modified:   backend/agent/persistence/screen-graph.repo.ts
new file:   backend/db/migrations/008_mvp_schema_refactor.up.sql
new file:   backend/db/migrations/DATABASE_REFACTORING_SUMMARY.md
modified:   backend/graph/hasher.ts
modified:   backend/graph/projector.ts
modified:   backend/graph/repo.ts
modified:   backend/graph/types.ts
modified:   backend/run/stream.ts
```

### Unstaged Changes (Work in Progress)
```
modified:   backend/agent/orchestrator/orchestrator.ts
modified:   backend/agent/persistence/run-db.repo.ts
modified:   backend/artifacts/get.ts
modified:   backend/artifacts/store.ts
```

### Untracked Files (New Migrations)
```
backend/db/migrations/009_add_back_old_columns.up.sql
backend/db/migrations/010_fix_app_package_constraint.up.sql
backend/db/migrations/011_standardize_american_spelling.up.sql
```

---

## Migration Analysis

### Migration 008: MVP Schema Refactor ✅

**Purpose**: Simplify database for MVP by removing multi-tenancy and intermediate tracking tables.

**Strengths**:
- Excellent documentation in `DATABASE_REFACTORING_SUMMARY.md`
- Removes 11 unnecessary tables (from 21 → 10 tables)
- Introduces typed ENUMs (no more magic strings)
- Proper foreign key constraints with CASCADE
- Table/column comments for self-documentation
- Creates backup tables for safety

**Key Changes**:
- Dropped multi-tenancy: `tenant_id`, `project_id` removed
- Simplified app tracking: `app_id` → `app_package`
- Renamed for clarity: `agent_state_snapshots` → `run_state_snapshots`
- Status enforcement: Text → `run_status_enum` (queued/running/completed/failed/cancelled)
- Removed: `policy_version`, `processing_by`, `heartbeat_at`, `ocr_stems_hash`, `evidence_counter`

**Risk Assessment**: 🟢 Low
- Well-planned migration with clear rollback strategy
- Backup tables created
- Comprehensive documentation

---

### Migration 009: Add Back Old Columns ⚠️

**Purpose**: Re-adds columns removed in migration 008 for code compatibility.

**Columns Re-Added**:
```sql
tenant_id TEXT DEFAULT 'tenant-default'
project_id TEXT DEFAULT 'project-default'
app_config_id TEXT DEFAULT '{}'
policy_version INT DEFAULT 1
heartbeat_at TIMESTAMPTZ NULL
cancel_requested_at TIMESTAMPTZ NULL
processing_by TEXT NULL (renamed from worker_id)
```

**Issues**:
1. **Contradicts Migration 008**: Immediately undoes the simplification
2. **Default Values**: Uses placeholder defaults that may mask data issues
3. **No Documentation**: Missing explanation for why these are needed
4. **Schema Drift**: Indicates code wasn't fully updated to match new schema

**Risk Assessment**: 🟡 Medium
- Creates technical debt immediately after cleanup
- Default values could hide bugs
- Suggests incomplete code migration

**Recommendation**: 
- Either fully remove these columns from code OR
- Keep them in 008 if truly needed
- Don't add/remove/add in successive migrations

---

### Migration 010: Fix app_package Constraint ⚠️

**Purpose**: Makes `app_package` nullable (migration 008 made it NOT NULL).

**Changes**:
```sql
ALTER TABLE runs ALTER COLUMN app_package DROP NOT NULL;
ALTER TABLE runs ALTER COLUMN app_package SET DEFAULT 'unknown';
```

**Issues**:
1. **Contradicts Migration 008**: Column was intentionally made required
2. **Magic String**: Uses `'unknown'` default (violates NO MAGIC STRINGS rule)
3. **Code Mismatch**: Suggests code uses `app_config_id` instead of `app_package`
4. **Data Integrity**: Nullable package name weakens schema guarantees

**Risk Assessment**: 🟡 Medium
- Weakens data integrity from 008
- Magic string default
- Indicates code/schema misalignment

**Recommendation**:
- Code should be updated to provide valid `app_package` values
- If truly optional, use explicit enum or null handling
- Remove magic string default

---

### Migration 011: American Spelling ✅

**Purpose**: Change 'cancelled' → 'canceled' (American English).

**Changes**:
```sql
DROP TYPE run_status_enum CASCADE;
CREATE TYPE run_status_enum AS ENUM ('queued', 'running', 'completed', 'failed', 'canceled');
UPDATE runs SET status = 'canceled' WHERE status = 'cancelled';
```

**Assessment**: 🟢 Good
- Aligns with founder rule: "Use American English spelling exclusively"
- Proper enum recreation with type casting
- Updates existing data
- Clean migration

**Risk Assessment**: 🟢 Low
- Straightforward spelling fix
- Follows coding standards

---

## Code Changes Analysis

### backend/agent/orchestrator/orchestrator.ts ⚠️

**Issues Found**:

1. **Lines 54, 59-60**: References `run.tenantId`, `run.projectId`
```typescript
const state = createInitialState(run.tenantId, run.projectId, run.runId, budgets, now);
const startEvent = createRunStartedEvent(
  this.generateId(),
  run.runId,
  run.tenantId,
  run.projectId,
  ...
);
```
**Problem**: These fields were removed in migration 008, re-added in 009. This creates dependency on compatibility columns.

2. **Multiple event creation sites**: Lines 100-104, 112-117, 125-129, 171-179 all reference `state.tenantId`, `state.projectId`

**Risk**: 🟡 Medium - Code depends on deprecated columns

**Recommendation**:
- Remove `tenantId`/`projectId` from domain events
- Update `createInitialState` to not require these fields
- OR: Explicitly document why these are still needed and keep them in 008

---

### backend/artifacts/store.ts ⚠️

**Observation**: Currently clean, uses only `runId` for artifact storage. Good example of simplified MVP approach.

**Minor Issue**: Line 10 comment says "PRIMARY internal API" but endpoint is `expose: false`. Confirm if this should be callable by frontend or only backend.

**Risk**: 🟢 Low

---

### backend/graph/* (Staged Changes) ✅

**Files Updated**:
- `hasher.ts`: Uses `appPackage` parameter
- `projector.ts`: Updated to use `appPackage` field  
- `repo.ts`: Uses `app_package`, `run_state_snapshots`, `run_artifacts`, `source_event_seq`
- `types.ts`: `RunMetadata` uses `appPackage` instead of `tenantId/projectId/appId`

**Assessment**: 🟢 Good
- Properly aligned with migration 008
- Follows new naming conventions
- Type-safe changes

**Risk**: 🟢 Low

---

## Critical Issues 🔴

### 1. Schema-Code Misalignment

**Problem**: Migration 008 removes columns, migrations 009-010 add them back, code still uses old patterns.

**Impact**: 
- Technical debt accumulating immediately
- Unclear which columns are "real" vs compatibility shims
- Future maintainers won't know migration intent
- Runtime errors if migrations not applied in order

**Solution**:
1. Audit all code using `tenantId`, `projectId`, `app_config_id`
2. Either:
   - **Option A**: Remove from domain model entirely (recommended for MVP)
   - **Option B**: Keep in 008 if truly needed, document why
3. Don't use compatibility migrations as a workaround for incomplete code updates

---

### 2. RunRecord Interface Missing

**Problem**: `orchestrator.ts` references `run.tenantId`, `run.projectId` from `RunRecord` type, but these fields don't exist after migration 008.

**Evidence**: Line 54, 59-60 will fail at runtime if `RunRecord` doesn't include these fields.

**Solution**:
- Check `backend/agent/ports/db-ports/run-db.port.ts` for `RunRecord` definition
- Verify if it includes compatibility fields
- Update domain model to remove these fields

---

### 3. Magic Strings Still Present ⚠️

**Violations Found**:
- Migration 009: `'tenant-default'`, `'project-default'`, `'{}'`
- Migration 010: `'unknown'`
- Migration 011: Fixed one instance (cancelled → canceled) ✅

**Founder Rule Violated**: "NO MAGIC STRINGS!"

**Solution**:
- Define enum or constant for default values
- Or: Make fields truly nullable and handle nulls explicitly

---

### 4. Status Enum Drift

**Migration 008**: `'cancelled'`
**Migration 011**: `'canceled'` (American spelling) ✅

**Check Required**: Verify TypeScript types match:
- `backend/run/types.ts` should have `'canceled'` not `'cancelled'`
- `backend/agent/domain/state.ts` should align
- All status checks should use enum, not strings

---

## Testing Requirements 🧪

Before merging, verify:

### Database Tests
- [ ] Migration 008 runs cleanly on empty database
- [ ] Migrations 009-011 apply without errors
- [ ] Foreign key constraints work (try deleting run, verify cascade)
- [ ] Enum constraints enforced (try inserting invalid status)

### Code Tests  
- [ ] Run creation succeeds with new schema
- [ ] Orchestrator initializes without errors
- [ ] Events created with correct field names
- [ ] Graph projection works after schema change
- [ ] Artifacts store/retrieve successfully

### Integration Tests
- [ ] Full run lifecycle: start → running → completed
- [ ] Run cancellation: start → canceled
- [ ] State snapshots persist/restore correctly
- [ ] Outbox cursor tracks events properly

### Log Verification
Test via Encore dashboard:
1. Start run: `POST /run`
2. Check logs for:
   - Module: "agent", Actor: "orchestrator"
   - Verify no SQL errors in logs
   - Check snapshot logs include correct field names
3. Verify graph projection logs show `appPackage` not `tenantId`

---

## Recommendations

### Immediate Actions (Before Merge)

1. **Audit RunRecord Type** 🔴 Critical
   ```bash
   grep -r "RunRecord" backend/agent/ports/db-ports/
   grep -r "tenantId" backend/agent/
   grep -r "projectId" backend/agent/
   ```
   Verify if compatibility fields are truly needed.

2. **Update Orchestrator** 🔴 Critical
   - Remove `tenantId`/`projectId` from all event creation
   - Update `createInitialState` signature
   - OR: Document why these must remain

3. **Consolidate Migrations** 🟡 High Priority
   - Option A: Fold 009 changes into 008 (if truly needed)
   - Option B: Remove 009 entirely and fix code instead
   - Keep 010 separate if `app_package` nullability is intentional
   - Keep 011 as-is (good fix)

4. **Remove Magic Strings** 🟡 Medium Priority
   - Define `DEFAULT_TENANT = 'tenant-default' as const`
   - Or: Use null and handle explicitly

5. **Run Full Test Suite** 🔴 Critical
   ```bash
   cd backend
   encore test
   encore run
   # Then test via API explorer
   ```

---

### Long-Term Improvements

1. **Schema Documentation**
   - Add ER diagram to repo
   - Document column removal rationale in 008
   - Create migration guide for breaking changes

2. **Type Safety**
   - Generate TypeScript types from database schema
   - Use branded types for IDs (RunId, ArtifactId)
   - Ensure enum values match between DB and TS

3. **Migration Strategy**
   - Pre-migration code audit checklist
   - Breaking change migrations require code updates first
   - No compatibility shims in production (dev/test only)

4. **Testing**
   - Add migration integration tests
   - Schema validation tests
   - End-to-end run tests with real database

---

## Approval Status

**Overall**: ⚠️ **CONDITIONALLY APPROVED** - Do not merge until critical issues resolved.

### By Component:

| Component | Status | Risk | Notes |
|-----------|--------|------|-------|
| Migration 008 | ✅ Approved | 🟢 Low | Excellent design and docs |
| Migration 009 | ⏸️ Hold | 🟡 Medium | May not be needed; audit code first |
| Migration 010 | ⏸️ Hold | 🟡 Medium | Weakens schema; fix code instead |
| Migration 011 | ✅ Approved | 🟢 Low | Good spelling fix |
| graph/* staged | ✅ Approved | 🟢 Low | Properly aligned with 008 |
| orchestrator.ts | ⏸️ Hold | 🔴 High | Uses removed columns |
| artifacts/* | ✅ Approved | 🟢 Low | Clean implementation |

---

## Next Steps

1. ✅ Read this review
2. 🔲 Run code audit for `tenantId`/`projectId` usage
3. 🔲 Decide: Remove from domain OR keep in 008
4. 🔲 Update orchestrator.ts accordingly
5. 🔲 Test migrations on clean database
6. 🔲 Run integration tests
7. 🔲 Verify via Encore dashboard logs
8. 🔲 Update this review with resolution
9. 🔲 Merge when all ✅

---

## Questions for Founder

1. **Multi-tenancy**: Is `tenantId`/`projectId` truly not needed for MVP? Or will you need it soon?
   - If not needed: Remove from all code
   - If needed soon: Keep in 008, don't remove/re-add

2. **app_package vs app_config_id**: Which should be the source of truth?
   - Migration 008 introduces `app_package` (string)
   - Code may still use `app_config_id` (JSON?)
   - Need clarity on data model

3. **Migration Strategy**: Should we:
   - Squash 008-011 into single migration?
   - Keep separate for git history?
   - Create 008_v2 that includes fixes?

4. **Testing Coverage**: Current testing is log-based. Do you want:
   - Automated migration tests?
   - Schema validation in CI?
   - Or: Keep manual verification via Encore dashboard?

---

## Conclusion

The migration 008 is well-designed and moves in the right direction for MVP simplification. However, migrations 009-010 suggest incomplete code alignment, creating immediate technical debt. 

**Do not merge** until the orchestrator and related code are verified to work without the compatibility columns. Either commit fully to the simplified schema or keep the removed fields in the original migration.

The goal should be a clean, coherent schema that matches the code, not a schema with compatibility patches.

---

**Review Complete**: 2025-11-05  
**Status**: Awaiting founder decision and code alignment fixes

