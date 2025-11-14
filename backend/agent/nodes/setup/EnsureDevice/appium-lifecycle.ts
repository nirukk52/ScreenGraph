import log from "encore.dev/log";
import { APPIUM_PORT } from "../../../../config/env";

/** Logger for Appium lifecycle operations. */
const logger = log.with({ module: "agent", actor: "appium-lifecycle" });

/** Health check result for Appium server. */
export interface AppiumHealthStatus {
  /** Whether Appium is running and ready. */
  isHealthy: boolean;
  /** HTTP status code from health check (undefined if connection failed). */
  statusCode?: number;
  /** Error message if health check failed. */
  error?: string;
}

/** PID tracking for started Appium process. */
export interface AppiumProcess {
  /** Process ID of the Appium server. */
  pid: number;
  /** Port the Appium server is listening on. */
  port: number;
}

/**
 * Checks if Appium server is running and healthy by polling its /status endpoint.
 * PURPOSE: Determine if existing Appium instance can be reused or needs restart.
 *
 * @param port - Port to check (defaults to APPIUM_PORT from env)
 * @returns Health status with connection details
 */
export async function checkAppiumHealth(port: number = APPIUM_PORT): Promise<AppiumHealthStatus> {
  const url = `http://localhost:${port}/status`;

  try {
    logger.info("checking appium health", { port, url });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.warn("appium health check failed", {
        port,
        statusCode: response.status,
        statusText: response.statusText,
      });

      return {
        isHealthy: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = await response.json();
    const isReady = data?.value?.ready === true;

    if (isReady) {
      logger.info("appium is healthy", { port, ready: true });
      return { isHealthy: true, statusCode: response.status };
    }

    logger.warn("appium not ready", { port, data });
    return {
      isHealthy: false,
      statusCode: response.status,
      error: "Appium server not ready",
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.warn("appium health check connection failed", {
      port,
      error: errorMessage,
    });

    return {
      isHealthy: false,
      error: `Connection failed: ${errorMessage}`,
    };
  }
}

/**
 * Starts Appium server as a background process.
 * PURPOSE: Launch Appium when no healthy instance exists.
 *
 * @param port - Port to start Appium on (defaults to APPIUM_PORT from env)
 * @returns Process information with PID
 * @throws Error if Appium fails to start within 60 seconds
 */
export async function startAppium(port: number = APPIUM_PORT): Promise<AppiumProcess> {
  logger.info("starting appium server", { port });

  const { spawn } = await import("node:child_process");

  // Start Appium with proper stdio handling (inherit for logs)
  const appiumProcess = spawn("appium", ["--port", String(port)], {
    detached: false, // Keep attached so we can monitor it
    stdio: ["ignore", "pipe", "pipe"], // Pipe stdout/stderr for monitoring
  });

  const pid = appiumProcess.pid;

  if (!pid) {
    const error = "Failed to start Appium: no PID returned";
    logger.error(error, { port });
    throw new Error(error);
  }

  // Capture stdout/stderr for debugging while bounding memory usage
  const MAX_STDIO_BUFFER = 5_000;
  let stdoutData = "";
  let stderrData = "";

  const limitBuffer = (buffer: string, chunk: string): string => {
    const updated = buffer + chunk;
    return updated.length > MAX_STDIO_BUFFER ? updated.slice(-MAX_STDIO_BUFFER) : updated;
  };

  const handleStdout = (data: Buffer): void => {
    const chunk = data.toString();
    stdoutData = limitBuffer(stdoutData, chunk);
    // Log if it contains "Welcome to Appium" or error messages
    if (chunk.includes("Welcome to Appium") || chunk.includes("error")) {
      logger.info("appium stdout", { output: chunk.trim() });
    }
  };

  const handleStderr = (data: Buffer): void => {
    const chunk = data.toString();
    stderrData = limitBuffer(stderrData, chunk);
    logger.warn("appium stderr", { error: chunk.trim() });
  };

  const detachListeners = (): void => {
    appiumProcess.stdout?.off("data", handleStdout);
    appiumProcess.stderr?.off("data", handleStderr);
  };

  appiumProcess.stdout?.on("data", handleStdout);
  appiumProcess.stderr?.on("data", handleStderr);

  logger.info("appium process spawned", { pid, port });

  // Poll for health with timeout (60s)
  const startTime = Date.now();
  const timeoutMs = 60_000; // 60 seconds
  const pollIntervalMs = 500; // Check every 500ms

  while (Date.now() - startTime < timeoutMs) {
    // Check if process died
    if (appiumProcess.exitCode !== null) {
      const error = `Appium process exited with code ${appiumProcess.exitCode}`;
      detachListeners();
      logger.error(error, {
        pid,
        port,
        exitCode: appiumProcess.exitCode,
        stdout: stdoutData.slice(-500), // Last 500 chars
        stderr: stderrData.slice(-500),
      });
      throw new Error(error);
    }

    const health = await checkAppiumHealth(port);

    if (health.isHealthy) {
      logger.info("appium ready", { pid, port, elapsedMs: Date.now() - startTime });
      detachListeners();
      return { pid, port };
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  // Timeout - kill the process and throw
  try {
    appiumProcess.kill("SIGTERM");
    detachListeners();
    logger.error("appium start timeout - process killed", {
      pid,
      port,
      timeoutMs,
      stdout: stdoutData.slice(-1000),
      stderr: stderrData.slice(-1000),
    });
  } catch (killError) {
    detachListeners();
    logger.error("failed to kill stalled appium process", {
      pid,
      error: killError instanceof Error ? killError.message : String(killError),
    });
  }

  throw new Error(
    `Appium failed to become healthy within ${timeoutMs / 1000}s (PID ${pid}). Check logs above for details.`,
  );
}
