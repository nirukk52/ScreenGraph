import { describe, it, expect } from "vitest";

/**
 * Determinism tests - SKIPPED
 * PURPOSE: These require Encore runtime (ENCORE_RUNTIME_LIB) which isn't available in vitest.
 * High-level determinism is now covered by `engine/xstate/machine.test.ts` and integration tests via Encore dashboard logs.
 */
describe.skip("Determinism Tests", () => {
  it("skipped - requires Encore runtime", () => {
    expect(true).toBe(true);
  });
});
