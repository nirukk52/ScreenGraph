# Bug Report: Failing GitHub PR Tasks

**Created**: 2025-11-05  
**Reporter**: @copilot  
**Status**: Open

## Issue Summary
GitHub PR checks/tasks are failing and need to be fixed following GitHub Copilot best practices.

## Impact
- **Severity**: High
- **Affected Area**: CI-CD

## Current Behavior
PR checks are failing, preventing merges and blocking development workflow.

## Expected Behavior
All PR checks should pass successfully following GitHub's best practices for Copilot coding agent:
- Automated tests should run and pass
- Code quality checks should pass
- Security scans should complete without critical issues
- Build processes should succeed

## Steps to Reproduce
1. Create a pull request
2. Observe failing checks in the PR status
3. Review check details to identify failure reasons

## Root Cause
Based on the PR context, potential root causes include:
- Missing or misconfigured GitHub Actions workflows
- No automated testing infrastructure in place
- Missing linting or code quality checks
- No security scanning configured

## Proposed Solution

### 1. Set Up GitHub Actions Workflows
Create `.github/workflows/` directory with essential workflows:

#### **ci.yml** - Main CI Pipeline
- Install dependencies (Bun)
- Run linters (Biome)
- Build backend (Encore)
- Build frontend (SvelteKit)
- Run tests (backend and frontend)

#### **codeql.yml** - Security Analysis
- Configure CodeQL for TypeScript
- Scan on push and PR events
- Report security vulnerabilities

#### **pr-checks.yml** - PR Quality Checks
- Validate PR title format
- Check for breaking changes
- Verify documentation updates
- Ensure no prohibited patterns (console.log, any type, etc.)

### 2. Follow GitHub Copilot Best Practices
Based on https://docs.github.com/en/copilot/get-started/best-practices:

- **Clear Issue Descriptions**: Ensure issues have clear acceptance criteria
- **Automated Testing**: Set up comprehensive test suite
- **Code Review Guidelines**: Establish review process
- **Security First**: Implement security scanning and vulnerability checks
- **Documentation**: Keep documentation in sync with code changes
- **Consistent Style**: Enforce code style with linters (already using Biome)

### 3. Backend Testing Strategy
```bash
# Encore tests
cd backend && encore test

# Type checking
cd backend && bun run type-check
```

### 4. Frontend Testing Strategy
```bash
# SvelteKit tests
cd frontend && bun test

# Type checking
cd frontend && bun run check

# Build verification
cd frontend && bun run build
```

## Related Resources
- [GitHub Copilot Best Practices](https://docs.github.com/en/copilot/get-started/best-practices)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Encore CI/CD Guide](https://encore.dev/docs/deploy/ci-cd)
- Project: `.github/copilot-instructions.md` (newly created)
- Project: `biome.json` (linting configuration)

## Action Items

### Phase 1: Essential CI/CD Setup
- [ ] Create `.github/workflows/ci.yml` for main CI pipeline
- [ ] Configure Bun installation and caching
- [ ] Add backend build and test steps (Encore)
- [ ] Add frontend build and test steps (SvelteKit)
- [ ] Add Biome linting checks

### Phase 2: Security & Quality
- [ ] Create `.github/workflows/codeql.yml` for security scanning
- [ ] Create `.github/workflows/pr-checks.yml` for PR validation
- [ ] Add dependency vulnerability scanning
- [ ] Configure branch protection rules

### Phase 3: Documentation & Optimization
- [ ] Document CI/CD workflow in README.md
- [ ] Add workflow status badges to README
- [ ] Optimize workflow caching for faster builds
- [ ] Set up deployment workflows for preview environments

### Phase 4: Advanced Checks
- [ ] Add visual regression testing (if applicable)
- [ ] Add performance benchmarking
- [ ] Add accessibility checks
- [ ] Add bundle size monitoring

## Implementation Priority
1. **Immediate**: Create basic CI workflow (ci.yml) to unblock PR merges
2. **Short-term**: Add security scanning and PR checks
3. **Medium-term**: Enhance with advanced testing and monitoring
4. **Long-term**: Optimize and add preview deployments

## Notes
- All workflows should respect the project's architecture (backend/frontend independence)
- Use Bun as the package manager (not npm/yarn)
- Encore has its own testing framework - use `encore test` not `bun test` for backend
- Follow American English spelling in all documentation
- Reference `.github/copilot-instructions.md` for project-specific standards

## Success Criteria
- [ ] All PR checks pass on new commits
- [ ] CI workflow completes in < 5 minutes
- [ ] Security scans report no critical issues
- [ ] Code quality checks enforce project standards
- [ ] Documentation is updated with CI/CD information
