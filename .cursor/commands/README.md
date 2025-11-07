# Cursor Commands

Quick reference for `.cursor/commands/` - all commands are executable scripts.

---

## Item Handoff Commands (NEW)

### `update-handoff [ITEM-ID]`
Update handoff for FR/BUG/TD/CHORE item. Interactive prompts.
```bash
update-handoff FR-015
```

### `update-handoff-quick [ITEM-ID]`
Fast handoff (30s). Auto-detects item from git branch/files.
```bash
update-handoff-quick        # Auto-detect
update-handoff-quick FR-015 # Explicit
```

### `update-status [ITEM-ID]`
Update status.md timestamp (< 5s).
```bash
update-status FR-015
```

### `update-main [ITEM-ID] [note]`
Append note to main.md (< 5s).
```bash
update-main FR-015 "Added API endpoint"
```

---

## Item Creation

- `create-feature` - Create FR-XXX
- `create-bug` - Create BUG-XXX
- `create-techdebt` - Create TD-XXX
- `create-chore` - Create CHORE-XXX (NEW)

---

## Validation

### `validate-docs`
Check all items for required files and line limits.
```bash
validate-docs
```

---

## Service Commands

- `start` - Start backend + frontend
- `stop` - Stop all services

---

## Archived

Old commands moved to `archive/`:
- `verify-worktree-isolation` (deprecated)
- `update_handoff` / `update_handoff_quick` (replaced)
- `test-default-run` (moved to automation/scripts/)

---

**Last Updated:** 2025-11-07
