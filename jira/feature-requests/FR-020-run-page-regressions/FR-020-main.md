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
- Treat Playwright MCP as the default execution path while keeping Cursor browser tooling as a documented option
- Provide TypeScript helpers under `webapp-testing_skill/lib/` so agents can reuse launch + wait primitives
- Update `skills.json`, `CLAUDE.md`, handoffs, and bug docs to reference the unified skill
- Remove redundant knowledge skill directories to avoid drift

---

## Implementation Details

### Backend Changes
- None (documentation + tooling only)

### Frontend Changes
- None (regression harness exercises existing UI but requires Appium/device availability for screenshot capture)

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
- **E2E Tests**: Manual Playwright script executed via Bun or MCP
- **Manual Testing**: Follow the sample script to ensure `/run` renders events, screenshots, and stop node

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

