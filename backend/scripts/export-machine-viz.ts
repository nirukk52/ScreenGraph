#!/usr/bin/env bun
/**
 * Export XState agent machine definition for Stately Studio visualization.
 *
 * PURPOSE: Generate a static snapshot of the agent orchestration machine that can be
 * imported into https://stately.ai/viz for visual inspection, documentation, and team sharing.
 *
 * USAGE:
 *   bun run scripts/export-machine-viz.ts
 *
 * OUTPUT: Machine JSON printed to console - copy and paste into Stately Studio
 */

import { AgentMachineFactory } from "../agent/engine/xstate/agent.machine.factory";
import type { AgentMachineParams } from "../agent/engine/xstate/types";

/** Creates minimal mock dependencies to instantiate the machine for export */
function createMockParams(): AgentMachineParams {
  // Mock logger matching Encore's log interface
  const mockLogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    trace: () => {},
    with: () => mockLogger,
  };

  return {
    initialState: {
      runId: "viz-export",
      nodeName: "EnsureDevice",
      stepOrdinal: 0,
      iterationOrdinalNumber: 0,
      status: "active",
      stopReason: null,
      budgets: {
        maxSteps: 100,
        maxTimeMs: 300_000,
        maxTaps: 50,
        outsideAppLimit: 10,
        restartLimit: 3,
      },
      counters: {
        stepsTotal: 0,
        tapsUsed: 0,
        outsideAppSteps: 0,
        restartsUsed: 0,
      },
      timestamps: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    entryNode: "EnsureDevice",
    dependencies: {
      registry: new Map(), // Empty registry for structure export only
      ports: {} as Record<string, unknown>,
      context: {} as Record<string, unknown>,
      callbacks: {
        onAttempt: async () => {},
        onSnapshot: async () => {},
        onRunEvent: async () => {},
      },
      shouldStop: async () => ({ stop: false }),
      now: () => new Date().toISOString(),
      logger: mockLogger,
    },
  };
}

/** Main export function */
function exportMachineForVisualization() {
  const factory = new AgentMachineFactory();
  const params = createMockParams();
  const machine = factory.createMachine(params);

  // Serialize machine config for Stately Studio
  const machineDefinition = {
    id: machine.id,
    initial: machine.config.initial,
    states: machine.config.states,
    // Include key metadata that Stately Studio needs
    type: machine.config.type,
    context: machine.config.context,
  };

  console.log("=".repeat(80));
  console.log("XState Agent Machine - Export for Stately Studio");
  console.log("=".repeat(80));
  console.log("\nCopy the JSON below and paste into:");
  console.log("https://stately.ai/viz\n");
  console.log("OR save to a .json file and import into Stately Studio\n");
  console.log("=".repeat(80));
  console.log(JSON.stringify(machineDefinition, null, 2));
  console.log("=".repeat(80));
  console.log("\nMachine structure exported successfully!");
  console.log(`States: ${Object.keys(machine.config.states || {}).join(", ")}`);
}

// Execute export
exportMachineForVisualization();
