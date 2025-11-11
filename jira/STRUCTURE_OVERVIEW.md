# JIRA Folder Structure - Visual Overview

```
/Users/priyankalalge/ScreenGraph/Code/ScreenGraph/jira/
│
├── 📋 feature-requests/
│   ├── 📄 TEMPLATE-main.md       ← Template for main ticket
│   ├── 📄 TEMPLATE-retro.md      ← Template for retrospective
│   ├── 📄 TEMPLATE-status.md     ← Template for status updates
│   │
│   ├── 📁 FR-DEMO-example-feature/    [EXAMPLE]
│   │   ├── FR-DEMO-main.md
│   │   ├── FR-DEMO-status.md
│   │   ├── FR-DEMO-retro.md
│   │   └── README.md
│   │
│   └── 📁 [Your features here]/
│       ├── FR-XXX-main.md        ← Core requirements
│       ├── FR-XXX-status.md      ← Progress tracking
│       └── FR-XXX-retro.md       ← Lessons learned
│
├── 🐛 bugs/
│   ├── 📄 TEMPLATE-main.md       ← Template for bug report
│   ├── 📄 TEMPLATE-retro.md      ← Template for retrospective
│   ├── 📄 TEMPLATE-status.md     ← Template for status updates
│   ├── 📄 TEMPLATE.md            ← (Legacy, kept for compatibility)
│   │
│   ├── 📁 BUG-001-live-inspector-not-visible/
│   │   └── BUG-001-live-inspector-not-visible.md
│   │
│   ├── 📁 BUG-002-graph-not-trigger/
│   │   └── BUG-002-graph-not-trigger.md
│   │
│   └── 📁 [Your bugs here]/
│       ├── BUG-XXX-main.md       ← Bug description
│       ├── BUG-XXX-status.md     ← Investigation progress
│       └── BUG-XXX-retro.md      ← Root cause analysis
│
├── 🔧 tech-debt/
│   ├── 📄 TEMPLATE-main.md       ← Template for tech debt
│   ├── 📄 TEMPLATE-retro.md      ← Template for retrospective
│   ├── 📄 TEMPLATE-status.md     ← Template for status updates
│   │
│   └── 📁 [Your tech debt here]/
│       ├── TD-XXX-main.md        ← Problem description
│       ├── TD-XXX-status.md      ← Refactoring progress
│       └── TD-XXX-retro.md       ← Impact measurement
│
├── 📖 README.md                   ← Complete documentation
└── 📊 IMPLEMENTATION_SUMMARY.md   ← This implementation summary
```

---

## Automation Commands Location

```
/Users/priyankalalge/ScreenGraph/Code/ScreenGraph/.cursor/commands/
│
├── 🚀 create-feature-doc              ← Creates feature folder
├── 🐛 create-bug-doc                  ← Creates bug folder
├── 🔧 create-tech-debt-doc             ← Creates tech debt folder
│
└── 📖 README-JIRA-COMMANDS.md     ← Quick reference guide
```

---

## How the Pattern Works

### 1. Discovery Phase
```
You identify: "We need API rate limiting"
             or "Graph projection is broken"
             or "Logging needs refactoring"
```

### 2. Creation Phase
```bash
# In Cursor, type one of:
@create-feature-doc
@create-bug-doc
@create-tech-debt-doc

# Answer prompts:
ID: FR-012
Title: api-rate-limiting
```

### 3. Folder Created
```
jira/feature-requests/FR-012-api-rate-limiting/
├── FR-012-main.md      ← Fill this first
├── FR-012-status.md    ← Update weekly
└── FR-012-retro.md     ← Complete when done
```

### 4. Work Flow
```
Start
  ↓
Fill main.md (requirements, acceptance criteria)
  ↓
Begin development
  ↓
Update status.md (weekly or when blockers occur)
  ↓
Complete work
  ↓
Fill retro.md (lessons learned, metrics)
  ↓
Done
```

---

## Key Features

### ✅ Consistency
- Every item uses same structure
- No confusion about where to document
- Easy to onboard new team members

### ✅ Automation
- Commands eliminate manual setup
- Templates ensure completeness
- Placeholders auto-replaced

### ✅ Tracking
- Status reports show progress
- Blockers visible immediately
- Timeline tracking built-in

### ✅ Learning
- Retros capture lessons
- Metrics measure impact
- Action items prevent repeat issues

---

## Usage Frequency Guide

| File | When to Update |
|------|---------------|
| `*-main.md` | **Once** - at creation (may refine as you learn more) |
| `*-status.md` | **Weekly** - or when something significant happens |
| `*-retro.md` | **Once** - after completion |

---

## Example Timeline

### Week 1
```
Mon: @create-feature-doc → Fill FR-012-main.md
Tue: Start development
Fri: First status.md update → "Database schema designed, 20% complete"
```

### Week 2
```
Mon: Status update → "API endpoints implemented, 50% complete"
Wed: BLOCKER → Status update → "Waiting on rate limiter library review"
Fri: Status update → "Blocker cleared, tests written, 80% complete"
```

### Week 3
```
Mon: Status update → "Code review done, deploying, 95% complete"
Wed: Complete! Fill FR-012-retro.md
    - What went well: Clean API design
    - What could improve: Earlier library review
    - Metrics: API response time 50ms
    - Lesson: Review dependencies earlier in planning
```

---

## Migration Path (Optional)

If you have existing flat files, you can migrate them:

```bash
# Old structure (current)
jira/feature-requests/FR-001-post-run-endpoint.md

# New structure
jira/feature-requests/FR-001-post-run-endpoint/
├── FR-001-main.md         ← Move old file here, rename
├── FR-001-status.md       ← Create from template
└── FR-001-retro.md        ← Create from template
```

---

## Quick Reference

| Task | Command |
|------|---------|
| New feature | `@create-feature-doc` |
| New bug | `@create-bug-doc` |
| New tech debt | `@create-tech-debt-doc` |
| Read guide | Open `jira/README.md` |
| Quick tips | Open `.cursor/commands/README-JIRA-COMMANDS.md` |

---

**Status**: ✅ Complete and Tested  
**Ready to Use**: Yes  
**Example Available**: `jira/feature-requests/FR-DEMO-example-feature/`










