# Today's Tasks

**Date**: 2025-10-23  
**Focus**: Steering Wheel Implementation

---

## Active Tasks (In Progress)

### 1. Create Steering Docs Folder Structure ✅
**Status**: Completed  
**Time**: 09:00 - 10:30

- [x] Create config/, rules/, facts/, procedures/, preferences/, reports/, wip/, tasks/ folders
- [x] Write README.md (system overview)
- [x] Write config files (ai.config.json, sections.index.json)
- [x] Write rules (coding-standards, architecture, naming, testing)
- [x] Write facts (milestone-index, glossary)
- [x] Write wip/current-focus.md
- [x] Write tasks/today.md (this file!)

**Next**: Build backend API endpoints for doc management

---

### 2. Build Steering Wheel Backend API
**Status**: Not Started  
**Estimated Time**: 2 hours

**Tasks**:
- [ ] Create `/backend/steering` service
- [ ] Add `encore.service.ts` configuration
- [ ] Implement `list-docs.ts` (list all docs by category)
- [ ] Implement `get-doc.ts` (fetch single doc content)
- [ ] Implement `update-doc.ts` (edit doc content)
- [ ] Test endpoints with ApiCall tool

**Files to create**:
- `backend/steering/encore.service.ts`
- `backend/steering/list-docs.ts`
- `backend/steering/get-doc.ts`
- `backend/steering/update-doc.ts`

**Note**: Database not needed for MVP — read directly from filesystem.

---

### 3. Build Steering Wheel Frontend Viewer
**Status**: Not Started  
**Estimated Time**: 2 hours

**Tasks**:
- [ ] Create `frontend/pages/SteeringWheel.tsx`
- [ ] Create `frontend/components/steering/DocNav.tsx` (sidebar)
- [ ] Create `frontend/components/steering/DocViewer.tsx` (markdown renderer)
- [ ] Add markdown parsing library (react-markdown + remark-gfm)
- [ ] Style with Tailwind CSS
- [ ] Test full flow (navigate → select doc → view content)

**Files to create**:
- `frontend/pages/SteeringWheel.tsx`
- `frontend/components/steering/DocNav.tsx`
- `frontend/components/steering/DocViewer.tsx`

---

## Blocked Tasks

None currently.

---

## Completed Today

- [x] Evaluate documentation options (Docusaurus, Starlight, Notion, Custom)
- [x] Write comprehensive analysis in `seed.md`
- [x] Create full `/steering-docs` folder structure with starter content

---

## Tomorrow's Preview

**Date**: 2025-10-24

1. Add doc editing capability (frontend editor + API)
2. Implement version tracking (Git commits on save)
3. Test AI agent integration (Leap reads config and docs)
4. Start Clerk authentication setup

---

## Notes

- **Velocity**: Aiming for Steering Wheel MVP by end of day
- **Quality**: Following all rules in `rules/coding-standards.md`
- **Testing**: Add tests for API endpoints (unit tests for file reading logic)

---

**Time Tracking**:
- Steering Docs Setup: 1.5 hours
- Backend API: 2 hours (estimated)
- Frontend Viewer: 2 hours (estimated)
- **Total**: ~5.5 hours

**Energy Level**: High ⚡  
**Confidence**: High — clear path forward
