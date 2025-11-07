# Template Updates Summary

**Date:** 2025-11-07  
**Change:** Added "Manual Testing Required (Top 5)" section to all status.md templates

---

## What Changed

All status.md templates now include a prominent section at the top listing manual testing requirements:

```markdown
## Manual Testing Required (Top 5)
1. [Test scenario 1 - small or large]
2. [Test scenario 2]
3. [Test scenario 3]
4. [Test scenario 4]
5. [Test scenario 5]
```

---

## Why This Matters

### Before
- Manual testing was implied or scattered in notes
- No clear list of what needs verification
- Easy to forget critical test scenarios

### After
- ✅ **Prominent placement**: Top of status.md (can't miss it)
- ✅ **Top 5 focus**: Forces prioritization of most important tests
- ✅ **Flexible scope**: Can be anything from "Click button works" to "Full user flow A→B→C"
- ✅ **Actionable**: Clear checklist for manual QA
- ✅ **Version controlled**: Testing requirements tracked with code

---

## Templates Updated

- ✅ `jira/bugs/TEMPLATE-status.md`
- ✅ `jira/feature-requests/TEMPLATE-status.md`
- ✅ `jira/tech-debt/TEMPLATE-status.md`
- ✅ `jira/chores/TEMPLATE-status.md`

---

## Example Usage

### Feature Request (FR-015: Display App Info)
```markdown
## Manual Testing Required (Top 5)
1. Open run page, verify app icon displays correctly
2. Check app name appears in header
3. Verify "Open in Play Store" link works
4. Test with app that has no icon (fallback behavior)
5. Verify app version displays if available
```

### Bug (BUG-003: Port Conflict)
```markdown
## Manual Testing Required (Top 5)
1. Start backend on port 4000, verify no conflict
2. Start frontend on port 5173, verify no conflict  
3. Check dashboard accessible on port 9400
4. Verify Appium starts on port 4723
5. Test services restart after port conflict resolution
```

### Tech Debt (TD-005: Refactor Logger)
```markdown
## Manual Testing Required (Top 5)
1. Verify structured logs appear in Encore dashboard
2. Check log levels (info, warn, error) work correctly
3. Verify context fields (runId, module) are included
4. Test log filtering in dashboard by module
5. Verify no console.log remains in codebase
```

### Chore (CHORE-001: Update Dependencies)
```markdown
## Manual Testing Required (Top 5)
1. Run smoke tests after dependency update
2. Verify frontend builds without errors
3. Check backend encore run starts successfully
4. Test hot-reload still works in development
5. Verify production build succeeds
```

---

## Benefits

1. **Prevents regressions** - Clear list of what to verify
2. **Speeds up QA** - No need to figure out what to test
3. **Documents intent** - Shows what the developer thought was important
4. **Improves handoffs** - Next person knows exactly what needs checking
5. **Visible to all** - Testing requirements aren't hidden in comments

---

## Guidelines

### What to Include
- Critical user flows
- Edge cases and error scenarios
- Integration points (API, database, external services)
- Visual/UI verification
- Performance-sensitive operations

### What NOT to Include
- Unit test scenarios (those go in automated tests)
- Every possible test case (top 5 only!)
- Implementation details
- Non-user-facing internal checks

### Writing Good Test Scenarios
- ✅ **Good**: "Create run, cancel mid-flight, verify status updates"
- ❌ **Bad**: "Test the cancelRun function"

- ✅ **Good**: "Upload 10MB screenshot, verify storage succeeds"
- ❌ **Bad**: "Check artifact upload works"

- ✅ **Good**: "Login with expired token, verify redirect to auth"
- ❌ **Bad**: "Test authentication"

---

**Last Updated:** 2025-11-07  
**Related:** `.cursor/DETERMINISTIC_CURSOR_PLAN.md`, `IMPLEMENTATION_PROGRESS.md`

