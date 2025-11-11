import { createMcpServer } from "@mobilenext/mobile-mcp";
import { Client } from "@modelcontextprotocol/sdk/client";
import { CallToolResultSchema, type CallToolResult } from "@modelcontextprotocol/sdk/types";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory";
import log from "encore.dev/log";

/**
 * MobileMcpRuntimeOptions define knobs required to bootstrap the in-process Mobile MCP server.
 * PURPOSE: Allows callers to tweak runtime identity for traceability without leaking implementation details.
 */
export interface MobileMcpRuntimeOptions {
  runtimeLabel?: string;
}

/**
 * MobileMcpRuntime manages an embedded Mobile MCP server and client pair inside the Encore process.
 * PURPOSE: Executes MCP tools without spawning external processes while preserving protocol semantics.
 */
export class MobileMcpRuntime {
  private readonly logger = log.with({ module: "mobile-mcp", actor: "runtime", label: this.options.runtimeLabel });
  private readonly server = createMcpServer();
  private client: Client | null = null;
  private clientTransport: InMemoryTransport | null = null;
  private serverTransport: InMemoryTransport | null = null;
  private initializePromise: Promise<void> | null = null;
  private disposed = false;
  private callChain: Promise<CallToolResult> = Promise.resolve().then(() => {
    return {
      content: [],
    } satisfies CallToolResult;
  });

  constructor(private readonly options: MobileMcpRuntimeOptions = {}) {}

  /**
   * init lazily wires the in-memory transport pair between the MCP server and client.
   * PURPOSE: Defers expensive setup until the first tool invocation while ensuring thread-safety via promise caching.
   */
  async init(): Promise<void> {
    if (this.disposed) {
      throw new Error("MobileMcpRuntime has been disposed");
    }
    if (this.client) {
      return;
    }
    if (!this.initializePromise) {
      this.initializePromise = this.initializeInternal();
    }
    await this.initializePromise;
  }

  /**
   * callTool executes a Mobile MCP tool by name with the provided arguments.
   * PURPOSE: Supplies a simple awaitable interface that serializes requests to guarantee determinism.
   */
  async callTool(toolName: string, args: Record<string, unknown>): Promise<CallToolResult> {
    await this.init();

    const client = this.client;
    if (!client) {
      throw new Error("Mobile MCP client not initialized");
    }

    this.logger.debug("Invoking Mobile MCP tool", { toolName, args });

    // Serialize calls to maintain deterministic order and avoid overlapping MCP request handling.
    this.callChain = this.callChain
      .catch(() => {
        // Reset the chain if previous invocation failed to avoid unhandled rejections cascading.
        return {
          content: [],
        } satisfies CallToolResult;
      })
      .then(async () => {
        const request = {
          method: "tools/call",
          params: {
            name: toolName,
            arguments: args,
          },
        } as const;

        const result = await client.request(request, CallToolResultSchema);
        this.logger.debug("Mobile MCP tool result", { toolName, result });
        return result;
      });

    return await this.callChain;
  }

  /**
   * dispose tears down transports and releases associated resources.
   * PURPOSE: Prevents leaking MCP transports when sessions conclude.
   */
  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }

    try {
      await this.clientTransport?.close();
    } catch (err) {
      this.logger.warn("Failed closing client transport", { err });
    }

    try {
      await this.serverTransport?.close();
    } catch (err) {
      this.logger.warn("Failed closing server transport", { err });
    }

    try {
      await this.server.close();
    } catch (err) {
      this.logger.warn("Failed closing Mobile MCP server", { err });
    }

    this.client = null;
    this.clientTransport = null;
    this.serverTransport = null;
    this.disposed = true;
  }

  private async initializeInternal(): Promise<void> {
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    this.clientTransport = clientTransport;
    this.serverTransport = serverTransport;

    await this.server.connect(serverTransport);

    const client = new Client(
      {
        name: "mobile-mcp-microservice",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    await client.connect(clientTransport);
    this.client = client;
  }
}
