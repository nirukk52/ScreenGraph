# BUG-003: Port Coordinator Assigns Offset to Main Tree - Retrospective

**Fixed Date:** [TBD - Awaiting fix]  
**Time to Fix:** [TBD]  
**Fixed By:** [TBD]

---

## 🐛 Root Cause Analysis
[To be completed after fix is applied]

The port coordinator was implemented to assign unique ports to all worktrees to prevent conflicts. However, it applied the same hash-based offset calculation to ALL trees including the main tree, when the documented architecture specified that the main tree should use base/default ports.

**Technical Root Cause**:
- File: `backend/scripts/port-coordinator.mjs` lines 93-102
- Missing conditional: No check for `if (worktree === "ScreenGraph")`
- Hash function applied universally: `const offset = offsetSeed % width;`
- Result: Main tree "ScreenGraph" gets offset +7 on all ports

---

## 🔧 Fix Applied
[To be completed after fix is applied]

**Approach Chosen**: [Option 1 | Option 2]

**Code Changes**:
- [TBD: File/module changed]
- [TBD: Specific lines modified]

**Related PRs/Commits**:
- [TBD: Link to PR or commit]

---

## ✅ Verification & Testing
[To be completed after fix is applied]

- [ ] Manual test: Clear registry and verify main tree gets base ports
- [ ] Manual test: Create worktree and verify it gets offset ports
- [ ] Manual test: Run webapp-testing Playwright flow on main tree
- [ ] Manual test: Run webapp-testing Playwright flow on worktree
- [ ] Automated test: Port coordinator returns correct ports for main tree
- [ ] Automated test: Port coordinator returns offset ports for worktrees
- [ ] Regression test: No port conflicts between multiple worktrees
- [ ] Documentation: Update founder rules if needed
- [ ] Documentation: Update skills if behavior changes

---

## 🎓 Lessons Learned
[To be completed after fix is applied]

1. **What could have prevented this bug**:
   - Automated test comparing port coordinator output to founder rules
   - Explicit test case: "Main tree should use base ports"
   - Documentation review during implementation

2. **What made it hard to debug**:
   - Discrepancy wasn't immediately obvious (offset only +7)
   - No clear error message or warning
   - Required reading both founder rules AND implementation
   - Discovered incidentally during skill creation, not direct testing

3. **What we learned about the system**:
   - Port coordinator uses persistent registry (`~/.screengraph/ports.json`)
   - Hash-based offset provides deterministic port assignment
   - Skills and commands can adapt to any port configuration
   - Main tree vs worktree distinction important for developer experience

---

## 🔄 Preventive Actions
[To be completed after fix is applied]

- [ ] Add test: Port coordinator returns base ports for "ScreenGraph"
- [ ] Add test: Port coordinator returns offset ports for worktrees
- [ ] Add validation: Warn if main tree gets non-base ports (unless override)
- [ ] Update documentation: Clarify main tree port expectations
- [ ] Code review checklist: Verify alignment with founder rules
- [ ] Consider: Pre-commit hook to validate port assignments

---

## 📊 Impact Assessment
[To be completed after fix is applied]

- **User Impact**: 
  - Minimal - developers working on main tree used unexpected ports
  - Confusion when default ports didn't work as expected
  - No functionality broken (skills adapted automatically)
  
- **System Impact**: 
  - Architectural inconsistency (docs vs implementation)
  - Skills/commands always call port coordinator (workaround)
  - No performance impact
  
- **Business Impact**: 
  - None - internal development tooling only
  - Minor developer experience friction

---

## 📝 Additional Notes

**Discovered During**: Building the original cursor Chrome testing playbook (now merged into `webapp-testing`) while validating port detection logic.

**Why It Wasn't Caught Earlier**:
- Port coordinator was working correctly from a functional perspective
- Developers adapted to using whatever ports were assigned
- No automated tests comparing against documented behavior
- Discrepancy was subtle (both approaches prevent conflicts)

**Positive Outcome**:
- Skills now robust to any port configuration
- Port detection is automatic and reliable
- Documentation now accurately reflects actual behavior

**Follow-up Needed**:
- Once fixed, verify all skills still work correctly
- Test with fresh registry (delete `~/.screengraph/ports.json`)
- Confirm no hardcoded port assumptions remain in codebase

