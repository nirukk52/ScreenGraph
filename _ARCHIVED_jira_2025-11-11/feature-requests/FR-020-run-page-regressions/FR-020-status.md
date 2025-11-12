# FR-020: Run Page Regression Harness — Status Report

**Last Updated:** 2025-11-08  
**Current Status:** ✅ COMPLETE  
**Owner:** Automation / QA Enablement

---

## 🎯 Current State
**Priority:** P0  
**Scope:** Ship unified Playwright test suite for `/run` page with CI integration  
**Confidence:** ✅ Complete (all tests passing, pre-push integration verified)  
**Strategy:** Single test suite, environment-aware config, .env-based package configuration

---

## 🔍 Investigation / Discovery
- [x] Gathered existing skills (`cursor-browser-mastery`, `cursor-chrome-window-mastery`, `webapp-testing`)  
- [x] Reviewed `playwright-skill-main` helpers for reusable patterns  
- [x] Evaluated unified vs separate test approach → **unified approach selected**
- [x] Analyzed Turborepo/Husky integration points
- [x] Confirmed .env as single source of truth for package configuration

---

## 🔨 Work Completed
- [x] Added Playwright-first guidance to `webapp-testing_skill/SKILL.md`
- [x] Strategic decision: unified test approach (single suite, environment-aware)
- [x] Updated FR-020 main doc with implementation details
- [x] Installed Playwright in frontend package (@playwright/test@^1.48.0)
- [x] Created playwright.config.ts with CI detection and .env loading
- [x] Wrote run-page.spec.ts (first test: Run Timeline visible) - 2 tests passing
- [x] Added test scripts to package.json files (frontend + root via Turborepo)
- [x] Updated turbo.json with E2E task definitions
- [x] Integrated with Husky pre-push hook
- [x] Verified .env integration - package name (com.jetbrains.kotlinconf) is the main key

**Test Results:**
```
✓ should open run page and show Run Timeline text (646ms)
✓ should load landing page successfully (1.3s)
2 passed (2.6s)
```

---

## 🚧 Work in Progress
- None - feature complete

---

## 📋 Next Steps
1. [ ] Monitor pre-push hook usage in practice
2. [ ] Optional: Expand tests for graph events and screenshot gallery when Appium workflow is stable
3. [ ] Optional: Add visual regression baseline captures if needed
4. [ ] Close ticket after confirming tests run successfully in first engineer workflow

---

## 🔥 Blockers
- None

---

## 🗓 Timeline
- **2025-11-08** — Ticket created, unified approach validated
- **2025-11-08** — Implementation started (Playwright setup + test creation)
- **2025-11-08** — ✅ **Feature complete** - All tests passing, pre-push integration done
- **TBD** — Closeout after monitoring in practice

---

## 📝 Notes
- All tests use `.env` file as single source of truth for package configuration
- Package name `com.jetbrains.kotlinconf` is the main key for consistency
- Tests are environment-aware: `HEADLESS=false` for visual debugging, `HEADLESS=true` for CI
- Pre-push hook now runs both smoke tests AND E2E tests automatically

