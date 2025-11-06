## Play Store App Information Microservice Plan

- **Objective**: deliver a backend Encore service that ingests Google Play metadata and screenshots for a given package name, persists it into a dedicated `appinfo` table, and exposes typed endpoints for other services.

- **Key Deliverables**:
  - Database migration introducing `appinfo` table plus supporting enums for data freshness and media kinds.
  - Encore service module (e.g., `backend/playstore`) with ports/adapters for Google Play acquisition, persistence, and retrieval APIs.
  - Typed DTOs and service methods for requesting ingestion, checking status, and retrieving cached metadata/screenshots references.
  - Tests covering ingestion happy path, duplicate package refresh, and error handling around external fetch failures.

- **Implementation Steps**:
  1. Investigate existing Encore patterns for services and persistence to align folder structure (`ports`, `adapters`, `dto`, `service.ts`).
  2. Select or implement Google Play metadata client (likely `google-play-scraper`); wrap with typed adapter avoiding `any`, and normalize outputs (title, developer, description, categories, rating, installs, images).
  3. Design union/enums describing screenshot kinds and ingest status; define DTOs at file top.
  4. Create SQL migration for `appinfo` with structured JSON columns for screenshots, categories, user types, plus indexes on `package_name` and freshness timestamp.
  5. Implement persistence repository encapsulating CRUD and upsert of `appinfo` records.
  6. Implement Encore endpoints:
     - `requestIngestion` to fetch and store metadata/screenshots for a package name.
     - `getAppInfo` to read cached record.
     - `listAppInfos` filtered by freshness or category (optional stretch).
  7. Integrate Encore logging (`log.with`) around ingestion attempts, success, and failures with structured fields.
  8. Add Vitest coverage using mocked Google Play adapter and SQLDatabase test harness; validate idempotency and error propagation.
  9. Document usage in `BACKEND_HANDOFF.md` and ensure `plan.md` stays in sync until delivery is complete.

- **Open Questions / Assumptions**:
  - External Play Store scraping is allowed; confirm chosen library satisfies licensing and stability needs.
  - Determine storage strategy for screenshots (raw binaries vs. artifact references); initial plan assumes storing URLs and delegating binary download to existing artifacts service.
  - Clarify required metadata breadth (e.g., user reviews, content ratings) to avoid scope creep.
