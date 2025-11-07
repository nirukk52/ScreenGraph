# BUG-003 — Port Coordinator Main Tree Offset Issue

## Quick Summary

**Problem**: Port coordinator assigns offset ports (4007, 5180) to main tree instead of defaults (4000, 5173), violating founder rules.

**Impact**: Low severity - architectural inconsistency, no functional breakage.

**Status**: Documented, fix proposed, awaiting decision.

---

## The Issue

### Expected Behavior (Per Founder Rules)
Main tree "ScreenGraph" should use **base ports**:
- Backend: `4000`
- Frontend: `5173`
- Dashboard: `9400`
- Appium: `4723`

### Actual Behavior
Main tree receives **offset ports** via hash calculation:
- Backend: `4007` (offset +7)
- Frontend: `5180` (offset +7)
- Dashboard: `9407` (offset +7)
- Appium: `4730` (offset +7)

### Root Cause
`scripts/port-coordinator.mjs` line 98-107 doesn't special-case main tree:

```javascript
const offsetSeed = hashString(worktree);  // Hashes "ScreenGraph" → 7
const offset = offsetSeed % width;
const preferred = base + offset;  // 4000 + 7 = 4007 ❌
```

**Missing check**: No `if (worktree === "ScreenGraph")` to use base ports.

---

## Proposed Fix

**File**: `scripts/port-coordinator.mjs`

**Change**: Add main tree detection before offset calculation:

```javascript
const isMainTree = worktree === "ScreenGraph";

for (const [name, cfg] of Object.entries(SERVICES)) {
  // ...
  let preferred;
  if (isMainTree) {
    // Main tree: use base ports (no offset)
    preferred = override ?? (registry.worktrees[worktree][name] ?? base);
  } else {
    // Worktrees: use hash-based offset
    const offsetSeed = hashString(worktree);
    const offset = offsetSeed % width;
    preferred = override ?? (registry.worktrees[worktree][name] ?? base + offset);
  }
  // ...
}
```

---

## Testing Steps

1. Apply fix to `scripts/port-coordinator.mjs`
2. Clear registry: `rm ~/.screengraph/ports.json`
3. Run: `bun scripts/port-coordinator.mjs --json`
4. Verify main tree gets base ports (4000, 5173, 9400, 4723)
5. Create worktree and verify it still gets offset ports

---

## Decision Needed

**Question**: Should main tree use base ports (per founder rules) or keep current hash-based approach?

**Options**:
1. ✅ **Fix code** to match founder rules (main tree = base ports)
2. ⚠️ **Update rules** to match current behavior (all trees = hash offsets)

**Recommendation**: Option 1 - Fix code to align with documented architecture.

---

## Related Files

- `scripts/port-coordinator.mjs` (needs fix)
- `.cursor/rules/founder_rules.mdc` (documents expected behavior)
- `jira/bugs/BUG-003-port-coordinator-main-tree-offset/BUG-003-main.md` (full details)

---

**Full Bug Report**: See `BUG-003-main.md` for complete analysis, logs, and discussion.

