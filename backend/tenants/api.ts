import { APIError, api } from "encore.dev/api";
import log from "encore.dev/log";
import type {
  ConnectTenantConnectorRequest,
  ConnectTenantConnectorResponse,
  ConnectorProvider,
  DisconnectTenantConnectorRequest,
  DisconnectTenantConnectorResponse,
  GetTenantRequest,
  GetTenantResponse,
  ListTenantsResponse,
} from "./dto";
import { CONNECTOR_PROVIDERS } from "./dto";
import {
  findTenantBySlug,
  listTenantsWithConnectors,
  markConnectorConnected,
  markConnectorDisconnected,
} from "./repository";

/**
 * SLUG_PATTERN restricts tenant slug path parameters to URL-safe values.
 * PURPOSE: Reject malformed slug inputs before hitting the database.
 */
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * CONNECTOR_PROVIDER_LOOKUP accelerates provider validation for connect APIs.
 * PURPOSE: Avoid linear scans when checking request provider values.
 */
const CONNECTOR_PROVIDER_LOOKUP = new Set<ConnectorProvider>(CONNECTOR_PROVIDERS);

/**
 * logger anchors structured logs for the tenants API surface.
 * PURPOSE: Keep module/actor fields consistent across tenant endpoints.
 */
const logger = log.with({ module: "tenants", actor: "api" });

/**
 * validateSlug ensures path slugs match the expected URL-safe pattern.
 * PURPOSE: Surface consistent invalidArgument errors for bad slugs.
 */
function validateSlug(slug: string): void {
  if (!slug || !SLUG_PATTERN.test(slug)) {
    throw APIError.invalidArgument("tenant_slug_invalid");
  }
}

/**
 * parseProvider coerces a path-param string into a ConnectorProvider.
 * PURPOSE: Encore path params are plain strings; validate before repository writes.
 */
function parseProvider(provider: string): ConnectorProvider {
  if (!CONNECTOR_PROVIDER_LOOKUP.has(provider as ConnectorProvider)) {
    throw APIError.invalidArgument("connector_provider_invalid");
  }
  return provider as ConnectorProvider;
}

/**
 * listTenants returns the onboarded tenant roster with connector status.
 * PURPOSE: Drive the tenant landing page (venkat.ag first, shoploop second).
 */
export const listTenants = api(
  { method: "GET", path: "/tenants", expose: true },
  async (): Promise<ListTenantsResponse> => {
    const tenants = await listTenantsWithConnectors();
    logger.info("listed tenants", { count: tenants.length });
    return { tenants };
  },
);

/**
 * getTenant returns one tenant and its connectors by slug.
 * PURPOSE: Support tenant-focused connector management views.
 */
export const getTenant = api(
  { method: "GET", path: "/tenants/:slug", expose: true },
  async (req: GetTenantRequest): Promise<GetTenantResponse> => {
    validateSlug(req.slug);
    const tenant = await findTenantBySlug(req.slug);
    if (!tenant) {
      throw APIError.notFound("tenant_not_found");
    }
    logger.info("fetched tenant", { slug: tenant.slug, tenantId: tenant.tenantId });
    return { tenant };
  },
);

/**
 * connectTenantConnector marks a tenant connector as connected.
 * PURPOSE: Complete GitHub / Slack / Perplexity linking for a tenant.
 */
export const connectTenantConnector = api(
  { method: "POST", path: "/tenants/:slug/connectors/:provider/connect", expose: true },
  async (req: ConnectTenantConnectorRequest): Promise<ConnectTenantConnectorResponse> => {
    validateSlug(req.slug);
    const provider = parseProvider(req.provider);

    const tenant = await findTenantBySlug(req.slug);
    if (!tenant) {
      throw APIError.notFound("tenant_not_found");
    }

    const connector = await markConnectorConnected(
      tenant.tenantId,
      provider,
      req.externalAccountLabel,
    );
    if (!connector) {
      throw APIError.notFound("connector_not_found");
    }

    logger.info("connected tenant connector", {
      slug: tenant.slug,
      tenantId: tenant.tenantId,
      provider: connector.provider,
      connectorId: connector.connectorId,
    });

    return { connector };
  },
);

/**
 * disconnectTenantConnector clears a previously connected connector.
 * PURPOSE: Allow operators to unlink GitHub / Slack / Perplexity from a tenant.
 */
export const disconnectTenantConnector = api(
  { method: "POST", path: "/tenants/:slug/connectors/:provider/disconnect", expose: true },
  async (req: DisconnectTenantConnectorRequest): Promise<DisconnectTenantConnectorResponse> => {
    validateSlug(req.slug);
    const provider = parseProvider(req.provider);

    const tenant = await findTenantBySlug(req.slug);
    if (!tenant) {
      throw APIError.notFound("tenant_not_found");
    }

    const connector = await markConnectorDisconnected(tenant.tenantId, provider);
    if (!connector) {
      throw APIError.notFound("connector_not_found");
    }

    logger.info("disconnected tenant connector", {
      slug: tenant.slug,
      tenantId: tenant.tenantId,
      provider: connector.provider,
      connectorId: connector.connectorId,
    });

    return { connector };
  },
);
