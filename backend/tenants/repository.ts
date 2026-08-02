import db from "../db";
import type {
  ConnectorProvider,
  ConnectorStatus,
  TenantConnectorRecord,
  TenantRecord,
  TenantStatus,
} from "./dto";
import { CONNECTOR_PROVIDERS, CONNECTOR_STATUSES, TENANT_STATUSES } from "./dto";

/**
 * TenantRow mirrors the tenants table columns returned by SQL.
 * PURPOSE: Typed mapping layer between Postgres and domain DTOs.
 */
interface TenantRow {
  tenant_id: string;
  slug: string;
  display_name: string;
  website_url: string;
  description: string;
  status: string;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * ConnectorRow mirrors the tenant_connectors table columns returned by SQL.
 * PURPOSE: Typed mapping layer between Postgres and connector DTOs.
 */
interface ConnectorRow {
  connector_id: string;
  tenant_id: string;
  provider: string;
  status: string;
  external_account_label: string | null;
  last_error: string | null;
  connected_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * TENANT_STATUS_LOOKUP accelerates runtime membership checks for tenant status.
 * PURPOSE: Guard against unexpected enum strings when reading from Postgres.
 */
const TENANT_STATUS_LOOKUP = new Set<TenantStatus>(TENANT_STATUSES);

/**
 * CONNECTOR_PROVIDER_LOOKUP accelerates provider membership checks.
 * PURPOSE: Guard against unexpected provider strings from the database.
 */
const CONNECTOR_PROVIDER_LOOKUP = new Set<ConnectorProvider>(CONNECTOR_PROVIDERS);

/**
 * CONNECTOR_STATUS_LOOKUP accelerates connector status membership checks.
 * PURPOSE: Guard against unexpected status strings from the database.
 */
const CONNECTOR_STATUS_LOOKUP = new Set<ConnectorStatus>(CONNECTOR_STATUSES);

/**
 * DEFAULT_ACCOUNT_LABELS supplies human-readable labels per provider on connect.
 * PURPOSE: Avoid empty labels when the caller omits an external account name.
 */
const DEFAULT_ACCOUNT_LABELS: Record<ConnectorProvider, string> = {
  github: "GitHub",
  slack: "Slack workspace",
  perplexity: "Perplexity",
};

/**
 * coerceTenantStatus maps a raw database string to TenantStatus.
 * PURPOSE: Fail closed to pending when encountering unexpected values.
 */
function coerceTenantStatus(raw: string): TenantStatus {
  if (TENANT_STATUS_LOOKUP.has(raw as TenantStatus)) {
    return raw as TenantStatus;
  }
  return "pending";
}

/**
 * coerceConnectorProvider maps a raw database string to ConnectorProvider.
 * PURPOSE: Reject unknown providers at the repository boundary.
 */
function coerceConnectorProvider(raw: string): ConnectorProvider {
  if (CONNECTOR_PROVIDER_LOOKUP.has(raw as ConnectorProvider)) {
    return raw as ConnectorProvider;
  }
  throw new Error(`unknown_connector_provider:${raw}`);
}

/**
 * coerceConnectorStatus maps a raw database string to ConnectorStatus.
 * PURPOSE: Fail closed to pending when encountering unexpected values.
 */
function coerceConnectorStatus(raw: string): ConnectorStatus {
  if (CONNECTOR_STATUS_LOOKUP.has(raw as ConnectorStatus)) {
    return raw as ConnectorStatus;
  }
  return "pending";
}

/**
 * mapConnectorRow converts a SQL connector row into an API DTO.
 * PURPOSE: Centralize snake_case to camelCase conversion for connectors.
 */
function mapConnectorRow(row: ConnectorRow): TenantConnectorRecord {
  return {
    connectorId: row.connector_id,
    tenantId: row.tenant_id,
    provider: coerceConnectorProvider(row.provider),
    status: coerceConnectorStatus(row.status),
    externalAccountLabel: row.external_account_label,
    lastError: row.last_error,
    connectedAt: row.connected_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * mapTenantRecord merges a tenant row with its connectors into one DTO.
 * PURPOSE: Build the nested tenant payload used by list and get APIs.
 */
function mapTenantRecord(
  row: TenantRow,
  connectors: readonly TenantConnectorRecord[],
): TenantRecord {
  return {
    tenantId: row.tenant_id,
    slug: row.slug,
    displayName: row.display_name,
    websiteUrl: row.website_url,
    description: row.description,
    status: coerceTenantStatus(row.status),
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    connectors,
  };
}

/**
 * loadConnectorsForTenants fetches connectors for the given tenant IDs.
 * PURPOSE: Avoid N+1 queries when assembling the tenant list response.
 */
async function loadConnectorsForTenants(
  tenantIds: readonly string[],
): Promise<Map<string, TenantConnectorRecord[]>> {
  const wanted = new Set(tenantIds);
  const byTenant = new Map<string, TenantConnectorRecord[]>();
  for (const tenantId of tenantIds) {
    byTenant.set(tenantId, []);
  }
  if (tenantIds.length === 0) {
    return byTenant;
  }

  const rows = await db.query<ConnectorRow>`
    SELECT
      connector_id,
      tenant_id,
      provider::text AS provider,
      status::text AS status,
      external_account_label,
      last_error,
      connected_at,
      created_at,
      updated_at
    FROM tenant_connectors
    ORDER BY provider ASC
  `;

  for await (const row of rows) {
    if (!wanted.has(row.tenant_id)) {
      continue;
    }
    const list = byTenant.get(row.tenant_id) ?? [];
    list.push(mapConnectorRow(row));
    byTenant.set(row.tenant_id, list);
  }

  return byTenant;
}

/**
 * listTenantsWithConnectors returns all tenants ordered for onboarding.
 * PURPOSE: Power the tenant landing page roster (venkat.ag first, shoploop second).
 */
export async function listTenantsWithConnectors(): Promise<TenantRecord[]> {
  const tenantRows: TenantRow[] = [];
  const rows = await db.query<TenantRow>`
    SELECT
      tenant_id,
      slug,
      display_name,
      website_url,
      description,
      status::text AS status,
      sort_order,
      created_at,
      updated_at
    FROM tenants
    ORDER BY sort_order ASC, created_at ASC
  `;

  for await (const row of rows) {
    tenantRows.push(row);
  }

  const connectorsByTenant = await loadConnectorsForTenants(tenantRows.map((row) => row.tenant_id));

  return tenantRows.map((row) => mapTenantRecord(row, connectorsByTenant.get(row.tenant_id) ?? []));
}

/**
 * findTenantBySlug loads one tenant and its connectors by slug.
 * PURPOSE: Support detail and connect/disconnect flows keyed by slug.
 */
export async function findTenantBySlug(slug: string): Promise<TenantRecord | null> {
  const row = await db.queryRow<TenantRow>`
    SELECT
      tenant_id,
      slug,
      display_name,
      website_url,
      description,
      status::text AS status,
      sort_order,
      created_at,
      updated_at
    FROM tenants
    WHERE slug = ${slug}
  `;

  if (!row) {
    return null;
  }

  const connectorsByTenant = await loadConnectorsForTenants([row.tenant_id]);
  return mapTenantRecord(row, connectorsByTenant.get(row.tenant_id) ?? []);
}

/**
 * markConnectorConnected updates a connector to the connected state.
 * PURPOSE: Persist the user's GitHub/Slack/Perplexity link for a tenant.
 */
export async function markConnectorConnected(
  tenantId: string,
  provider: ConnectorProvider,
  externalAccountLabel?: string,
): Promise<TenantConnectorRecord | null> {
  const label = externalAccountLabel?.trim() || DEFAULT_ACCOUNT_LABELS[provider];
  const row = await db.queryRow<ConnectorRow>`
    UPDATE tenant_connectors
    SET
      status = 'connected'::connector_status_enum,
      external_account_label = ${label},
      last_error = NULL,
      connected_at = NOW(),
      updated_at = NOW()
    WHERE tenant_id = ${tenantId}
      AND provider = ${provider}::connector_provider_enum
    RETURNING
      connector_id,
      tenant_id,
      provider::text AS provider,
      status::text AS status,
      external_account_label,
      last_error,
      connected_at,
      created_at,
      updated_at
  `;

  return row ? mapConnectorRow(row) : null;
}

/**
 * markConnectorDisconnected clears an active connector link.
 * PURPOSE: Allow operators to tear down a tenant connector without deleting it.
 */
export async function markConnectorDisconnected(
  tenantId: string,
  provider: ConnectorProvider,
): Promise<TenantConnectorRecord | null> {
  const row = await db.queryRow<ConnectorRow>`
    UPDATE tenant_connectors
    SET
      status = 'disconnected'::connector_status_enum,
      external_account_label = NULL,
      last_error = NULL,
      connected_at = NULL,
      updated_at = NOW()
    WHERE tenant_id = ${tenantId}
      AND provider = ${provider}::connector_provider_enum
    RETURNING
      connector_id,
      tenant_id,
      provider::text AS provider,
      status::text AS status,
      external_account_label,
      last_error,
      connected_at,
      created_at,
      updated_at
  `;

  return row ? mapConnectorRow(row) : null;
}
