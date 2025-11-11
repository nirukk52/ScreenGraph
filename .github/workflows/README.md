# GitHub Workflows

**Status:** Active  
**Purpose:** Fast parallel CI/CD automation for backend and frontend

---

## Active Workflows

### 🔧 `backend-test.yml` - Backend Encore Tests

**Status:** ✅ Active

**What it does:**
- Runs backend unit and integration tests via `encore test`
- Executes on changes to `backend/**` files
- Uses dependency caching for faster runs

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only runs when backend files change

**Runtime:** ~5-10 minutes

**Key features:**
- Bun dependency caching
- Encore CLI installation
- Parallel execution with `frontend-e2e.yml`
- Test result artifact uploads

---

### 🎭 `frontend-e2e.yml` - Frontend E2E Tests

**Status:** ✅ Active

**What it does:**
- Runs Playwright E2E tests in headless mode
- Executes on changes to `frontend/**` files
- Uses Playwright browser caching for faster runs

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Only runs when frontend files change

**Runtime:** ~10-15 minutes

**Key features:**
- Bun dependency caching
- Playwright browser caching
- Chromium-only for CI speed
- Playwright report and test result uploads
- Frontend build validation

---

### 📋 `ci.yml.scaffold` - Legacy Unified CI (Inactive)

**Status:** ⚠️ Scaffolded (not active)

**Note:** This monolithic workflow has been replaced by the faster, parallel `backend-test.yml` and `frontend-e2e.yml` workflows. The scaffold is kept for reference.

**What it did:**
- Validates founder rules
- Runs backend smoke tests
- Runs frontend smoke tests
- Checks TypeScript types

**Why replaced:**
- Parallel execution is faster (workflows run simultaneously)
- Path-based filtering prevents unnecessary runs
- Smaller, focused workflows are easier to debug
- Better aligns with qa_vibe.json layered architecture

---

## CI Architecture: Fast Parallel Execution

Following qa_vibe.json principles, the CI is designed for speed and reliability:

```
┌─────────────────────────────────────────┐
│  PR/Push to main/develop                │
└─────────────────────────────────────────┘
                 │
                 ├──────────────────────────────┐
                 ▼                              ▼
    ┌─────────────────────────┐   ┌─────────────────────────┐
    │  backend-test.yml       │   │  frontend-e2e.yml       │
    │  (if backend/* changed) │   │  (if frontend/* changed)│
    └─────────────────────────┘   └─────────────────────────┘
                 │                              │
                 ├──────────────────────────────┤
                 ▼                              ▼
    ┌─────────────────────────┐   ┌─────────────────────────┐
    │  encore test            │   │  playwright test        │
    │  ~5-10 min              │   │  ~10-15 min             │
    └─────────────────────────┘   └─────────────────────────┘
```

**Benefits:**
- ⚡ **Parallel execution** - Backend and frontend tests run simultaneously
- 🎯 **Path-based filtering** - Only runs tests for changed code
- 🚀 **Smart caching** - Dependencies and browsers cached for speed
- 🔍 **Focused feedback** - Clear separation of backend vs frontend issues
- ♻️ **Cancellation** - Auto-cancels outdated runs on new pushes

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

## Workflow Details

### Backend Test Workflow

**File:** `backend-test.yml`

**Steps:**
1. Checkout code
2. Setup Bun (latest)
3. Install Encore CLI
4. Cache Bun dependencies (keyed by `backend/bun.lock`)
5. Install backend dependencies
6. Run `encore test`
7. Upload test results as artifacts

**Optimizations:**
- Dependency caching reduces install time
- Path-based filtering prevents unnecessary runs
- Concurrency cancellation for outdated runs
- 15-minute timeout for fast feedback

---

### Frontend E2E Test Workflow

**File:** `frontend-e2e.yml`

**Steps:**
1. Checkout code
2. Setup Bun (latest)
3. Cache Bun dependencies (keyed by `frontend/bun.lock`)
4. Install frontend dependencies
5. Cache Playwright browsers (keyed by `frontend/bun.lock`)
6. Install Playwright browsers (Chromium only for speed)
7. Build frontend
8. Run Playwright E2E tests in CI mode
9. Upload Playwright report and test results as artifacts

**Optimizations:**
- Chromium-only testing (faster than all browsers)
- Browser caching for subsequent runs
- Separate system deps install if cache hit
- Path-based filtering for frontend changes only
- 20-minute timeout for comprehensive E2E coverage

---

## Testing the Workflows

### Local Validation (Syntax)

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash  # Linux

# Validate workflow syntax
act --list --workflows .github/workflows/

# Dry run backend tests
act push --workflows .github/workflows/backend-test.yml --dry-run

# Dry run frontend E2E tests
act push --workflows .github/workflows/frontend-e2e.yml --dry-run
```

### Testing in CI

1. Push changes to feature branch
2. Monitor workflow runs in GitHub Actions tab
3. Verify both workflows execute correctly
4. Check for any failures or timeout issues
5. Review uploaded artifacts

---

## Future Enhancements

### Planned Additions

1. **Linting workflow** (lint.yml)
   - Run Biome linter on both backend and frontend
   - Separate from test workflows for faster feedback

2. **Type checking workflow** (typecheck.yml)
   - TypeScript type validation
   - Frontend Svelte type checking

3. **Deployment workflow** (deploy.yml.scaffold)
   - Deploy backend to Encore Cloud
   - Deploy frontend to Vercel
   - Smoke tests on staging

4. **Release workflow** (release.yml.scaffold)
   - Create GitHub releases
   - Generate changelog
   - Tag versions

5. **Performance monitoring** (performance.yml.scaffold)
   - Lighthouse scores
   - Bundle size checks
   - API performance tests

---

## Troubleshooting

### Common Issues

**Backend Tests**

**"Encore CLI not found"**
```yaml
# Verify PATH setup after Encore install:
- run: echo "$HOME/.encore/bin" >> $GITHUB_PATH
```

**"Tests timeout"**
```yaml
# Increase timeout if needed:
timeout-minutes: 20
```

---

**Frontend E2E Tests**

**"Playwright browsers not found"**
```yaml
# Install system dependencies separately if cache hit:
- run: bunx playwright install-deps chromium
  if: steps.playwright-cache.outputs.cache-hit == 'true'
```

**"Build fails"**
```yaml
# Ensure PUBLIC_API_BASE is set:
env:
  PUBLIC_API_BASE: http://localhost:4000
```

**"E2E tests flaky"**
- Review Playwright report artifact
- Check for timing issues in tests
- Consider increasing timeouts in `playwright.config.ts`
- Use `test.describe.serial()` for dependent tests

---

## Monitoring &amp; Maintenance

### Key Metrics to Track

- **Workflow duration** (target: <15 min total)
- **Cache hit rate** (should be >80% for dependencies)
- **Test failure rate** (should be <5%)
- **Artifact upload success** (should be 100%)

### Regular Maintenance

- **Monthly:** Review and update action versions
- **Quarterly:** Audit cache effectiveness
- **As needed:** Adjust timeouts based on test suite growth
- **On failures:** Investigate and fix immediately (don't ignore flaky tests per qa_vibe.json)

---

**Last Updated:** 2025-11-11  
**Status:** Active - Fast parallel CI workflows for backend and frontend  
**Maintainer:** Founder

