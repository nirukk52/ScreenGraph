/**
 * Retry utilities for Appium adapter operations.
 * Implements retry logic with exponential backoff for transient failures.
 */

export interface RetryOptions {
  maxAttempts?: number;
  backoffMs?: number[];
}

/**
 * Default retry configuration
 */
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BACKOFF_MS = [100, 200, 400];

/**
 * Retry decorator for async operations.
 * Retries on transient failures (DeviceOfflineError, TimeoutError).
 * 
 * Args:
 *   options: Retry configuration (maxAttempts, backoffMs)
 * 
 * Returns:
 *   Decorated function with retry logic
 */
export function retryOnTransient(options: RetryOptions = {}) {
  const maxAttempts = options.maxAttempts || DEFAULT_MAX_ATTEMPTS;
  const backoffMs = options.backoffMs || DEFAULT_BACKOFF_MS;

  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Only retry on transient errors
          if (error instanceof Error && this.isTransientError(error)) {
            if (attempt < maxAttempts - 1) {
              const delayMs = backoffMs[Math.min(attempt, backoffMs.length - 1)];
              console.warn(
                `Attempt ${attempt + 1}/${maxAttempts} failed: ${error.message}. Retrying in ${delayMs}ms...`,
              );
              await new Promise((resolve) => setTimeout(resolve, delayMs));
              continue;
            }
          }

          // Non-transient error or all retries exhausted
          throw error;
        }
      }

      // All retries exhausted
      console.error(`All ${maxAttempts} attempts failed`);
      throw lastError;
    };

    return descriptor;
  };
}

/**
 * Check if an error is transient (should be retried).
 * 
 * Args:
 *   error: Error to check
 * 
 * Returns:
 *   True if error is transient, False otherwise
 */
export function isTransientError(error: Error): boolean {
  const transientPatterns = [
    "timeout",
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
    "socket hang up",
    "connection lost",
  ];

  return transientPatterns.some((pattern) =>
    error.message.toLowerCase().includes(pattern.toLowerCase()),
  );
}

