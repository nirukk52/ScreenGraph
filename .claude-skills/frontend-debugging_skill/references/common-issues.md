# Frontend Debugging – Common Issues

## Fast-Fail Signals
- `page.waitForURL` timeout: Backend `startRun` likely failed. Check `task backend:logs` and confirm Appium/device with `task qa:appium:start`.
- Timeline shows `agent.app.launch_failed`: Device/Appium misconfiguration. Inspect payload for package, attempt, duration.
- If Backend integration test `encore test run/start.integration.test.ts` fails, fix backend before debugging frontend.

## Encore Client Sync
- Always run `task founder:workflows:regen-client` after backend API changes.
- Verify imports use `~encore/clients` aliases.
- Type errors in routes are usually stale generated clients.

## SSR Hydration
- Ensure server and client render identical HTML.
- Guard browser-only APIs with `if (browser) { ... }`.
- For load functions, return serialisable data only.

## Routing Checklist
- Validate file structure (e.g., `[slug]/+page.svelte`).
- Confirm `+layout.svelte` hierarchy—parent layouts must render `<slot />`.
- Keep `load` return values aligned with `PageData` typings.

## Additional References
- `frontend-development_skill` for full Svelte 5 + Skeleton workflow.
- `e2e-testing_skill` for Playwright regression and timeout policies.
