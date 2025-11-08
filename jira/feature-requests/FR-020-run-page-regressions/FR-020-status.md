# FR-020: Run Page Regression Harness — Status Report

**Last Updated:** 2025-11-08  
**Current Status:** 🚧 IN PROGRESS  
**Owner:** Automation / QA Enablement

---

## 🎯 Current State
**Priority:** P0  
**Scope:** Merge knowledge skills + ship Playwright harness  
**Confidence:** Medium (playbook drafted, automation wiring underway)

---

## 🔍 Investigation / Discovery
- [x] Gathered existing skills (`cursor-browser-mastery`, `cursor-chrome-window-mastery`, `webapp-testing`)  
- [x] Reviewed `playwright-skill-main` helpers for reusable patterns  
- [ ] Sync with engineers currently patching `/run` to collect failure evidence  
- [ ] Validate that Playwright MCP has Chromium installed in the shared environment

---

## 🔨 Work Completed
- Added Playwright-first guidance to `webapp-testing_skill/SKILL.md` (setup, script, troubleshooting)
- Created reusable helpers in `webapp-testing_skill/lib/playwright-helpers.ts`
- Updated `skills.json`, `CLAUDE.md`, and bug docs to reference the unified skill
- Removed redundant skill directories (`cursor-browser-mastery_skill`, `cursor-chrome-window-mastery_skill`)

---

## 🚧 Work in Progress
- Finalize status/retro templates after first execution
- Collect real regression artifacts (timeline events, screenshots) to attach to ticket
- Document MCP invocation pattern once validated by QA

---

## 📋 Next Steps
1. [ ] Run Playwright script against the current `/run` build and capture `/tmp/run-page-full.png`
2. [ ] Hand off script + evidence to the engineer fixing `/run`
3. [ ] Capture MCP command examples (execution, log retrieval) in the skill
4. [ ] Update status/retro once regressions are confirmed or cleared

---

## 🔥 Blockers
- Awaiting access to the WIP `/run` branch for validation
- Need explicit permission before committing UI changes (per founder directive)

---

## 🗓 Timeline
- **2025-11-08** — Ticket created, initial documentation merged  
- **TBD** — First Playwright execution against failing build  
- **TBD** — Final verification + closeout

---

## 📝 Notes
- Keep manual evidence (screenshots, console logs) under `/tmp` or attach to Graphiti episodes
- Coordinate with whoever is addressing graph event visibility before altering frontend code

