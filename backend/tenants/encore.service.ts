import { Service } from "encore.dev/service";

/**
 * Tenants Service
 * PURPOSE: Hosts Encore endpoints for listing tenants and managing
 * per-tenant connectors (GitHub, Slack, Perplexity).
 */
export default new Service("tenants");
