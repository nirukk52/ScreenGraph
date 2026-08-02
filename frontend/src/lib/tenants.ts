import type { tenants } from "./encore-client";
import { getEncoreClient } from "./getEncoreClient";

/**
 * listTenants fetches the onboarded tenant roster with connector status.
 * PURPOSE: Power the tenant landing page without manual fetch calls.
 */
export async function listTenants(): Promise<tenants.ListTenantsResponse> {
  const client = await getEncoreClient();
  return client.tenants.listTenants();
}

/**
 * getTenant fetches one tenant and its connectors by slug.
 * PURPOSE: Support tenant-focused connector management views.
 */
export async function getTenant(slug: string): Promise<tenants.GetTenantResponse> {
  const client = await getEncoreClient();
  return client.tenants.getTenant(slug);
}

/**
 * connectTenantConnector marks a provider as connected for a tenant.
 * PURPOSE: Complete GitHub / Slack / Perplexity linking from the UI.
 */
export async function connectTenantConnector(
  slug: string,
  provider: tenants.ConnectorProvider,
  externalAccountLabel?: string,
): Promise<tenants.ConnectTenantConnectorResponse> {
  const client = await getEncoreClient();
  return client.tenants.connectTenantConnector(slug, provider, {
    externalAccountLabel,
  });
}

/**
 * disconnectTenantConnector clears a previously connected provider.
 * PURPOSE: Allow operators to unlink connectors from the UI.
 */
export async function disconnectTenantConnector(
  slug: string,
  provider: tenants.ConnectorProvider,
): Promise<tenants.DisconnectTenantConnectorResponse> {
  const client = await getEncoreClient();
  return client.tenants.disconnectTenantConnector(slug, provider);
}
