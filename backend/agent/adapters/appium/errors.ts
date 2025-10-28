/**
 * Appium adapter error classes mapping from Python exceptions.
 * Preserves the error semantics from the Python implementation.
 */

/**
 * Device is permanently offline or unreachable.
 */
export class DeviceOfflineError extends Error {
  constructor(message = "Device is offline or unreachable") {
    super(message);
    this.name = "DeviceOfflineError";
  }
}

/**
 * App package not found or not installed.
 */
export class AppNotInstalledError extends Error {
  constructor(message = "App not installed") {
    super(message);
    this.name = "AppNotInstalledError";
  }
}

/**
 * App crashed unexpectedly during operation.
 */
export class AppCrashedError extends Error {
  constructor(message = "App crashed unexpectedly") {
    super(message);
    this.name = "AppCrashedError";
  }
}

/**
 * Operation exceeded timeout threshold.
 */
export class TimeoutError extends Error {
  constructor(message = "Operation timed out") {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Element not found or not visible.
 */
export class ElementNotFoundError extends Error {
  constructor(message = "Element not found") {
    super(message);
    this.name = "ElementNotFoundError";
  }
}

/**
 * Invalid argument or parameter.
 */
export class InvalidArgumentError extends Error {
  constructor(message = "Invalid argument") {
    super(message);
    this.name = "InvalidArgumentError";
  }
}
