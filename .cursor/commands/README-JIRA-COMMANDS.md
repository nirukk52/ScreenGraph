# JIRA Management Commands - Quick Reference

## Available Commands

### @create-feature-doc
Creates a new feature request folder with all necessary documents.

**Usage:**
```bash
@create-feature-doc
```

**You'll be prompted for:**
- Feature ID (e.g., `FR-012`)
- Short Title (e.g., `api-rate-limiting`)

**Creates:**
```
jira/feature-requests/FR-012-api-rate-limiting/
├── FR-012-main.md      ← Fill this out first
├── FR-012-status.md    ← Update regularly during dev
└── FR-012-retro.md     ← Complete after shipping
```

---

### @create-bug-doc
Creates a new bug report folder with all necessary documents.

**Usage:**
```bash
@create-bug-doc
```

**You'll be prompted for:**
- Bug ID (e.g., `BUG-003`)
- Short Title (e.g., `api-timeout-error`)

**Creates:**
```
jira/bugs/BUG-003-api-timeout-error/
├── BUG-003-main.md      ← Document the bug
├── BUG-003-status.md    ← Track investigation/fix
└── BUG-003-retro.md     ← Analyze after fixing
```

---

### @create-tech-debt-doc
Creates a new tech debt folder with all necessary documents.

**Usage:**
```bash
@create-tech-debt-doc
```

**You'll be prompted for:**
- Tech Debt ID (e.g., `TD-001`)
- Short Title (e.g., `refactor-logging-layer`)

**Creates:**
```
jira/tech-debt/TD-001-refactor-logging-layer/
├── TD-001-main.md      ← Document the debt
├── TD-001-status.md    ← Track refactoring
└── TD-001-retro.md     ← Measure impact after
```

---

## Quick Tips

### When to Use Each Command

| Command | When to Use |
|---------|-------------|
| `@create-feature-doc` | New functionality, API endpoints, UI components, integrations |
| `@create-bug-doc` | Something broken, incorrect behavior, errors, crashes |
| `@create-tech-debt-doc` | Code that needs refactoring, performance improvements, maintainability issues |

### Naming Guidelines

**Good Names:**
- `api-rate-limiting`
- `graph-projection-bug`
- `refactor-logging-layer`
- `add-user-authentication`
- `fix-memory-leak`

**Bad Names:**
- `new-feature` (too generic)
- `bug` (not descriptive)
- `fix` (what fix?)
- `refactor` (refactor what?)

### ID Numbering

- **Features**: `FR-001`, `FR-002`, `FR-003`, ...
- **Bugs**: `BUG-001`, `BUG-002`, `BUG-003`, ...
- **Tech Debt**: `TD-001`, `TD-002`, `TD-003`, ...

**Tip**: Check existing folders to find the next available ID.

---

## Workflow Reminder

### For Features
1. `@create-feature-doc` → Create folder
2. Fill out `main.md` → Plan the feature
3. Update `status.md` → Track progress weekly
4. Complete `retro.md` → Capture learnings

### For Bugs
1. `@create-bug-doc` → Create folder
2. Fill out `main.md` → Document the bug
3. Update `status.md` → Track investigation
4. Complete `retro.md` → Analyze root cause

### For Tech Debt
1. `@create-tech-debt-doc` → Create folder
2. Fill out `main.md` → Describe the problem
3. Update `status.md` → Track refactoring
4. Complete `retro.md` → Measure impact

---

## Example Session

```
🎯 Scenario: You discover a new feature is needed

Step 1: Type in Cursor
@create-feature-doc

Step 2: Answer prompts
Feature ID (e.g., FR-012): FR-014
Short Title (kebab-case): websocket-reconnection

Step 3: Success!
✅ Feature request folder created: jira/feature-requests/FR-014-websocket-reconnection

📁 Created files:
   - FR-014-main.md (main ticket)
   - FR-014-retro.md (retrospective)
   - FR-014-status.md (status report)

Step 4: Open and fill out FR-014-main.md
- Add description
- Define acceptance criteria
- List dependencies
- Plan testing

Step 5: Start development
- Update FR-014-status.md weekly
- Track blockers immediately
- Note progress and decisions

Step 6: After completion
- Fill out FR-014-retro.md
- What went well?
- What could improve?
- Lessons learned?
```

---

## Troubleshooting

### "Folder already exists"
→ Check existing folders, you may have already created this item

### "Command not found"
→ Make sure you're in the project root: `/Users/priyankalalge/ScreenGraph/Code/ScreenGraph`

### "Permission denied"
→ Run: `chmod +x .cursor/commands/create-*`

---

**Full Documentation**: See `jira/README.md` for complete details.










