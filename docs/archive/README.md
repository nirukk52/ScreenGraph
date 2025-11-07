# Global Handoffs Archived

**Date:** 2025-11-07  
**Reason:** Migrated to item-level handoffs

---

## What Changed

Previously, all work was tracked in two global files:
- `BACKEND_HANDOFF.md` (840 lines)
- `FRONTEND_HANDOFF.md` (460 lines)

**Problems with global handoffs:**
- ❌ Files grew too large (hard to find relevant info)
- ❌ Merge conflicts when multiple agents worked in parallel
- ❌ Context scattered across single file
- ❌ No structured tracking per feature/bug/debt

---

## New Approach: Item-Level Handoffs

Every work item now has its own handoff:
```
jira/feature-requests/FR-015/handoff.md
jira/bugs/BUG-003/handoff.md
jira/tech-debt/TD-005/handoff.md
jira/chores/CHORE-001/handoff.md
```

**Benefits:**
- ✅ **Focused**: Each handoff is ≤50 lines, specific to one item
- ✅ **Searchable**: Easy to find context for specific features/bugs
- ✅ **No conflicts**: Parallel work doesn't cause merge issues
- ✅ **Structured**: Standard format with todos, ratings, handoff chains
- ✅ **Scalable**: Works with 10 items or 1000 items

---

## Migration Path

### For Active Work Items
If you're currently working on something mentioned in these archived files:
1. Create a proper FR/BUG/TD/CHORE item in `jira/`
2. Use `update-handoff [ITEM-ID]` to track your work
3. Reference the archived global handoffs if you need historical context

### For Historical Context
These archived files are preserved for:
- Historical reference
- Understanding past architectural decisions
- Tracing how features evolved

---

## New Commands

Instead of manually updating BACKEND_HANDOFF.md:

```bash
# Full handoff update (2-3 min)
update-handoff FR-015

# Quick handoff (30 sec, auto-detects item from git)
update-handoff-quick
```

---

## Item Types Supported

- **FR-XXX**: Feature requests
- **BUG-XXX**: Bugs
- **TD-XXX**: Tech debt
- **CHORE-XXX**: Maintenance tasks

---

**See:** `.cursor/DETERMINISTIC_CURSOR_PLAN.md` for full details

