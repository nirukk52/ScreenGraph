# Current Focus

**Week of**: 2025-10-23  
**Milestone**: M6 — Onboarding & Authentication  
**Priority**: High

---

## This Week's Goal

**Implement Steering Wheel documentation system and Clerk authentication**

Get the internal documentation system (Steering Wheel) operational so AI agents can read business context, then add user authentication with Clerk for secure access to ScreenGraph.

---

## Primary Objectives

### 1. ✅ Steering Wheel Setup
**Status**: In Progress  
**Deadline**: 2025-10-23 (Today)

- [x] Evaluate documentation options (Docusaurus, Starlight, Notion, Custom)
- [x] Create `/steering-docs` folder structure
- [x] Write starter docs (rules, facts, procedures, preferences)
- [ ] Build Encore.ts API endpoints (CRUD for docs)
- [ ] Create React frontend (doc viewer)
- [ ] Test AI agent integration (Leap reads mandatory docs)

**Why**: Foundation for all future work. AI agents need context to work effectively.

---

### 2. Clerk Authentication Integration
**Status**: Not Started  
**Deadline**: 2025-10-27

- [ ] Setup Clerk account and get API keys
- [ ] Install Clerk SDK and configure Encore.ts middleware
- [ ] Create User model and database schema
- [ ] Implement protected API endpoints
- [ ] Build frontend login/signup UI
- [ ] Test authentication flow end-to-end

**Why**: M6 milestone deliverable. Required before building dashboard.

---

## Secondary Tasks

### Documentation Content
- [ ] Write `facts/agent-system-deep-dive.md` (architecture overview)
- [ ] Write `facts/infra-topology.md` (cloud, DBs, services)
- [ ] Write `procedures/release-process.md` (how to deploy)
- [ ] Write `preferences/ai-persona-guidelines.md` (how AI should behave)

**Why**: Comprehensive docs = better AI assistance.

---

### Code Quality
- [ ] Add ESLint configuration per `rules/coding-standards.md`
- [ ] Setup Prettier auto-formatting
- [ ] Configure pre-commit hooks (lint + type check)

**Why**: Prevent technical debt early.

---

## Blockers

**None currently** — all dependencies met for this week's work.

---

## Next Week Preview (2025-10-30)

1. Complete M6 authentication if not done
2. Start M7 dashboard (graph visualization research)
3. Begin M2 planning (agent system architecture)

---

## Context for AI Agents

**Before working on any task, read**:
1. `steering-docs/config/ai.config.json` — mandatory reading list
2. `steering-docs/rules/coding-standards.md` — code quality requirements
3. `steering-docs/rules/architecture-rules.md` — system design principles
4. `steering-docs/tasks/today.md` — specific tasks for today

**Current stack**:
- Backend: Encore.ts (TypeScript framework)
- Frontend: React + Vite + Tailwind CSS v4
- Database: PostgreSQL (via Encore.ts)
- Auth: Clerk (implementing this week)

**Active milestone**: M6 (see `facts/milestone-index.md`)

---

**Last Updated**: 2025-10-23  
**Updated By**: Founder  
**Next Review**: 2025-10-24
