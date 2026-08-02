# Tenants Service

Multi-tenant onboarding and connector management for ScreenGraph.

## Seeded tenants

1. **venkat.ag** (`venkat-ag`) — active; GitHub, Slack, and Perplexity connectors staged
2. **ShopLoop** (`shoploop`) — pending; ready for later connector pack

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/tenants` | List tenants with connectors (sort order) |
| `GET` | `/tenants/:slug` | Fetch one tenant |
| `POST` | `/tenants/:slug/connectors/:provider/connect` | Mark connector connected |
| `POST` | `/tenants/:slug/connectors/:provider/disconnect` | Clear connector link |

Supported providers: `github`, `slack`, `perplexity`.

## Frontend

Tenant landing page: `/tenants`
