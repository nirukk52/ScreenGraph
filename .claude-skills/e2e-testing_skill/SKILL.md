---
name: e2e-testing
description: Playwright end-to-end testing for ScreenGraph using .env-driven configuration. Use when validating full user flows, running regression suites, or inspecting UI behavior with Cursor browser tools.
---

# ScreenGraph E2E Testing Skill

## Mission
Provide consistent, deterministic coverage of the ScreenGraph UI by coupling Playwright automation with the shared .env configuration. This skill summarizes the workflow and defers deep scripts, policies, and RCA playbooks to `references/`.

## When to Use
- Validating the run flow from landing page ➜ run timeline ➜ screenshot gallery
- Reproducing UI regressions before releasing backend/front-end changes
- Maintaining smoke tests enforced by the pre-push hook
- Capturing artifacts (screenshots, console logs) for tickets and handoffs

## Automation Loop
1. **Prepare environment** – Ensure backend, frontend, Appium/device, and `.env` values are ready (see `references/automated-tests.md`).
2. **Execute Playwright suites** – Run headed/headless/CI modes using the prescribed commands. Respect the 60s timeout budget.
3. **Investigate failures** – Use helpers in `lib/playwright-helpers.ts`, console/network logs, and backend logs to locate the root cause.
4. **Escalate diagnostics** – Fall back to Cursor Browser tools (`references/browser-tools.md`) or the regression playbook for complex incidents.
5. **Document** – Attach screenshots, logs, and RCA notes in Graphiti or the relevant ticket.

## Quick Command Set
```bash
# Headed for visual debugging
bun run test:e2e:headed

# Headless CI-parity run
bun run test:e2e:ci

# Playwright UI mode
bun run test:e2e:ui
```

## Quality Gates
- `.env` values (package name, Appium URL, APK path) sourced before running tests
- Total Playwright test time per spec ≤ 60 seconds (budget defined in references)
- Failures include screenshot + console output attachments
- Regressions traced back to backend/frontend root cause with notes in Graphiti
- Run-flow assertions confirm both timeline events and visible screenshot gallery output

## Reference Library
- `references/automated-tests.md` – Quick start commands, configuration, timeout policy, and pre-push integration
- `references/manual-workflow.md` – Running ad-hoc Playwright scripts from scratch directories and capturing artifacts
- `references/browser-tools.md` – Automating interactive debugging with Cursor’s @Browser tool
- `references/regression-playbook.md` – BUG-010 case study and systematic RCA steps
- `references/troubleshooting.md` – Fast-fail signals, Appium/device checks, cleanup routines

## Related Skills
- `frontend-development_skill` – Source of truth for Svelte/Skeleton patterns the tests exercise
- `backend-development_skill` – Ensures backend flows are stable before they enter E2E coverage
- `frontend-debugging_skill` – Use after tests fail to diagnose rune or SSR issues in the UI
