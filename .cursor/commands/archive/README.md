# Archived Commands

**Date:** 2025-11-07  
**Reason:** Deprecated or replaced with better alternatives

---

## verify-worktree-isolation

**Deprecated:** Per FR-018 single environment policy

**Why removed:**
- No longer using worktree-specific port offsets
- Standard ports now managed via `.env` only
- Worktree isolation verification is no longer needed

**Replacement:**
- Use standard ports: backend=4000, frontend=5173, dashboard=9400, appium=4723
- Follow PROC-005 for worktree bring-up

---

## update_handoff / update_handoff_quick (old versions)

**Replaced with:** `update-handoff` and `update-handoff-quick`

**Why replaced:**
- Old versions updated global BACKEND_HANDOFF.md / FRONTEND_HANDOFF.md
- New versions use item-level handoffs (FR/BUG/TD/CHORE)
- Better structure, line limits, handoff chains

**Migration:**
- Old: `@update_handoff` → New: `update-handoff [ITEM-ID]`
- Old: `@update_handoff_quick` → New: `update-handoff-quick [ITEM-ID]`

---

## test-default-run

**Moved to:** `automation/scripts/test-default-run`

**Why moved:**
- Too large (444 lines) for `.cursor/commands/`
- Better suited to automation/scripts/ directory
- Commands should be thin wrappers, not full test scripts

**Usage:**
- Old: `@test-default-run`
- New: `./automation/scripts/test-default-run` or via Taskfile

---

**See:** `.cursor/DETERMINISTIC_CURSOR_PLAN.md` for current command structure

