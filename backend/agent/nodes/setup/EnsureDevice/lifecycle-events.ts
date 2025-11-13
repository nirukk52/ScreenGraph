import { nanoid } from "nanoid";
import { type DomainEvent, createDomainEvent } from "../../../domain/events";

/**
 * Event emission helpers for Appium lifecycle operations.
 * PURPOSE: Standardize lifecycle event creation with consistent structure.
 */

/** Creates agent.device.check_started event. */
export function createDeviceCheckStartedEvent(
  runId: string,
  sequence: number,
  appId: string,
  deviceId?: string,
): DomainEvent<"agent.device.check_started"> {
  return createDomainEvent(
    nanoid(),
    runId,
    sequence,
    new Date().toISOString(),
    "agent.device.check_started",
    { appId, deviceId },
  );
}

/** Creates agent.device.check_completed event. */
export function createDeviceCheckCompletedEvent(
  runId: string,
  sequence: number,
  isOnline: boolean,
  deviceId?: string,
): DomainEvent<"agent.device.check_completed"> {
  return createDomainEvent(
    nanoid(),
    runId,
    sequence,
    new Date().toISOString(),
    "agent.device.check_completed",
    { isOnline, deviceId },
  );
}

/** Creates agent.device.check_failed event. */
export function createDeviceCheckFailedEvent(
  runId: string,
  sequence: number,
  error: string,
  appId: string,
): DomainEvent<"agent.device.check_failed"> {
  return createDomainEvent(
    nanoid(),
    runId,
    sequence,
    new Date().toISOString(),
    "agent.device.check_failed",
    { error, appId },
  );
}

/** Creates agent.appium.health_check_started event. */
export function createAppiumHealthCheckStartedEvent(
  runId: string,
  sequence: number,
  port: number,
): DomainEvent<"agent.appium.health_check_started"> {
  return createDomainEvent(
    nanoid(),
    runId,
    sequence,
    new Date().toISOString(),
    "agent.appium.health_check_started",
    { port },
  );
}

/** Creates agent.appium.health_check_completed event. */
export function createAppiumHealthCheckCompletedEvent(
  runId: string,
  sequence: number,
  isHealthy: boolean,
  port: number,
  reusingExisting: boolean,
): DomainEvent<"agent.appium.health_check_completed"> {
  return createDomainEvent(
    nanoid(),
    runId,
    sequence,
    new Date().toISOString(),
    "agent.appium.health_check_completed",
    { isHealthy, port, reusingExisting },
  );
}

/** Creates agent.appium.health_check_failed event. */
export function createAppiumHealthCheckFailedEvent(
  runId: string,
  sequence: number,
  error: string,
  port: number,
): DomainEvent<"agent.appium.health_check_failed"> {
  return createDomainEvent(
    nanoid(),
    runId,
    sequence,
    new Date().toISOString(),
    "agent.appium.health_check_failed",
    { error, port },
  );
}

/** Creates agent.appium.starting event. */
export function createAppiumStartingEvent(
  runId: string,
  sequence: number,
  port: number,
): DomainEvent<"agent.appium.starting"> {
  return createDomainEvent(
    nanoid(),
    runId,
    sequence,
    new Date().toISOString(),
    "agent.appium.starting",
    { port },
  );
}

/** Creates agent.appium.ready event. */
export function createAppiumReadyEvent(
  runId: string,
  sequence: number,
  pid: number,
  port: number,
  startDurationMs: number,
): DomainEvent<"agent.appium.ready"> {
  return createDomainEvent(
    nanoid(),
    runId,
    sequence,
    new Date().toISOString(),
    "agent.appium.ready",
    { pid, port, startDurationMs },
  );
}

/** Creates agent.appium.start_failed event. */
export function createAppiumStartFailedEvent(
  runId: string,
  sequence: number,
  error: string,
  port: number,
  timeoutMs: number,
): DomainEvent<"agent.appium.start_failed"> {
  return createDomainEvent(
    nanoid(),
    runId,
    sequence,
    new Date().toISOString(),
    "agent.appium.start_failed",
    { error, port, timeoutMs },
  );
}
