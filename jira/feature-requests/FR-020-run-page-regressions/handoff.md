# Handoff — FR-020 Run Page Regression Harness

## What I Am Doing
- Building a Playwright-first regression harness for the `/run` page and consolidating testing guidance into `webapp-testing_skill`.
- Investigating active regressions reported by engineers:
  - Graph events not appearing in the timeline.
  - Screenshot gallery empty.
  - Stop node never emitted.
- Capturing evidence without pushing code until we have explicit approval (founder directive).
- Ensuring the Appium/device stack is running before each validation run so screenshots actually populate.

## What Is Pending
- [ ] Run the sample Playwright script against the failing build and store `/tmp/run-page-full.png`.
- [ ] Confirm whether SSE events are missing because of backend changes or frontend rendering regressions.
- [ ] Document MCP execution steps once we verify the command set.
- [ ] Capture optional visual diff (`expect(page).toHaveScreenshot`) once a stable baseline is produced.

## What I Plan To Do Next
- Execute the regression script with Chromium (headful) to observe timeline updates in real time.
- If events/screenshots are still missing, gather console + network logs and attach them here.
- Coordinate with the engineer holding request `f0164999-3a34-4705-bd7c-e426eff61c6f` before touching UI code.
- After the first successful run, generate a baseline screenshot so future diffs highlight regressions automatically.

## Modules / Paths
- `.claude-skills/webapp-testing_skill/SKILL.md`
- `.claude-skills/webapp-testing_skill/lib/playwright-helpers.ts`
- `jira/feature-requests/FR-020-run-page-regressions/`
- `/tmp/run-page-full.png` (evidence once captured)
- `/tmp/run-page-visual/` (baseline + diff artifacts when visual comparisons are enabled)

## Work Status Rating
- 2 / 5 — Documentation drafted, automation still needs validation on the failing build.

## Graphiti Episodes
- _Pending capture after first Playwright execution_

## Related Docs
- `.cursor/rules/founder_rules.mdc` (port + permission policies)
- `.claude-skills/skills.json`
- BUG-003 (historical port coordinator notes)

## Notes For Next Engineer
- Do **not** commit quick fixes to `/run` without explicit founder approval; collect evidence first.
- Use the Playwright script to reproduce the issues, then compare with manual @Browser checks if you need UI introspection.
- Start the regression from the landing page (no pre-existing run ID needed) and verify Appium/device services are online.
- If you enable visual diffs, keep `/tmp` tidy and update baselines only after a confirmed fix.
- If you discover additional regressions (e.g., missing stop node payload), add them to this handoff and update the status file.

