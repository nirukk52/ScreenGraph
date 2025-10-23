# Steering Wheel — ScreenGraph Documentation System

**Purpose**: Central knowledge base for ScreenGraph — business memory, engineering rules, procedures, preferences, and active work. Designed for AI-first collaboration with Leap, Cursor, and Claude.

---

## What This Is

The **Steering Wheel** is ScreenGraph's single source of truth for:
- **Business context**: What we're building, why, and for whom
- **Technical rules**: Non-negotiable engineering constraints
- **Domain facts**: Immutable system truths and architecture
- **Procedures**: Repeatable operational playbooks
- **Preferences**: Cultural coding styles and conventions
- **Strategic thinking**: Founder reflections and roadmap
- **Active work**: Current focus, tasks, and WIP

---

## Structure

```
/steering-docs
├── config/              # AI agent configuration
├── rules/               # Hard constraints (must follow)
├── facts/               # Immutable truths (what is)
├── procedures/          # How-tos and playbooks
├── preferences/         # Styles and culture (soft guidelines)
├── reports/             # Strategic thinking and reflections
├── wip/                 # Active work area
└── tasks/               # Atomic task management
```

---

## AI Agent Integration

### Mandatory Reading

Before performing any work, AI agents must read:
1. `config/ai.config.json` — mandatory reading list
2. `rules/coding-standards.md` — code quality requirements
3. `wip/current-focus.md` — current priorities
4. `tasks/today.md` — active tasks

See `config/ai.config.json` for the complete list.

### Update Protocol

AI agents can:
- **Read freely**: All markdown files are open for context
- **Update WIP/tasks**: Current work documents are living
- **Suggest rule changes**: But must ask human approval
- **Never modify**: Facts without human confirmation

---

## For Humans

### Quick Start
1. Check `wip/current-focus.md` for today's priority
2. Review `tasks/today.md` for active tasks
3. Update `reports/founder-daily.md` with reflections

### Update Workflow
1. Edit markdown files directly in this folder
2. Commit changes to Git (auto-tracked)
3. AI agents will pick up changes automatically

### Categories Explained

**Rules**: Non-negotiable. Violating these breaks the build or architecture.

**Facts**: Objective reality. Change only when system actually changes.

**Procedures**: Step-by-step guides. Update when process improves.

**Preferences**: Cultural norms. Can evolve as team grows.

**Reports**: Strategic snapshots. Archive old, create new.

**WIP**: High churn. Update daily or hourly.

**Tasks**: Atomic actions. Move from today → completed.

---

## Why This Approach?

**Vibe coding, Rapid Dev, Reliability**

1. **AI-First**: Markdown in predictable locations, config-driven mandatory reading
2. **Native Integration**: Lives in codebase, zero deployment overhead
3. **Real-Time**: Edit and see changes instantly, no build cycle
4. **Single Source of Truth**: One place for all context
5. **Version Controlled**: Git tracks all changes automatically
6. **Scalable**: Start simple, add features (chat, search) incrementally

---

## Maintenance

- **Daily**: Update `wip/current-focus.md` and `tasks/today.md`
- **Weekly**: Review `wip/m6-checklist.md` milestone progress
- **Monthly**: Update `reports/strategy-roadmap.md`
- **As needed**: Evolve rules, procedures, and facts

---

**Last Updated**: 2025-10-23  
**Maintained by**: Founder + AI Agents  
**System**: ScreenGraph — A living map of your mobile app
