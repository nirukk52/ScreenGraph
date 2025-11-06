# JIRA Workflow Pattern

## Overview
This directory structure organizes all feature requests, bugs, and tech debt items into **individual folders**, each containing:
- **Main ticket document** - The core request/issue description
- **Status report** - Living document tracking progress
- **Retrospective** - Post-completion analysis and learnings

## Directory Structure

```
jira/
├── feature-requests/
│   ├── TEMPLATE-main.md         ← Main ticket template
│   ├── TEMPLATE-retro.md        ← Retro template
│   ├── TEMPLATE-status.md       ← Status template
│   └── FR-XXX-feature-name/     ← Individual feature folder
│       ├── FR-XXX-main.md       ← Main ticket
│       ├── FR-XXX-status.md     ← Status updates
│       └── FR-XXX-retro.md      ← Retrospective
│
├── bugs/
│   ├── TEMPLATE-main.md         ← Main ticket template
│   ├── TEMPLATE-retro.md        ← Retro template
│   ├── TEMPLATE-status.md       ← Status template
│   └── BUG-XXX-bug-name/        ← Individual bug folder
│       ├── BUG-XXX-main.md      ← Main ticket
│       ├── BUG-XXX-status.md    ← Investigation/fix updates
│       └── BUG-XXX-retro.md     ← Post-fix analysis
│
└── tech-debt/
    ├── TEMPLATE-main.md         ← Main ticket template
    ├── TEMPLATE-retro.md        ← Retro template
    ├── TEMPLATE-status.md       ← Status template
    └── TD-XXX-debt-name/        ← Individual tech debt folder
        ├── TD-XXX-main.md       ← Main ticket
        ├── TD-XXX-status.md     ← Refactor updates
        └── TD-XXX-retro.md      ← Post-refactor analysis
```

## Automated Setup Commands

Three cursor commands are available in `.cursor/commands/`:

### 1. Create Feature Request
```bash
# In Cursor, mention: @create-feature
# Or run directly:
.cursor/commands/create-feature
```
**Prompts for:**
- Feature ID (e.g., `FR-012`)
- Short Title (e.g., `api-rate-limiting`)

**Creates:**
- `jira/feature-requests/FR-012-api-rate-limiting/`
  - `FR-012-main.md`
  - `FR-012-status.md`
  - `FR-012-retro.md`

### 2. Create Bug Report
```bash
# In Cursor, mention: @create-bug
# Or run directly:
.cursor/commands/create-bug
```
**Prompts for:**
- Bug ID (e.g., `BUG-003`)
- Short Title (e.g., `api-timeout-error`)

**Creates:**
- `jira/bugs/BUG-003-api-timeout-error/`
  - `BUG-003-main.md`
  - `BUG-003-status.md`
  - `BUG-003-retro.md`

### 3. Create Tech Debt
```bash
# In Cursor, mention: @create-techdebt
# Or run directly:
.cursor/commands/create-techdebt
```
**Prompts for:**
- Tech Debt ID (e.g., `TD-001`)
- Short Title (e.g., `refactor-logging-layer`)

**Creates:**
- `jira/tech-debt/TD-001-refactor-logging-layer/`
  - `TD-001-main.md`
  - `TD-001-status.md`
  - `TD-001-retro.md`

## Workflow

### For Feature Requests

1. **Discovery**: When you discover a feature need
   ```bash
   @create-feature
   # Enter: FR-012, api-rate-limiting
   ```

2. **Planning**: Fill out `FR-012-main.md`
   - Description, acceptance criteria
   - Dependencies, testing requirements
   - Technical notes

3. **Development**: Update `FR-012-status.md` regularly
   - Progress percentage
   - Blockers and risks
   - Timeline updates
   - Recent accomplishments

4. **Completion**: Fill out `FR-012-retro.md`
   - What went well
   - What could be improved
   - Metrics and outcomes
   - Lessons learned
   - Action items for future

### For Bugs

1. **Discovery**: When you discover a bug
   ```bash
   @create-bug
   # Enter: BUG-003, api-timeout-error
   ```

2. **Reporting**: Fill out `BUG-003-main.md`
   - Summary, severity, impact
   - Steps to reproduce
   - Expected vs actual result
   - Proposed fix

3. **Investigation/Fix**: Update `BUG-003-status.md` regularly
   - Investigation findings
   - Current state and progress
   - Blockers
   - Next steps

4. **Post-Fix**: Fill out `BUG-003-retro.md`
   - Root cause analysis
   - Fix applied
   - Verification & testing
   - Preventive actions

### For Tech Debt

1. **Discovery**: When you identify tech debt
   ```bash
   @create-techdebt
   # Enter: TD-001, refactor-logging-layer
   ```

2. **Documentation**: Fill out `TD-001-main.md`
   - Current problem
   - Business value of fixing
   - Proposed solution
   - Migration plan

3. **Refactoring**: Update `TD-001-status.md` regularly
   - Progress on refactor
   - Impact metrics so far
   - Remaining work

4. **Completion**: Fill out `TD-001-retro.md`
   - What was accomplished
   - Before/after metrics
   - Business impact
   - Lessons learned

## Naming Conventions

### IDs
- **Features**: `FR-XXX` (sequential numbering)
- **Bugs**: `BUG-XXX` (sequential numbering)
- **Tech Debt**: `TD-XXX` (sequential numbering)

### Titles
- Use `kebab-case`
- Be descriptive but concise
- Good: `api-rate-limiting`, `graph-projection-bug`, `refactor-logging`
- Bad: `new-feature`, `bug`, `fix-code`

### Folders
- Format: `{ID}-{title}`
- Example: `FR-012-api-rate-limiting`
- Example: `BUG-003-api-timeout-error`
- Example: `TD-001-refactor-logging-layer`

## Benefits

### Organization
- Each item has its own dedicated space
- All related documents stay together
- Easy to find and track

### Consistency
- Templates ensure uniform documentation
- Status reports provide regular updates
- Retros capture learnings

### Accountability
- Clear ownership and priority
- Visible progress tracking
- Post-completion analysis

### Knowledge Retention
- Retros document what we learned
- Action items prevent repeat mistakes
- Historical context preserved

## Tips

### Status Updates
- Update at least weekly during active work
- More frequent updates for P0/P1 items
- Include blockers immediately when they occur

### Retrospectives
- Complete within 48 hours of finishing
- Be honest about what didn't work
- Focus on actionable lessons
- Celebrate wins

### Maintenance
- Archive completed items after 90 days (move to `jira/archive/`)
- Review open status reports weekly
- Close stale items (no updates in 30 days)

## Integration with Cursor

The commands integrate seamlessly with Cursor's @ system:

1. When you discover something during development
2. Type `@create-feature`, `@create-bug`, or `@create-techdebt`
3. Answer the prompts
4. Folder and files are created instantly
5. Start documenting immediately

## Example Usage

### Scenario 1: New Feature Discovered
```
Developer: "We need rate limiting on the API"
→ @create-feature
→ FR-013, api-rate-limiting
→ Fill out FR-013-main.md with requirements
→ Start development
→ Update FR-013-status.md weekly
→ Complete FR-013-retro.md when done
```

### Scenario 2: Bug Found
```
QA: "Graph projection failing on large datasets"
→ @create-bug
→ BUG-004, graph-projection-failure
→ Fill out BUG-004-main.md with repro steps
→ Update BUG-004-status.md during investigation
→ Complete BUG-004-retro.md after fix
```

### Scenario 3: Tech Debt Identified
```
Engineer: "Logging layer is inconsistent and hard to maintain"
→ @create-techdebt
→ TD-002, standardize-logging
→ Fill out TD-002-main.md with current pain points
→ Update TD-002-status.md during refactor
→ Complete TD-002-retro.md when finished
```

## Migration from Old Structure

Old flat files (e.g., `FR-001-post-run-endpoint.md`) can be migrated:

```bash
# Create folder
mkdir jira/feature-requests/FR-001-post-run-endpoint

# Move main file
mv jira/feature-requests/FR-001-post-run-endpoint.md \
   jira/feature-requests/FR-001-post-run-endpoint/FR-001-main.md

# Create status and retro from templates
cp jira/feature-requests/TEMPLATE-status.md \
   jira/feature-requests/FR-001-post-run-endpoint/FR-001-status.md
cp jira/feature-requests/TEMPLATE-retro.md \
   jira/feature-requests/FR-001-post-run-endpoint/FR-001-retro.md

# Update placeholders
sed -i '' 's/FR-XXX/FR-001/g' jira/feature-requests/FR-001-post-run-endpoint/*.md
```

---

**Questions?** See `.cursor/commands/create-*` scripts for implementation details.

