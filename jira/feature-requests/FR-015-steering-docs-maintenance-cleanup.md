# FR-015: Steering Docs – One-Command Maintenance & Cleanup

**Status:** Planned  
**Priority:** P0  
**Milestone:** M2 – Steering Docs Onyx Integration  
**Owner:** Backend Engineer  
**Estimated Effort:** Medium

---

## 📝 Description
Provide a single maintenance command (API) that safely cleans, organizes, and indexes docs without deleting content. Supports dry-run preview and streaming progress.

---

## 🎯 Acceptance Criteria
- [ ] `POST /steering/maintenance/preview` → returns planned actions, no writes
- [ ] `POST /steering/maintenance/cleanup` → executes actions; supports `{ dryRun?: boolean, mode?: "quick"|"full" }`
- [ ] Actions (idempotent):
  - Deduplicate by `contentHash` → canonicalize, add aliases, archive duplicates
  - Normalize filenames to kebab-case `.md`
  - Categorize orphans into `uncategorized/`
  - Ensure frontmatter (title, updatedAt) and H1
  - Rebuild `.meta/docs.index.json`
  - Generate `.meta/link-report.json` for broken/aliased links
- [ ] SSE events for progress: `docs.maintenance.progress`
- [ ] Auth required for executing cleanup

---

## 🔗 Dependencies
- `backend/steering/hash.ts` (hash/normalize)
- `backend/steering/indexer.ts`, `backend/steering/repo.ts`
- `backend/steering/types.ts` (maintenance DTOs)

---

## 🧪 Testing Requirements
- [ ] Dry-run returns non-empty plan on messy fixtures
- [ ] Apply updates index, lifecycle, filenames without data loss
- [ ] Idempotency: running cleanup twice yields no changes

---

## 📋 Technical Notes
- All operations are non-destructive; archive or alias rather than delete
- Emit per-item progress for observability
- Rebuild index at the end

---

## 🛠️ Work Breakdown
1) Implement planner producing action list (dedupe, normalize, categorize, index, links)
2) Implement executor applying actions (atomic where possible)
3) Wire preview/cleanup endpoints and SSE progress

---

## 🏷️ Labels
`api`, `backend`, `steering-docs`, `maintenance`, `cleanup`, `onyx`


