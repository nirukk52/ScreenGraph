# FR-013: Steering Docs – Rename, Archive, Restore (Lifecycle)

**Status:** Planned  
**Priority:** P1  
**Milestone:** M2 – Steering Docs Onyx Integration  
**Owner:** Backend Engineer  
**Estimated Effort:** Medium

---

## 📝 Description
Add lifecycle management to avoid deletions. Support renaming with atomic moves, archiving without data loss, and restoring archived docs. Lifecycle state tracked in `.meta/lifecycle.json` and surfaced via index.

---

## 🎯 Acceptance Criteria
- [ ] `POST /steering/docs/:category/:filename/rename` → `{ newFilename }` (kebab-case normalized)
- [ ] `POST /steering/docs/:category/:filename/archive` → sets lifecycle to `archived`
- [ ] `POST /steering/docs/:category/:filename/restore` → sets lifecycle to `active`
- [ ] Index reflects lifecycle; no content deletions
- [ ] Auth required for all mutating routes

---

## 🔗 Dependencies
- `backend/steering/indexer.ts` (lifecycle map read/write)
- `backend/steering/repo.ts` (atomic move; path guards)
- `backend/steering/auth.ts`

---

## 🧪 Testing Requirements
- [ ] Rename → file exists at new path; revisions preserved; index updated
- [ ] Archive/Restore → lifecycle flips; content untouched
- [ ] Invalid token → 403

---

## 📋 Technical Notes
- Lifecycle persisted at `steering-docs/.meta/lifecycle.json`
- Rebuild index after lifecycle changes
- Log with `op:"renameDoc|archiveDoc|restoreDoc"`

---

## 🛠️ Work Breakdown
1) Add lifecycle read/write helpers in indexer
2) Implement rename, archive, restore endpoints
3) Update index after each change

---

## 🏷️ Labels
`api`, `backend`, `steering-docs`, `lifecycle`, `onyx`


