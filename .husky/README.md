# Git Hooks (Husky)

**Purpose:** Local enforcement of code quality and project standards via Git hooks.

Husky provides the **first line of defense** against common mistakes by running validation checks before commits and pushes. This catches violations early—before they hit CI/CD.

---

## Overview

### Multi-Layer Enforcement

```
┌─────────────────────────────────────────────┐
│  1. Local Git Hooks (Husky) ← YOU ARE HERE  │  Fastest feedback
├─────────────────────────────────────────────┤
│  2. Cursor Commands (Manual)                │  On-demand checks
├─────────────────────────────────────────────┤
│  3. GitHub Actions (CI/CD)                  │  Pre-merge validation
├─────────────────────────────────────────────┤
│  4. Claude Skills (AI-assisted)             │  Intelligent helpers
└─────────────────────────────────────────────┘
```

**Same checks at every level** - all call the same Task commands from `automation/`.

---

## Installed Hooks

### `pre-commit` - Founder Rules Validation

**Triggers:** Before every commit  
**Command:** `task founder:rules:check`

**Checks:**
- ❌ No `console.log` (must use `encore.dev/log`)
- ❌ No `any` types
- ❌ No root `package.json` with backend/frontend deps
- ❌ No British spelling (must use American)
- ⚠️  Functions/classes should have comments

**Example Output:**
```bash
$ git commit -m "Add new feature"

🔍 Checking founder rules...

🚨 Founder Rules Violations:

❌ no-console (1 violation):
   backend/agent/orchestrator/main.ts:45 - Found console.log (use encore.dev/log instead)

❗ Fix these issues before committing.
```

**How to Fix:**
1. Address the violations in your code
2. Run `task founder:rules:check` to verify
3. Commit again

---

### `pre-push` - Smoke Tests

**Triggers:** Before every push to remote  
**Command:** `task qa:smoke:backend && task qa:smoke:frontend`

**Checks:**
- Backend API is functional
- Frontend builds successfully
- Basic integration works

**Example Output:**
```bash
$ git push origin feature-branch

🧪 Running smoke tests before push...

✅ Backend smoke tests passed
✅ Frontend smoke tests passed

Enumerating objects: 12, done.
...
```

**How to Fix:**
1. If tests fail, investigate the error
2. Fix the broken functionality
3. Run `task qa:smoke:backend` and `task qa:smoke:frontend` locally
4. Push again when green

---

### `post-checkout` - Worktree Isolation Check

**Triggers:** After switching branches  
**Command:** `task shared:check-worktree`

**Checks:**
- Confirms current worktree
- Validates port assignments
- Ensures registry is up-to-date

**Example Output:**
```bash
$ git checkout feature-new-ui

📍 Worktree: jcCtc
✅ Worktree isolation verified
🔢 Ports: Backend 4100, Frontend 5273
```

**Purpose:**  
Reminds you which worktree you're in and confirms isolation is working.

---

### `commit-msg` - Conventional Commits

**Triggers:** Before commit message is finalized  
**Command:** `task shared:validate:commit-message`

**Enforces:**
- Conventional commit format: `type(scope): message`
- Valid types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`

**Example:**
```bash
# ✅ Valid
git commit -m "feat(agent): add retry logic to state transitions"

# ❌ Invalid
git commit -m "added stuff"
→ Error: Commit message must follow format: type(scope): message
```

---

## Hook Lifecycle

### Normal Workflow

```
1. Developer makes changes
2. git add <files>
3. git commit -m "..."
   ├─→ pre-commit runs
   │   └─→ task founder:rules:check
   ├─→ commit-msg runs
   │   └─→ task shared:validate:commit-message
   └─→ Commit succeeds ✅

4. git push
   ├─→ pre-push runs
   │   └─→ task qa:smoke:*
   └─→ Push succeeds ✅
```

### When Hooks Fail

```
1. git commit -m "..."
2. pre-commit runs
3. ❌ Violations found
4. Commit BLOCKED
5. Developer fixes issues
6. git commit -m "..." (try again)
7. ✅ Clean - commit succeeds
```

---

## Bypassing Hooks (Emergency Only)

### When to Bypass

**ONLY in emergencies:**
- Critical hotfix that can't wait for full validation
- Known false positive you'll fix in next commit
- Hook itself is broken and needs fixing

**NEVER bypass for:**
- "I don't want to fix the violations"
- "I'm in a hurry"
- "I'll fix it later" (you won't)

### How to Bypass

```bash
# Skip all hooks (use sparingly!)
HUSKY_SKIP_HOOKS=1 git commit -m "emergency hotfix"

# Or use --no-verify flag
git commit -m "emergency hotfix" --no-verify
git push --no-verify
```

**⚠️  WARNING:** Bypassed commits will still fail in CI if violations exist!

---

## Hook Configuration

### Installation

Husky is configured in `package.json` (if at root) or via `bun add husky`:

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^9.0.0"
  }
}
```

Run once after clone:
```bash
bun install
```

This creates `.husky/` and installs hooks.

### Hook Files

Each hook is a simple shell script:

**`.husky/pre-commit`**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run founder rules check
task founder:rules:check
```

**`.husky/pre-push`**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🧪 Running smoke tests before push..."

# Run smoke tests (parallel)
task qa:smoke:backend &
BACKEND_PID=$!

task qa:smoke:frontend &
FRONTEND_PID=$!

# Wait for both
wait $BACKEND_PID || exit 1
wait $FRONTEND_PID || exit 1

echo "✅ Smoke tests passed"
```

---

## Customizing Hooks

### Adding Checks to pre-commit

Edit `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Existing check
task founder:rules:check

# Add new check
task frontend:typecheck
```

### Making Hooks Faster

If hooks are too slow:

1. **Parallelize checks:**
```bash
task founder:rules:check &
task frontend:typecheck &
wait
```

2. **Cache results:**
```bash
# Only check changed files
CHANGED_FILES=$(git diff --cached --name-only)
if echo "$CHANGED_FILES" | grep -q "\.ts$"; then
  task founder:rules:check
fi
```

3. **Split checks:**
- Fast checks in `pre-commit` (< 1s)
- Slow checks in `pre-push` (< 30s)

---

## Troubleshooting

### "Husky: command not found"

**Cause:** Husky not installed.

**Fix:**
```bash
cd /path/to/project
bun install
bun run prepare  # Installs hooks
```

### Hooks not running

**Cause:** Git hooks not enabled.

**Fix:**
```bash
# Re-initialize Husky
rm -rf .husky/_
bunx husky install
```

### Hook script errors

**Cause:** Script syntax error or missing task.

**Fix:**
1. Test hook manually:
```bash
.husky/pre-commit
```

2. Check task exists:
```bash
task --list | grep founder:rules:check
```

3. Run with verbose output:
```bash
sh -x .husky/pre-commit
```

### Hooks too slow

**Cause:** Running too many checks.

**Solution:**
- Move slow checks from `pre-commit` to `pre-push`
- Add `--fast` flag to tasks if available
- Parallelize independent checks

---

## Best Practices

### 1. Keep pre-commit Fast (< 1s)

Users commit frequently. Slow hooks are annoying.

**Fast checks for pre-commit:**
- Linting staged files only
- Founder rules on changed files only
- Quick syntax checks

**Slow checks for pre-push:**
- Full test suite
- Type checking entire codebase
- Build validation

### 2. Provide Clear Error Messages

```bash
# ✅ Good
echo "❌ Commit message must start with 'feat:', 'fix:', or 'chore:'"
echo "   Example: feat(backend): add user authentication"

# ❌ Bad
echo "Invalid commit"
```

### 3. Exit Codes Matter

```bash
# Hook fails on non-zero exit
task founder:rules:check || exit 1

# Hook continues even if command fails
task founder:rules:check || true  # DON'T DO THIS
```

### 4. Document Bypass Instructions

Include bypass instructions in error output for emergencies.

---

## Integration with Other Systems

### Same Checks in CI

`.github/workflows/ci.yml` runs the **same tasks**:

```yaml
- name: Check Founder Rules
  run: task founder:rules:check

- name: Run Smoke Tests
  run: |
    task qa:smoke:backend
    task qa:smoke:frontend
```

**Benefit:** If hooks pass locally, CI will pass too.

### Same Checks in Cursor

Developers can run manually:

```bash
task founder:rules:check      # Pre-commit check
task qa:smoke:backend         # Pre-push check (backend)
```

### Same Checks via Claude

Claude Skills can trigger:

```
"Run the pre-commit checks"
→ Executes: task founder:rules:check
```

---

## Maintenance

### Updating Hooks

Hooks are version-controlled. To update:

1. Edit hook file (e.g., `.husky/pre-commit`)
2. Test locally: `.husky/pre-commit`
3. Commit and push
4. Team gets updates on next `git pull`

### Adding New Hooks

```bash
# Create new hook
bunx husky add .husky/post-merge "task shared:check-dependencies"

# Make executable
chmod +x .husky/post-merge

# Commit
git add .husky/post-merge
git commit -m "chore: add post-merge dependency check"
```

### Removing Hooks

```bash
# Delete hook file
rm .husky/pre-commit

# Commit
git add .husky/pre-commit
git commit -m "chore: remove pre-commit hook"
```

---

## Related Documentation

- `automation/README.md` - Scripts called by hooks
- `.cursor/commands/README.md` - Task command reference
- `.claude-skills/README.md` - AI integration
- `FR-013-main.md` - Unified automation architecture
- Husky docs: https://typicode.github.io/husky/

---

**Last Updated:** 2025-11-07  
**Status:** Phase 4 - Hooks Defined (Not Yet Installed)  
**Maintainer:** Founder

