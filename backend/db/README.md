# Database Module

## Service Role
- Owns PostgreSQL schema and migrations for all backend services.
- Provides canonical tables for runs, events, artifacts index, and graph projection.
- Encourages evidence-layer consumption via SQL views (no duplicate base tables).

## Migrations
- Location: `backend/db/migrations/*.up.sql`
- Sequential numbering: `001_*.up.sql`, `002_*.up.sql`, ...
- Forward-only; Encore applies/rolls back failed migrations automatically.
- Naming: American English; no magic strings; explicit enums or literal unions in code.

## Evidence Layer (Run-Scoped Views)
Use views over canonical tables to expose run-local evidence without adding storage:

- `screen_observations_view`: derived from `graph_persistence_outcomes`
- `edge_evidence_view`: derived from `edges` (optionally joined to runs)
- `action_candidates_view`: derived from `actions` (provenance fields)

Illustrative example:
```sql
CREATE VIEW screen_observations_view AS
SELECT run_id, step_ordinal, screen_id, upsert_kind, source_run_seq, created_at
FROM graph_persistence_outcomes
WHERE upsert_kind IN ('discovered','mapped');
```

## Conventions
- Typed row annotations in code (`db.query<{ id: string }>`)
- No `any`; prefer `Record<string, unknown>` for dynamic JSON
- Idempotency: prefer deterministic IDs; unique constraints on natural keys

## Local Dev
- Reset: `encore db reset`
- Shell: `encore db shell run --write`
- URI: `encore db conn-uri run`

