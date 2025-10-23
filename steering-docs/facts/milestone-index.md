# Milestone Index

**Status**: Living Document  
**Last Updated**: 2025-10-23  
**Current Milestone**: M6 (Onboarding & Authentication)

---

## Overview

ScreenGraph development is organized into 8 milestones (M1-M8), each building toward the full SAAS product vision.

**Philosophy**: Ship working software incrementally. Each milestone delivers value and validates assumptions.

---

## Milestone Status Legend

- 🎯 **Current** — actively being worked on
- ✅ **Completed** — shipped and validated
- 📋 **Planned** — designed but not started
- ⏸️ **Paused** — blocked or deprioritized
- ❌ **Cancelled** — abandoned

---

## M1: Foundation & Infrastructure ✅

**Goal**: Set up core tech stack and development environment.

**Status**: Completed  
**Dates**: 2025-09-15 → 2025-09-22  
**Duration**: 1 week

### Deliverables
- [x] Encore.ts backend project scaffolded
- [x] React frontend with Vite + Tailwind
- [x] PostgreSQL database configured
- [x] Basic API endpoint (health check)
- [x] CI/CD pipeline (GitHub Actions)

### Validation
- Health check endpoint returns 200 OK
- Frontend loads without errors
- Database migrations run successfully

### Learnings
- Encore.ts auto-deployment is excellent for solo dev velocity
- Tailwind v4 significantly faster than v3
- Vitest integration straightforward

---

## M2: Agent System — Core Architecture 📋

**Goal**: Build agent domain model and Appium integration.

**Status**: Planned  
**Target Start**: 2025-10-25  
**Estimated Duration**: 2 weeks

### Deliverables
- [ ] Agent domain model (entity, value objects, events)
- [ ] Appium driver adapter (port + implementation)
- [ ] Basic crawl logic (screenshot → tap → screenshot)
- [ ] Event outbox pattern implementation
- [ ] Agent CRUD API endpoints

### Success Criteria
- Agent can connect to Appium server
- Agent can take screenshot of app
- Agent can tap an element
- Events published to outbox on state changes

### Dependencies
- M1 infrastructure ✅
- Appium server running locally

### Risks
- Appium setup complexity on different platforms
- Event ordering guarantees with Pub/Sub

---

## M3: Graph Building — Screen Detection 📋

**Goal**: Convert screenshots into graph nodes (unique screens).

**Status**: Planned  
**Target Start**: 2025-11-08  
**Estimated Duration**: 2 weeks

### Deliverables
- [ ] Screenshot similarity algorithm (perceptual hash)
- [ ] Screen deduplication logic
- [ ] Graph data structure (nodes + edges)
- [ ] PostgreSQL schema for graph storage
- [ ] Graph visualization API (basic JSON response)

### Success Criteria
- Agent crawl produces graph with unique screens
- Duplicate screens are merged
- Graph accurately represents app structure

### Dependencies
- M2 agent system ✅
- Image processing library (sharp or similar)

### Risks
- False positives in screen similarity
- Performance with large graphs (1000+ screens)

---

## M4: Analysis — UI Component Detection 📋

**Goal**: ML-powered UI element detection (buttons, inputs, text).

**Status**: Planned  
**Target Start**: 2025-11-22  
**Estimated Duration**: 3 weeks

### Deliverables
- [ ] Integration with Vision API (OpenAI or Google)
- [ ] UI element extraction from screenshots
- [ ] Bounding box storage in database
- [ ] Element type classification (button, input, text, image)
- [ ] Analysis report API endpoints

### Success Criteria
- Elements detected with >80% accuracy
- Analysis completes within 30 seconds for 50 screens
- Results accessible via API

### Dependencies
- M3 graph building ✅
- Vision API account + credits

### Risks
- API rate limits and cost
- Accuracy of element detection on complex UIs

---

## M5: Competitive Analysis — App Comparison 📋

**Goal**: Compare two apps side-by-side, highlight differences.

**Status**: Planned  
**Target Start**: 2025-12-13  
**Estimated Duration**: 2 weeks

### Deliverables
- [ ] Graph diffing algorithm (screen matching)
- [ ] Flow comparison (common paths, unique paths)
- [ ] UI pattern detection (e.g., "both have login flow")
- [ ] Comparison report generation
- [ ] Frontend comparison view

### Success Criteria
- Compare two graphs and identify common/unique screens
- Detect similar flows across apps
- Generate visual diff report

### Dependencies
- M4 analysis ✅
- At least 5 test apps crawled

### Risks
- Graph matching complexity (different UI, same flow)
- Scale — comparing large graphs is expensive

---

## M6: Onboarding & Authentication 🎯

**Goal**: User signup, login, and basic workspace setup.

**Status**: Current  
**Dates**: 2025-10-23 → 2025-11-01 (estimated)  
**Duration**: ~1 week

### Deliverables
- [ ] Clerk authentication integration
- [ ] User model and database schema
- [ ] Protected API endpoints (require auth)
- [ ] Onboarding flow (name, workspace setup)
- [ ] Frontend login/signup UI

### Success Criteria
- Users can sign up and log in
- APIs reject unauthenticated requests
- User data persisted and accessible

### Dependencies
- M1 infrastructure ✅
- Clerk account setup

### Current Blockers
- None

---

## M7: Dashboard & Visualization 📋

**Goal**: Beautiful frontend for viewing graphs and analysis.

**Status**: Planned  
**Target Start**: 2025-11-01  
**Estimated Duration**: 3 weeks

### Deliverables
- [ ] Graph visualization (React Flow or similar)
- [ ] Screenshot viewer with bounding boxes
- [ ] Analysis results display
- [ ] Agent management UI (start/stop crawls)
- [ ] Responsive design (desktop + mobile)

### Success Criteria
- Graph renders with pan/zoom
- Screenshots load quickly
- UI feels polished and professional

### Dependencies
- M6 authentication ✅
- M3 graph data ✅
- M4 analysis data ✅

### Risks
- Performance with large graphs (1000+ nodes)
- Complexity of interactive graph library

---

## M8: Launch Readiness — MVP 📋

**Goal**: Polish, performance, and initial launch.

**Status**: Planned  
**Target Start**: 2025-11-22  
**Estimated Duration**: 2-3 weeks

### Deliverables
- [ ] Performance optimization (caching, query tuning)
- [ ] Error handling and user-facing messages
- [ ] Analytics (PostHog or similar)
- [ ] Landing page and docs
- [ ] Beta user onboarding
- [ ] Pricing and payment (if applicable)

### Success Criteria
- 10 beta users successfully onboard
- Avg response time < 200ms
- Zero critical bugs in 1-week test period

### Dependencies
- M7 dashboard ✅
- All core features working

### Risks
- Scope creep (resist adding features)
- Beta user feedback requires major changes

---

## Post-MVP (M9+)

Future milestones TBD based on user feedback and traction:

- **M9**: Advanced analytics (retention, conversion funnels)
- **M10**: API for external integrations
- **M11**: Automated testing (generate test cases from graph)
- **M12**: White-label solution for enterprise

---

## Dependencies Graph

```
M1 (Foundation)
  ↓
M2 (Agent) → M3 (Graph) → M4 (Analysis) → M5 (Comparison)
  ↓                          ↓
M6 (Auth) ───────────────→ M7 (Dashboard) → M8 (Launch)
```

---

## Tracking

- **Detailed checklists**: See `wip/m6-checklist.md` (or current milestone)
- **Daily progress**: `tasks/today.md`
- **Strategic updates**: `reports/founder-daily.md`

---

**Remember**: Milestones are fluid. Adjust based on learnings and user feedback. Ship fast, learn faster.
