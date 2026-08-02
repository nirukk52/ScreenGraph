/**
 * TenantStatus models lifecycle states for an onboarded tenant.
 * PURPOSE: Drive UI badges and filterability without magic strings.
 */
export type TenantStatus = "active" | "pending" | "disabled";

/**
 * TENANT_STATUSES enumerates allowed tenant lifecycle values.
 * PURPOSE: Keep repository coercion aligned with the database enum.
 */
export const TENANT_STATUSES: readonly TenantStatus[] = ["active", "pending", "disabled"];

/**
 * ConnectorProvider identifies supported third-party integrations.
 * PURPOSE: Constrain connector kinds to the known product surface.
 */
export type ConnectorProvider = "github" | "slack" | "perplexity";

/**
 * CONNECTOR_PROVIDERS enumerates supported connector providers.
 * PURPOSE: Validate and iterate providers without scattered literals.
 */
export const CONNECTOR_PROVIDERS: readonly ConnectorProvider[] = ["github", "slack", "perplexity"];

/**
 * ConnectorStatus models connection lifecycle for a tenant connector.
 * PURPOSE: Surface connect/disconnect/error states in APIs and UI.
 */
export type ConnectorStatus = "pending" | "connected" | "error" | "disconnected";

/**
 * CONNECTOR_STATUSES enumerates allowed connector lifecycle values.
 * PURPOSE: Keep repository coercion aligned with the database enum.
 */
export const CONNECTOR_STATUSES: readonly ConnectorStatus[] = [
  "pending",
  "connected",
  "error",
  "disconnected",
];

/**
 * TenantConnectorRecord describes one connector attached to a tenant.
 * PURPOSE: Typed DTO returned by list and connect endpoints.
 */
export interface TenantConnectorRecord {
  readonly connectorId: string;
  readonly tenantId: string;
  readonly provider: ConnectorProvider;
  readonly status: ConnectorStatus;
  readonly externalAccountLabel: string | null;
  readonly lastError: string | null;
  readonly connectedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * TenantRecord describes an onboarded ScreenGraph tenant.
 * PURPOSE: Typed DTO for tenant list and detail responses.
 */
export interface TenantRecord {
  readonly tenantId: string;
  readonly slug: string;
  readonly displayName: string;
  readonly websiteUrl: string;
  readonly description: string;
  readonly status: TenantStatus;
  readonly sortOrder: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly connectors: readonly TenantConnectorRecord[];
}

/**
 * ListTenantsResponse wraps the ordered tenant roster for onboarding.
 * PURPOSE: Provide a stable payload for the tenant landing page.
 */
export interface ListTenantsResponse {
  readonly tenants: readonly TenantRecord[];
}

/**
 * GetTenantRequest identifies a tenant by slug path parameter.
 * PURPOSE: Parameter object for the getTenant endpoint.
 */
export interface GetTenantRequest {
  readonly slug: string;
}

/**
 * GetTenantResponse wraps a single tenant with its connectors.
 * PURPOSE: Detail payload for tenant-focused connector management.
 */
export interface GetTenantResponse {
  readonly tenant: TenantRecord;
}

/**
 * ConnectTenantConnectorRequest starts or completes a connector link.
 * PURPOSE: Accept optional account label when marking a connector connected.
 * NOTE: Path params must be plain string for the Encore parser; provider is validated in the API layer.
 */
export interface ConnectTenantConnectorRequest {
  readonly slug: string;
  readonly provider: string;
  readonly externalAccountLabel?: string;
}

/**
 * ConnectTenantConnectorResponse returns the updated connector row.
 * PURPOSE: Let the UI refresh a single connector after connect.
 */
export interface ConnectTenantConnectorResponse {
  readonly connector: TenantConnectorRecord;
}

/**
 * DisconnectTenantConnectorRequest tears down a connector link.
 * PURPOSE: Parameter object for the disconnect endpoint.
 * NOTE: Path params must be plain string for the Encore parser; provider is validated in the API layer.
 */
export interface DisconnectTenantConnectorRequest {
  readonly slug: string;
  readonly provider: string;
}

/**
 * DisconnectTenantConnectorResponse returns the updated connector row.
 * PURPOSE: Let the UI refresh a single connector after disconnect.
 */
export interface DisconnectTenantConnectorResponse {
  readonly connector: TenantConnectorRecord;
}
