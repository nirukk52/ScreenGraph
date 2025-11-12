# Common Failures

| Symptom | Likely Cause | Resolution |
| --- | --- | --- |
| Run stuck in `queued` | Worker subscription not imported | Add `import "../agent/orchestrator/subscription";` at top of test. |
| Service call hangs | Required service module not imported | Import relevant services, e.g. `../artifacts/store`, `../graph/encore.service.ts`. |
| `~encore/clients` alias missing | Vitest config lacks alias | Update `backend/vitest.config.ts` with `resolve.alias['~encore'] = resolve(__dirname, './encore.gen')`. |
| `projectedScreens: 0` | Projector queried before finishing | Poll status until `completed`, then wait ~5s before reading projector results. |
| `budget_exhausted` after few steps | `maxSteps` too low | Increase `maxSteps` (e.g., to 20) to allow retries/backtracking. |

## Fast-Fail Checks
1. Confirm `task backend:logs` shows structured log entries for the run.
2. Ensure Appium/device is running when the scenario requires the agent.
3. Re-run with `encore test ./run/start.integration.test.ts -- --runInBand` for consistent reproduction.
4. Document root cause and fix in Graphiti once resolved.
