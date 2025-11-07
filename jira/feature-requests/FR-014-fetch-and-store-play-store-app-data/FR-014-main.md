# FR-014: Fetch and Store Play Store App Data

**Status:** 📋 Todo  
**Priority:** P2 (Medium)  
**Milestone:** M7 - App Metadata & Discovery  
**Owner:** TBD  
**Estimated Effort:** Medium

---

## 📝 Description

Fetch and persist Google Play Store metadata for Android applications using their package name (e.g., `com.example.app`). This enriches run records and screen graphs with human-readable app information like title, icon, version, and description.

**Business Value:**
- Improves UI/UX by showing app names/icons instead of package names
- Enables app-level analytics and reporting across runs
- Supports future features like app discovery, trending apps, and app catalogs
- Provides version tracking to correlate bugs with specific app releases

**User Impact:**
- Frontend displays "Gmail" with icon instead of "com.google.android.gm"
- Run history is more intuitive and searchable by app name
- Better debugging context with version numbers tied to runs

---

## 🎯 Acceptance Criteria
- [ ] Database migration creates `play_store_apps` table with schema defined below
- [ ] Backend service `apps/` exposes `GET /apps/:packageName` endpoint to fetch app metadata
- [ ] Endpoint fetches from Play Store on first request and caches in database
- [ ] Cached data has TTL (7 days) and auto-refreshes on subsequent requests after expiry
- [ ] App metadata includes: package name, title, description, icon URL, current version, developer name
- [ ] Failed fetches (404, network errors) are gracefully handled with appropriate error codes
- [ ] Encore client regeneration (`bun run gen`) includes new apps service types
- [ ] Frontend can import and use `apps.getAppMetadata()` with full type safety
- [ ] Structured logging includes `module:"apps"`, `actor:"fetch"`, `packageName`, `cacheHit:boolean`
- [ ] Manual testing confirms metadata is correctly fetched for 3+ popular apps (Gmail, Chrome, Maps)

---

## 🔗 Dependencies

**External Libraries:**
- `google-play-scraper` (npm package) - for fetching Play Store data without official API
- Alternative: `gplay-api` or manual scraping via HTTP client

**Database Changes:**
- New migration: `009_play_store_apps.up.sql`
- New table: `play_store_apps` (see Technical Notes)

**No Blocking FRs:**
- This is a standalone feature, can be developed independently
- Future integration with run UI (out of scope for this FR)

---

## 🧪 Testing Requirements

**Unit Tests (`backend/apps/fetch.test.ts`):**
- [ ] Mock Play Store scraper returns valid app data
- [ ] Cache hit returns data from database without external call
- [ ] Cache miss triggers Play Store fetch and database insert
- [ ] Expired cache (>7 days) triggers refresh
- [ ] Invalid package name returns 404 error
- [ ] Network timeout returns 503 error with retry message

**Integration Tests:**
- [ ] End-to-end test fetches real app data from Play Store (e.g., `com.google.android.gm`)
- [ ] Database insert creates correct row in `play_store_apps`
- [ ] Second request hits cache and returns same data
- [ ] Verify `fetched_at` and `expires_at` timestamps are correct

**Log Verification (via Encore Dashboard):**
- [ ] `module:"apps" AND actor:"fetch" AND packageName:"com.google.android.gm" AND cacheHit:false`
- [ ] `module:"apps" AND actor:"fetch" AND cacheHit:true` for subsequent requests
- [ ] Error logs include `err.message` and `stopReason` for failures

---

## 📋 Technical Notes

### Database Schema (`backend/db/migrations/009_play_store_apps.up.sql`)

```sql
CREATE TABLE play_store_apps (
  package_name TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  current_version TEXT,
  developer_name TEXT,
  developer_id TEXT,
  rating DECIMAL(2,1),
  installs TEXT,
  price TEXT DEFAULT 'Free',
  category TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX play_store_apps_expires ON play_store_apps(expires_at);
CREATE INDEX play_store_apps_developer ON play_store_apps(developer_id);

COMMENT ON TABLE play_store_apps IS 'Cached metadata from Google Play Store for Android applications';
COMMENT ON COLUMN play_store_apps.expires_at IS 'TTL for cache invalidation (7 days from fetched_at)';
```

### API Schema

**Request:**
```typescript
// GET /apps/:packageName
// Path parameter: packageName (e.g., "com.google.android.gm")
```

**Response:**
```typescript
interface GetAppMetadataResponse {
  packageName: string;
  title: string;
  description: string | null;
  iconUrl: string | null;
  currentVersion: string | null;
  developerName: string | null;
  developerId: string | null;
  rating: number | null;
  installs: string | null;
  price: string;
  category: string | null;
  fetchedAt: Date;
  expiresAt: Date;
  cacheHit: boolean; // true if returned from cache
}
```

**Error Responses:**
```typescript
// 404 Not Found
{
  "code": "not_found",
  "message": "App not found in Play Store",
  "details": { "packageName": "com.invalid.app" }
}

// 503 Service Unavailable
{
  "code": "unavailable",
  "message": "Play Store temporarily unavailable",
  "details": { "retryAfter": "60s" }
}

// 500 Internal Server Error
{
  "code": "internal",
  "message": "Failed to fetch app metadata",
  "details": { "error": "..." }
}
```

### Service Structure

**File Tree:**
```
backend/apps/
├── encore.service.ts      # Service declaration
├── types.ts               # Request/response DTOs
├── get-metadata.ts        # GET /apps/:packageName endpoint
├── fetch.ts               # Play Store fetch logic
├── repo.ts                # Database operations
├── fetch.test.ts          # Unit tests
├── CLAUDE.md              # Service context doc
└── README.md              # Service overview
```

### Implementation Logic (`backend/apps/get-metadata.ts`)

```typescript
import { api } from "encore.dev/api";
import { getAppMetadata } from "./fetch";
import type { GetAppMetadataResponse } from "./types";

/**
 * Fetches app metadata from Google Play Store with database caching.
 * PURPOSE: Enrich runs and screens with human-readable app information.
 */
export const getApp = api(
  { expose: true, method: "GET", path: "/apps/:packageName" },
  async ({ packageName }: { packageName: string }): Promise<GetAppMetadataResponse> => {
    return await getAppMetadata(packageName);
  }
);
```

### Fetch Logic (`backend/apps/fetch.ts`)

```typescript
import gplay from "google-play-scraper";
import { loggerWith, MODULES } from "../logging/logger";
import { getFromCache, upsertToCache } from "./repo";
import type { GetAppMetadataResponse } from "./types";

const CACHE_TTL_DAYS = 7;
const logger = loggerWith(MODULES.APPS, "fetch", {});

/**
 * Fetches app metadata from Play Store or returns cached data if valid.
 * PURPOSE: Single source of truth for app metadata with automatic cache refresh.
 */
export async function getAppMetadata(packageName: string): Promise<GetAppMetadataResponse> {
  logger.info("Fetching app metadata", { packageName });

  // Check cache first
  const cached = await getFromCache(packageName);
  if (cached && cached.expiresAt > new Date()) {
    logger.info("Cache hit", { packageName, cacheHit: true });
    return { ...cached, cacheHit: true };
  }

  // Fetch from Play Store
  logger.info("Cache miss, fetching from Play Store", { packageName, cacheHit: false });
  
  try {
    const appData = await gplay.app({ appId: packageName });
    
    const metadata: GetAppMetadataResponse = {
      packageName,
      title: appData.title,
      description: appData.description,
      iconUrl: appData.icon,
      currentVersion: appData.version,
      developerName: appData.developer,
      developerId: appData.developerId,
      rating: appData.score,
      installs: appData.installs,
      price: appData.free ? "Free" : appData.price,
      category: appData.genre,
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000),
      cacheHit: false
    };

    // Upsert to cache
    await upsertToCache(metadata);
    logger.info("Cached app metadata", { packageName, expiresAt: metadata.expiresAt });

    return metadata;
  } catch (err) {
    logger.error("Failed to fetch app metadata", { 
      packageName, 
      err: (err as Error).message 
    });
    throw err;
  }
}
```

### Repository Logic (`backend/apps/repo.ts`)

```typescript
import { db } from "../db";
import type { GetAppMetadataResponse } from "./types";

/**
 * Retrieves cached app metadata from database.
 * PURPOSE: Avoid redundant Play Store API calls.
 */
export async function getFromCache(packageName: string): Promise<GetAppMetadataResponse | null> {
  const row = await db.queryRow<{
    package_name: string;
    title: string;
    description: string | null;
    icon_url: string | null;
    current_version: string | null;
    developer_name: string | null;
    developer_id: string | null;
    rating: number | null;
    installs: string | null;
    price: string;
    category: string | null;
    fetched_at: Date;
    expires_at: Date;
  }>`
    SELECT * FROM play_store_apps WHERE package_name = ${packageName}
  `;

  if (!row) return null;

  return {
    packageName: row.package_name,
    title: row.title,
    description: row.description,
    iconUrl: row.icon_url,
    currentVersion: row.current_version,
    developerName: row.developer_name,
    developerId: row.developer_id,
    rating: row.rating,
    installs: row.installs,
    price: row.price,
    category: row.category,
    fetchedAt: row.fetched_at,
    expiresAt: row.expires_at,
    cacheHit: true
  };
}

/**
 * Inserts or updates app metadata in cache.
 * PURPOSE: Persist Play Store data for future requests.
 */
export async function upsertToCache(metadata: GetAppMetadataResponse): Promise<void> {
  await db.exec`
    INSERT INTO play_store_apps (
      package_name, title, description, icon_url, current_version,
      developer_name, developer_id, rating, installs, price, category,
      fetched_at, expires_at, updated_at
    ) VALUES (
      ${metadata.packageName}, ${metadata.title}, ${metadata.description}, 
      ${metadata.iconUrl}, ${metadata.currentVersion}, ${metadata.developerName},
      ${metadata.developerId}, ${metadata.rating}, ${metadata.installs},
      ${metadata.price}, ${metadata.category}, ${metadata.fetchedAt},
      ${metadata.expiresAt}, NOW()
    )
    ON CONFLICT (package_name) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      icon_url = EXCLUDED.icon_url,
      current_version = EXCLUDED.current_version,
      developer_name = EXCLUDED.developer_name,
      developer_id = EXCLUDED.developer_id,
      rating = EXCLUDED.rating,
      installs = EXCLUDED.installs,
      price = EXCLUDED.price,
      category = EXCLUDED.category,
      fetched_at = EXCLUDED.fetched_at,
      expires_at = EXCLUDED.expires_at,
      updated_at = NOW()
  `;
}
```

### Logging Module

Add to `backend/logging/logger.ts`:

```typescript
export const MODULES = {
  // ... existing modules
  APPS: "apps",
} as const;

export const APPS_ACTORS = {
  FETCH: "fetch",
  CACHE: "cache",
} as const;
```

### Frontend Usage (after `bun run gen`)

```typescript
import { apps } from '~encore/clients';

// Fetch app metadata
const appData = await apps.getApp({ packageName: 'com.google.android.gm' });

console.log(appData.title); // "Gmail"
console.log(appData.iconUrl); // "https://..."
console.log(appData.cacheHit); // true/false
```

---

## 🏷️ Labels
`[api]`, `[backend]`, `[database]`, `[caching]`, `[milestone-7]`, `[p2]`, `[external-api]`

---

## 📚 Related Documents
- `backend/BACKEND_README.md` - Backend architecture overview
- `backend/db/README.md` - Database migration guidelines
- `backend/db/CLAUDE.md` - Database engineering context
- `backend/logging/CLAUDE.md` - Logging standards
- `BACKEND_HANDOFF.md` - Backend handoff documentation
- [google-play-scraper npm package](https://www.npmjs.com/package/google-play-scraper)
- [Encore.ts Documentation](https://encore.dev/docs)

---

## Release Plan (PROC-001)
- Follow PROC-001 "Production Release" in `.cursor/procedures/PROCEDURES.md`
- Preconditions:
  - [ ] `@verify-worktree-isolation` passes
  - [ ] `@test-default-run` passes on this worktree
- Handoff:
  - After merge to main, run `@update_handoff` and choose the "Production Release Update" workflow
- Notes:
  - Frontend version bump (semver) required before tagging
  - Tag format: `v<frontend>-<date>-<shortsha>`

## Worktree Setup Quicklinks
- Isolation: `@verify-worktree-isolation`
- Start Backend: `./scripts/dev-backend.sh`
- Start Frontend: `./scripts/dev-frontend.sh`
- Smoke Test: `@test-default-run`

