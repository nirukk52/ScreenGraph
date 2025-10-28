import {
  AppCrashedError,
  AppNotInstalledError,
  DeviceOfflineError,
  TimeoutError,
} from "./errors";

/**
 * DriverErrorKind enumerates normalized error categories surfaced by Appium adapters.
 * PURPOSE: Ensures domain logic handles a small, typed set of error outcomes deterministically.
 */
export const DriverErrorKind = {
  DRIVER_TIMEOUT: "DRIVER_TIMEOUT",
  SESSION_LOST: "SESSION_LOST",
  APP_NOT_FOREGROUND: "APP_NOT_FOREGROUND",
  INPUT_FAILED: "INPUT_FAILED",
  VISIBILITY_STALE: "VISIBILITY_STALE",
  WINDOW_METRICS_UNKNOWN: "WINDOW_METRICS_UNKNOWN",
  INTERNAL_DRIVER_ERROR: "INTERNAL_DRIVER_ERROR",
} as const;

export type DriverErrorKind = (typeof DriverErrorKind)[keyof typeof DriverErrorKind];

/**
 * mapAdapterErrorToDriverErrorKind coerces thrown adapter errors to DriverErrorKind values.
 * PURPOSE: Collapses vendor-specific errors into deterministic categories for recovery policies.
 */
export function mapAdapterErrorToDriverErrorKind(error: unknown): DriverErrorKind {
  if (error instanceof TimeoutError) {
    return DriverErrorKind.DRIVER_TIMEOUT;
  }
  if (error instanceof AppNotInstalledError) {
    return DriverErrorKind.APP_NOT_FOREGROUND;
  }
  if (error instanceof AppCrashedError) {
    return DriverErrorKind.SESSION_LOST;
  }
  if (error instanceof DeviceOfflineError) {
    return DriverErrorKind.SESSION_LOST;
  }

  return DriverErrorKind.INTERNAL_DRIVER_ERROR;
}

