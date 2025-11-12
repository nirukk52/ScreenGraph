# FR-018: Turborepo Harness - Code Review

**Reviewed Date:** 2025-11-07  
**Status:** ✅ Approved with Conditions  
**Reviewer:** Technical Review  
**Implementation Phase:** Pilot (20% Complete)

---

## 📋 Executive Summary

FR-018 introduces a Turborepo-based development harness to streamline developer experience while maintaining strict backend/frontend isolation. The implementation adds root-level orchestration tooling (package.json, turbo.json) and updates automation entry points to support the new harness.

**Verdict:** Implementation is **architecturally sound** with clear guardrails, but requires completion of integration tasks before full adoption.

---

## 🔍 Changes Summary

### Files Added
1. `/package.json` - Root harness configuration (private, dev-only)
2. `/turbo.json` - Turborepo pipeline definitions

### Files Modified
1. `.cursor/rules/founder_rules.mdc` - Added FR-018 exception for dev-only root tooling
2. `.cursor/commands/founder/Taskfile.yml` - Updated to invoke Turborepo harness
3. `.husky/pre-push` - Changed to use `bun run qa:smoke` entry point
4. `CLAUDE.md` - Added Turborepo quick start documentation

### Services Touched
- None (harness is orchestration-only, no runtime changes)

---

## 🏗️ Architecture Review

### ✅ Strengths

#### 1. Strict Isolation Maintained
```json
// package.json
"workspaces": ["backend", "frontend"]
```
- Workspaces reference service directories without linking `node_modules`
- No shared runtime dependencies (only `turbo` as devDependency)
- Backend and frontend package.json files remain untouched

#### 2. Clear Separation of Concerns
```json
// turbo.json - Tasks are defined, not implemented
{
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "qa:smoke": { "cache": false, "outputs": [] }
  }
}
```
- Turborepo defines task **orchestration** only
- Actual implementation remains in backend/frontend scripts
- Pipeline configuration is declarative and minimal

#### 3. Backward Compatibility
```yaml
# Taskfile.yml - Wraps Turborepo
servers:start:
  cmds:
    - bun run dev  # Invokes Turborepo harness
```
- Existing Taskfile commands continue to work
- `task founder:servers:start` now delegates to `bun run dev`
- Fallback path preserved: developers can still run services directly

#### 4. Founder Rule Compliance
```markdown
# founder_rules.mdc
⚠️ Root `package.json` ONLY allowed for dev-only orchestration harnesses
- Must be marked `"private": true` ✅
- May contain devDependencies only ✅
- Must reference via workspace paths without linking node_modules ✅
- Must delegate QA/lint/typecheck to existing scripts ✅
```
All four criteria met. Exception is well-documented and narrowly scoped.

### ⚠️ Concerns

#### 1. Dual Orchestration Sources
**Issue:** Turborepo and Taskfile both define workflows, creating potential drift.

```bash
# Root package.json
"scripts": {
  "qa:smoke": "cd .cursor && task qa:smoke:all"
}
```

```yaml
# Taskfile.yml
testing:smoke:
  cmds:
    - task: qa:smoke:backend
    - task: qa:smoke:frontend
```

**Risk:** Definitions could diverge if updated separately.  
**Mitigation Required:** Document single source of truth (recommend Taskfile → Turborepo delegation).

#### 2. Port Coordination Gap
```json
// package.json
"predev": "cd .cursor && task shared:preflight"
```

**Current State:** `predev` hook references `shared:preflight` task that doesn't exist in Taskfile.  
**Risk:** Port isolation (FR-012) may not be enforced before service startup.  
**Recommendation:** Implement preflight task or remove hook.

#### 3. Incomplete Pipeline Definitions
```json
// turbo.json
"qa:smoke": { "cache": false, "outputs": [] }
```

**Observation:** Turborepo defines `qa:smoke` task, but individual services don't implement it in their package.json.  
**Current Flow:** Root script shells out to Taskfile, bypassing Turborepo pipeline execution.  
**Recommendation:** Either implement in service package.json or remove from turbo.json.

---

## 📝 Code Quality Assessment

### Type Safety: ✅ N/A
- No TypeScript code added (configuration only)

### Documentation: ✅ Excellent
- CLAUDE.md updated with clear quick start
- Founder rules explicitly amended with FR-018 exception
- Critique document provides architectural analysis
- All changes well-documented in FR-018-main.md

### Naming Conventions: ✅ Compliant
- Script names follow verb-noun pattern (`servers:start`, `workflows:regen-client`)
- Configuration files use standard names (`package.json`, `turbo.json`)

### Comments & Clarity: ⚠️ Adequate
- Configuration files lack inline comments explaining design choices
- Recommendation: Add comments to turbo.json explaining task definitions

**Example Enhancement:**
```json
{
  "tasks": {
    // Dev server runs indefinitely, no caching
    "dev": { "cache": false, "persistent": true },
    
    // QA tasks never cached to ensure fresh validation
    "qa:smoke": { "cache": false, "outputs": [] }
  }
}
```

---

## 🧪 Testing & Validation

### Test Coverage: ⚠️ Incomplete

**What's Tested:**
- ✅ Husky pre-push hooks execute `bun run qa:smoke`
- ✅ Taskfile `servers:start` successfully invokes Turborepo

**What's Missing:**
- ❌ No validation that `bun run dev` actually starts both services
- ❌ No smoke test for Turborepo pipeline execution
- ❌ No CI integration test for new harness

**Required Before Full Adoption:**
```bash
# Add to automation test suite
bun run dev &
sleep 10
curl http://localhost:4000/health  # Backend health
curl http://localhost:5173         # Frontend health
pkill -f "turbo run dev"
```

### Integration Points: ⚠️ Partial

**Husky Integration:** ✅ Complete
```bash
# .husky/pre-push
bun run qa:smoke || exit 1
```
Clean delegation to root script.

**CI Integration:** ⚠️ Not Verified
- Status document mentions "CI scaffold updated" but no CI file changes visible
- Recommendation: Verify GitHub Actions workflows use `bun run` entry points

**Taskfile Integration:** ⚠️ Mixed
- `founder:servers:start` delegates to harness ✅
- QA tasks reference undefined `shared:preflight` ❌
- Port resolution still uses `env.mjs` directly ✅

---

## 🔐 Security & Compliance

### Founder Rules Compliance: ✅ Pass

| Rule | Requirement | Status |
|------|-------------|--------|
| No root package.json | Exception granted for dev-only harness | ✅ Compliant |
| Private flag | Must be `"private": true` | ✅ Verified |
| Dev dependencies only | No runtime deps in root | ✅ Verified |
| Workspace isolation | No shared node_modules | ✅ Verified |
| Delegation to existing scripts | QA/lint/typecheck use Taskfile | ✅ Verified |

### Exception Scope: ✅ Narrow and Well-Defined
```markdown
⚠️ Root `package.json` ONLY allowed for dev-only orchestration harnesses
```
- Exception explicitly limited to Turborepo use case
- Clear constraints prevent scope creep
- Rollback plan documented in FR-018-critique.md

---

## 🔗 Integration Analysis

### FR-013 (Unified Automation): ⚠️ Partial Alignment

**Current State:**
- Taskfile remains source of truth for task definitions ✅
- Turborepo harness wraps Taskfile commands ✅
- Some duplication between root scripts and Taskfile ⚠️

**Recommendation:**
```json
// Prefer this pattern (delegation)
"qa:smoke": "cd .cursor && task qa:smoke:all"

// Over this pattern (duplication)
"qa:smoke": "bun test && vite test"
```

### FR-017 (Testing Stack): ✅ Compatible
- Testing commands continue to execute via Taskfile
- Husky hooks preserve existing QA entry points
- No regression risk identified

### FR-012 (Port Management): ⚠️ Needs Integration
- Port resolver (`env.mjs`) not called before harness starts services
- `predev` hook references non-existent task
- Multi-worktree isolation may be compromised

**Required Fix:**
```json
// package.json
"predev": "node automation/scripts/env.mjs validate-ports"
```

---

## 🚨 Risks & Mitigation

### High Priority

#### Risk 1: Port Coordination Bypass
**Severity:** High  
**Likelihood:** Medium  
**Impact:** Multi-worktree developers will encounter port conflicts

**Mitigation:**
- Implement `shared:preflight` task in Taskfile
- Call port validation before Turborepo spawns services
- Add integration test verifying port allocation

#### Risk 2: Definition Drift
**Severity:** Medium  
**Likelihood:** High  
**Impact:** Taskfile and package.json scripts diverge over time

**Mitigation:**
- Document single source of truth (recommend: Taskfile owns definitions)
- Add automation check comparing root scripts vs Taskfile
- Include in founder rules validation (`check-founder-rules.mjs`)

### Medium Priority

#### Risk 3: Incomplete Pipeline
**Severity:** Low  
**Likelihood:** Low  
**Impact:** Turborepo tasks defined but not fully utilized

**Mitigation:**
- Phase 2: Migrate service scripts to participate in Turborepo tasks
- Or remove unused task definitions from `turbo.json`
- Document intended vs actual pipeline usage

---

## 💡 Recommendations

### Immediate (Required Before Merge)

1. **Fix Port Coordination**
   ```yaml
   # Add to .cursor/commands/shared/Taskfile.yml
   preflight:
     desc: "Validate environment before starting services"
     cmds:
       - node ../../../automation/scripts/env.mjs validate-ports
   ```

2. **Add Harness Smoke Test**
   ```bash
   # Add to automation/TEST_PLAN.md
   - [ ] Verify `bun run dev` starts both services
   - [ ] Verify `bun run qa:smoke` executes all QA tasks
   - [ ] Verify Ctrl+C cleanly stops harness
   ```

3. **Document Decision**
   - Complete FR-018-retro.md after pilot validation
   - Add rollback procedure to FR-018-critique.md
   - Update BACKEND_HANDOFF.md and FRONTEND_HANDOFF.md

### Short-Term (Phase 2)

4. **Complete Pipeline Integration**
   ```json
   // backend/package.json
   "scripts": {
     "qa:smoke": "encore test --filter=smoke"
   }
   
   // frontend/package.json
   "scripts": {
     "qa:smoke": "playwright test --grep @smoke"
   }
   ```

5. **Consolidate Orchestration**
   - Choose Taskfile or Turborepo as primary orchestrator
   - Make the other delegate (current pattern: root → Taskfile is good)
   - Remove duplicate definitions

6. **Add Drift Detection**
   ```javascript
   // automation/scripts/check-harness-parity.mjs
   // Compare root package.json scripts vs Taskfile definitions
   // Fail if delegation pattern is broken
   ```

### Long-Term (Phase 3)

7. **CI Integration Verification**
   - Update GitHub Actions to use `bun run` entry points
   - Test in CI environment with smoke tests
   - Measure performance impact (startup time, cache hits)

8. **Remote Caching Evaluation**
   - Configure Turborepo remote cache (if adopted fully)
   - Measure CI speedup with cached builds
   - Document cache invalidation strategy

---

## 📊 Metrics & Quality Gates

### Code Quality: ✅ 4/5
- Well-structured configuration
- Clear separation of concerns
- Minor documentation gaps

### Compliance: ✅ 5/5
- Full founder rule compliance
- Exception properly documented
- Isolation guarantees maintained

### Integration: ⚠️ 3/5
- Husky integration complete
- Port coordination incomplete
- CI integration unverified

### Testing: ⚠️ 2/5
- No automated tests for harness
- Manual validation only
- Smoke test missing

### Documentation: ✅ 4/5
- CLAUDE.md updated
- Founder rules amended
- Inline comments lacking

**Overall Grade: B+ (Approved with Conditions)**

---

## ✅ Approval Conditions

### Must Fix Before Full Adoption
1. ✅ Implement `shared:preflight` task or remove from predev hook
2. ✅ Add harness smoke test to automation suite
3. ✅ Verify CI integration works with new entry points
4. ✅ Document rollback procedure

### Should Address in Phase 2
5. ⚡ Complete Turborepo pipeline (service-level tasks)
6. ⚡ Add drift detection between orchestration layers
7. ⚡ Measure and document performance impact

### May Defer to Future
8. 🔮 Remote caching configuration
9. 🔮 Monorepo build optimizations
10. 🔮 Advanced pipeline features (filtered builds, cache scopes)

---

## 🎯 Final Verdict

**Status: ✅ APPROVED WITH CONDITIONS**

The FR-018 Turborepo harness implementation demonstrates strong architectural discipline and proper founder rule compliance. The code quality is high, and the design preserves critical isolation guarantees.

**Strengths:**
- Clean separation of orchestration vs implementation
- Narrow, well-documented rule exception
- Backward compatibility maintained
- Clear delegation patterns

**Required Improvements:**
- Complete port coordination integration
- Add automated harness validation
- Verify CI compatibility
- Document rollback procedure

**Recommendation:**  
✅ **Approve merge to main** once port coordination fix is implemented.  
✅ **Continue pilot** with Phase 2 integration tasks as documented.  
✅ **Revisit adoption decision** after 2-week pilot period (measure DX improvement vs complexity cost).

---

## 📝 Reviewer Notes

### What Went Well
- FR-018 team properly researched trade-offs before implementation
- Founder rule amendment is precise and prevents scope creep
- Critique document demonstrates thorough architectural thinking
- Implementation is minimally invasive (only 4 files modified)

### What Could Be Improved
- Testing strategy should have been defined before code changes
- Port coordination gap should have been caught in design review
- CI integration should be verified as part of acceptance criteria

### Lessons for Future FRs
- Always validate integration points before marking acceptance criteria complete
- Include "does not break existing functionality" in test plans
- Add rollback testing to pilot evaluation criteria

---

**Review Completed:** 2025-11-07  
**Next Review:** After Phase 2 integration tasks complete (est. 2025-11-12)

