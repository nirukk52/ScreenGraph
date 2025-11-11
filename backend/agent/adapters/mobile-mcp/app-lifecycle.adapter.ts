import type { ApplicationForegroundContext } from "../../domain/entities";
import type { AppLifecycleBudget, AppLifecyclePort } from "../../ports/appium/app-lifecycle.port";
import { getMobileMcpClient } from "./client";
import type { MobileMcpSessionState } from "./session.adapter";

/**
 * MobileMcpAppLifecycleAdapter implements AppLifecyclePort using Mobile MCP endpoints.
 * PURPOSE: Launches and restarts applications within the Mobile MCP session.
 */
export class MobileMcpAppLifecycleAdapter implements AppLifecyclePort {
  private lastForegroundPackage: string | null = null;

  constructor(private readonly contextProvider: () => MobileMcpSessionState | null) {}

  private get context(): MobileMcpSessionState {
    const ctx = this.contextProvider();
    if (!ctx) {
      throw new Error("Mobile MCP session not initialized");
    }
    return ctx;
  }

  async launchApp(packageId: string, _budget: AppLifecycleBudget): Promise<ApplicationForegroundContext> {
    const client = await getMobileMcpClient();
    await client.launchApp({
      sessionId: this.context.sessionId,
      packageName: packageId,
    });

    this.lastForegroundPackage = packageId;

    return {
      currentPackageId: packageId,
      currentActivityName: "unknown",
      appBroughtToForegroundTimestamp: new Date().toISOString(),
    };
  }

  async restartApp(packageId: string, budget: AppLifecycleBudget): Promise<boolean> {
    const client = await getMobileMcpClient();
    await client.pressButton({
      sessionId: this.context.sessionId,
      button: "HOME",
    });
    await this.launchApp(packageId, budget);
    return true;
  }

  async getCurrentApp(): Promise<string> {
    return this.lastForegroundPackage ?? "unknown";
  }
}
