/**
 * NavigationPort: System Navigation Interface
 * 
 * PURPOSE:
 * --------
 * Abstract interface for system-level navigation (back, home).
 * Enables ActNode to navigate within apps.
 * 
 * DEPENDENCIES (ALLOWED):
 * -----------------------
 * - None
 * 
 * DEPENDENCIES (FORBIDDEN):
 * -------------------------
 * - NO Appium SDK imports
 * - NO concrete driver implementations
 */
export interface NavigationPort {
  /**
   * Navigate back (hardware or software back button).
   * 
   * Raises:
   *   TimeoutError: If navigation timed out
   */
  performBack(): Promise<void>;

  /**
   * Go to home screen.
   * 
   * Raises:
   *   TimeoutError: If navigation timed out
   */
  pressHome(): Promise<void>;
}

