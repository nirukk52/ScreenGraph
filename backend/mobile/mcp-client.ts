/** Mobile MCP client wrapper for invoking mobile-mcp tools. */

import { type ChildProcess, spawn } from "node:child_process";
import log from "encore.dev/log";
import type {
  AppInfo,
  DeviceButton,
  DeviceInfo,
  Orientation,
  Screenshot,
  SwipeDirection,
  UIElement,
} from "./types";

/** Mobile MCP JSON-RPC request. */
interface MCPRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params: Record<string, unknown>;
}

/** Mobile MCP JSON-RPC response. */
interface MCPResponse {
  jsonrpc: "2.0";
  id: number;
  result?: {
    content: Array<{ type: "text"; text: string }>;
    isError?: boolean;
  };
  error?: {
    code: number;
    message: string;
  };
}

/** Mobile MCP server initialization response. */
interface MCPInitResponse {
  protocolVersion: string;
  serverInfo: {
    name: string;
    version: string;
  };
  capabilities: {
    tools?: Record<string, unknown>;
    resources?: Record<string, unknown>;
  };
}

/** Client for invoking mobile-mcp server tools via stdio. */
export class MobileMCPClient {
  private process: ChildProcess | undefined;
  private requestId = 0;
  private responseHandlers = new Map<number, (response: MCPResponse) => void>();
  private logger = log.with({ module: "mobile", component: "mcp-client" });
  private buffer = "";
  private initialized = false;
  private initializationPromise: Promise<void> | undefined;

  /** Initialize the mobile-mcp server process. */
  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.initialized) {
      return;
    }

    // If initialization is in progress, wait for it to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization and store the promise
    this.initializationPromise = this.doInitialize();

    try {
      await this.initializationPromise;
    } catch (error) {
      // On failure, clear the promise so retry is possible
      this.initializationPromise = undefined;
      throw error;
    }
  }

  /** Internal initialization implementation. */
  private async doInitialize(): Promise<void> {
    this.logger.info("starting mobile-mcp server");

    this.process = spawn("npx", ["-y", "@mobilenext/mobile-mcp@latest"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (!this.process.stdout || !this.process.stdin || !this.process.stderr) {
      this.cleanup();
      throw new Error("Failed to create mobile-mcp process stdio streams");
    }

    this.process.stdout.on("data", (data: Buffer) => {
      this.handleStdout(data);
    });

    this.process.stderr.on("data", (data: Buffer) => {
      this.logger.warn("mobile-mcp stderr", { stderr: data.toString() });
    });

    this.process.on("error", (error: Error) => {
      this.logger.error("mobile-mcp process error", { error: error.message });
    });

    this.process.on("exit", (code: number | null) => {
      this.logger.info("mobile-mcp process exited", { exitCode: code });
      this.initialized = false;
      this.initializationPromise = undefined;
    });

    try {
      // Send initialization request
      const initRequest = {
        jsonrpc: "2.0",
        id: this.requestId++,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "screengraph-mobile-service",
            version: "1.0.0",
          },
        },
      };

      const initResponse = await this.sendRequest<MCPInitResponse>(initRequest);
      this.logger.info("mobile-mcp initialized", {
        serverVersion: initResponse.serverInfo.version,
      });

      // Send initialized notification
      this.sendNotification({
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      });

      this.initialized = true;
    } catch (error) {
      // Clean up process on initialization failure
      this.logger.error("mobile-mcp initialization failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      this.cleanup();
      throw error;
    }
  }

  /** Clean up process and reset state. */
  private cleanup(): void {
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
    this.initialized = false;
    this.buffer = "";
    this.responseHandlers.clear();
  }

  /** Handle stdout data from mobile-mcp process. */
  private handleStdout(data: Buffer): void {
    this.buffer += data.toString();

    // Process complete JSON-RPC messages (newline-delimited)
    let newlineIndex = this.buffer.indexOf("\n");
    while (newlineIndex !== -1) {
      const line = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.trim()) {
        try {
          const response = JSON.parse(line) as MCPResponse;
          const handler = this.responseHandlers.get(response.id);
          if (handler) {
            handler(response);
            this.responseHandlers.delete(response.id);
          }
        } catch (error) {
          this.logger.error("failed to parse mobile-mcp response", {
            error: error instanceof Error ? error.message : String(error),
            line,
          });
        }
      }
      newlineIndex = this.buffer.indexOf("\n");
    }
  }

  /** Send JSON-RPC request to mobile-mcp and wait for response. */
  private async sendRequest<T>(request: MCPRequest): Promise<T> {
    if (!this.process?.stdin) {
      throw new Error("Mobile MCP process not running");
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseHandlers.delete(request.id);
        reject(new Error(`Mobile MCP request timeout: ${request.method}`));
      }, 30000);

      this.responseHandlers.set(request.id, (response: MCPResponse) => {
        clearTimeout(timeout);

        if (response.error) {
          reject(new Error(`Mobile MCP error: ${response.error.message}`));
          return;
        }

        if (response.result?.isError) {
          const errorText = response.result.content[0]?.text || "Unknown error";
          reject(new Error(`Mobile MCP tool error: ${errorText}`));
          return;
        }

        // Extract result from content array
        if (response.result?.content && response.result.content.length > 0) {
          const textContent = response.result.content[0].text;
          try {
            // Try to parse as JSON if possible
            resolve(JSON.parse(textContent) as T);
          } catch {
            // Return as plain text
            resolve(textContent as T);
          }
        } else {
          resolve({} as T);
        }
      });

      const message = `${JSON.stringify(request)}\n`;
      if (this.process?.stdin) {
        this.process.stdin.write(message);
      }
    });
  }

  /** Send JSON-RPC notification (no response expected). */
  private sendNotification(notification: {
    jsonrpc: "2.0";
    method: string;
    params: Record<string, unknown>;
  }): void {
    if (!this.process?.stdin) {
      throw new Error("Mobile MCP process not running");
    }

    const message = `${JSON.stringify(notification)}\n`;
    this.process.stdin.write(message);
  }

  /** Invoke mobile-mcp tool. */
  private async invokeTool<T>(toolName: string, args: Record<string, unknown>): Promise<T> {
    if (!this.initialized) {
      await this.initialize();
    }

    const request: MCPRequest = {
      jsonrpc: "2.0",
      id: this.requestId++,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    };

    return this.sendRequest<T>(request);
  }

  /** List all available devices. */
  async listDevices(): Promise<DeviceInfo[]> {
    const result = await this.invokeTool<string>("mobile_list_available_devices", {});
    return this.parseDevicesFromText(result);
  }

  /** Parse device list from mobile-mcp text response. */
  private parseDevicesFromText(text: string): DeviceInfo[] {
    const devices: DeviceInfo[] = [];
    const lines = text.split("\n");

    for (const line of lines) {
      if (line.includes("iOS simulators:")) {
        const match = line.match(/\[(.*?)\]/);
        if (match) {
          const simulators = match[1].split(",").map((s) => s.trim());
          for (const sim of simulators) {
            if (sim) {
              devices.push({
                id: sim,
                name: sim,
                platform: "ios",
                type: "simulator",
                version: "unknown",
              });
            }
          }
        }
      } else if (line.includes("iOS devices:")) {
        const match = line.match(/\[(.*?)\]/);
        if (match) {
          const iosDevices = match[1].split(",").map((s) => s.trim());
          for (const dev of iosDevices) {
            if (dev) {
              devices.push({
                id: dev,
                name: dev,
                platform: "ios",
                type: "real",
                version: "unknown",
              });
            }
          }
        }
      } else if (line.includes("Android devices:")) {
        const match = line.match(/\[(.*?)\]/);
        if (match) {
          const androidDevices = match[1].split(",").map((s) => s.trim());
          for (const dev of androidDevices) {
            if (dev) {
              devices.push({
                id: dev,
                name: dev,
                platform: "android",
                type: "real",
                version: "unknown",
              });
            }
          }
        }
      }
    }

    return devices;
  }

  /** List apps on device. */
  async listApps(deviceId: string): Promise<AppInfo[]> {
    const result = await this.invokeTool<string>("mobile_list_apps", { device: deviceId });
    return this.parseAppsFromText(result);
  }

  /** Parse app list from mobile-mcp text response. */
  private parseAppsFromText(text: string): AppInfo[] {
    const apps: AppInfo[] = [];
    // Example format: "Found these apps on device: App Name (com.package.name), ..."
    const match = text.match(/Found these apps on device: (.*)/);
    if (match) {
      const appStrings = match[1].split(",").map((s) => s.trim());
      for (const appStr of appStrings) {
        const appMatch = appStr.match(/(.+?)\s+\((.+?)\)/);
        if (appMatch) {
          apps.push({
            appName: appMatch[1].trim(),
            packageName: appMatch[2].trim(),
          });
        }
      }
    }
    return apps;
  }

  /** Launch app on device. */
  async launchApp(deviceId: string, packageName: string): Promise<string> {
    return this.invokeTool<string>("mobile_launch_app", {
      device: deviceId,
      packageName,
    });
  }

  /** Terminate app on device. */
  async terminateApp(deviceId: string, packageName: string): Promise<string> {
    return this.invokeTool<string>("mobile_terminate_app", {
      device: deviceId,
      packageName,
    });
  }

  /** Install app on device. */
  async installApp(deviceId: string, appPath: string): Promise<string> {
    return this.invokeTool<string>("mobile_install_app", {
      device: deviceId,
      path: appPath,
    });
  }

  /** Uninstall app from device. */
  async uninstallApp(deviceId: string, packageName: string): Promise<string> {
    return this.invokeTool<string>("mobile_uninstall_app", {
      device: deviceId,
      packageName,
    });
  }

  /** Capture screenshot from device. */
  async captureScreenshot(deviceId: string): Promise<Screenshot> {
    const result = await this.invokeTool<{ image: string; width: number; height: number }>(
      "mobile_take_screenshot",
      { device: deviceId },
    );

    return {
      data: result.image,
      width: result.width,
      height: result.height,
      timestamp: new Date().toISOString(),
    };
  }

  /** Get UI elements from device. */
  async getUIElements(deviceId: string): Promise<{ elements: UIElement[]; sourceXml?: string }> {
    const result = await this.invokeTool<string>("mobile_list_elements_on_screen", {
      device: deviceId,
    });

    // Parse UI elements from mobile-mcp response
    // Note: mobile-mcp returns structured data, implementation may need adjustment
    return {
      elements: [],
      sourceXml: result,
    };
  }

  /** Tap at coordinates on device. */
  async tapAtCoordinates(deviceId: string, x: number, y: number): Promise<string> {
    return this.invokeTool<string>("mobile_click_on_screen_at_coordinates", {
      device: deviceId,
      x,
      y,
    });
  }

  /** Long press at coordinates on device. */
  async longPressAtCoordinates(
    deviceId: string,
    x: number,
    y: number,
    durationMs?: number,
  ): Promise<string> {
    return this.invokeTool<string>("mobile_long_press_on_screen_at_coordinates", {
      device: deviceId,
      x,
      y,
      duration: durationMs || 1000,
    });
  }

  /** Double tap at coordinates on device. */
  async doubleTapAtCoordinates(deviceId: string, x: number, y: number): Promise<string> {
    return this.invokeTool<string>("mobile_double_tap_on_screen", {
      device: deviceId,
      x,
      y,
    });
  }

  /** Perform swipe gesture on device. */
  async swipe(
    deviceId: string,
    direction: SwipeDirection,
    distance?: number,
    durationMs?: number,
  ): Promise<string> {
    return this.invokeTool<string>("mobile_swipe_on_screen", {
      device: deviceId,
      direction,
      distance: distance || 0.5,
      duration: durationMs || 300,
    });
  }

  /** Type text on device. */
  async typeText(deviceId: string, text: string, submit?: boolean): Promise<string> {
    return this.invokeTool<string>("mobile_type_keys", {
      device: deviceId,
      text,
      submit: submit || false,
    });
  }

  /** Press device button. */
  async pressButton(deviceId: string, button: DeviceButton): Promise<string> {
    return this.invokeTool<string>("mobile_press_button", {
      device: deviceId,
      button,
    });
  }

  /** Get screen size. */
  async getScreenSize(deviceId: string): Promise<{ width: number; height: number }> {
    return this.invokeTool<{ width: number; height: number }>("mobile_get_screen_size", {
      device: deviceId,
    });
  }

  /** Get device orientation. */
  async getOrientation(deviceId: string): Promise<Orientation> {
    const result = await this.invokeTool<{ orientation: Orientation }>("mobile_get_orientation", {
      device: deviceId,
    });
    return result.orientation;
  }

  /** Set device orientation. */
  async setOrientation(deviceId: string, orientation: Orientation): Promise<string> {
    return this.invokeTool<string>("mobile_set_orientation", {
      device: deviceId,
      orientation,
    });
  }

  /** Open URL in device browser. */
  async openURL(deviceId: string, url: string): Promise<string> {
    return this.invokeTool<string>("mobile_open_url", {
      device: deviceId,
      url,
    });
  }

  /** Shutdown the mobile-mcp process. */
  async shutdown(): Promise<void> {
    if (this.process) {
      this.logger.info("shutting down mobile-mcp server");
      this.cleanup();
    }
  }
}

/** Singleton mobile-mcp client instance. */
let mcpClientInstance: MobileMCPClient | undefined;

/** Get or create mobile-mcp client singleton. */
export function getMobileMCPClient(): MobileMCPClient {
  if (!mcpClientInstance) {
    mcpClientInstance = new MobileMCPClient();
  }
  return mcpClientInstance;
}
