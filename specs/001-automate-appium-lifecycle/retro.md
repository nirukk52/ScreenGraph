# Retrospective: Auto-Managed Appium Lifecycle

**Feature**: 001-automate-appium-lifecycle  
**Completed**: 2025-11-13  
**Status**: ✅ Shipped

---

## ✅ What Went Well

1. **TDD caught database constraint violations early**  
   - Running `encore test` exposed event name mismatch between code (`agent.appium.starting`) and migration (`agent.appium.start_initiated`)
   - Fixed before manual testing, preventing runtime failures

2. **Diagnostic logs pinpointed silent failures fast**  
   - Strategic `console.log` statements in `recordNodeEvents` revealed CHECK constraint violations
   - Without logs, the hang would have been much harder to debug (events silently failed to persist)

3. **Frontend-first debugging revealed real user experience issues**  
   - Using browser/Playwright MCP to verify "Detect My First Drift" flow caught screenshot duplication bug
   - Testing through UI (not just backend logs) showed duplicate `#16` screenshots that pure backend testing missed

---

## ❌ What Didn't Go Well

1. **Event naming inconsistency wasn't caught until late**  
   - Code emitted `agent.appium.starting/ready` but migrations whitelisted `agent.appium.start_initiated/start_completed`
   - Should have validated event names against migration during initial task planning phase
   - **Fix**: Add event name validation script in `automation/scripts/` to compare `EventKind` types against migration constraints

2. **deviceId filtering bug slipped through initial implementation**  
   - Always returned `lines[0]` even when caller specified deviceId, risking wrong device in multi-device labs
   - Wasn't discovered until post-implementation code review
   - **Fix**: Add explicit test cases for multi-device scenarios in Phase 1 (foundational tests) instead of Phase 5 (polish)

3. **Duplicate migration files caused confusion**  
   - Created `009_add_lifecycle_events.up.sql` but `009_appinfo_table.up.sql` already existed
   - Required cleanup and renumbering to `010_add_lifecycle_events.up.sql`
   - **Fix**: Check existing migration numbers before creating new migration files (add to task template)

---

## 🎯 Action Items for Next Spec

- [ ] Add "validate event names against DB constraints" task to Phase 1 (setup)
- [ ] Add "test multi-device scenarios" to foundational test phase (not polish)
- [ ] Add "check migration sequence numbers" to data model phase
- [ ] Consider linter rule to enforce event name consistency between types and migrations

