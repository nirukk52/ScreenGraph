import gplay from "google-play-scraper";
import type {
  AppInfoCategory,
  AppInfoMediaKind,
  NormalizedPlayStoreAppData,
  PlayStoreMediaAsset,
} from "./dto";

/**
 * FetchPlayStoreOptions encapsulates locale switches for Google Play scraping.
 * PURPOSE: Allow callers to adjust language and country without magic strings.
 */
export interface FetchPlayStoreOptions {
  readonly language?: string;
  readonly country?: string;
}

/**
 * GooglePlayScraperAppDetails represents the subset of fields returned by
 * google-play-scraper used by ScreenGraph.
 * PURPOSE: Provide local typings because the upstream package ships without
 * exhaustive TypeScript declarations.
 */
interface GooglePlayScraperAppDetails {
  readonly appId: string;
  readonly title: string;
  readonly summary?: string;
  readonly description?: string;
  readonly url: string;
  readonly genreId?: string;
  readonly familyGenreId?: string;
  readonly developer?: string;
  readonly developerId?: string;
  readonly developerEmail?: string;
  readonly developerWebsite?: string;
  readonly developerAddress?: string;
  readonly contentRating?: string;
  readonly minInstalls?: number;
  readonly maxInstalls?: number;
  readonly installs?: string;
  readonly score?: number;
  readonly ratings?: number;
  readonly reviews?: number;
  readonly price?: number;
  readonly free?: boolean;
  readonly currency?: string;
  readonly offersIAP?: boolean;
  readonly adSupported?: boolean;
  readonly containsAds?: boolean;
  readonly androidVersion?: string;
  readonly androidVersionText?: string;
  readonly version?: string;
  readonly updated?: number;
  readonly privacyPolicy?: string;
  readonly icon?: string;
  readonly headerImage?: string;
  readonly video?: string;
  readonly videoImage?: string;
  readonly screenshots?: readonly string[];
  readonly tabletScreenshots?: readonly string[];
}

/**
 * CATEGORY_ID_MAP converts Google Play genre identifiers to normalized codes.
 * PURPOSE: Maintain a single authoritative mapping to avoid scattered literals.
 */
const CATEGORY_ID_MAP: Record<string, AppInfoCategory> = {
  APPLICATION: "unknown",
  ART_AND_DESIGN: "art_and_design",
  AUTO_AND_VEHICLES: "auto_and_vehicles",
  BEAUTY: "beauty",
  BOOKS_AND_REFERENCE: "books_and_reference",
  BUSINESS: "business",
  COMICS: "comics",
  COMMUNICATION: "communication",
  DATING: "dating",
  EDUCATION: "education",
  ENTERTAINMENT: "entertainment",
  EVENTS: "events",
  FINANCE: "finance",
  FOOD_AND_DRINK: "food_and_drink",
  GAME: "game",
  GAME_ACTION: "game_action",
  GAME_ADVENTURE: "game_adventure",
  GAME_ARCADE: "game_arcade",
  GAME_BOARD: "game_board",
  GAME_CARD: "game_card",
  GAME_CASINO: "game_casino",
  GAME_CASUAL: "game_casual",
  GAME_EDUCATIONAL: "game_educational",
  GAME_MUSIC: "game_music",
  GAME_PUZZLE: "game_puzzle",
  GAME_RACING: "game_racing",
  GAME_ROLE_PLAYING: "game_role_playing",
  GAME_SIMULATION: "game_simulation",
  GAME_SPORTS: "game_sports",
  GAME_STRATEGY: "game_strategy",
  GAME_TRIVIA: "game_trivia",
  GAME_WORD: "game_word",
  HEALTH_AND_FITNESS: "health_and_fitness",
  HOUSE_AND_HOME: "house_and_home",
  LIBRARIES_AND_DEMO: "libraries_and_demo",
  LIFESTYLE: "lifestyle",
  MAPS_AND_NAVIGATION: "maps_and_navigation",
  MEDICAL: "medical",
  MUSIC_AND_AUDIO: "music_and_audio",
  NEWS_AND_MAGAZINES: "news_and_magazines",
  PARENTING: "parenting",
  PERSONALIZATION: "personalization",
  PHOTOGRAPHY: "photography",
  PRODUCTIVITY: "productivity",
  SHOPPING: "shopping",
  SOCIAL: "social",
  SPORTS: "sports",
  TOOLS: "tools",
  TRAVEL_AND_LOCAL: "travel_and_local",
  VIDEO_PLAYERS: "video_players",
  WATCH_FACE: "watch_face",
  WEATHER: "weather",
};

/**
 * DEFAULT_LANGUAGE_CODE ensures consistent text fields when callers omit locale.
 * PURPOSE: Avoid scattering default locale literals across callers.
 */
const DEFAULT_LANGUAGE_CODE = "en";

/**
 * DEFAULT_COUNTRY_CODE ensures consistent store variants when unspecified.
 * PURPOSE: Keep ingestion deterministic irrespective of caller environment.
 */
const DEFAULT_COUNTRY_CODE = "us";

/**
 * MICROS_PER_UNIT converts currency units to micros as required by pricing fields.
 * PURPOSE: Represent prices using integers to avoid floating point rounding errors.
 */
const MICROS_PER_UNIT = 1_000_000;

/**
 * mapCategoryId converts a Play Store genre identifier to ScreenGraph category code.
 * PURPOSE: Provide graceful fallback for unknown categories.
 */
function mapCategoryId(raw: string | undefined): AppInfoCategory {
  if (!raw) return "unknown";
  return CATEGORY_ID_MAP[raw] ?? "unknown";
}

/**
 * deriveMediaAssets builds ordered media assets from scraper output.
 * PURPOSE: Normalize screenshot and trailer metadata before persistence.
 */
function deriveMediaAssets(details: GooglePlayScraperAppDetails): PlayStoreMediaAsset[] {
  const assets: PlayStoreMediaAsset[] = [];

  const screenshotUrls = details.screenshots ?? [];
  screenshotUrls.forEach((url, index) => {
    assets.push({
      kind: "phone_screenshot",
      position: index,
      assetUrl: url,
      thumbnailUrl: null,
    });
  });

  const tabletScreenshots = details.tabletScreenshots ?? [];
  tabletScreenshots.forEach((url, index) => {
    assets.push({
      kind: "tablet_screenshot",
      position: index,
      assetUrl: url,
      thumbnailUrl: null,
    });
  });

  if (details.headerImage) {
    assets.push({
      kind: "feature_graphic",
      position: 0,
      assetUrl: details.headerImage,
      thumbnailUrl: null,
    });
  }

  if (details.video) {
    assets.push({
      kind: "video_trailer",
      position: 0,
      assetUrl: details.video,
      thumbnailUrl: details.videoImage ?? null,
    });
  }

  return assets;
}

/**
 * toNormalizedPlayStoreAppData maps scraper payloads into ScreenGraph DTOs.
 * PURPOSE: Centralize transformation logic to keep endpoints slim.
 */
function toNormalizedPlayStoreAppData(details: GooglePlayScraperAppDetails): NormalizedPlayStoreAppData {
  const primaryCategory = mapCategoryId(details.genreId);
  const additionalCategories: AppInfoCategory[] = [];
  const familyCategory = mapCategoryId(details.familyGenreId);
  if (familyCategory !== "unknown") {
    additionalCategories.push(familyCategory);
  }

  const uniqueCategories = [primaryCategory, ...additionalCategories].filter(
    (category, index, arr) => arr.indexOf(category) === index,
  );

  const price = typeof details.price === "number" ? details.price : 0;
  const isFree = details.free ?? price === 0;

  const lastUpdated = typeof details.updated === "number" ? new Date(details.updated) : null;

  const supportsAds = details.adSupported ?? details.containsAds ?? null;

  const developerName = details.developer ?? details.developerId ?? details.appId;

  return {
    packageName: details.appId,
    displayName: details.title,
    shortDescription: details.summary ?? null,
    longDescription: details.description ?? null,
    developerName,
    developerId: details.developerId ?? null,
    developerEmail: details.developerEmail ?? null,
    developerWebsite: details.developerWebsite ?? null,
    developerAddress: details.developerAddress ?? null,
    categories: uniqueCategories,
    primaryCategory,
    contentRating: details.contentRating ?? null,
    installsLabel: details.installs ?? null,
    minInstalls: typeof details.minInstalls === "number" ? details.minInstalls : null,
    maxInstalls: typeof details.maxInstalls === "number" ? details.maxInstalls : null,
    ratingScore: typeof details.score === "number" ? details.score : null,
    ratingsCount: typeof details.ratings === "number" ? details.ratings : null,
    reviewsCount: typeof details.reviews === "number" ? details.reviews : null,
    isFree,
    priceMicros: isFree ? 0 : Math.round(price * MICROS_PER_UNIT),
    currencyCode: details.currency ?? null,
    offersInAppPurchases: details.offersIAP ?? null,
    supportsAds,
    playStoreUrl: details.url,
    iconUrl: details.icon ?? null,
    headerImageUrl: details.headerImage ?? null,
    videoTrailerUrl: details.video ?? null,
    privacyPolicyUrl: details.privacyPolicy ?? null,
    latestVersion: details.version ?? null,
    androidVersion: details.androidVersion ?? null,
    androidVersionText: details.androidVersionText ?? null,
    lastStoreUpdate: lastUpdated,
    media: deriveMediaAssets(details),
  };
}

/**
 * fetchNormalizedPlayStoreAppData retrieves and normalizes metadata for a package.
 * PURPOSE: Provide a single entry point for ingestion flows to access Play Store data.
 */
export async function fetchNormalizedPlayStoreAppData(
  packageName: string,
  options: FetchPlayStoreOptions = {},
): Promise<NormalizedPlayStoreAppData> {
  const details = (await gplay.app({
    appId: packageName,
    lang: options.language ?? DEFAULT_LANGUAGE_CODE,
    country: options.country ?? DEFAULT_COUNTRY_CODE,
  })) as GooglePlayScraperAppDetails;

  return toNormalizedPlayStoreAppData(details);
}

/**
 * mapMediaKind ensures values originate from APP_INFO_MEDIA_KINDS.
 * PURPOSE: Support testing helpers that need to coerce arbitrary input.
 */
export function mapMediaKind(kind: string): AppInfoMediaKind {
  const allowedKinds: AppInfoMediaKind[] = [
    "phone_screenshot",
    "tablet_screenshot",
    "feature_graphic",
    "video_trailer",
  ];
  return (allowedKinds.find((candidate) => candidate === kind) ?? "phone_screenshot") as AppInfoMediaKind;
}

/**
 * __testUtils__ exposes internal helpers for unit testing without broad exports.
 * PURPOSE: Enable deterministic tests over adapter normalization logic.
 */
export const __testUtils__ = {
  mapCategoryId,
  deriveMediaAssets,
  toNormalizedPlayStoreAppData,
};

