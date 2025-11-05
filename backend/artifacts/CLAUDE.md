# Artifacts Service Context

## Service Role
- Store and index exploration artifacts (screenshots, UI XML) with deterministic references.
- Provide typed, internal-only endpoints for store/get metadata.
- Power the `graph` projector by supplying canonical XML for hashing.

## API Contracts
- `POST /artifacts` → store with `{ runId, kind, contentBase64, ... }`
- `GET /artifacts/:refId` → indexed metadata for `refId`
- DTOs live in `dto.ts`; no `any`, explicit unions for `kind` and formats

## Boundaries
- No raw blob public serving; only metadata (refs) unless explicitly added
- Agent is the producer; Graph is the consumer
- Does not write to `run_events` or graph tables

## Determinism & Idempotency
- Content-addressed refs; `ON CONFLICT DO NOTHING` semantics
- Stable `refId` enables replay and deduplication

## Logging
- Module: `artifacts`; Actors: `store`, `getMeta`
- Always include `{ runId, kind, refId }`

## Future
- Optional raw content retrieval endpoint (auth-gated)
- Lifecycle policies (retention, compression)
- Additional kinds (logs/traces)

