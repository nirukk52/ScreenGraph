import type { NavigationPort } from "../../ports/appium/navigation.port";

/**
 * Fake implementation of NavigationPort for testing.
 * Provides predictable mock behavior without requiring a real device.
 */
export class FakeNavigationPort implements NavigationPort {
  async performBack(): Promise<void> {
    // No-op for testing
  }

  async pressHome(): Promise<void> {
    // No-op for testing
  }
}

