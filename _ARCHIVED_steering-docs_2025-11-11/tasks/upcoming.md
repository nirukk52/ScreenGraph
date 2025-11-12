# Upcoming Tasks

**Next Sprint**: Week of 2025-10-24 to 2025-10-30

---

## High Priority

### Clerk Authentication (M6)
**Deadline**: 2025-10-27  
**Estimated Time**: 8 hours

- [ ] Create Clerk account and get API keys
- [ ] Install Clerk SDK (@clerk/clerk-react, @clerk/backend)
- [ ] Configure Encore.ts authentication middleware
- [ ] Create User model and database schema
- [ ] Implement protected API endpoints (require auth)
- [ ] Build frontend login/signup UI
- [ ] Add user profile page
- [ ] Test authentication flow end-to-end
- [ ] Handle edge cases (expired tokens, logout, etc.)

---

### Steering Wheel Enhancements
**Deadline**: 2025-10-25  
**Estimated Time**: 4 hours

- [ ] Add doc editing UI (Monaco editor or simple textarea)
- [ ] Implement `update-doc.ts` API endpoint
- [ ] Git integration (auto-commit on save)
- [ ] Add version history view (Git log)
- [ ] Markdown syntax highlighting in viewer
- [ ] Mobile-responsive design

---

## Medium Priority

### Documentation Content
**Deadline**: 2025-10-28  
**Estimated Time**: 6 hours

- [ ] Write `facts/agent-system-deep-dive.md` (architecture)
- [ ] Write `facts/infra-topology.md` (cloud, DBs, services)
- [ ] Write `procedures/release-process.md` (deployment guide)
- [ ] Write `procedures/testing-pipeline.md` (how to run tests)
- [ ] Update `wip/m6-checklist.md` with detailed breakdown

---

### Code Quality Setup
**Deadline**: 2025-10-29  
**Estimated Time**: 3 hours

- [ ] Add ESLint configuration per `rules/coding-standards.md`
- [ ] Setup Prettier with auto-formatting
- [ ] Configure pre-commit hooks (husky + lint-staged)
- [ ] Add type checking to CI pipeline
- [ ] Fix any existing linting violations

---

## Low Priority (Nice to Have)

### Steering Wheel Advanced Features
**Deadline**: No deadline (backlog)  
**Estimated Time**: 8+ hours

- [ ] Full-text search across all docs
- [ ] Chat interface (query docs using AI)
- [ ] Diff viewer for version comparison
- [ ] Bookmark favorite docs
- [ ] Tag/category filtering
- [ ] Export to PDF/HTML

---

### M7 Planning (Dashboard)
**Deadline**: Start 2025-11-01  
**Estimated Time**: Research only

- [ ] Research graph visualization libraries (React Flow, D3, Cytoscape)
- [ ] Sketch wireframes for dashboard layout
- [ ] Define graph data structure (JSON schema)
- [ ] Plan screenshot storage strategy (S3/Object Storage)

---

## Blocked/Waiting

**None currently**

---

## Completed (This Week)

- [x] Evaluate documentation options
- [x] Create `/steering-docs` folder structure
- [x] Write starter documentation (rules, facts, preferences)
- [x] Build Steering Wheel backend API *(move here when done)*
- [x] Build Steering Wheel frontend viewer *(move here when done)*

---

## Notes

- **Focus**: Don't let Steering Wheel enhancements delay M6 authentication work
- **Timeline**: M6 must complete by 2025-10-27 to stay on track for M7
- **Quality**: Following all rules, no shortcuts even for "simple" tasks

---

**Next Review**: 2025-10-27 (end of week)
