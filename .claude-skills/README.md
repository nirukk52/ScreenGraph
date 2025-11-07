# Claude Skills Configuration

**Purpose:** Define AI agent workflows that integrate with the unified automation system.

Claude Skills allow AI assistants (like Claude in Cursor) to trigger development workflows, run tests, check status, and manage the project through natural language commands.

---

## Overview

Claude Skills are JSON-defined workflows that map natural language intents to Task commands. This creates a seamless AI-assisted development experience.

### Architecture

```
User says: "Start the dev environment"
      ↓
Claude interprets intent
      ↓
Claude finds matching skill: "start-dev-environment"
      ↓
Claude executes: task founder:servers:start
      ↓
Task runs preflight checks → starts services
      ↓
User gets feedback: "✅ Services started on ports 4100, 5273"
```

---

## Skills Configuration

### Two Types of Skills

**1. Task-Based Skills** (`skills.json`)
- Automation workflows that execute Task commands
- 30+ development, testing, and workflow automations
- Activated by natural language intents

**2. Knowledge-Based Skills** (Subdirectories with `SKILL.md`)
- Specialized debugging procedures and methodologies
- Loaded via symlinks from backend/frontend for discoverability
- Activated by explicit mention or context matching

### Current Task-Based Skills

#### Development
- **start-dev-environment** - Start backend and frontend services
- **stop-dev-environment** - Stop all running services
- **check-service-status** - Show service status and ports

#### Testing
- **run-smoke-tests** - Run smoke tests for both backend and frontend
- **test-backend** - Run backend tests only
- **test-frontend** - Run frontend tests only

#### Quality
- **check-founder-rules** - Validate all founder rules compliance
- **check-worktree-isolation** - Verify worktree setup
- **typecheck-code** - Run TypeScript type checking

#### Project Management
- **create-feature-request** - Create new feature request folder
- **create-bug-report** - Create new bug report folder
- **generate-status-report** - Generate JIRA status report

#### Workflows
- **regenerate-client** - Regenerate frontend Encore client
- **reset-database** - Reset database (with safety checks)

### Current Knowledge-Based Skills

#### Browser Mastery
- **cursor-browser-mastery** - Complete guide to Cursor's @Browser tool
- **cursor-chrome-window-mastery** - Window management patterns

#### Domain-Specific Debugging
- **backend-debugging** - 10-phase Encore.ts debugging (symlinked from `backend/.claude-skills/`)
- **frontend-debugging** - 10-phase SvelteKit debugging (symlinked from `frontend/.claude-skills/`)

#### Skill Creation & Management
- **skill-creator** - Complete guide for creating new skills (copied from Anthropic's skills repository)

---

## Using Skills in Cursor

### Automatic Discovery

**Root-level skills** (`.claude-skills/` at workspace root):
- ✅ Auto-discovered by Cursor at workspace load
- ✅ Available without explicit mention
- ✅ Activated by natural language intent matching

**Subdirectory skills** (e.g., `backend/.claude-skills/`):
- ❌ NOT auto-discovered from subdirectories
- ✅ Use symlinks to make them discoverable (already configured)
- ✅ OR mention explicitly: "Use the backend-debugging skill"

### Natural Language Commands (Task-Based Skills)

Users can say things like:

```
"Start the dev servers"
→ Triggers: start-dev-environment

"Run the smoke tests"  
→ Triggers: run-smoke-tests

"Check if worktree isolation is working"
→ Triggers: check-worktree-isolation

"I made backend changes, update the frontend client"
→ Triggers: regenerate-client

"Create a new feature request"
→ Triggers: create-feature-request
```

Claude will:
1. Understand the intent
2. Find matching skill
3. Execute the Task command
4. Report results back to user

### Using Knowledge-Based Skills

**Explicit Activation:**
```
"Use the backend-debugging-encore skill to investigate why screens table is empty"
"Use the frontend-debugging-sveltekit skill to debug WebSocket connection"
"Use the skill-creator skill to build a new deployment skill"
```

**Context-Based Activation:**
Claude may automatically load relevant knowledge skills when:
- Working in related files (e.g., frontend component → frontend-debugging)
- Describing issues that match skill descriptions
- Following systematic debugging procedures

---

## Creating New Skills

Claude can quickly create new skills for you using the skill-creator workflow.

### Quick Start

**Natural Language (Recommended):**
```
"Create a skill for database migrations"
"Create a skill to help with API documentation"
"Update the deployment skill to include rollback steps"
```

Claude will:
1. Ask clarifying questions about the skill's purpose
2. Identify what scripts, references, or assets are needed
3. Generate the skill structure using `init_skill.py`
4. Create SKILL.md with proper frontmatter
5. Add relevant scripts/references/assets
6. Validate the skill structure

### Manual Creation

**Using Scripts Directly:**
```bash
# Initialize new skill
python3 skills-main/skill-creator/scripts/init_skill.py <skill-name> --path .claude-skills/

# Validate skill
python3 skills-main/skill-creator/scripts/quick_validate.py .claude-skills/<skill-name>

# Package skill for distribution
python3 skills-main/skill-creator/scripts/package_skill.py .claude-skills/<skill-name>
```

### Skill Structure

Every skill needs:
```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description)
│   └── Markdown instructions
└── Optional resources:
    ├── scripts/       - Executable code (Python/Bash)
    ├── references/    - Documentation to load as needed
    └── assets/        - Templates, files for output
```

### Best Practices

**When to Create a Skill:**
- ✅ You're rewriting the same code repeatedly
- ✅ You need domain-specific knowledge available
- ✅ There's a systematic procedure to follow
- ✅ You have reusable assets or templates

**Skill Types to Create:**
- **Workflow skills** - Multi-step procedures (e.g., deployment, testing)
- **Tool integration skills** - Work with specific APIs or file formats
- **Domain expertise skills** - Company schemas, business logic
- **Debugging skills** - Systematic investigation procedures

**Skill Naming:**
- Use kebab-case: `database-migration`, `api-generator`
- Be descriptive: `frontend-component-builder` not just `builder`
- Include context: `encore-database-migration` not just `migration`

### Iteration Workflow

1. Create initial skill
2. Use it on real tasks
3. Notice what's missing or inefficient
4. Say: "Update the [skill-name] skill to include [improvement]"
5. Claude updates SKILL.md or adds resources
6. Validate and test again

---

## Skill Definition Format

Each skill in `skills.json` has:

```json
{
  "name": "skill-identifier",
  "description": "Clear description of what this skill does",
  "command": "task namespace:command",
  "category": "development|testing|quality|project-management|workflows",
  "requires": ["optional-precondition"],
  "destructive": false
}
```

### Fields

- **name** (required): Unique identifier for the skill
- **description** (required): What the skill does (helps AI match intent)
- **command** (required): Task command to execute
- **category** (optional): Grouping for organization
- **requires** (optional): Preconditions (e.g., ["worktree-isolation"])
- **destructive** (optional): If true, AI will confirm before running

---

## Adding New Skills

### 1. Define the Skill

Edit `skills.json`:

```json
{
  "name": "deploy-to-staging",
  "description": "Deploy current branch to staging environment",
  "command": "task founder:workflows:deploy-staging",
  "category": "workflows",
  "requires": ["all-tests-passing"],
  "destructive": true
}
```

### 2. Ensure Task Exists

Make sure the referenced task is defined in a Taskfile:

```yaml
# .cursor/commands/founder/Taskfile.yml
tasks:
  workflows:deploy-staging:
    desc: "Deploy to staging"
    deps:
      - task: qa:smoke:backend
      - task: qa:smoke:frontend
    cmds:
      - ./scripts/deploy-staging.sh
```

### 3. Test the Skill

Ask Claude to use it:
```
"Deploy this to staging"
```

Claude should recognize the intent and execute the task.

---

## Skill Categories

### Development
Skills for starting, stopping, and managing services.

**Examples:**
- Start/stop environments
- Check service status
- View logs

### Testing
Skills for running tests at various levels.

**Examples:**
- Smoke tests
- Unit tests
- E2E tests
- Performance tests

### Quality
Skills for code quality and standards enforcement.

**Examples:**
- Founder rules validation
- Type checking
- Linting
- Worktree isolation checks

### Project Management
Skills for JIRA, documentation, and project tracking.

**Examples:**
- Create feature requests
- Create bug reports
- Generate status reports
- Link worktrees to issues

### Workflows
Complex multi-step workflows.

**Examples:**
- Deploy to staging/production
- Database migrations
- Client regeneration
- Release tagging

---

## Preconditions and Safety

### Requires Field

The `requires` field defines preconditions:

```json
{
  "name": "deploy-to-production",
  "requires": ["worktree-isolation", "all-tests-passing", "founder-approval"],
  "destructive": true
}
```

Claude will check (or ask user to confirm) these preconditions before executing.

### Destructive Flag

Skills marked `destructive: true` will trigger confirmation prompts:

```
User: "Reset the database"
Claude: "⚠️  This is a destructive operation that will delete all data. 
         Are you sure you want to continue?"
User: "Yes"
Claude: *executes task founder:workflows:db-reset*
```

---

## Integration with Other Systems

### Husky Hooks
Skills can trigger the same tasks as Git hooks:

```json
{
  "name": "pre-commit-checks",
  "description": "Run all pre-commit validation",
  "command": "task founder:rules:check"
}
```

This is the **same task** that runs in `.husky/pre-commit`.

### GitHub Actions
Skills can trigger the same tasks as CI/CD:

```json
{
  "name": "run-ci-checks",
  "description": "Run all CI checks locally",
  "command": "task qa:smoke:backend && task qa:smoke:frontend"
}
```

This mirrors `.github/workflows/ci.yml`.

### Cursor Commands
Skills wrap Taskfile commands:

```json
{
  "name": "show-ports",
  "command": "task ops:ports:show"
}
```

User can also run directly: `task ops:ports:show`

---

## Best Practices

### 1. Clear Descriptions

```json
// ✅ Good
{
  "description": "Start backend and frontend services with worktree isolation checks"
}

// ❌ Bad
{
  "description": "Start stuff"
}
```

### 2. Meaningful Names

```json
// ✅ Good
{
  "name": "regenerate-encore-client-after-backend-changes"
}

// ❌ Bad
{
  "name": "regen"
}
```

### 3. Use Categories

Group related skills for better organization.

### 4. Mark Destructive Operations

Always set `destructive: true` for operations that:
- Delete data
- Modify production
- Reset state
- Create releases

### 5. Document Prerequisites

Use `requires` to make expectations clear.

---

## Examples

### Simple Skill: Check Status

```json
{
  "name": "check-status",
  "description": "Show current service status and port assignments",
  "command": "task founder:servers:status",
  "category": "development"
}
```

### Complex Skill: Full Deploy

```json
{
  "name": "deploy-production",
  "description": "Deploy to production with full validation",
  "command": "task founder:workflows:release",
  "category": "workflows",
  "requires": [
    "worktree-is-main",
    "all-tests-passing",
    "founder-approval"
  ],
  "destructive": true
}
```

### Conditional Skill: Auto-Fix

```json
{
  "name": "auto-fix-founder-rules",
  "description": "Attempt to automatically fix common founder rule violations",
  "command": "task founder:rules:auto-fix",
  "category": "quality",
  "requires": ["no-uncommitted-changes"]
}
```

---

## Troubleshooting

### Skill Not Triggering

**Problem:** User says "start services" but Claude doesn't recognize it.

**Solution:** Update skill description to include more synonyms:
```json
{
  "description": "Start backend and frontend development servers (also: run services, launch dev environment, boot up)"
}
```

### Task Command Fails

**Problem:** Skill executes but task fails.

**Solution:** Test task independently:
```bash
task founder:servers:start --verbose
```

Fix the underlying task, not the skill.

### Permission Issues

**Problem:** Skill runs but scripts aren't executable.

**Solution:**
```bash
chmod +x automation/scripts/*.mjs
```

---

## Future Enhancements

### Planned Skills (Phase 3+)

- **auto-create-worktree** - Create and setup new worktree
- **merge-to-main** - Merge current branch with validation
- **generate-changelog** - Auto-generate changelog from commits
- **optimize-performance** - Run performance profiling
- **security-scan** - Run security vulnerability scan

---

## Related Documentation

- `.cursor/commands/README.md` - Taskfile command reference
- `automation/README.md` - Shared automation library
- `.husky/README.md` - Git hooks integration
- `FR-013-main.md` - Unified automation architecture

---

**Last Updated:** 2025-11-07  
**Status:** Phase 1 - Structure Defined  
**Maintainer:** Founder

