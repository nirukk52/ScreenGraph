# Cursor Commands

Quick reference for `.cursor/commands/` - all commands are executable scripts.

---

## Item Handoff Commands (NEW)

### `update-handoff [ITEM-ID]`
Update handoff for FR/BUG/TD/CHORE item. Interactive prompts.
```bash
update-handoff FR-015
```

### `quick-update-handoff [ITEM-ID]`
Fast handoff (30s). Auto-detects item from git branch/files.
```bash
quick-update-handoff        # Auto-detect
quick-update-handoff FR-015 # Explicit
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

- `create-feature-doc` - Create FR-XXX
- `create-bug-doc` - Create BUG-XXX
- `create-tech-debt-doc` - Create TD-XXX
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

- `start-services` - Start backend + frontend
- `stop-services` - Stop all services

---

## Archived

Old commands moved to `archive/`:
- `verify-worktree-isolation` (deprecated)

---

**Last Updated:** 2025-11-07
