# GitHub Workflows

**Status:** Scaffolded (not yet active)  
**Purpose:** CI/CD automation using unified Task system

---

## Available Workflows

### 📋 `ci.yml.scaffold` - Continuous Integration

**What it does:**
- Validates founder rules
- Runs backend smoke tests
- Runs frontend smoke tests
- Checks TypeScript types

**Commands used:**
- `task founder:rules:check`
- `task qa:smoke:backend`
- `task qa:smoke:frontend`
- `task frontend:typecheck`

**Activation:**
1. Rename `ci.yml.scaffold` → `ci.yml`
2. Test in feature branch first
3. Verify all jobs pass
4. Merge to main

---

## Integration with Unified System

### Same Commands, Multiple Entry Points

```
┌─────────────────────────────────────┐
│  Local Development (Husky Hooks)    │  ← pre-commit, pre-push
├─────────────────────────────────────┤
│  Cursor Commands (Manual)           │  ← task founder:rules:check
├─────────────────────────────────────┤
│  GitHub Actions (CI/CD)             │  ← Same task commands
└─────────────────────────────────────┘
```

**Key benefit:** Hooks and CI run identical validation logic!

---

## Dependencies Required

### CI Environment Needs:
1. **go-task** - Task runner
   ```yaml
   - run: sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin
   ```

2. **bun** - Package manager
   ```yaml
   - uses: oven-sh/setup-bun@v1
   ```

3. **Node.js** - For automation scripts
   ```yaml
   - uses: actions/setup-node@v4
     with:
       node-version: '20'
   ```

4. **Encore CLI** - For backend (if needed)
   ```yaml
   - run: curl -L https://encore.dev/install.sh | bash
   ```

---

## Testing Strategy

### Before Activation

1. **Local testing:**
   ```bash
   cd .cursor
   task founder:rules:check  # Should pass
   task qa:smoke:backend     # Should pass
   task qa:smoke:frontend    # Should pass
   ```

2. **Feature branch testing:**
   - Rename scaffold → `.yml`
   - Push to feature branch
   - Verify all jobs green
   - Fix any issues
   - Merge to main

3. **Monitor first runs:**
   - Check execution times
   - Verify all tasks complete
   - Look for environment issues

---

## Workflow Design Principles

### 1. **Consistency**
- Same commands as local development
- No CI-specific scripts
- Identical validation logic

### 2. **Redundancy**
- Hooks catch issues locally
- CI catches anything that bypassed hooks
- Multiple layers of protection

### 3. **Speed**
- Jobs run in parallel where possible
- Caching for dependencies
- Fast feedback (target: <5 min)

### 4. **Clarity**
- Clear job names
- Helpful error messages
- Links to documentation

---

## Future Enhancements

### Planned Additions

1. **Deployment workflow** (deploy.yml.scaffold)
   - Deploy backend to Encore Cloud
   - Deploy frontend to Vercel
   - Smoke tests on staging

2. **Release workflow** (release.yml.scaffold)
   - Create GitHub releases
   - Generate changelog
   - Tag versions

3. **Performance monitoring** (performance.yml.scaffold)
   - Lighthouse scores
   - Bundle size checks
   - API performance tests

---

## Troubleshooting

### Common Issues

**"Task command not found"**
```yaml
# Add this before running tasks:
- run: sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin
```

**"automation scripts fail"**
```yaml
# Ensure Node.js is installed:
- uses: actions/setup-node@v4
```

**"Services don't start"**
```yaml
# Give services time to start:
- run: sleep 5  # After starting service
```

---

## Activation Checklist

Before renaming `.scaffold` files to `.yml`:

- [ ] All local tasks tested and passing
- [ ] Dependencies documented
- [ ] Environment variables configured
- [ ] Test database setup (if needed)
- [ ] Secrets configured (if needed)
- [ ] Team notified of new CI checks
- [ ] Feature branch test successful
- [ ] Documentation updated

---

**Last Updated:** 2025-11-07  
**Status:** Scaffolded, ready for future activation  
**Maintainer:** Founder

