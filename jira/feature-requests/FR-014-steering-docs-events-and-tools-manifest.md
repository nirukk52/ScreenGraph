# FR-014: Steering Docs – Events Stream & Tools Manifest (Onyx)

**Status:** Planned  
**Priority:** P1  
**Milestone:** M2 – Steering Docs Onyx Integration  
**Owner:** Backend Engineer  
**Estimated Effort:** Medium

---

## 📝 Description
Provide real-time events for document changes and a tools manifest endpoint so Onyx can register actions (search, read, create, update, rename, archive, restore, maintenance).

---

## 🎯 Acceptance Criteria
- [ ] `STREAM /steering/events` SSE endpoint emitting:
  - `docs.document.changed` (create/update)
  - `docs.document.renamed`
  - `docs.document.lifecycle` (archive/restore)
  - `docs.index.rebuilt`
  - `docs.maintenance.progress`
- [ ] `GET /steering/tools` returns JSON manifest describing tool names, methods, paths, and schemas for Onyx

---

## 🔗 Dependencies
- `backend/steering/types.ts` (event unions, manifest type)
- `backend/steering/indexer.ts` (index rebuild hook)

---

## 🧪 Testing Requirements
- [ ] Connect to SSE and receive events for each operation
- [ ] Manifest lists all supported tools with correct methods and paths

---

## 📋 Technical Notes
- SSE similar to `backend/graph/stream.ts` pattern
- Keep payloads small; include `DocumentKey`, timestamps, and optional metadata
- Manifest stability: names are semver-like; changes documented in `API_DOCUMENTATION.md`

---

## 🛠️ Work Breakdown
1) Implement `events.stream.ts` with typed event union
2) Implement `tools.ts` that enumerates available steering-docs tools
3) Emit events from create/update/rename/archive/restore/reindex/maintenance

---

## 🏷️ Labels
`api`, `backend`, `steering-docs`, `sse`, `onyx`, `tools`


