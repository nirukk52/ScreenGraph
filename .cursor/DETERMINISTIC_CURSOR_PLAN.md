# Deterministic .cursor Plan

**Created:** 2025-11-07  
**Goal:** Make `.cursor` tasks small, fast, and deterministic with standardized documentation  
**Status:** Ready for Implementation

---

## 📊 Overview

### Current Issues
- ❌ No standardized documentation across all item types (features, bugs, tech debt, chores)
- ❌ Some commands are too large (444 lines) and slow
- ❌ No line limits enforced on documentation
- ❌ Handoff concept not clearly defined or implemented
- ❌ Todo format varies across items
- ❌ Deprecated commands still present (worktree isolation, port coordination)

### Target State
- ✅ Every FR/BUG/TD/CHORE has `handoff.md`, `main.md`, `status.md`
- ✅ All commands complete in < 30 seconds
- ✅ Line limits enforced: handoff (50), main (150), status (100)
- ✅ Standardized todo format with checkboxes
- ✅ Handoff chains link items together
- ✅ Validation enforced via pre-commit hooks
- ✅ Only essential commands remain

---

## 📏 Documentation Standards

### Line Limits (ENFORCED)
```
handoff.md:  ≤ 50 lines  (focused context for next item)
main.md:     ≤ 150 lines (core implementation details)
status.md:   ≤ 100 lines (todos, progress tracking)
retro.md:    ≤ 100 lines (learnings, optional, rating out of 5)
```

### Required Files
Every `jira/feature-requests/FR-XXX/`, `jira/bugs/BUG-XXX/`, `jira/tech-debt/TD-XXX/`, `jira/chores/CHORE-XXX/` must have:
1. `handoff.md` - Context for next item in chain
2. `main.md` - Implementation details
3. `status.md` - Todos and progress

---

## 📝 Standard Formats

### status.md Format
```markdown
# [ITEM-ID]: [Title] - Status

**Status:** [pending|in-progress|blocked|completed|cancelled]  
**Owner:** [Name]  
**Started:** YYYY-MM-DD  
**Last Updated:** YYYY-MM-DD  
**Completed:** YYYY-MM-DD (if applicable)

---

## Manual Testing Required (Top 5)
1. [Test scenario 1 - small or large]
2. [Test scenario 2]
3. [Test scenario 3]
4. [Test scenario 4]
5. [Test scenario 5]

---

## Todos
- [ ] Todo item 1 (Brief, < 10 words)
- [ ] Todo item 2
- [x] Completed todo 3

---

## Blockers
- (none) or list specific blockers with dates

---

## Notes
Brief progress notes (< 3 lines per update)
```

### handoff.md Format (Handoff Chain)
```markdown
# Handoff: [CURRENT-ID] → [NEXT-ID]

## Completed in [CURRENT-ID]
- Accomplishment 1
- Accomplishment 2
- Accomplishment 3

## Context for [NEXT-ID]
- Key decision 1
- Key constraint 2
- Open question 3

## Links
- Previous: [PREV-ID]
- Next: [NEXT-ID]
- Related: [OTHER-ID-1], [OTHER-ID-2]

---

**Max 50 lines total**
```

### main.md Format
```markdown
# [ITEM-ID]: [Title]

## Summary
[Brief description: what, why, impact]

## Implementation Details
[Architecture, approach, key files]

## Technical Notes
[Decisions, constraints, gotchas]

## Testing
[How to verify, test approach]

---

**Max 150 lines total**
```

---

## 🛠️ Command Structure (Atomic & Fast)

### CREATE Commands (< 10s each)
```bash
create-feature [FR-XXX]    # Initialize feature-requests/FR-XXX/ with templates
create-bug [BUG-XXX]       # Initialize bugs/BUG-XXX/ with templates
create-techdebt [TD-XXX]   # Initialize tech-debt/TD-XXX/ with templates
create-chore [CHORE-XXX]   # Initialize chores/CHORE-XXX/ with templates (NEW)
```

### UPDATE Commands (< 5s each)
```bash
update-status [ITEM-ID]    # Update status.md with new todo states
update-main [ITEM-ID]      # Update main.md implementation notes
update-handoff [ITEM-ID]   # Update handoff.md with next-item context
```

### VALIDATION Commands (< 10s each)
```bash
validate-docs              # Check all items have required files + line limits
validate-todos [ITEM-ID]   # Check todos are properly formatted
validate-handoffs          # Check handoff chains are valid and linked
```

### MIGRATE Commands
```bash
migrate-existing-docs      # One-time: Update existing docs to new format
```

---

## 🗑️ Commands to REMOVE

### Deprecated (Per FR-018 Single Environment Policy)
- `verify-worktree-isolation` - No longer needed, standard ports only
- Any port-coordination scripts

### Too Large (Move to automation/scripts/)
- `test-default-run` (444 lines) → Move to `automation/scripts/test-default-run.mjs`

### Obsolete Global Handoffs
- `BACKEND_HANDOFF.md` - Archive to `docs/archive/`
- `FRONTEND_HANDOFF.md` - Archive to `docs/archive/`
- All handoffs now live in item-level `handoff.md` files

### Consolidation
- `update-bug-doc`, `update-feature-doc`, `update-tech-debt` → Replace with `update-handoff [ITEM-ID]`

---

## ✅ Validation & Enforcement

### Pre-Commit Hook
Add to `.husky/pre-commit`:
```bash
# Validate cursor documentation
node automation/scripts/validate-cursor-docs.mjs || {
  echo "❌ Cursor docs validation failed"
  echo "Run 'validate-docs' to see errors"
  exit 1
}
```

### Validation Script (`automation/scripts/validate-cursor-docs.mjs`)
Checks:
1. ✅ All FR/BUG/TD/CHORE directories have `handoff.md`, `main.md`, `status.md`
2. ✅ Line limits respected: handoff (50), main (150), status (100)
3. ✅ Status.md has valid format with todos section
4. ✅ Handoff chains are valid (NEXT-ID exists or is TBD)
5. ✅ No orphaned handoffs (every handoff references valid items)

Returns:
- Exit code 0 if all validations pass
- Exit code 1 with detailed error messages if violations found

---

## 🔄 Handoff Chain Concept

### What is a Handoff Chain?
A handoff chain links related work items together, creating a narrative of progress:

```
FR-015 → FR-016 → FR-017 → FR-018 → [FR-019: Next planned feature]
   ↓
BUG-001 (discovered during FR-016)
   ↓
TD-005 (refactor needed from bug fix)
```

### How to Create a Handoff Chain
1. Complete work on CURRENT-ID
2. Identify NEXT-ID (next planned feature/bug/debt)
3. Update `handoff.md` in CURRENT-ID with:
   - What was accomplished
   - Context NEXT-ID needs
   - Explicit link to NEXT-ID
4. Create NEXT-ID directory with templates
5. Reference CURRENT-ID as "Previous" in NEXT-ID's handoff.md

### Benefits
- ✅ Context preserved across sessions
- ✅ Clear narrative of feature development
- ✅ Easy to onboard new agents/developers
- ✅ Prevents context loss
- ✅ Creates audit trail

---

## 📋 Implementation Plan

### Phase 1: Templates & Standards (2 hours)
1. ✅ Update bug templates with line limits and standardized formats
2. ✅ Copy templates to `jira/feature-requests/`
3. ✅ Copy templates to `jira/tech-debt/`
4. ✅ Create `jira/chores/` with templates
5. ✅ Update `.cursor/procedures/PROCEDURES.md` with:
   - Line limit policy
   - Handoff chain concept
   - Standard formats

### Phase 2: Command Refactoring (3 hours)
1. ✅ Create atomic `update-status` command
2. ✅ Create atomic `update-main` command
3. ✅ Refactor `update-handoff` to be atomic
4. ✅ Create `create-chore` command
5. ✅ Move `test-default-run` to `automation/scripts/`
6. ✅ Remove deprecated commands:
   - `verify-worktree-isolation`
   - Port coordination scripts
7. ✅ Consolidate duplicate update commands

### Phase 3: Validation & Enforcement (2 hours)
1. ✅ Create `automation/scripts/validate-cursor-docs.mjs`
2. ✅ Create `validate-docs` command wrapper
3. ✅ Create `validate-todos` command
4. ✅ Create `validate-handoffs` command
5. ✅ Add validation to `.husky/pre-commit`
6. ✅ Test validation on existing docs

### Phase 4: Migration & Cleanup (2 hours)
1. ✅ Create `migrate-existing-docs` script
2. ✅ Run migration on all existing FR/BUG/TD items
3. ✅ Manually fix items that exceed line limits
4. ✅ Update `.cursor/commands/README.md`
5. ✅ Update `.cursor/procedures/PROCEDURES.md`
6. ✅ Test all commands end-to-end
7. ✅ Archive removed commands to `.cursor/commands/archive/`

**Total Estimated Time:** 9 hours

---

## 🎯 Success Criteria

### Completion Checklist
- [ ] All FR/BUG/TD items have handoff.md, main.md, status.md
- [ ] All new chores have templates in jira/chores/
- [ ] Line limits enforced: handoff (50), main (150), status (100)
- [ ] All commands complete in < 30 seconds
- [ ] Validation runs in pre-commit hook
- [ ] No deprecated commands remain
- [ ] All todos use standardized checkbox format
- [ ] Handoff chains documented and working
- [ ] Commands README updated
- [ ] PROCEDURES.md updated with new standards

### Metrics
- Command execution time: < 30s for all commands
- Validation time: < 10s for all docs
- Template compliance: 100%
- Line limit compliance: 100%
- Handoff chain coverage: 100% of completed items

---

## 📚 Related Documents

- `.cursor/procedures/PROCEDURES.md` - Standard operating procedures
- `.cursor/commands/README.md` - All available commands
- `jira/README.md` - Jira structure overview
- `automation/README.md` - Automation library documentation
- `automation/scripts/` - All operational scripts (dev, validation, migration)

---

## 🚀 Next Steps

1. Review this plan with founder
2. Get approval on line limits and formats
3. Begin Phase 1: Templates & Standards
4. Track progress in todos (see top of file)

---

**Last Updated:** 2025-11-07

