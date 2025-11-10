# Metrics Regression Guard Options

We evaluated how to keep the `metrics.test.ts` coverage without skipping it. Below are three viable approaches and the recommendation we should adopt.

## Option 1 — Self-Managed Harness Inside Vitest
- **Idea:** Have the test spawn `encore run`, start Appium, wait for the health checks, and then execute the run + assertions.
- **Pros:** Fully automated once the harness is stable; matches a developer’s workflow.
- **Cons:** Complex lifecycle management (process cleanup, log streaming, port conflicts). Still depends on a local device/emulator, so it can flake or hang.

## Option 2 — Pre-Push Integration Gate (Recommended)
- **Idea:** Add a dedicated Task/Husky hook (e.g., `task backend:integration:metrics`) that:
  1. Checks whether `/backend` files changed.
  2. Verifies prerequisites (Appium endpoint reachable, device online).
  3. Runs `encore test agent/tests/metrics.test.ts`.
- **Pros:**
  - Explicit, repeatable workflow for the only integration gate that matters.
  - Does not slow down normal Vitest runs or CI jobs that lack hardware.
  - Fails fast with guidance if prerequisites are missing.
- **Cons:** Requires developers to keep the harness healthy and run the hook when backend code changes.

## Option 3 — Fixture-Based Simulation
- **Idea:** Replace the real agent/Appium dependency with a fake worker that injects the expected run events/metrics into the DB when the test starts a run.
- **Pros:** Fast and CI-friendly; no device required.
- **Cons:** Validates only the pipeline (run → metrics), not the actual crawling logic; can miss regressions that show up only with real device behavior.

## Recommendation
Adopt **Option 2**. It keeps the real-device coverage (critical as crawling logic evolves) while avoiding flaky automation inside Vitest. The workflow fits our existing Task/Husky automation model:

- Add a task (e.g., `task backend:integration:metrics`) that wraps the metrics test and prints actionable errors if Appium/device/back-end aren’t running.
- Wire the task into the pre-push hook conditioned on `/backend` changes.
- Keep `metrics.test.ts` active so developers can run it manually while they have the harness up.

This gives us a dependable regression guard without fighting the limitations of fully automated device orchestration.

## Next Steps
1. Implement the `backend:integration:metrics` Task.
2. Update Husky’s pre-push hook to run the task when backend files change.
3. Document the workflow in `README.md` / CLAUDE quick reference (tools to start Appium, simple emulator checklist).
4. Optionally add the fixture-based simulation as a quick CI smoke test later.
