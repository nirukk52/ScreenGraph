import { createSkyInspector } from "@statelyai/inspect";
import log from "encore.dev/log";
import { XSTATE_INSPECTOR_ENABLED, env } from "../../../config/env";
import { AGENT_ACTORS, MODULES } from "../../../logging/logger";

/**
 * getInspector returns a dev-only singleton cloud inspector instance for XState.
 * PURPOSE: Enable live visualization of the backend state machine in Chrome via Stately Inspector
 * without needing a local WebSocket server. Uses Stately cloud relay (dev-only, no production impact).
 */
let singletonInspector: ReturnType<typeof createSkyInspector> | null = null;

/**
 * Returns an inspector with an `inspect` function to pass into `createActor`, or null when disabled.
 * Env controls:
 * - NODE_ENV !== "production" (dev only)
 * - XSTATE_INSPECTOR_ENABLED !== "false" (can force-disable)
 */
export function getInspector(): ReturnType<typeof createSkyInspector> | null {
  const isDev = env.isDev;
  const enabled = XSTATE_INSPECTOR_ENABLED;

  if (!isDev || !enabled) {
    return null;
  }

  if (!singletonInspector) {
    // Uses Stately cloud relay - no local WebSocket server needed
    singletonInspector = createSkyInspector();

    const logger = log.with({ module: MODULES.AGENT, actor: AGENT_ACTORS.WORKER });
    logger.info("XState Inspector enabled (cloud relay)", {
      inspectorUrl: "https://stately.ai/inspect",
      note: "Open the URL in Chrome while a run is active - cloud inspector will auto-connect",
    });
  }

  return singletonInspector;
}
