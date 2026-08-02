-- Migration 012: Tenants and Connectors
-- PURPOSE: Introduce multi-tenant onboarding with per-tenant connector links
-- for GitHub, Slack, and Perplexity. Seeds venkat.ag (first) and shoploop (second).

CREATE TYPE tenant_status_enum AS ENUM (
  'active',
  'pending',
  'disabled'
);

CREATE TYPE connector_provider_enum AS ENUM (
  'github',
  'slack',
  'perplexity'
);

CREATE TYPE connector_status_enum AS ENUM (
  'pending',
  'connected',
  'error',
  'disconnected'
);

CREATE TABLE tenants (
  tenant_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status tenant_status_enum NOT NULL DEFAULT 'pending',
  sort_order INT NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tenants IS 'Customer/workspace tenants onboarded onto ScreenGraph.';
COMMENT ON COLUMN tenants.slug IS 'URL-safe tenant identifier (e.g., venkat-ag, shoploop).';
COMMENT ON COLUMN tenants.sort_order IS 'Lower values appear first in onboarding lists.';

CREATE INDEX tenants_by_sort_order ON tenants(sort_order ASC, created_at ASC);
CREATE INDEX tenants_by_status ON tenants(status);

CREATE TABLE tenant_connectors (
  connector_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
  provider connector_provider_enum NOT NULL,
  status connector_status_enum NOT NULL DEFAULT 'pending',
  external_account_label TEXT NULL,
  last_error TEXT NULL,
  connected_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider)
);

COMMENT ON TABLE tenant_connectors IS 'Per-tenant integration connectors (GitHub, Slack, Perplexity).';
COMMENT ON COLUMN tenant_connectors.external_account_label IS 'Human-readable connected account name when available.';

CREATE INDEX tenant_connectors_by_tenant ON tenant_connectors(tenant_id);
CREATE INDEX tenant_connectors_by_provider ON tenant_connectors(provider);

-- Seed first tenant: venkat.ag with GitHub, Slack, and Perplexity connectors
INSERT INTO tenants (
  tenant_id,
  slug,
  display_name,
  website_url,
  description,
  status,
  sort_order
) VALUES (
  'tenant_venkat_ag',
  'venkat-ag',
  'venkat.ag',
  'https://venkat.ag',
  'Always-on QA agent for mobile, web, and desktop. First ScreenGraph tenant.',
  'active',
  1
);

INSERT INTO tenant_connectors (
  connector_id,
  tenant_id,
  provider,
  status
) VALUES
  ('conn_venkat_github', 'tenant_venkat_ag', 'github', 'pending'),
  ('conn_venkat_slack', 'tenant_venkat_ag', 'slack', 'pending'),
  ('conn_venkat_perplexity', 'tenant_venkat_ag', 'perplexity', 'pending');

-- Seed second tenant: shoploop (connectors can be added later)
INSERT INTO tenants (
  tenant_id,
  slug,
  display_name,
  website_url,
  description,
  status,
  sort_order
) VALUES (
  'tenant_shoploop',
  'shoploop',
  'ShopLoop',
  'https://www.shoploop.app',
  'Video shopping platform. Second ScreenGraph tenant.',
  'pending',
  2
);
