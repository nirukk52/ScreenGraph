# Cursor Commands

All commands accessible via `@command-name` in Cursor.

---

## 📋 Item Management

- `@create-feature` - Create FR-XXX
- `@create-bug` - Create BUG-XXX  
- `@create-techdebt` - Create TD-XXX

## ✍️ Handoff Updates

- `@update-handoff` - Full handoff (interactive)
- `@update-handoff-quick` - Fast 30s handoff
- `@update-status` - Update timestamp (< 5s)
- `@update-main` - Append note (< 5s)

## ✅ Validation

- `@validate-docs` - Check line limits & required files

## 🚀 Services

- `@start` - Start backend + frontend
- `@stop` - Stop all services

---

## Task Commands

Run from `.cursor/`: `task [command]`

- `task founder:servers:start` - Start all with health checks
- `task founder:rules:check` - Validate founder rules
- `task backend:dev` / `task frontend:dev` - Start services
- `task qa:smoke:all` - All smoke tests

---

**Last Updated:** 2025-11-07
