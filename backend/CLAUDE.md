# Backend Engineering Context (Encore.ts)

## Overview
The backend uses Encore.ts for service orchestration, PostgreSQL for persistence, and follows strict type-safety with no `any` types allowed.

## Architecture
- **Service Isolation**: Backend and frontend are completely independent
- **No Root Coupling**: Root only holds docs and Git config
- **Type Safety**: Always use Encore generated clients (`~encore/clients`), never manual `fetch()`
- **Package Manager**: Use Bun for all dependency management

## Key Subsystems
- **`/run`**: API endpoints for run lifecycle (start, cancel, stream, health)
- **`/agent`**: Core agent orchestration, nodes, ports, persistence
- **`/logging`**: Structured logging with module/actor fields
- **`/db`**: Database migrations and connection management
- **`/steering`**: Documentation management endpoints

## Coding Standards
- **Purpose comments**: Every class, enum, function, DTO must have a comment explaining why it exists
- **No `any`**: Use explicit types or `Record<string, unknown>` for dynamic data
- **Typed APIs**: All endpoints use explicit request/response interfaces
- **Database**: Use `db.query`, `db.queryRow`, `db.exec` with typed rows

## Logging Standards
- **Logger**: Use `encore.dev/log` exclusively
- **Context Fields**: Always include `module`, `actor`, `runId`, `ts`, `level`
- **Helper**: Use `loggerWith(module, actor, context)` for contextual loggers
- **Error Logging**: Include `err.message`, `err.code`, `stopReason`

## Testing & QA
- **Primary Method**: Log-based verification via Encore dashboard
- **Verification**: All features must be traceable through structured logs
- **Search Patterns**: Use module/actor filters to isolate component logs

## Directory Rules
- Keep services under `backend/`
- Follow Encore service boundaries
- No nesting of services
- Each service has its own `encore.service.ts`

## Commands
- **Run**: `encore run` (or `encore run --port=4001` if 4000 is in use)
- **Test**: `encore test`
- **API Explorer**: `http://localhost:4000/#/api` (or 4001)

## Absolute Prohibitions
- No manual cross-service HTTP (use generated clients)
- No backend↔frontend imports
- No shared node_modules
- No root-level Encore/Node config
- No `any` types in production code

## Database
- Migrations under `backend/db/migrations`
- Sequential naming: `001_*.up.sql`
- Use `db.exec` for queries with template literals
- Type all query results

## Pub/Sub
- Topics defined with `new Topic<T>("name", { deliveryGuarantee })`
- Subscriptions use `new Subscription(topic, "name", { handler })`
- Handlers are idempotent (at-least-once delivery)

## Secrets & Config
- Define with `secret()` from `encore.dev/config`
- Load per-environment via Encore
- Never hardcode secrets

## Deployment
- Backend via Encore Cloud CI
- No manual build scripts
- Cloud deploy relies on Encore CI/CD

