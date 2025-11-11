import { Client } from "@modelcontextprotocol/sdk/client";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse";
import { CallToolResultSchema, type CallToolResult } from "@modelcontextprotocol/sdk/types";
import log from "encore.dev/log";

import {
  MOBILE_MCP_AWS_MCP_BEARER_TOKEN,
  MOBILE_MCP_AWS_MCP_URL,
  MOBILE_MCP_DEVICE_POOL_ARN,
  MOBILE_MCP_PROJECT_ARN,
  MOBILE_MCP_STATIC_DEVICE_ID,
} from "../config/env";
import type { MobilePlatformKind } from "./dto";

/**
 * DeviceFarmSessionDetails surfaces the metadata required to route traffic to the allocated device.
 * PURPOSE: Shared contract between the connector and session registry.
 */
export interface DeviceFarmSessionDetails {
  deviceId: string;
  devicePlatform: MobilePlatformKind;
  deviceFarmJobArn?: string;
  appiumEndpointUrl?: string;
  mcpSessionToken?: string;
}

/**
 * DeviceFarmStartInput conveys the contextual information for provisioning a Device Farm session.
 * PURPOSE: Keeps connector inputs minimal while supporting overrides per request.
 */
export interface DeviceFarmStartInput {
  runId: string;
  platform: MobilePlatformKind;
  projectArnOverride?: string;
  devicePoolArnOverride?: string;
}

/**
 * AwsDeviceFarmConnector uses the AWS MCP bridge (when available) to allocate and release devices.
 * PURPOSE: Centralizes Device Farm communication while offering a deterministic fallback for local dev.
 */
export class AwsDeviceFarmConnector {
  private readonly logger = log.with({ module: "mobile-mcp", actor: "aws-connector" });

  /**
   * startSession provisions a device either through the AWS MCP bridge or a local fallback.
   * PURPOSE: Supplies the runtime with a device identifier and related metadata.
   */
  async startSession(input: DeviceFarmStartInput): Promise<DeviceFarmSessionDetails> {
    if (!MOBILE_MCP_AWS_MCP_URL) {
      if (!MOBILE_MCP_STATIC_DEVICE_ID) {
        throw new Error("MOBILE_MCP_STATIC_DEVICE_ID must be set when AWS MCP bridge is disabled");
      }

      this.logger.info("Using static device id fallback for Mobile MCP session", {
        runId: input.runId,
        platform: input.platform,
      });

      return {
        deviceId: MOBILE_MCP_STATIC_DEVICE_ID,
        devicePlatform: input.platform,
      };
    }

    const url = new URL(MOBILE_MCP_AWS_MCP_URL);
    const requestHeaders: Record<string, string> = {};
    if (MOBILE_MCP_AWS_MCP_BEARER_TOKEN) {
      requestHeaders.Authorization = `Bearer ${MOBILE_MCP_AWS_MCP_BEARER_TOKEN}`;
    }

    const transport = new SSEClientTransport(url, {
      requestInit: {
        headers: requestHeaders,
      },
    });

    const client = new Client(
      {
        name: "mobile-mcp-aws-connector",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    try {
      await client.connect(transport);

      const argumentsPayload: Record<string, unknown> = {
        runId: input.runId,
        platform: input.platform,
        projectArn: input.projectArnOverride || MOBILE_MCP_PROJECT_ARN || undefined,
        devicePoolArn: input.devicePoolArnOverride || MOBILE_MCP_DEVICE_POOL_ARN || undefined,
      };

      const callResult = await client.request(
        {
          method: "tools/call",
          params: {
            name: "device_farm.start_session",
            arguments: argumentsPayload,
          },
        },
        CallToolResultSchema,
      );

      const details = this.parseDeviceFarmSession(callResult, input.platform);
      this.logger.info("AWS Device Farm session started", {
        runId: input.runId,
        deviceId: details.deviceId,
        jobArn: details.deviceFarmJobArn,
      });
      return details;
    } finally {
      await transport.close();
    }
  }

  /**
   * stopSession tears down the Device Farm job when the AWS MCP bridge is configured.
   * PURPOSE: Ensures allocated devices are released promptly after agent completion.
   */
  async stopSession(deviceFarmJobArn: string | undefined): Promise<void> {
    if (!deviceFarmJobArn) {
      this.logger.info("Skip Device Farm stop session because no job ARN was recorded");
      return;
    }

    if (!MOBILE_MCP_AWS_MCP_URL) {
      this.logger.info("AWS MCP bridge disabled, assuming static device cleanup handled externally", {
        jobArn: deviceFarmJobArn,
      });
      return;
    }

    const url = new URL(MOBILE_MCP_AWS_MCP_URL);
    const requestHeaders: Record<string, string> = {};
    if (MOBILE_MCP_AWS_MCP_BEARER_TOKEN) {
      requestHeaders.Authorization = `Bearer ${MOBILE_MCP_AWS_MCP_BEARER_TOKEN}`;
    }

    const transport = new SSEClientTransport(url, {
      requestInit: {
        headers: requestHeaders,
      },
    });

    const client = new Client(
      {
        name: "mobile-mcp-aws-connector",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    try {
      await client.connect(transport);
      await client.request(
        {
          method: "tools/call",
          params: {
            name: "device_farm.stop_session",
            arguments: {
              jobArn: deviceFarmJobArn,
            },
          },
        },
        CallToolResultSchema,
      );
      this.logger.info("AWS Device Farm session stopped", { jobArn: deviceFarmJobArn });
    } catch (err) {
      this.logger.warn("Failed to stop AWS Device Farm session", { err, jobArn: deviceFarmJobArn });
    } finally {
      await transport.close();
    }
  }

  private parseDeviceFarmSession(result: CallToolResult, platform: MobilePlatformKind): DeviceFarmSessionDetails {
    for (const content of result.content ?? []) {
      if (content.type === "text" && content.text) {
        const parsed = this.tryParseJson(content.text.trim());
        if (parsed && typeof parsed.deviceId === "string") {
          return {
            deviceId: parsed.deviceId,
            devicePlatform: platform,
            deviceFarmJobArn: typeof parsed.deviceFarmJobArn === "string" ? parsed.deviceFarmJobArn : undefined,
            appiumEndpointUrl: typeof parsed.appiumEndpointUrl === "string" ? parsed.appiumEndpointUrl : undefined,
            mcpSessionToken: typeof parsed.mcpSessionToken === "string" ? parsed.mcpSessionToken : undefined,
          };
        }
      }

      if (content.type === "resource" && content.resource && "text" in content.resource) {
        const parsed = this.tryParseJson(String(content.resource.text));
        if (parsed && typeof parsed.deviceId === "string") {
          return {
            deviceId: parsed.deviceId,
            devicePlatform: platform,
            deviceFarmJobArn: typeof parsed.deviceFarmJobArn === "string" ? parsed.deviceFarmJobArn : undefined,
            appiumEndpointUrl: typeof parsed.appiumEndpointUrl === "string" ? parsed.appiumEndpointUrl : undefined,
            mcpSessionToken: typeof parsed.mcpSessionToken === "string" ? parsed.mcpSessionToken : undefined,
          };
        }
      }
    }

    throw new Error("Unable to parse AWS Device Farm session response");
  }

  private tryParseJson(value: string): Record<string, unknown> | null {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
      return null;
    }
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      return parsed;
    } catch {
      return null;
    }
  }
}
