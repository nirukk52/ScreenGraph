# Automation Library - Quick Reference

> **Purpose**: Single source of truth for all automation across Husky, Cursor, GitHub, and Claude.
> **Status**: Phase 1 Complete - Foundation established

---

## Quick Commands

### Environment & Status
```bash
# Show service status
node automation/scripts/env.mjs status

# Get ports
node automation/scripts/env.mjs backend-port    # → 4100
node automation/scripts/env.mjs frontend-port   # → 5273

# Print all env vars
node automation/scripts/env.mjs print
```

### Founder Rules Check
```bash
# Run all checks
node automation/scripts/check-founder-rules.mjs

# With warnings
node automation/scripts/check-founder-rules.mjs --strict
```

---

## File Structure

```
automation/
├── scripts/
│   ├── env.mjs                    # Environment & port resolution
│   ├── check-founder-rules.mjs    # Founder rules validator
│   └── port-coordinator.mjs       # Symlink → ../../scripts/
├── lib/
│   ├── preflight-checks.mjs       # (Future) Extracted checks
│   └── port-resolver.mjs          # (Future) Port allocation
└── templates/
    ├── github/                    # GitHub issue templates
    └── jira/                      # JIRA ticket templates
```

---

## Integration Points

### Husky Hooks
```bash
# .husky/pre-commit
node automation/scripts/check-founder-rules.mjs
```

### Taskfile
```yaml
vars:
  BACKEND_PORT:
    sh: node automation/scripts/env.mjs backend-port
```

### GitHub Actions
```yaml
- name: Check Founder Rules
  run: node automation/scripts/check-founder-rules.mjs
```

### Claude Skills
```json
{
  "command": "node automation/scripts/env.mjs status"
}
```

---

## Scripts API

### env.mjs
**Exports**: `getPorts()`, `getServiceStatus()`, `printStatus()`, `printEnv()`

**CLI**: `status | print | json | backend-port | frontend-port | worktree-name`

### check-founder-rules.mjs
**Exports**: `checkNoConsoleLog()`, `checkNoAnyType()`, etc.

**CLI**: (no args) or `--strict`

---

## Founder Rules Enforced

1. ❌ No `console.log` → Use `encore.dev/log`
2. ❌ No `any` types → Use explicit types
3. ❌ No root `package.json` with backend/frontend deps
4. ❌ No British spelling → American only
5. ⚠️  Functions/classes need comments

---

## Testing Scripts Independently

```bash
# Test env resolution
node automation/scripts/env.mjs status
# Expected: Shows services, ports, status

# Test founder rules (should pass on clean codebase)
node automation/scripts/check-founder-rules.mjs
# Expected: ✅ All founder rules passed
```

---

## Common Patterns

### Get Ports
```javascript
import { getPorts } from './automation/scripts/env.mjs';
const ports = getPorts();
// { backend: 4100, frontend: 5273, dashboard: 9500, appium: 4823 }
```

### Check Port Status
```javascript
import { checkPort } from './automation/scripts/env.mjs';
const status = checkPort(4100);
// { inUse: true, pid: 12345, process: "encore" }
```

---

## Related Files

- `automation/README.md` - Full documentation
- `.cursor/commands/README.md` - Taskfile reference
- `.husky/README.md` - Git hooks
- `.claude-skills/README.md` - AI integration
- `FR-013-main.md` - Implementation plan

---

**Last Updated**: 2025-11-07  
**Phase**: 1 - Foundation Complete  
**Next**: Phase 2 - Taskfile Setup

