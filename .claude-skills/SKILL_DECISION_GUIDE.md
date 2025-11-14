# ScreenGraph Skills: Decision Guide

## 🎯 Quick Reference: Which Skill Should I Use?

### I'm building something...
- **Backend feature** → `backend-development_skill`
- **Frontend feature** → `frontend-development_skill`

### Something broke...
- **Backend test failed** → `backend-debugging_skill`
- **UI is broken** → `frontend-debugging_skill`

### I'm testing...
- **Manual testing + watching logs** → `dev-log-monitoring_skill`
- **Automated regression testing** → `e2e-testing_skill`

---

## 📊 Skill Comparison Matrix

| Skill | Primary Purpose | When Active | Output | Tools Used |
|-------|----------------|-------------|---------|------------|
| **dev-log-monitoring** | Live monitoring + post-run analysis | During manual testing | Log analysis report | Playwright MCP, grep, tail |
| **e2e-testing** | Automated regression testing | Pre-push, CI/CD | Pass/fail + artifacts | Playwright automated |
| **backend-debugging** | Fix failing tests/services | When tests fail | Root cause + fix | SQL queries, diagnostic scripts |
| **backend-development** | Build new backend features | During development | Working code + tests | Encore.ts, integration tests |
| **frontend-debugging** | Fix UI/component issues | When UI breaks | Root cause + fix | Browser DevTools, type checking |
| **frontend-development** | Build new UI features | During development | Working components | Svelte 5, Skeleton UI |

---

## 🔄 Common Workflows

### Workflow A: Building New Backend Feature
```
1. backend-development_skill (build + write tests)
   ↓
2. If tests fail → backend-debugging_skill
   ↓
3. Before commit → e2e-testing_skill (verify no regressions)
```

### Workflow B: Building New Frontend Feature
```
1. frontend-development_skill (build UI)
   ↓
2. If UI breaks → frontend-debugging_skill
   ↓
3. Manual verification → dev-log-monitoring_skill (watch full flow)
   ↓
4. Before commit → e2e-testing_skill (automated validation)
```

### Workflow C: Investigating Production Issue
```
1. dev-log-monitoring_skill (reproduce + capture logs)
   ↓
2a. If backend issue → backend-debugging_skill
2b. If frontend issue → frontend-debugging_skill
   ↓
3. Write regression test → e2e-testing_skill
```

### Workflow D: Pre-Release Verification
```
1. e2e-testing_skill (run full suite)
   ↓
2. If failures → specific debugging skill
   ↓
3. Manual smoke test → dev-log-monitoring_skill (watch key flows)
```

---

## ✅ Why We Need All 6 Skills

**dev-log-monitoring_skill** ✅
- **Unique:** Only skill for live log monitoring during manual testing
- **No Overlap:** All others are automated or focus on different phases

**e2e-testing_skill** ✅
- **Unique:** Only automated Playwright testing skill
- **No Overlap:** Automation vs manual exploration

**backend-debugging_skill** ✅
- **Unique:** SQL queries, diagnostic scripts, structured log analysis
- **No Overlap:** Diagnosis, not development

**backend-development_skill** ✅
- **Unique:** Integration test patterns, polling helpers
- **No Overlap:** Building, not debugging

**frontend-debugging_skill** ✅
- **Unique:** 10-phase systematic Svelte/runes debugging
- **No Overlap:** Diagnosis, not development

**frontend-development_skill** ✅
- **Unique:** Svelte 5 runes + Skeleton UI patterns
- **No Overlap:** Building, not debugging

---

## 🎓 Visual Decision Tree

```
"I want to..."
      │
      ├─── BUILD something?
      │    ├─── Backend? → backend-development_skill
      │    └─── Frontend? → frontend-development_skill
      │
      ├─── DEBUG something?
      │    ├─── Backend test failed? → backend-debugging_skill
      │    ├─── Frontend/UI broken? → frontend-debugging_skill
      │    └─── E2E test failed? → e2e-testing_skill (then escalate)
      │
      └─── TEST something?
           ├─── Manual + watch logs? → dev-log-monitoring_skill
           └─── Automated regression? → e2e-testing_skill
```

---

## 💡 Pro Tips

1. **Start with development skill, escalate to debugging skill**
   - Don't jump to debugging without trying development patterns first

2. **dev-log-monitoring is for MANUAL exploration**
   - Use when you want to understand system behavior
   - Not for CI/CD (use e2e-testing for that)

3. **e2e-testing catches regressions, debugging skills find root causes**
   - E2E tells you WHAT broke
   - Debugging skills tell you WHY it broke

4. **All 6 skills are complementary, not redundant**
   - Each fills a specific gap in the development lifecycle

