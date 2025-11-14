# FR-010: Centralized Run Default Configuration Service

**Status:** ⏳ Proposed  
**Priority:** P1 (Reduce Drift)  
**Milestone:** M2 - Run UX Improvements  
**Owner:** Backend + Frontend  
**Estimated Effort:** Medium

---

## 📝 Description
Currently the run start defaults (APK path, package name, Appium server URL, goal, max steps) are duplicated in frontend constants and ad-hoc backend requests (latest request captured in Encore API Explorer at `http://127.0.0.1:9400/screengraph-ovzi/requests`). This proposal introduces a single Encore-backed configuration surface so both CLI/API clients and the SvelteKit frontend consume identical defaults. The configuration should be overridable per environment via Encore config/secrets and introspectable through a typed endpoint.

---

## 🎯 Acceptance Criteria
- [ ] New Encore endpoint `GET /config/run-defaults` returning typed defaults:
  - `apkPath`
  - `packageName`
  - `appActivity`
  - `appiumServerUrl`
  - `maxSteps`
  - `goal`
- [ ] Defaults sourced from Encore config/secrets with environment overrides (dev/prod).
- [ ] Frontend `startRun` flow fetches defaults via generated client before form submission.
- [ ] CLI/other clients can call the same endpoint (documented in API explorer).
- [ ] Frontend config fallback updated to use server response with local cache for offline dev.
- [ ] Unit tests cover config provider and endpoint serialization.

---

## 🔗 Dependencies
- Encore config/secrets support in `backend/run` service.
- Existing `POST /run` endpoint (no changes to request schema, just default provider).

---

## 🧪 Testing Requirements
- [ ] Unit: config loader returns environment-specific values with sensible fallbacks.
- [ ] Integration: calling `GET /config/run-defaults` yields values matching Encore config.
- [ ] Frontend: smoke test ensures button "Detect My First Drift" works with fetched defaults (no hardcoded values).

---

## 📋 Technical Notes
- Implement via new module `backend/run/config.ts` exposing typed DTO + Encore `api()` handler.
- Use `encore.dev/config` to load per-env overrides (e.g., `apk_path`, `package_name`).
- Frontend to expose `loadRunDefaults()` helper in `src/lib/api.ts` wrapping generated client.
- Cache defaults client-side (e.g., in a store) to avoid multiple requests per session.
- Update documentation in CODE_REVIEW.md / README to reflect single source of truth.

---

## 🏷️ Labels
`backend`, `frontend`, `config`, `run`, `milestone-2`, `p1`

---

## 📝 Implementation Breakdown
1. Backend configuration provider + endpoint (Encore config schema, DTO, handler).
2. Frontend client update + run start integration (fallback to env if endpoint unavailable).
3. Documentation & tests.

---

## 📎 Related Links
- Saved Encore request: `http://127.0.0.1:9400/screengraph-ovzi/requests`
- Existing defaults usage: `frontend/src/lib/config.ts`
- Run API: `backend/run/start.ts`
