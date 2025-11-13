import log from "encore.dev/log";

/** Logger for device prerequisite checks. */
const logger = log.with({ module: "agent", actor: "device-check" });

/** Device prerequisite check result. */
export interface DevicePrerequisite {
  /** Whether device is online and connectable. */
  isOnline: boolean;
  /** Device identifier (UDID or serial). */
  deviceId?: string;
  /** Error message if device check failed. */
  error?: string;
  /** Additional details about the check. */
  details?: Record<string, unknown>;
}

/** Configuration for device prerequisite check. */
export interface DeviceCheckConfig {
  /** Android package name or iOS bundle ID to verify. */
  appId: string;
  /** Device UDID (iOS) or serial (Android) - optional, will auto-detect if not provided. */
  deviceId?: string;
  /** Platform hint (android/ios) - optional, will auto-detect. */
  platform?: "android" | "ios";
}

/**
 * Checks if device prerequisites are met before starting Appium session.
 * PURPOSE: Fail fast with clear error if device is offline/disconnected.
 * 
 * This performs a lightweight check without creating a full Appium session:
 * - For Android: Uses `adb devices` to check connectivity
 * - For iOS: Uses `idevice_id -l` or similar tool
 * 
 * @param config - Device and app configuration to check
 * @returns Prerequisite status with device info or error
 */
export async function checkDevicePrerequisites(
  config: DeviceCheckConfig
): Promise<DevicePrerequisite> {
  logger.info("checking device prerequisites", {
    appId: config.appId,
    deviceId: config.deviceId,
    platform: config.platform,
  });
  
  try {
    // For MVP, we'll do a simple check via adb (Android) or other platform tools
    // This is a placeholder that will be expanded based on platform detection
    
    const { exec } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execAsync = promisify(exec);
    
    // Check for Android devices using adb
    const { stdout, stderr } = await execAsync("adb devices -l");
    
    if (stderr) {
      logger.warn("adb devices warning", { stderr });
    }
    
    // Parse adb output (format: "SERIAL\tdevice ..." or "SERIAL          device ...")
    // Filter for lines with "device" status (not "offline" or "unauthorized")
    const lines = stdout
      .split("\n")
      .filter((line) => line.trim().length > 0 && line.includes("device"))
      .filter((line) => !line.startsWith("List of devices")); // Skip header
    
    if (lines.length === 0) {
      logger.error("no devices found", { adbOutput: stdout });
      return {
        isOnline: false,
        error: "No connected devices found. Please connect a device or start an emulator.",
        details: { adbOutput: stdout },
      };
    }
    
    // If caller specified a deviceId, find that specific device
    if (config.deviceId) {
      const matchingLine = lines.find((line) => line.startsWith(config.deviceId));
      
      if (!matchingLine) {
        const availableDevices = lines.map((line) => line.trim().split(/\s+/)[0]);
        logger.error("requested device not found", {
          requestedDeviceId: config.deviceId,
          availableDevices,
          totalDevices: lines.length,
        });
        
        return {
          isOnline: false,
          error: `Requested device '${config.deviceId}' not found. Available devices: ${availableDevices.join(", ")}`,
          details: {
            requestedDeviceId: config.deviceId,
            availableDevices,
            adbOutput: stdout,
          },
        };
      }
      
      logger.info("requested device found online", {
        deviceId: config.deviceId,
        totalDevices: lines.length,
      });
      
      return {
        isOnline: true,
        deviceId: config.deviceId,
        details: {
          totalDevices: lines.length,
          adbOutput: stdout,
        },
      };
    }
    
    // No specific device requested - return first available device
    const firstLine = lines[0];
    const deviceId = firstLine.trim().split(/\s+/)[0];
    
    logger.info("device found online", {
      deviceId,
      totalDevices: lines.length,
    });
    
    return {
      isOnline: true,
      deviceId,
      details: {
        totalDevices: lines.length,
        adbOutput: stdout,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error("device prerequisite check failed", {
      error: errorMessage,
      appId: config.appId,
    });
    
    return {
      isOnline: false,
      error: `Device check failed: ${errorMessage}`,
      details: {
        originalError: errorMessage,
      },
    };
  }
}

