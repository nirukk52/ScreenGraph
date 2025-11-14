/**
 * AppInfoMediaKind models the allowed media categories for stored assets.
 * PURPOSE: Enforce type safety across repositories and API DTOs.
 */
export type AppInfoMediaKind =
  | "phone_screenshot"
  | "tablet_screenshot"
  | "feature_graphic"
  | "video_trailer";

/**
 * APP_INFO_MEDIA_KINDS enumerates supported Play Store media asset types.
 * PURPOSE: Prevent magic strings when classifying screenshots and trailers.
 */
export const APP_INFO_MEDIA_KINDS: readonly AppInfoMediaKind[] = [
  "phone_screenshot",
  "tablet_screenshot",
  "feature_graphic",
  "video_trailer",
];

/**
 * AppInfoIngestStatus signals the most recent ingestion outcome for a package.
 * PURPOSE: Surface operational visibility to API consumers.
 */
export type AppInfoIngestStatus = "pending" | "succeeded" | "failed";

/**
 * APP_INFO_INGEST_STATUSES defines ingestion lifecycle states for Play Store sync.
 * PURPOSE: Coordinate endpoint responses and database persistence logic.
 */
export const APP_INFO_INGEST_STATUSES: readonly AppInfoIngestStatus[] = [
  "pending",
  "succeeded",
  "failed",
];

/**
 * AppInfoCategory is the normalized Google Play category code assigned to an app.
 * PURPOSE: Drive analytics grouping and downstream filtering.
 */
export type AppInfoCategory =
  | "unknown"
  | "art_and_design"
  | "auto_and_vehicles"
  | "beauty"
  | "books_and_reference"
  | "business"
  | "comics"
  | "communication"
  | "dating"
  | "education"
  | "entertainment"
  | "events"
  | "finance"
  | "food_and_drink"
  | "game"
  | "game_action"
  | "game_adventure"
  | "game_arcade"
  | "game_board"
  | "game_card"
  | "game_casino"
  | "game_casual"
  | "game_educational"
  | "game_music"
  | "game_puzzle"
  | "game_racing"
  | "game_role_playing"
  | "game_simulation"
  | "game_sports"
  | "game_strategy"
  | "game_trivia"
  | "game_word"
  | "health_and_fitness"
  | "house_and_home"
  | "libraries_and_demo"
  | "lifestyle"
  | "maps_and_navigation"
  | "medical"
  | "music_and_audio"
  | "news_and_magazines"
  | "parenting"
  | "personalization"
  | "photography"
  | "productivity"
  | "shopping"
  | "social"
  | "sports"
  | "tools"
  | "travel_and_local"
  | "video_players"
  | "watch_face"
  | "weather";

/**
 * APP_INFO_CATEGORIES captures known Google Play classification codes.
 * PURPOSE: Normalize external category identifiers into a controlled vocabulary.
 */
export const APP_INFO_CATEGORIES: readonly AppInfoCategory[] = [
  "unknown",
  "art_and_design",
  "auto_and_vehicles",
  "beauty",
  "books_and_reference",
  "business",
  "comics",
  "communication",
  "dating",
  "education",
  "entertainment",
  "events",
  "finance",
  "food_and_drink",
  "game",
  "game_action",
  "game_adventure",
  "game_arcade",
  "game_board",
  "game_card",
  "game_casino",
  "game_casual",
  "game_educational",
  "game_music",
  "game_puzzle",
  "game_racing",
  "game_role_playing",
  "game_simulation",
  "game_sports",
  "game_strategy",
  "game_trivia",
  "game_word",
  "health_and_fitness",
  "house_and_home",
  "libraries_and_demo",
  "lifestyle",
  "maps_and_navigation",
  "medical",
  "music_and_audio",
  "news_and_magazines",
  "parenting",
  "personalization",
  "photography",
  "productivity",
  "shopping",
  "social",
  "sports",
  "tools",
  "travel_and_local",
  "video_players",
  "watch_face",
  "weather",
];

/**
 * PlayStoreMediaAsset represents a single media element returned by scraping.
 * PURPOSE: Provide a typed contract between the adapter and persistence layer.
 */
export interface PlayStoreMediaAsset {
  readonly kind: AppInfoMediaKind;
  readonly position: number;
  readonly assetUrl: string;
  readonly thumbnailUrl: string | null;
}

/**
 * NormalizedPlayStoreAppData describes sanitized metadata retrieved from Play Store.
 * PURPOSE: Intermediate representation before writing to the database.
 */
export interface NormalizedPlayStoreAppData {
  readonly packageName: string;
  readonly displayName: string;
  readonly shortDescription: string | null;
  readonly longDescription: string | null;
  readonly developerName: string;
  readonly developerId: string | null;
  readonly developerEmail: string | null;
  readonly developerWebsite: string | null;
  readonly developerAddress: string | null;
  readonly categories: readonly AppInfoCategory[];
  readonly primaryCategory: AppInfoCategory;
  readonly contentRating: string | null;
  readonly installsLabel: string | null;
  readonly minInstalls: number | null;
  readonly maxInstalls: number | null;
  readonly ratingScore: number | null;
  readonly ratingsCount: number | null;
  readonly reviewsCount: number | null;
  readonly isFree: boolean;
  readonly priceMicros: number | null;
  readonly currencyCode: string | null;
  readonly offersInAppPurchases: boolean | null;
  readonly supportsAds: boolean | null;
  readonly playStoreUrl: string;
  readonly iconUrl: string | null;
  readonly headerImageUrl: string | null;
  readonly videoTrailerUrl: string | null;
  readonly privacyPolicyUrl: string | null;
  readonly latestVersion: string | null;
  readonly androidVersion: string | null;
  readonly androidVersionText: string | null;
  readonly lastStoreUpdate: Date | null;
  readonly media: readonly PlayStoreMediaAsset[];
}

/**
 * RequestAppInfoIngestionRequest captures API payloads for ingestion requests.
 * PURPOSE: Validate upstream inputs before contacting the Play Store adapter.
 */
export interface RequestAppInfoIngestionRequest {
  readonly packageName: string;
  readonly language?: string;
  readonly country?: string;
  readonly forceRefresh?: boolean;
}

/**
 * RequestAppInfoIngestionResponse returns persisted metadata after ingestion.
 * PURPOSE: Provide callers with the freshly stored record without extra fetches.
 */
export interface RequestAppInfoIngestionResponse {
  readonly appInfo: StoredAppInfoRecord;
}

/**
 * GetAppInfoRequest identifies which package to read from persistence.
 * PURPOSE: Parameter object for the getAppInfo endpoint.
 */
export interface GetAppInfoRequest {
  readonly packageName: string;
}

/**
 * AppInfoMediaRecord represents media data as stored in the database.
 * PURPOSE: Attach persisted asset metadata to API responses.
 */
export interface AppInfoMediaRecord {
  readonly kind: AppInfoMediaKind;
  readonly position: number;
  readonly assetUrl: string;
  readonly thumbnailUrl: string | null;
}

/**
 * StoredAppInfoRecord mirrors the persisted Play Store metadata row.
 * PURPOSE: Structurally typed DTO returned by repository and exposed via API.
 */
export interface StoredAppInfoRecord {
  readonly packageName: string;
  readonly displayName: string;
  readonly shortDescription: string | null;
  readonly longDescription: string | null;
  readonly developerName: string;
  readonly developerId: string | null;
  readonly developerEmail: string | null;
  readonly developerWebsite: string | null;
  readonly developerAddress: string | null;
  readonly categories: readonly AppInfoCategory[];
  readonly primaryCategory: AppInfoCategory;
  readonly contentRating: string | null;
  readonly installsLabel: string | null;
  readonly minInstalls: number | null;
  readonly maxInstalls: number | null;
  readonly ratingScore: number | null;
  readonly ratingsCount: number | null;
  readonly reviewsCount: number | null;
  readonly isFree: boolean;
  readonly priceMicros: number | null;
  readonly currencyCode: string | null;
  readonly offersInAppPurchases: boolean | null;
  readonly supportsAds: boolean | null;
  readonly playStoreUrl: string;
  readonly iconUrl: string | null;
  readonly headerImageUrl: string | null;
  readonly videoTrailerUrl: string | null;
  readonly privacyPolicyUrl: string | null;
  readonly latestVersion: string | null;
  readonly androidVersion: string | null;
  readonly androidVersionText: string | null;
  readonly lastStoreUpdate: Date | null;
  readonly ingestStatus: AppInfoIngestStatus;
  readonly ingestedAt: Date | null;
  readonly media: readonly AppInfoMediaRecord[];
}

/**
 * GetAppInfoResponse wraps the stored record for Encore API responses.
 * PURPOSE: Maintain backwards-compatible payload versions.
 */
export interface GetAppInfoResponse {
  readonly appInfo: StoredAppInfoRecord;
}
