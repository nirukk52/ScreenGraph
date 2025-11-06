# Steering-Docs Service Implementation Retro

**Date**: 2025-11-06  
**Feature Requests**: FR-011 through FR-015  
**Rating**: 4/5

---

## What Went Well ✅

### Architecture & Design
- **Clean separation of concerns**: Modular design with types, repo, hash, indexer, revisions, auth, events as separate utilities
- **Never-delete guarantee**: Successfully implemented lifecycle + revision system that preserves all history
- **Type safety**: Zero `any` types; explicit DTOs for all endpoints
- **Encore patterns**: Followed best practices for service registration, API definition, structured logging

### Implementation Quality
- **15+ endpoints delivered**: Full CRUD + revisions + lifecycle + search + indexing + events + tools manifest
- **Path security**: Robust path traversal guards in all file operations
- **Auth layer**: Clean write-token validation with dual header support
- **Event system**: SSE streaming with in-memory pub/sub for real-time updates
- **Documentation**: Comprehensive README and CLAUDE.md with examples and troubleshooting

### Testing & Validation
- **All endpoints tested**: Verified via curl; 30 documents successfully indexed
- **Quick feedback loop**: Rapid iteration with Encore hot reload
- **Smoke tests**: Basic coverage for critical utilities (hash, indexer)

### Developer Experience
- **Onyx integration ready**: Tools manifest enables easy registration of actions
- **API Explorer**: All endpoints visible at `http://localhost:9400`
- **Clear examples**: README includes curl commands for every operation

---

## What Didn't Go Well ❌

### Debugging Challenges
- **Encore parse error**: Lost time debugging `Awaited<ReturnType<...>>` - Encore parser doesn't support advanced TypeScript utility types
- **Secret dependency**: Backend wouldn't start without `STEERING_WRITE_TOKEN` set; not immediately obvious from error messages
- **Service discovery**: Initially unclear why endpoints weren't registering (missing secret, not file structure)

### Scope Creep
- **Maintenance endpoints incomplete**: Preview/cleanup planned but not implemented due to time constraints
- **Integration tests missing**: Only smoke tests; full workflow tests (create→update→rename→archive→restore→revert) not written

### Documentation Gaps
- **Onyx configuration missing**: README mentions Onyx but doesn't provide actual Onyx config examples
- **Migration guide absent**: No guide for existing projects adopting steering-docs

---

## Key Learnings 📚

1. **Encore Type Constraints**: Use explicit types in API signatures; avoid complex utility types like `Awaited<ReturnType<...>>`
2. **Secrets First**: Set required secrets before running backend; consider default values or better error messages
3. **Debug in Foreground**: Run `encore run` in foreground (not background) to see parse errors immediately
4. **Index Rebuild Strategy**: Current approach rebuilds entire index on every write; consider incremental updates for performance
5. **Event Streaming Complexity**: In-memory pub/sub works for single-instance deployments; would need Redis/similar for multi-instance

---

## Metrics

- **Lines of Code**: ~1,500 (25 files)
- **Endpoints Created**: 15
- **Time to First Working Endpoint**: ~2 hours
- **Time to Complete Core**: ~6 hours
- **Bugs Fixed**: 2 (parse error, missing secret)
- **Tests Written**: 3 (smoke tests only)

---

## What Would We Do Differently?

1. **Set secrets earlier**: Document secret requirements in plan; set them before implementation
2. **Incremental testing**: Test first endpoint completely before building all 15
3. **Integration tests sooner**: Write workflow tests alongside endpoint implementation
4. **Encore type validation**: Validate type compatibility early (perhaps with test compile)
5. **Maintenance scope**: Either implement fully or defer explicitly; half-planned creates confusion

---

## Follow-Up Actions

- [ ] Implement maintenance/cleanup endpoints (FR-015 complete)
- [ ] Add integration tests for revision workflows
- [ ] Test with actual Onyx deployment
- [ ] Optimize index rebuild for incremental updates
- [ ] Add Onyx configuration examples to README
- [ ] Consider frontend UI for docs browsing

---

## Technical Debt

- Index rebuilds on every write (acceptable for v1, optimize later)
- No caching layer for search results
- SSE in-memory pub/sub (won't scale to multiple instances)
- Basic tokenization search (could enhance with stemming, fuzzy matching)
- No link validation or broken link detection yet

---

## Recommended for Future Reference

- **Encore Parse Errors**: Always run in foreground first when adding new services
- **Never-Delete Pattern**: Lifecycle + revisions approach works well; reusable for other services
- **Tools Manifest**: Simple JSON schema enables easy integration with any tool/agent system
- **Path Guards**: `repo.ts` pattern of `resolveWithinBase` prevents security issues

