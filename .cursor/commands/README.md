# Cursor Commands

This directory contains Cursor AI commands that can be triggered with `@command-name` syntax.

---

## 📝 Handoff Commands

### `@update_handoff_quick` ⚡ **RECOMMENDED FOR DAILY WORK**

**Fast, deterministic handoff (30 seconds)**

- ✅ Auto-reads git state and modified files
- ✅ Creates 1-2 focused Graphiti episodes
- ✅ Updates handoff doc with pre-filled template
- ✅ Commits and pushes
- ⏭️ Skips: SKILLS.md, retros, extensive docs

**When to use:**
- Regular development work
- Bug fixes in progress
- Feature iterations
- Documentation updates
- Dependency updates
- Minor refactoring

**Usage:**
```bash
@update_handoff_quick
# Rate work (0-5): 4
# Notes (optional): Fixed type conversion issue
# ✅ Done!
```

---

### `@update_handoff` 📚 **FOR PRODUCTION & MILESTONES**

**Thorough handoff with full documentation (2-3 minutes)**

- ✅ Updates SKILLS.md files
- ✅ Creates comprehensive Graphiti episodes
- ✅ Updates handoff docs
- ✅ Creates retro documents
- ✅ Commits and pushes
- ✅ Supports PROC-001 production release workflow

**When to use:**
- Production releases (PROC-001)
- Feature completions requiring retros
- Major architectural changes
- Skills/documentation updates
- End-of-milestone summaries

**Usage:**
```bash
@update_handoff
# Choose workflow: Production Release / Regular Handoff
# Follow prompts...
```

---

## 🎫 Ticket Management Commands

### `@create-feature`
Create a new feature request folder with auto-incremented ID.

### `@create-bug`
Create a new bug report folder with auto-incremented ID.

### `@create-techdebt`
Create a new tech debt folder with auto-incremented ID.

### `@update-feature-doc`
Add handoff entry to a specific feature request folder.

### `@update-bug-doc`
Add handoff entry to a specific bug report folder.

### `@update-tech-debt`
Add handoff entry to a specific tech debt folder.

---

## 🧪 Testing Commands

### `@test-default-run`
Run smoke test for default run workflow (backend + frontend + device).

---

## 🚀 Service Commands

### `@start`
Start both backend and frontend services.

### `@stop`
Stop all running ScreenGraph services.

---

## 📊 Comparison: Quick vs Thorough Handoff

| Feature | Quick | Thorough |
|---------|-------|----------|
| **Time** | ~30 sec | 2-3 min |
| **Git State** | ✅ Auto | ✅ Auto |
| **Graphiti Episodes** | 1-2 focused | Comprehensive (4+) |
| **Handoff Doc** | ✅ Pre-filled | ✅ Detailed |
| **SKILLS.md** | ❌ Skip | ✅ Update |
| **Retro Docs** | ❌ Skip | ✅ Create |
| **Commit & Push** | ✅ Auto | ✅ Auto |
| **Production Release** | ❌ No | ✅ PROC-001 |

---

## 💡 Best Practices

1. **Daily work**: Use `@update_handoff_quick` after every 1-2 hour work session
2. **Before breaks**: Quick handoff ensures context is saved
3. **Before PRs**: Use thorough handoff for complete documentation
4. **Production releases**: Always use thorough handoff with PROC-001 workflow

---

## 📁 Command File Structure

All commands are executable shell scripts or markdown instruction files:

```
.cursor/commands/
├── README.md                    # This file
├── update_handoff_quick         # Fast handoff (NEW)
├── update_handoff               # Thorough handoff
├── create-feature               # Create FR-XXX
├── create-bug                   # Create BUG-XXX
├── create-techdebt              # Create TD-XXX
├── update-feature-doc           # Update FR-XXX handoff
├── update-bug-doc               # Update BUG-XXX handoff
├── update-tech-debt             # Update TD-XXX handoff
└── test-default-run             # Smoke test
```

---

**Last Updated**: November 7, 2025  
**Recommended for 99% of work**: `@update_handoff_quick` ⚡
