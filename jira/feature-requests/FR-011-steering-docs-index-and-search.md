# FR-011: Steering Docs – Index & Search APIs

**Status:** In Progress  
**Priority:** P0  
**Milestone:** M2 – Steering Docs Onyx Integration  
**Owner:** Backend Engineer  
**Estimated Effort:** Medium

---

## 📝 Description
Expose typed APIs to index and search documentation in `steering-docs/`. Provide a fast, file-backed index with lifecycle metadata to power agent chat (Onyx) and future UIs.

---

## 🎯 Acceptance Criteria
- [ ] `GET /steering/index` returns an array of `DocumentMetadata` (category, filename, lifecycle, createdAt, updatedAt, revisionCount, contentHash)
- [ ] `POST /steering/index/rebuild` rebuilds the derived index from filesystem; requires write token
- [ ] `GET /steering/search?q=&category?` returns ranked `hits[]` with snippets; no external deps
- [ ] Index stored at `steering-docs/.meta/docs.index.json` and updated on writes
- [ ] No magic strings; use shared DTOs from `backend/steering/types.ts`
- [ ] Structured logging with `module:"steering"`, `actor:"api"`

---

## 🔗 Dependencies
- `backend/steering/types.ts`
- `backend/steering/repo.ts` (safe fs + path guards)
- `backend/steering/hash.ts` (content hashing)

---

## 🧪 Testing Requirements
- [ ] Unit: index rebuild on a small fixture tree
- [ ] Unit: search ranking (filename, headings, content)
- [ ] Integration: rebuild endpoint updates `.meta/docs.index.json`

---

## 📋 Technical Notes
- Index file: `steering-docs/.meta/docs.index.json`
- Lifecycle map: `steering-docs/.meta/lifecycle.json` (defaults to `"active"`)
- `DocumentMetadata` includes `contentHash` for dedupe/maintenance
- Search: simple tokenization with filename/heading boosts

---

## 🛠️ Work Breakdown
1) Implement indexer (`backend/steering/indexer.ts`) with rebuild, read, lifecycle map
2) Implement search (`backend/steering/search.ts`) with basic ranking and snippets
3) Add endpoints: `GET /steering/index`, `POST /steering/index/rebuild`, `GET /steering/search`

---

## 🏷️ Labels
`api`, `backend`, `steering-docs`, `index`, `search`, `onyx`


