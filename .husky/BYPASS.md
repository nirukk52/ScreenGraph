# Husky Hook Bypass (Emergency Only)

**⚠️ WARNING:** Only bypass hooks in genuine emergencies!

---

## When to Bypass

**ONLY use in these scenarios:**
- Critical hotfix that can't wait for full validation
- Known false positive you'll fix in next commit  
- Hook itself is broken and needs fixing

**NEVER bypass for:**
- "I don't want to fix violations"
- "I'm in a hurry"
- "I'll fix it later" (you won't)

---

## How to Bypass

### Skip ALL Hooks
```bash
# Option 1: Environment variable
HUSKY=0 git commit -m "emergency hotfix"
HUSKY=0 git push

# Option 2: --no-verify flag
git commit -m "emergency hotfix" --no-verify
git push --no-verify
```

### Skip Specific Hook

Edit the hook file temporarily:
```bash
# Disable pre-commit
mv .husky/pre-commit .husky/pre-commit.disabled

# Commit
git commit -m "your message"

# Re-enable
mv .husky/pre-commit.disabled .husky/pre-commit
```

---

## ⚠️ Important Notes

1. **CI will still run checks** - Bypassing hooks doesn't bypass CI/CD
2. **Document why** - Add explanation in commit message if bypassing
3. **Fix violations ASAP** - Don't let technical debt accumulate
4. **Team notification** - Inform team if bypassing on shared branches

---

## Hook Status

View which hooks are active:
```bash
ls -la .husky/
```

Test a hook manually:
```bash
./.husky/pre-commit
./.husky/pre-push
./.husky/post-checkout
```

---

## Troubleshooting

### "Husky command not found"
```bash
cd /path/to/project
bun install
```

### Hooks not running
```bash
# Re-initialize Husky
bun run prepare
```

### Hook fails incorrectly
```bash
# Test hook directly
./.husky/pre-commit

# Check task independently
cd .cursor && task founder:rules:check
```

---

**Remember:** Hooks protect code quality. Bypass sparingly!

