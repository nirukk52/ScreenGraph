# Artifacts Service

## Service Role
- Content-addressed storage for exploration artifacts: screenshots and UI XML.
- Provides deterministic `refId` for each stored blob; indexes metadata in DB.
- Serves as the source for the `graph` projector to fetch UI XML for hashing.

## Interfaces
- `POST /artifacts` – Store artifact; returns `{ refId, byteSize, contentHashSha256 }`
- `GET /artifacts/:refId` – Retrieve indexed metadata for an artifact

## Interactions
- `agent` uploads artifacts during Perceive; stores only `refId` in events/state
- `graph` reads artifacts (by `refId`) to normalize XML and compute `layout_hash`
- No public access to raw blobs from this service by default

## Determinism & Idempotency
- `refId` derives from `(runId, kind, sha256)` ensuring stable references
- Duplicate uploads of identical content are safe (no-op on index)

## Ownership
- Owns object bucket and `artifacts_index` table
- No coupling to graph schemas; portable across environments


