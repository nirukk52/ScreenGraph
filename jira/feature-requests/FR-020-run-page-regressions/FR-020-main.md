# FR-020: Run Page Regression Harness

> **Line Limit:** 150 lines max (enforced)  
> **Purpose:** Core feature documentation and implementation details

---

## Summary
Playwright-first automation and documentation so engineers can reliably test the `/run` page when graph events vanish, screenshots fail to render, or the stop node never fires. Request `f0164999-3a34-4705-bd7c-e426eff61c6f` triggered this work after repeated regression fixes stalled due to missing tooling.

---

## User Story
**As a** ScreenGraph engineer  
**I want** a reproducible `/run` regression harness and unified testing skill  
**So that** I can debug UI regressions without guessing which tool or port configuration to use

---

## Acceptance Criteria
- [ ] `webapp-testing_skill` documents a Playwright-first workflow plus optional Cursor tools in one place
- [ ] Legacy `cursor-browser-mastery` and `cursor-chrome-window-mastery` directories are merged and references updated
- [ ] Playwright helper library checked in (TypeScript) with launch, wait, and safe interaction utilities
- [ ] Example Playwright script verifies graph timeline events, discovered screenshots, and the stop node on `/run`
- [ ] Optional visual regression workflow documented (`expect(page).toHaveScreenshot`) with baseline instructions
- [ ] Feature ticket handoff captures current regression symptoms, data prerequisites (device/Appium), and cautions (no code commits without permission)

---

## Technical Approach
**UNIFIED TEST STRATEGY:** Single Playwright test suite with environment-based configuration (one test file runs in both dev and CI)

**Key Decisions:**
- Environment variable `HEADLESS` controls browser visibility (true for CI, false for local dev)
- `process.env.CI` auto-adjusts retries, reporters, and video recording
- Tests live in `frontend/tests/e2e/` (proper frontend isolation)
- Integrated into pre-push Husky hook for automated verification
- No separate dev/CI test files (eliminates drift, easier maintenance)

**Execution Modes:**
- Local dev: `bun run test:e2e:headed` (visual debugging with slowMo)
- Pre-push hook: `bun run test:e2e:ci` (headless, fast)
- CI: `bun run test:e2e:ci` (headless with video on failure)

---

## Implementation Details

### Backend Changes
- None (E2E testing only)

### Frontend Changes
- Add `@playwright/test` to devDependencies
- Create `playwright.config.ts` with CI detection and environment-aware settings
- Create `tests/e2e/run-page.spec.ts` with first test (Run Timeline visibility)
- Add test scripts to `package.json` (test:e2e, test:e2e:headed, test:e2e:ci, test:e2e:ui)
- Optional: `tests/e2e/helpers.ts` for reusable utilities

### Husky Integration
- Update `.husky/pre-push` to run E2E tests before allowing push

---

## API Contract (if applicable)
```typescript
// No API changes
```

---

## Database Schema (if applicable)
```sql
-- No database changes
```

---

## Testing Strategy
- **Unit Tests**: N/A
- **Integration Tests**: N/A
- **E2E Tests**: Playwright automated tests in `frontend/tests/e2e/`
  - `run-page.spec.ts` verifies Run Timeline text appears
  - Runs automatically in pre-push hook (headless mode)
  - Can run locally in headed mode for debugging
- **Manual Testing**: Use `bun run test:e2e:headed` to visually verify flow

---

## Dependencies
- **Blocked by**: None
- **Blocks**: Future `/run` fixes that require reliable verification
- **Related**: BUG-003 (port coordinator removal history), FR-017 (minimal robust testing)

---

## Owner / Priority
- **Requested by**: Founder
- **Assigned to**: Focused automation engineer
- **Priority**: P0
- **Target Release**: Immediate onboarding aid for `/run` fixes

---

## Notes
- Request ID: `f0164999-3a34-4705-bd7c-e426eff61c6f`
- Appium/device session must be running so the agent can capture screenshots (check `qa:appium:start`)
- Do **not** commit UI hotfixes for `/run` without explicit approval until this harness validates the flow

