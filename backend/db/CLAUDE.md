# Database Engineering Context

## Purpose
- Centralize migration discipline, schema principles, and evidence-layer guidance.

## Rules
- Forward-only `.up.sql` migrations; sequential numbering.
- Small, focused migrations; one logical change per file.
- American English naming; no magic strings; prefer enums/literal unions in code.
- Typed queries (`db.query<T>`), no `any`. Use `Record<string, unknown>` for dynamic JSON.

## Evidence Layer Strategy (Minimal)
- Prefer SQL views over new base tables:
  - `screen_observations_view` from `graph_persistence_outcomes`
  - `edge_evidence_view` from `edges`
  - `action_candidates_view` from `actions`
- Benefits: zero duplication, replay-safe, aligns with single-sink projection.

## Observability
- Add constraints/uniques on natural keys
- Deterministic IDs where possible
- Migration logs via Encore

## Local Ops
- Reset DB (dev): `encore db reset`
- Shell: `encore db shell run --write`
- Conn string: `encore db conn-uri run`

