# Backend Debugging Skill

**Purpose:** Systematic 10-phase debugging procedure for Encore.ts backend issues.

---

## When to Use

- Backend service errors or crashes
- API endpoint failures
- Database query issues
- PubSub message delivery problems
- Performance bottlenecks

---

## 10-Phase Debugging Process

### Phase 1: Health Check
```bash
task backend:health
task backend:logs
```

### Phase 2: Service Status
```bash
task founder:servers:status
encore logs
```

### Phase 3: Database State
```bash
task backend:db:shell
# Check recent migrations
```

### Phase 4: Encore Dashboard
- Open http://localhost:9400
- Review traces, logs, metrics

### Phase 5: Type Safety
```bash
task backend:test
# Check for type errors
```

### Phase 6: Structured Logging
- Review `encore.dev/log` usage
- Check for proper context fields

### Phase 7: PubSub/Outbox
- Verify message delivery
- Check outbox publisher status

### Phase 8: Isolation Testing
- Test endpoint in isolation
- Mock dependencies

### Phase 9: Integration Tests
```bash
encore test
```

### Phase 10: MCP Tools
- Use Encore MCP for runtime introspection
- Check metadata, traces, database schemas

---

## Common Issues

### Database Connection Failures
- Check migrations applied
- Verify connection string
- Reset database if needed: `task founder:workflows:db-reset`

### Type Errors
- Regenerate client: `task founder:workflows:regen-client`
- Check for `any` types (forbidden)

### Logging Issues
- Never use `console.log` (use `encore.dev/log`)
- Always include structured context

