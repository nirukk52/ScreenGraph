import type { IdleDetectorPort } from "../../ports/appium/idle-detector.port";

/**
 * Fake implementation of IdleDetectorPort for testing.
 * Provides predictable mock behavior without requiring a real device.
 */
export class FakeIdleDetectorPort implements IdleDetectorPort {
  async waitIdle(minQuietMillis: number, maxWaitMillis: number): Promise<number> {
    return minQuietMillis + 100;
  }
}
