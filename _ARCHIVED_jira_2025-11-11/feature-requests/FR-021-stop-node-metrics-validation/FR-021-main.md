# FR-021: stop-node-metrics-validation

> **Line Limit:** 150 lines max (enforced)
> **Purpose:** Core feature documentation and implementation details

---

## Summary

Add comprehensive validation of Stop node metrics to ensure agent runs produce accurate, non-zero counts for discovered screens, executed iterations, and run duration. This will serve as the foundation for progressive test validation going forward, ensuring we never regress on core agent telemetry.

**Impact**: Establishes baseline quality gate for agent execution metrics, preventing silent failures where runs "complete" but report zero activity.

---

## User Story
**As a** QA Engineer / Developer  
**I want** automated validation of Stop node metrics after every agent run  
**So that** I can trust the reported metrics match actual agent activity and catch metric calculation bugs early

---

## Acceptance Criteria

### Phase 1: Baseline Validation (Immediate)
- [ ] E2E test verifies Stop node `agent.run.finished` event emitted
- [ ] Test validates `uniqueScreensDiscoveredCount > 0` after successful run
- [ ] Test validates `totalIterationsExecuted > 0` 
- [ ] Test validates `runDurationInMilliseconds > 0`
- [ ] Test fails if any metric is exactly zero after a real run

### Phase 2: Database Cross-Check (Progressive)
- [ ] Backend Stop node queries `graph_persistence_outcomes` for actual screen count
- [ ] If count mismatch > 10%, emit warning log (don't fail run)
- [ ] Store both "reported" and "actual" counts in `agent.run.finished` event payload
- [ ] Analytics endpoint to report metric drift over time

### Phase 3: Automated Regression Protection
- [ ] Pre-push hook includes metrics validation test
- [ ] CI fails if Stop node reports all-zero metrics
- [ ] Dashboard shows metric accuracy percentage (reported vs actual)

---

## Technical Approach

**Philosophy**: Start with simple non-zero checks (Phase 1), progressively add database validation (Phase 2), then full regression protection (Phase 3).

**Key Insight from BUG-010**: We removed DB query from Stop node execution path because it caused hangs. Now we reintroduce it as **optional validation** that runs AFTER Stop completes, not during.

**Architecture**:
1. **Stop Node** - Emits metrics from `input.finalRunMetrics` (fast path)
2. **Post-Run Validator** (new service) - Async validation after run completes
3. **E2E Test** - Validates event payload contains expected metrics
4. **Analytics Endpoint** - Reports metric drift trends

---

## Implementation Details

### Backend Changes

#### Phase 1: Stop Node Metrics (Already Implemented)
```typescript
// backend/agent/nodes/terminal/Stop/node.ts
export async function stop(input: StopInput) {
  const metrics = input.finalRunMetrics;  // From agent state counters
  
  logger.info("Stop node metrics", { metrics });
  
  return {
    output,
    events: [{
      kind: "agent.run.finished",
      payload: {
        disposition: input.intendedTerminalDisposition,
        basis: input.terminalizationBasis,
        metrics,  // ✅ This is what we validate
      },
    }],
  };
}
```

#### Phase 2: Post-Run Validator (New)
```typescript
// backend/agent/post-run-validator.ts
export async function validateRunMetrics(runId: string): Promise<ValidationResult> {
  const event = await fetchRunFinishedEvent(runId);
  const reportedScreens = event.payload.metrics.uniqueScreensDiscoveredCount;
  
  const actualScreens = await db.queryRow<{ count: number }>`
    SELECT COUNT(DISTINCT screen_id) FROM graph_persistence_outcomes
    WHERE run_id = ${runId} AND outcome_kind = 'discovered'
  `;
  
  const drift = Math.abs(reportedScreens - actualScreens.count) / actualScreens.count;
  
  if (drift > 0.1) {  // 10% threshold
    logger.warn("Metric drift detected", { 
      runId, reportedScreens, actualScreens: actualScreens.count, drift 
    });
  }
  
  return { reportedScreens, actualScreens: actualScreens.count, drift };
}
```

#### Phase 2: Analytics Endpoint
```typescript
// backend/analytics/metrics-health.ts
export const getMetricsHealth = api.get("/analytics/metrics-health", async () => {
  const recentRuns = await fetchLast100Runs();
  const validations = await Promise.all(
    recentRuns.map(run => validateRunMetrics(run.runId))
  );
  
  const avgDrift = validations.reduce((sum, v) => sum + v.drift, 0) / validations.length;
  
  return { avgDrift, validations: validations.slice(0, 10) };
});
```

### Frontend Changes

#### Phase 2: Metrics Health Dashboard
```svelte
<!-- frontend/src/routes/analytics/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { analytics } from '~encore/clients';
  
  let health = $state(null);
  
  onMount(async () => {
    health = await analytics.getMetricsHealth();
  });
</script>

{#if health}
  <div class="card p-6">
    <h2>Metrics Health</h2>
    <p>Average drift: {(health.avgDrift * 100).toFixed(2)}%</p>
    
    <table>
      <thead>
        <tr>
          <th>Run ID</th>
          <th>Reported</th>
          <th>Actual</th>
          <th>Drift</th>
        </tr>
      </thead>
      <tbody>
        {#each health.validations as v}
          <tr class:error={v.drift > 0.1}>
            <td>{v.runId}</td>
            <td>{v.reportedScreens}</td>
            <td>{v.actualScreens}</td>
            <td>{(v.drift * 100).toFixed(1)}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
```

---

## Testing Strategy

### Phase 1: E2E Validation Test (NEW)
```typescript
// frontend/tests/e2e/stop-node-metrics.spec.ts
import { test, expect } from "@playwright/test";
import { TEST_PACKAGE_NAME } from "./helpers";

test("Stop node emits real metrics", async ({ page }) => {
  await page.goto("/");
  
  // Start run
  await page.getByRole("button", { name: "Detect My First Drift" }).click();
  await page.waitForURL("**/run/**");
  
  // Wait for run completion (Stop node)
  await page.waitForTimeout(10000);  // Allow agent to complete
  
  // Find agent.run.finished event
  const finishedEvent = page.locator('[data-event-kind="agent.run.finished"]').first();
  await expect(finishedEvent).toBeVisible();
  
  // Extract metrics from event payload
  const payload = await finishedEvent.locator('pre').textContent();
  const metrics = JSON.parse(payload).metrics;
  
  // VALIDATE: All metrics > 0
  expect(metrics.uniqueScreensDiscoveredCount, "Discovered screens must be > 0").toBeGreaterThan(0);
  expect(metrics.totalIterationsExecuted, "Iterations must be > 0").toBeGreaterThan(0);
  expect(metrics.runDurationInMilliseconds, "Duration must be > 0").toBeGreaterThan(0);
  
  // VALIDATE: Screenshot visible in gallery
  const screenshots = page.locator('[data-testid="discovered-screens"] img');
  await expect(screenshots.first()).toBeVisible();
});
```

### Phase 2: Backend Integration Test
```typescript
// backend/agent/post-run-validator.test.ts
import { test } from "vitest";
import { validateRunMetrics } from "./post-run-validator";

test("validates metrics match database", async () => {
  const runId = "01K9GXG8996KW0NH6Y6RMRXNKP";  // Known good run
  const result = await validateRunMetrics(runId);
  
  expect(result.drift).toBeLessThan(0.1);  // < 10% drift
  expect(result.actualScreens).toBeGreaterThan(0);
});
```

### Phase 3: Pre-Push Hook Integration
```bash
# .husky/pre-push
bun run test:e2e:ci  # Now includes stop-node-metrics.spec.ts
```

---

## Dependencies
- **Blocked by**: None (BUG-010 resolved)
- **Blocks**: None
- **Related**: 
  - BUG-010 (Stop node regression)
  - FR-017 (Minimal robust testing)

---

## Owner / Priority
- **Requested by**: Founder
- **Assigned to**: Engineering Team
- **Priority**: P1 (Quality Gate)
- **Target Release**: Next sprint (incremental rollout)

---

## Notes

### Context from BUG-010
During the BUG-010 investigation, we discovered that:
1. Stop node was reporting all-zero metrics (`uniqueScreensDiscoveredCount: 0`)
2. This was because the DB query was added incorrectly (blocking execution)
3. After removing the query, we lost validation that metrics are correct

This feature request re-introduces validation in a **safe, non-blocking way**.

### Progressive Rollout Strategy
- **Week 1**: Phase 1 (E2E test validates non-zero metrics)
- **Week 2**: Phase 2 (Post-run validator + analytics endpoint)
- **Week 3**: Phase 3 (Full CI integration + dashboard)

### Success Metrics
- Zero false positives (test doesn't fail on valid runs)
- 100% coverage of Stop node metrics validation
- < 1% metric drift across all runs
- Dashboard shows metric accuracy trends

### Future Enhancements
- Validate `uniqueActionsPersistedCount` (currently always 0 in MVP)
- Validate `runDurationInMilliseconds` within expected bounds
- Add Slack alerts when metric drift > 20%
- Historical metric accuracy charts


---

## Release Plan (PROC-001)
- Follow PROC-001 "Production Release" in `.cursor/procedures/PROCEDURES.md`
- Preconditions:
  - [ ] `@run-default-test` passes
- Handoff:
  - After merge to main, run `@update-handoff` and choose the “Production Release Update” workflow
- Notes:
  - Frontend version bump (semver) required before tagging
  - Tag format: `v<frontend>-<date>-<shortsha>`

## Worktree Setup Quicklinks
- Start Backend: `./scripts/dev-backend.sh`
- Start Frontend: `./scripts/dev-frontend.sh`
- Smoke Test: `@run-default-test`

