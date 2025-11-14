import log from "encore.dev/log";
import type { DeviceAllocationRequest, DeviceSession } from "../../../mobile/types";
import { AGENT_ACTORS, MODULES } from "../../../logging/logger";

/**
 * MobileSessionAdapter coordinates device session lifecycle through the mobile-mcp Encore service.
 * PURPOSE: Provide a typed, logged integration point for agent nodes to request and release devices.
 */
const logger = log.with({
  module: MODULES.AGENT,
  actor: AGENT_ACTORS.ORCHESTRATOR,
  component: "mobile-session",
});

let cachedMobileClientPromise: Promise<typeof import("~encore/clients")["mobile"]> | null = null;

/**
 * Lazily loads and memoizes the mobile Encore client.
 * PURPOSE: Avoid repeated dynamic imports while preventing circular dependencies at module load time.
 */
async function getMobileClient() {
  if (!cachedMobileClientPromise) {
    cachedMobileClientPromise = import("~encore/clients").then(({ mobile }) => mobile);
  }

  return cachedMobileClientPromise;
}

/**
 * Creates a new device session via mobile-mcp and returns the resulting session record.
 * PURPOSE: Centralizes allocation logging and error normalization for callers.
 */
export async function createMobileDeviceSession(
  allocation: DeviceAllocationRequest,
): Promise<DeviceSession> {
  const mobileClient = await getMobileClient();

  try {
    const response = await mobileClient.createSession({ allocation });
    logger.info("mobile session created", {
      sessionId: response.session.sessionId,
      deviceId: response.session.deviceId,
      allocation,
    });
    return response.session;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("failed to create mobile session", { allocation, error: message });
    throw new Error(`Mobile session allocation failed: ${message}`);
  }
}

/**
 * Closes an existing mobile session ensuring device availability is restored.
 * PURPOSE: Provide idempotent cleanup helper for agent nodes.
 */
export async function closeMobileDeviceSession(sessionId: string): Promise<void> {
  const mobileClient = await getMobileClient();

  try {
    await mobileClient.closeSession({ sessionId });
    logger.info("mobile session closed", { sessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("failed to close mobile session", { sessionId, error: message });
    throw new Error(`Mobile session cleanup failed: ${message}`);
  }
}

