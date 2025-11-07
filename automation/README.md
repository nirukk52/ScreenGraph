# Automation Library

**Purpose:** Shared automation library used by all four automation systems:
- `.husky/` - Git hooks
- `.cursor/` - Cursor commands (Taskfile)
- `.github/` - GitHub Actions workflows
- `.claude-skills/` - Claude AI agent workflows

This library eliminates code duplication and ensures consistent behavior across all entry points.

---

## Architecture

### Single Source of Truth

All business logic for port coordination, environment resolution, and founder rules validation lives here. The four systems above **call** this library—they don't duplicate it.

```
┌─────────────┐
│   HUSKY     │  Git Hooks
└──────┬──────┘
       │
       ├──────────┐
       │          │
┌──────▼──────┐  │  ┌─────────────┐
│   CURSOR    │  │  │   GITHUB    │  CI/CD
└──────┬──────┘  │  └──────┬──────┘
       │         │         │
       └────┬────┴────┬────┘
            │         │
       ┌────▼─────────▼────┐
       │   automation/     │  ← YOU ARE HERE
       │   - scripts/      │
       │   - lib/          │
       │   - templates/    │
       └───────────────────┘
```

---

## Folder Structure

```
automation/
├── README.md                          # This file
├── scripts/                           # Executable scripts
│   ├── env.mjs                        # Environment & port resolution
│   ├── check-founder-rules.mjs        # Founder rules validation
│   └── port-coordinator.mjs           # Symlink → ../../scripts/port-coordinator.mjs
├── lib/                               # Reusable library functions
│   ├── preflight-checks.mjs           # (Future) Preflight validation
│   └── port-resolver.mjs              # (Future) Port allocation logic
└── templates/                         # Document templates
    ├── github/                        # GitHub issue templates
    └── jira/                          # JIRA ticket templates
```

---

## Scripts

### `env.mjs` - Environment Resolution

Central module for all environment variables and service status.

**Usage:**
```bash
# Get service status
node automation/scripts/env.mjs status

# Print environment variables (for Task/shell)
node automation/scripts/env.mjs print

# Get JSON output
node automation/scripts/env.mjs json

# Get specific values
node automation/scripts/env.mjs backend-port
node automation/scripts/env.mjs frontend-port
```

**Output Example:**
```
📍 Worktree: jcCtc

🔢 Port Configuration:

   🟢 backend     Port 4100 - Running (PID 12345, encore)
   🟢 frontend    Port 5273 - Running (PID 12346, vite)
   ⚪ dashboard   Port 9500 - Available
   ⚪ appium      Port 4823 - Available
```

**Used by:**
- Taskfile (for environment variable resolution)
- Cursor commands (for status checks)
- Husky hooks (for validation)

---

### `check-founder-rules.mjs` - Founder Rules Validation

Validates all Founder Rules before commits/pushes.

**Rules Checked:**
1. ❌ No `console.log` (must use `encore.dev/log`)
2. ❌ No `any` types (must use explicit types)
3. ❌ No root `package.json` with backend/frontend deps
4. ❌ No British spelling (must use American)
5. ⚠️  Functions/classes should have comments (warning only)

**Usage:**
```bash
# Run all checks
node automation/scripts/check-founder-rules.mjs

# Include warnings
node automation/scripts/check-founder-rules.mjs --strict
```

**Output Example:**
```
🔍 Checking founder rules...

🚨 Founder Rules Violations:

❌ no-console (2 violations):
   backend/agent/orchestrator/main.ts:45 - Found console.* (use encore.dev/log instead)
   backend/run/start.ts:123 - Found console.* (use encore.dev/log instead)

❌ no-any (1 violation):
   backend/graph/types.ts:12 - Found 'any' type (use explicit types)

❗ Fix these issues before committing.
```

**Used by:**
- Husky `pre-commit` hook (prevents bad commits)
- GitHub CI (catches violations in PRs)
- Cursor commands (manual validation)

---

### `port-coordinator.mjs` - Port Resolution

Simple port resolver (symlinked from `scripts/port-coordinator.mjs`).

**Usage:**
```bash
# Show ports
bun automation/scripts/port-coordinator.mjs

# JSON output
bun automation/scripts/port-coordinator.mjs --json
```

**Note:** This is a symlink to maintain backward compatibility. New code should use `env.mjs` instead, which wraps this functionality.

---

## Integration Examples

### Taskfile Usage

```yaml
# .cursor/Taskfile.yml
version: '3'

vars:
  BACKEND_PORT:
    sh: node automation/scripts/env.mjs backend-port

tasks:
  preflight:
    desc: "Run preflight checks"
    cmds:
      - node automation/scripts/check-founder-rules.mjs
```

### Husky Hook Usage

```bash
# .husky/pre-commit
#!/bin/sh
node automation/scripts/check-founder-rules.mjs
```

### GitHub Workflow Usage

```yaml
# .github/workflows/ci.yml
- name: Check Founder Rules
  run: node automation/scripts/check-founder-rules.mjs
```

### Cursor Command Usage

```bash
# .cursor/commands/start
#!/bin/bash
node automation/scripts/env.mjs status
```

---

## Design Principles

### 1. **Modularity**
Each script is self-contained and can be used independently.

### 2. **Composability**
Scripts can import each other as needed.

### 3. **CLI + Export**
All scripts work as both:
- CLI tools (when run directly)
- ES modules (when imported)

### 4. **Clear Output**
- Errors use exit code 1
- Success uses exit code 0
- Human-friendly output by default
- JSON output available via `--json` or `json` command

### 5. **No Dependencies on External Systems**
Scripts only depend on:
- Node.js built-ins
- Git (available everywhere)
- Common Unix tools (lsof, ps)

---

## Future Enhancements

### Planned for Phase 2+
- `automation/lib/preflight-checks.mjs` - Extracted preflight logic
- `automation/lib/port-resolver.mjs` - Dynamic port allocation
- `automation/scripts/validate-commit-msg.mjs` - Conventional commit message validation
- `automation/templates/` - Standardized templates for GitHub issues, JIRA tickets, PR checklists

---

## Contributing

### Adding a New Script

1. Create the script in `automation/scripts/`
2. Add CLI usage with `if (import.meta.url === ...)` check
3. Export functions for use as module
4. Document in this README
5. Test independently
6. Integrate into Taskfile/Husky/GitHub/Claude

### Naming Conventions

- **Scripts:** `kebab-case.mjs` (e.g., `check-founder-rules.mjs`)
- **Functions:** `camelCase` (e.g., `getCurrentWorktree`)
- **CLI commands:** `kebab-case` (e.g., `node env.mjs backend-port`)

### Testing

Each script should be testable independently:

```bash
# Test env resolution
node automation/scripts/env.mjs status

# Test founder rules (should pass clean codebase)
node automation/scripts/check-founder-rules.mjs
```

---

## Troubleshooting

### "Module not found" errors

Make sure you're running from the repository root:
```bash
cd /path/to/ScreenGraph
node automation/scripts/env.mjs status
```

### Port detection not working

Ensure `.env` file exists in root:
```bash
ls -la .env
# If missing, services will use defaults
```

### Founder rules failing unexpectedly

Check for:
- Hidden `console.log` statements
- Commented-out code with violations
- Generated files in `encore.gen/` (should be ignored)

---

## Related Documentation

- `.cursor/PORT_ISOLATION_ENFORCEMENT.md` - Port isolation strategy
- `.cursor/rules/founder_rules.mdc` - Complete founder rules
- `FR-013-main.md` - This feature's implementation plan

---

**Last Updated:** 2025-11-07  
**Maintainer:** Founder  
**Status:** Phase 1 - Foundation Complete

