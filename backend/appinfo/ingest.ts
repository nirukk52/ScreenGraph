import { APIError, api } from "encore.dev/api";
import log from "encore.dev/log";
import type {
  GetAppInfoRequest,
  GetAppInfoResponse,
  RequestAppInfoIngestionRequest,
  RequestAppInfoIngestionResponse,
  StoredAppInfoRecord,
} from "./dto";
import { fetchNormalizedPlayStoreAppData } from "./playstore.adapter";
import { loadAppInfo, markAppInfoIngestFailure, upsertAppInfoFromPlayStore } from "./repository";

/**
 * PACKAGE_NAME_PATTERN restricts allowed Android package identifiers.
 * PURPOSE: Prevent outbound requests for malformed or malicious inputs.
 */
const PACKAGE_NAME_PATTERN = /^[a-zA-Z0-9_.]+$/;

/**
 * MILLISECONDS_PER_SECOND anchors duration math to explicit units.
 * PURPOSE: Avoid scattering literal conversions throughout the module.
 */
const MILLISECONDS_PER_SECOND = 1_000;

/**
 * SECONDS_PER_MINUTE documents the conversion factor for refresh logic.
 * PURPOSE: Maintain readability when deriving larger intervals.
 */
const SECONDS_PER_MINUTE = 60;

/**
 * MINUTES_PER_HOUR defines the number of minutes per hour.
 * PURPOSE: Support refresh interval derivation without magic numbers.
 */
const MINUTES_PER_HOUR = 60;

/**
 * REFRESH_WINDOW_HOURS specifies how long cached data remains fresh.
 * PURPOSE: Balance Play Store traffic with analytics freshness.
 */
const REFRESH_WINDOW_HOURS = 6;

/**
 * REFRESH_INTERVAL_MS is the computed millisecond duration for cache reuse.
 * PURPOSE: Provide a single constant used when evaluating cached records.
 */
const REFRESH_INTERVAL_MS =
  MILLISECONDS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR * REFRESH_WINDOW_HOURS;

/**
 * validatePackageName ensures inputs align with Android package identifier rules.
 * PURPOSE: Surface consistent API errors for invalid requests.
 */
function validatePackageName(packageName: string): void {
  if (!packageName || packageName.length < 3) {
    throw APIError.invalidArgument("package_name_missing");
  }
  if (!PACKAGE_NAME_PATTERN.test(packageName)) {
    throw APIError.invalidArgument("package_name_invalid");
  }
}

/**
 * isFresh determines whether an existing record is within the reuse window.
 * PURPOSE: Reduce redundant Play Store requests when recent data exists.
 */
function isFresh(record: StoredAppInfoRecord | null): boolean {
  if (!record?.ingestedAt) return false;
  const ageMs = Date.now() - record.ingestedAt.getTime();
  return ageMs < REFRESH_INTERVAL_MS;
}

/**
 * requestAppInfoIngestion fetches Play Store metadata and persists it to Postgres.
 * PURPOSE: Primary Encore endpoint invoked by backend workflows.
 */
export const requestAppInfoIngestion = api<
  RequestAppInfoIngestionRequest,
  RequestAppInfoIngestionResponse
>({ method: "POST", path: "/appinfo/ingest", expose: true }, async (req) => {
  validatePackageName(req.packageName);

  const baseLog = log.with({ module: "appinfo", actor: "ingestion", packageName: req.packageName });

  if (!req.forceRefresh) {
    const existing = await loadAppInfo(req.packageName);
    if (isFresh(existing)) {
      baseLog.info("Using cached appinfo record", {
        ingestedAt: existing?.ingestedAt?.toISOString(),
      });
      return { appInfo: existing as StoredAppInfoRecord };
    }
  }

  baseLog.info("Fetching Play Store metadata", {
    language: req.language ?? "default",
    country: req.country ?? "default",
  });

  let normalized: Awaited<ReturnType<typeof fetchNormalizedPlayStoreAppData>>;
  try {
    normalized = await fetchNormalizedPlayStoreAppData(req.packageName, {
      language: req.language,
      country: req.country,
    });
  } catch (err) {
    baseLog.error("Play Store fetch failed", { err });
    await markAppInfoIngestFailure(
      req.packageName,
      "play_store_fetch_failed",
      err instanceof Error ? err.message : "unknown_error",
    );
    throw APIError.internal("play_store_fetch_failed");
  }

  let stored: StoredAppInfoRecord;
  try {
    stored = await upsertAppInfoFromPlayStore(normalized);
  } catch (err) {
    baseLog.error("Persistence failed", { err });
    await markAppInfoIngestFailure(
      req.packageName,
      "appinfo_persistence_failed",
      err instanceof Error ? err.message : "unknown_error",
    );
    throw APIError.internal("appinfo_persistence_failed");
  }

  baseLog.info("Appinfo ingestion completed", {
    ingestStatus: stored.ingestStatus,
    ingestedAt: stored.ingestedAt?.toISOString(),
  });

  return { appInfo: stored };
});

/**
 * getAppInfo returns the cached metadata for a package name.
 * PURPOSE: Provide read access for analytics and downstream services.
 */
export const getAppInfo = api<GetAppInfoRequest, GetAppInfoResponse>(
  { method: "GET", path: "/appinfo/:packageName", expose: true },
  async (req) => {
    validatePackageName(req.packageName);

    const record = await loadAppInfo(req.packageName);
    if (!record) {
      throw APIError.notFound("appinfo_not_found");
    }

    return { appInfo: record };
  },
);
