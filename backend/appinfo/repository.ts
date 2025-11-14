import db from "../db";
import type {
  AppInfoCategory,
  AppInfoIngestStatus,
  AppInfoMediaKind,
  AppInfoMediaRecord,
  NormalizedPlayStoreAppData,
  StoredAppInfoRecord,
} from "./dto";
import { APP_INFO_CATEGORIES, APP_INFO_INGEST_STATUSES, APP_INFO_MEDIA_KINDS } from "./dto";

/**
 * APPINFO_BASE_URL anchors Play Store deep links for fallback rows.
 * PURPOSE: Avoid duplicating string concatenation when generating URLs.
 */
const APPINFO_BASE_URL = "https://play.google.com/store/apps/details?id=";

/**
 * INGEST_STATUS_SUCCEEDED centralizes the succeeded literal.
 * PURPOSE: Enforce consistent usage across repository operations.
 */
const INGEST_STATUS_SUCCEEDED: AppInfoIngestStatus = "succeeded";

/**
 * INGEST_STATUS_FAILED centralizes the failure literal for reuse.
 * PURPOSE: Prevent typo-prone inline strings when marking ingestion errors.
 */
const INGEST_STATUS_FAILED: AppInfoIngestStatus = "failed";

/**
 * CATEGORY_LOOKUP accelerates runtime membership checks for category codes.
 * PURPOSE: Support coercion when reading data back from PostgreSQL arrays.
 */
const CATEGORY_LOOKUP = new Set<AppInfoCategory>(APP_INFO_CATEGORIES);

/**
 * MEDIA_KIND_LOOKUP accelerates validation of persisted media kind values.
 * PURPOSE: Guard against unexpected data introduced via manual SQL debugging.
 */
const MEDIA_KIND_LOOKUP = new Set<AppInfoMediaKind>(APP_INFO_MEDIA_KINDS);

/**
 * INGEST_STATUS_LOOKUP ensures ingest status values map back to allowed literals.
 * PURPOSE: Maintain compatibility with database enum values.
 */
const INGEST_STATUS_LOOKUP = new Set<AppInfoIngestStatus>(APP_INFO_INGEST_STATUSES);

/**
 * coerceCategory ensures stored strings align with AppInfoCategory union.
 * PURPOSE: Default to "unknown" when encountering unexpected data.
 */
function coerceCategory(raw: string | null): AppInfoCategory {
  if (!raw) return "unknown";
  if (CATEGORY_LOOKUP.has(raw as AppInfoCategory)) {
    return raw as AppInfoCategory;
  }
  return "unknown";
}

/**
 * coerceMediaKind translates raw DB values into AppInfoMediaKind literals.
 * PURPOSE: Safely read persisted media rows with strict typing.
 */
function coerceMediaKind(raw: string): AppInfoMediaKind {
  if (MEDIA_KIND_LOOKUP.has(raw as AppInfoMediaKind)) {
    return raw as AppInfoMediaKind;
  }
  return "phone_screenshot";
}

/**
 * coerceIngestStatus ensures DB enum values map to typed union values.
 * PURPOSE: Avoid leaking unexpected statuses to API consumers.
 */
function coerceIngestStatus(raw: string): AppInfoIngestStatus {
  if (INGEST_STATUS_LOOKUP.has(raw as AppInfoIngestStatus)) {
    return raw as AppInfoIngestStatus;
  }
  return INGEST_STATUS_FAILED;
}

/**
 * upsertAppInfoFromPlayStore writes normalized metadata and media assets.
 * PURPOSE: Primary persistence entry point used by ingestion endpoint.
 */
export async function upsertAppInfoFromPlayStore(
  payload: NormalizedPlayStoreAppData,
): Promise<StoredAppInfoRecord> {
  const ingestionTimestamp = new Date();
  const categories = [...payload.categories];
  if (categories.length === 0) {
    categories.push("unknown");
  }

  await db.exec`
    INSERT INTO appinfo (
      app_package,
      app_display_name,
      short_description,
      long_description,
      developer_name,
      developer_id,
      developer_email,
      developer_website,
      developer_address,
      content_rating,
      primary_category_code,
      category_codes,
      installs_label,
      min_installs,
      max_installs,
      rating_score,
      ratings_count,
      reviews_count,
      is_free,
      price_micros,
      currency_code,
      offers_in_app_purchases,
      supports_ads,
      play_store_url,
      icon_url,
      header_image_url,
      video_trailer_url,
      privacy_policy_url,
      latest_version,
      android_version,
      android_version_text,
      last_play_store_update,
      ingest_status,
      ingest_error_code,
      ingest_error_detail,
      ingested_at,
      created_at,
      updated_at
    ) VALUES (
      ${payload.packageName},
      ${payload.displayName},
      ${payload.shortDescription},
      ${payload.longDescription},
      ${payload.developerName},
      ${payload.developerId},
      ${payload.developerEmail},
      ${payload.developerWebsite},
      ${payload.developerAddress},
      ${payload.contentRating},
      ${payload.primaryCategory},
      ${categories},
      ${payload.installsLabel},
      ${payload.minInstalls},
      ${payload.maxInstalls},
      ${payload.ratingScore},
      ${payload.ratingsCount},
      ${payload.reviewsCount},
      ${payload.isFree},
      ${payload.priceMicros},
      ${payload.currencyCode},
      ${payload.offersInAppPurchases},
      ${payload.supportsAds},
      ${payload.playStoreUrl},
      ${payload.iconUrl},
      ${payload.headerImageUrl},
      ${payload.videoTrailerUrl},
      ${payload.privacyPolicyUrl},
      ${payload.latestVersion},
      ${payload.androidVersion},
      ${payload.androidVersionText},
      ${payload.lastStoreUpdate?.toISOString() ?? null},
      ${INGEST_STATUS_SUCCEEDED},
      ${null},
      ${null},
      ${ingestionTimestamp.toISOString()},
      ${ingestionTimestamp.toISOString()},
      ${ingestionTimestamp.toISOString()}
    )
    ON CONFLICT (app_package) DO UPDATE SET
      app_display_name = EXCLUDED.app_display_name,
      short_description = EXCLUDED.short_description,
      long_description = EXCLUDED.long_description,
      developer_name = EXCLUDED.developer_name,
      developer_id = EXCLUDED.developer_id,
      developer_email = EXCLUDED.developer_email,
      developer_website = EXCLUDED.developer_website,
      developer_address = EXCLUDED.developer_address,
      content_rating = EXCLUDED.content_rating,
      primary_category_code = EXCLUDED.primary_category_code,
      category_codes = EXCLUDED.category_codes,
      installs_label = EXCLUDED.installs_label,
      min_installs = EXCLUDED.min_installs,
      max_installs = EXCLUDED.max_installs,
      rating_score = EXCLUDED.rating_score,
      ratings_count = EXCLUDED.ratings_count,
      reviews_count = EXCLUDED.reviews_count,
      is_free = EXCLUDED.is_free,
      price_micros = EXCLUDED.price_micros,
      currency_code = EXCLUDED.currency_code,
      offers_in_app_purchases = EXCLUDED.offers_in_app_purchases,
      supports_ads = EXCLUDED.supports_ads,
      play_store_url = EXCLUDED.play_store_url,
      icon_url = EXCLUDED.icon_url,
      header_image_url = EXCLUDED.header_image_url,
      video_trailer_url = EXCLUDED.video_trailer_url,
      privacy_policy_url = EXCLUDED.privacy_policy_url,
      latest_version = EXCLUDED.latest_version,
      android_version = EXCLUDED.android_version,
      android_version_text = EXCLUDED.android_version_text,
      last_play_store_update = EXCLUDED.last_play_store_update,
      ingest_status = EXCLUDED.ingest_status,
      ingest_error_code = NULL,
      ingest_error_detail = NULL,
      ingested_at = EXCLUDED.ingested_at,
      updated_at = EXCLUDED.updated_at;
  `;

  await db.exec`
    DELETE FROM appinfo_media
    WHERE app_package = ${payload.packageName};
  `;

  for (const media of payload.media) {
    await db.exec`
      INSERT INTO appinfo_media (app_package, media_kind, position, asset_url, thumbnail_url)
      VALUES (
        ${payload.packageName},
        ${media.kind},
        ${media.position},
        ${media.assetUrl},
        ${media.thumbnailUrl}
      )
      ON CONFLICT (app_package, media_kind, position) DO UPDATE SET
        asset_url = EXCLUDED.asset_url,
        thumbnail_url = EXCLUDED.thumbnail_url;
    `;
  }

  const stored = await loadAppInfo(payload.packageName);
  if (!stored) {
    throw new Error("appinfo_upsert_readback_failed");
  }
  return stored;
}

/**
 * loadAppInfo fetches a stored AppInfo record including ordered media assets.
 * PURPOSE: Provide a typed persistence accessor for Encore endpoints.
 */
export async function loadAppInfo(packageName: string): Promise<StoredAppInfoRecord | null> {
  const rows = db.query<{
    app_package: string;
    app_display_name: string;
    short_description: string | null;
    long_description: string | null;
    developer_name: string;
    developer_id: string | null;
    developer_email: string | null;
    developer_website: string | null;
    developer_address: string | null;
    content_rating: string | null;
    primary_category_code: string;
    category_codes: string[];
    installs_label: string | null;
    min_installs: number | null;
    max_installs: number | null;
    rating_score: number | null;
    ratings_count: number | null;
    reviews_count: number | null;
    is_free: boolean;
    price_micros: number | null;
    currency_code: string | null;
    offers_in_app_purchases: boolean | null;
    supports_ads: boolean | null;
    play_store_url: string;
    icon_url: string | null;
    header_image_url: string | null;
    video_trailer_url: string | null;
    privacy_policy_url: string | null;
    latest_version: string | null;
    android_version: string | null;
    android_version_text: string | null;
    last_play_store_update: string | null;
    ingest_status: string;
    ingested_at: string | null;
  }>`
    SELECT
      app_package,
      app_display_name,
      short_description,
      long_description,
      developer_name,
      developer_id,
      developer_email,
      developer_website,
      developer_address,
      content_rating,
      primary_category_code,
      category_codes,
      installs_label,
      min_installs,
      max_installs,
      rating_score,
      ratings_count,
      reviews_count,
      is_free,
      price_micros,
      currency_code,
      offers_in_app_purchases,
      supports_ads,
      play_store_url,
      icon_url,
      header_image_url,
      video_trailer_url,
      privacy_policy_url,
      latest_version,
      android_version,
      android_version_text,
      last_play_store_update,
      ingest_status,
      ingested_at
    FROM appinfo
    WHERE app_package = ${packageName}
  `;

  let record: StoredAppInfoRecord | null = null;
  for await (const row of rows) {
    const mediaRows = db.query<{
      media_kind: string;
      position: number;
      asset_url: string;
      thumbnail_url: string | null;
    }>`
      SELECT media_kind, position, asset_url, thumbnail_url
      FROM appinfo_media
      WHERE app_package = ${packageName}
      ORDER BY media_kind, position
    `;

    const media: AppInfoMediaRecord[] = [];
    for await (const mediaRow of mediaRows) {
      media.push({
        kind: coerceMediaKind(mediaRow.media_kind),
        position: mediaRow.position,
        assetUrl: mediaRow.asset_url,
        thumbnailUrl: mediaRow.thumbnail_url,
      });
    }

    const categoriesArray = Array.isArray(row.category_codes)
      ? row.category_codes.map((value) => coerceCategory(value))
      : ["unknown"];

    record = {
      packageName: row.app_package,
      displayName: row.app_display_name,
      shortDescription: row.short_description,
      longDescription: row.long_description,
      developerName: row.developer_name,
      developerId: row.developer_id,
      developerEmail: row.developer_email,
      developerWebsite: row.developer_website,
      developerAddress: row.developer_address,
      categories: categoriesArray,
      primaryCategory: coerceCategory(row.primary_category_code),
      contentRating: row.content_rating,
      installsLabel: row.installs_label,
      minInstalls: row.min_installs,
      maxInstalls: row.max_installs,
      ratingScore: row.rating_score !== null ? Number(row.rating_score) : null,
      ratingsCount: row.ratings_count,
      reviewsCount: row.reviews_count,
      isFree: row.is_free,
      priceMicros: row.price_micros,
      currencyCode: row.currency_code,
      offersInAppPurchases: row.offers_in_app_purchases,
      supportsAds: row.supports_ads,
      playStoreUrl: row.play_store_url,
      iconUrl: row.icon_url,
      headerImageUrl: row.header_image_url,
      videoTrailerUrl: row.video_trailer_url,
      privacyPolicyUrl: row.privacy_policy_url,
      latestVersion: row.latest_version,
      androidVersion: row.android_version,
      androidVersionText: row.android_version_text,
      lastStoreUpdate: row.last_play_store_update ? new Date(row.last_play_store_update) : null,
      ingestStatus: coerceIngestStatus(row.ingest_status),
      ingestedAt: row.ingested_at ? new Date(row.ingested_at) : null,
      media,
    };
    break;
  }

  return record;
}

/**
 * markAppInfoIngestFailure records ingestion errors for auditing purposes.
 * PURPOSE: Persist failure metadata so retries can surface prior issues.
 */
export async function markAppInfoIngestFailure(
  packageName: string,
  errorCode: string,
  errorDetail: string,
): Promise<void> {
  const now = new Date().toISOString();
  await db.exec`
    INSERT INTO appinfo (
      app_package,
      app_display_name,
      short_description,
      long_description,
      developer_name,
      developer_id,
      developer_email,
      developer_website,
      developer_address,
      content_rating,
      primary_category_code,
      category_codes,
      installs_label,
      min_installs,
      max_installs,
      rating_score,
      ratings_count,
      reviews_count,
      is_free,
      price_micros,
      currency_code,
      offers_in_app_purchases,
      supports_ads,
      play_store_url,
      icon_url,
      header_image_url,
      video_trailer_url,
      privacy_policy_url,
      latest_version,
      android_version,
      android_version_text,
      last_play_store_update,
      ingest_status,
      ingest_error_code,
      ingest_error_detail,
      ingested_at,
      created_at,
      updated_at
    ) VALUES (
      ${packageName},
      ${packageName},
      ${null},
      ${null},
      ${packageName},
      ${null},
      ${null},
      ${null},
      ${null},
      ${null},
      ${"unknown"},
      ${["unknown"]},
      ${null},
      ${null},
      ${null},
      ${null},
      ${null},
      ${null},
      ${true},
      ${0},
      ${null},
      ${null},
      ${null},
      ${APPINFO_BASE_URL + packageName},
      ${null},
      ${null},
      ${null},
      ${null},
      ${null},
      ${null},
      ${null},
      ${null},
      ${INGEST_STATUS_FAILED},
      ${errorCode},
      ${errorDetail},
      ${null},
      ${now},
      ${now}
    )
    ON CONFLICT (app_package) DO UPDATE SET
      ingest_status = ${INGEST_STATUS_FAILED},
      ingest_error_code = ${errorCode},
      ingest_error_detail = ${errorDetail},
      updated_at = ${now};
  `;
}
