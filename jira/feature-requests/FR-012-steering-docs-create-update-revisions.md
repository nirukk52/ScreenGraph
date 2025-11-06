# FR-012: Steering Docs – Create & Update with Revisions

**Status:** ✅ Done  
**Completed:** 2025-11-06  
**Priority:** P0  
**Milestone:** M2 – Steering Docs Onyx Integration  
**Owner:** Backend Engineer  
**Estimated Effort:** Medium

---

## 📝 Description
Add endpoints to create and update docs with guaranteed revision history. Every write appends a revision entry and persists a snapshot (`.versions/<filename>/<revisionId>.md`). Never delete; always record history.

---

## 🎯 Acceptance Criteria
- [ ] `POST /steering/docs/:category` creates a new document (normalizes filename to kebab-case `.md`)
- [ ] `PATCH /steering/docs/:category/:filename` updates content and records a revision
- [ ] Revisions stored under `steering-docs/<category>/.versions/<filename>/` with `manifest.json`
- [ ] Auth: write endpoints require `STEERING_WRITE_TOKEN` (Bearer or `X-Steering-Write-Token`)
- [ ] On each write: update `.meta/docs.index.json` (rebuild acceptable in v1)
- [ ] No `any` types; DTOs in `backend/steering/types.ts`

---

## 🔗 Dependencies
- `backend/steering/revisions.ts` (store + manifest)
- `backend/steering/indexer.ts` (rebuild)
- `backend/steering/auth.ts` (token validation)

---

## 🧪 Testing Requirements
- [ ] Create → index includes new file with `revisionCount=1`
- [ ] Update → appends revision; `revisionCount` increments
- [ ] Auth: invalid token → 403; missing token → 403

---

## 📋 Technical Notes
- `revisionId = <iso-timestamp>-<sha12>`
- `manifest.json` tracks ordered revisions with sha, size, author, message
- Logging: `module:"steering"`, `actor:"api"`, `op:"createDoc|updateDoc"`

---

## 🛠️ Work Breakdown
1) Implement `revisions.ts` (record/list/get helpers)
2) Implement `auth.ts` write-token check
3) Implement create & update endpoints; rebuild index on success

---

## 🏷️ Labels
`api`, `backend`, `steering-docs`, `revisions`, `auth`, `onyx`


