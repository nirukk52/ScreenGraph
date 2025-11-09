# Husky Git Hooks

**Purpose:** Automated quality gates enforced on every git operation.

---

## Active Hooks

### `pre-commit`
**When:** Before every `git commit`  
**What:**
1. Validates founder rules compliance
2. Validates cursor documentation

**Checks:**
- ❌ No `console.log` in code
- ❌ No `any` types
- ✅ American English spelling
- ✅ Proper naming conventions

**Bypass (emergency only):**
```bash
HUSKY=0 git commit -m "message"
```

---

### `pre-push` ⭐ UPDATED
**When:** Before every `git push`  
**What:**
1. **Vibe Manager cleanup** - Moves temporary docs to `jira/reports/`
2. **Smoke tests** - Health checks for backend + frontend
3. **E2E tests** - Playwright tests in CI mode

**Flow:**
```
git push
    ↓
1. Cleanup root docs (vibe_manager_vibe)
   - Moves TESTING_*.md → jira/reports/
   - Moves ARCHITECTURE_REVIEW*.md → jira/reports/
   - Keeps CLAUDE.md, README.md, *_HANDOFF.md, VIBE_*.md
    ↓
2. Run smoke tests (task qa:smoke)
   - Backend health check
   - Frontend availability check
    ↓
3. Run E2E tests (playwright headless)
   - Full user workflows
    ↓
✅ Push allowed
```

**Script:** `automation/scripts/cleanup-root-docs.mjs`

**What Gets Moved:**
- `TESTING_COMMANDS_ANALYSIS.md` → `jira/reports/`
- `TESTING_CONSOLIDATION_SUMMARY.md` → `jira/reports/`
- `TESTING_QUICK_REFERENCE.md` → `jira/reports/`
- `ARCHITECTURE_REVIEW.md` → `jira/reports/`
- `ARCHITECTURE_REVIEW_RETRO.md` → `jira/reports/`
- `BROWSER_DEBUGGING_OPTIONS_ANALYSIS.md` → `jira/reports/`

**What Stays at Root:**
- `CLAUDE.md` - Project quick reference
- `README.md` - Project overview
- `WHAT_WE_ARE_MAKING.md` - Product vision
- `*_HANDOFF.md` - Architecture handoffs
- `VIBE_*.md` - Vibe system documentation
- `FOUNDERS_NOTEPAD.md` - Founder notes
- `plan.md` - Planning doc

**Bypass (emergency only):**
```bash
HUSKY=0 git push
```

---

## Philosophy

### Why Vibe Manager Cleans Root

**Rationale:**
- Root should only contain **core, permanent** documentation
- **Analysis/temporary docs** belong in `jira/reports/` for reference
- Keeps root clean and discoverable
- vibe_manager_vibe owns root organization

**What is "Core" Documentation:**
1. **Quick references** - CLAUDE.md (developer quick lookup)
2. **Architecture** - Handoff docs, vibe system docs
3. **Product** - WHAT_WE_ARE_MAKING.md, README.md
4. **Founder** - FOUNDERS_NOTEPAD.md, plan.md

**What is "Analysis" Documentation:**
1. Testing analysis/consolidation docs
2. Architecture review retrospectives
3. Debugging options analysis
4. Temporary investigation reports

### Why Run Tests on Pre-Push

**Rationale:**
- Catch issues before they reach remote
- Smoke tests (< 5s) catch 90% of problems
- E2E tests ensure critical flows work
- Pre-push is the last gate before collaboration

**Exit Codes:**
- Non-zero exit = Push blocked
- Cleanup warnings are non-blocking
- Test failures block the push

---

## Troubleshooting

### Cleanup Script Fails
```bash
# Run manually to debug
node automation/scripts/cleanup-root-docs.mjs

# Check jira/reports/ exists
ls -la jira/reports/
```

### Smoke Tests Fail
```bash
# Check services running
task founder:servers:status

# Start services
task founder:servers:start

# Try push again
git push
```

### E2E Tests Fail
```bash
# Appium probably not running
task qa:appium:start

# Or skip E2E in emergency
HUSKY=0 git push
```

### Need to Skip All Hooks
```bash
# Emergency bypass (use sparingly)
HUSKY=0 git push
```

---

## Configuration

### Enabling/Disabling Hooks

**Disable temporarily:**
```bash
export HUSKY=0
git commit ...
git push ...
unset HUSKY
```

**Disable permanently (not recommended):**
```bash
# Remove .husky/ directory or rename hooks
```

### Modifying Hooks

**Location:** `.husky/pre-commit`, `.husky/pre-push`

**After modifying:**
```bash
chmod +x .husky/pre-push
```

---

## Integration with Vibe System

### Vibe Manager Ownership

The **vibe_manager_vibe** is responsible for:
- ✅ Maintaining clean root directory
- ✅ Organizing documentation
- ✅ Ensuring founder rules are enforced
- ✅ Managing git hooks that enforce organization

**Pre-push hook** is a vibe_manager responsibility because:
- It manages root documentation cleanup
- It enforces organizational standards
- It ensures quality before code leaves local environment

---

**Last Updated:** 2025-11-09  
**See Also:**
- `automation/scripts/cleanup-root-docs.mjs` - Cleanup script
- `vibes/vibe_manager_vibe.json` - Vibe manager definition
- `VIBE_OWNERSHIP_MAP.md` - What vibe_manager owns
