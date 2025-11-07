# BUG-003: Port Coordinator Assigns Offset to Main Tree - Status Report

**Last Updated:** 2025-11-07  
**Current Status:** ✅ RESOLVED (Port coordinator removed)  
**Owner:** Founder / Backend Team

---

## 🎯 Current State
**Priority:** P3 (Low - architectural inconsistency)  
**Severity:** Low  
**Assigned To:** Awaiting triage

---

## 🔍 Investigation Progress
### What We Know
- Port coordinator applies hash-based offset to ALL worktrees including main tree
- Main tree "ScreenGraph" gets ports: 4007, 5180, 9407, 4730
- Founder rules document main tree should use defaults: 4000, 5173, 9400, 4723
- Root cause identified: Lines 93-102 in `backend/scripts/port-coordinator.mjs`
- No special case for main tree name "ScreenGraph"
- Hash calculation: `hashString("ScreenGraph") % 10 = 7`
- Current behavior causes +7 offset on all main tree ports

### What We Don't Know
- [x] Root cause - **FOUND**: No main tree special case in code
- [ ] Is current behavior intentional or oversight?
- [ ] Founder's preference: base ports vs hash-based safety?
- [ ] Historical context: Why was it implemented this way?

---

## 🔨 Work Completed (Last Update)
- Identified discrepancy during cursor-chrome-window-mastery skill creation
- Traced root cause to port-coordinator.mjs lines 93-102
- Verified behavior on main tree: returns 4007/5180 instead of 4000/5173
- Updated skill documentation to reflect actual behavior (not ideal behavior)
- Created BUG-003 ticket with full analysis and proposed fixes
- Documented workaround: Always call port coordinator before testing

---

## 🚧 Work In Progress
- Awaiting founder decision on preferred approach:
  - **Option 1**: Add main tree special case (align with founder rules)
  - **Option 2**: Update founder rules to match current implementation

---

## 📋 Next Steps
1. [ ] Get founder input on intended behavior
2. [ ] If Option 1 chosen: Implement main tree special case
3. [ ] If Option 2 chosen: Update founder rules documentation
4. [ ] Clear `~/.screengraph/ports.json` and test
5. [ ] Verify no port conflicts in both main tree and worktrees
6. [ ] Update skills/commands if behavior changes

---

## 🔥 Blockers
- **Decision needed** - Awaiting founder preference on fix approach
- No technical blockers; fix is straightforward once decision made

---

## 📊 Timeline
- **Reported:** 2025-11-06 20:15
- **Root Cause Found:** 2025-11-06 20:20
- **Ticket Created:** 2025-11-06 20:30
- **Expected Decision:** TBD (awaiting founder review)
- **Expected Fix:** 1 hour after decision (if code change needed)

---

## 💬 Recent Updates

### 2025-11-07 - RESOLVED
**Resolution:** Removed `backend/scripts/port-coordinator.mjs` entirely per founder rules.

Rationale:
- Founder rules explicitly state: "Do not customize ports per worktree; treat `.env` as the source of truth"
- Port coordinator added unnecessary complexity
- All port configuration now centralized in `.env` file
- `backend/config/env.ts` reads from `.env` with sensible defaults
- Scripts (`dev-backend.sh`, `dev-frontend.sh`) respect `.env` values
- Simplified `backend/encore.app` CORS to use only base port 5173

This bug is now obsolete as the offending code has been removed.

### 2025-11-06 20:30
Created full bug report with:
- Root cause analysis (lines 93-102 in port-coordinator.mjs)
- Two proposed fix options with code examples
- Testing plan
- Impact assessment
- Workaround documentation

Current behavior is **not breaking** functionality because:
- Skills call port coordinator to detect actual ports
- Test commands respect detected ports
- No hardcoded port assumptions in new code

### 2025-11-06 20:15
Discovered issue while implementing cursor-chrome-window-mastery skill:
- Expected main tree to use 4000/5173 (per founder rules)
- Port coordinator returned 4007/5180
- Investigated and found no main tree special case

---

## 🤝 Help Needed
- **Founder decision**: Which option preferred?
  - Option 1: Main tree uses base ports (requires code change)
  - Option 2: Main tree uses hash offset (requires docs update)
- **Context**: Why was hash-based offset applied to all trees originally?

---

## 📝 Notes
**Current Workaround Working Well**:
All skills and commands now call port coordinator first, so they automatically adapt to whatever ports are assigned. This means the fix is not urgent from a functionality perspective.

**Architectural Preference**:
From a clean architecture perspective, Option 1 (main tree = base ports) is cleaner because:
- Predictable defaults for main development environment
- Aligns with industry conventions (main = standard ports)
- Easier to document and remember
- Worktrees still get isolation via hash-based offsets

**Safety Argument for Current Behavior**:
The current behavior (hash for all trees) could be safer if:
- Developer has other services running on default ports
- Prevents accidental conflicts
- Consistent algorithm for all trees (simpler code)

**Impact**: Low priority because functionality works correctly either way.

