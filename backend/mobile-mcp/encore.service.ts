import { Service } from "encore.dev/service";

/**
 * MobileMcpService registers the Mobile MCP microservice within the Encore application graph.
 * PURPOSE: Allows other services to reference the Mobile MCP endpoint group via generated clients.
 */
export default new Service("mobile-mcp");
