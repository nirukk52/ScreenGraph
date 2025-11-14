import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./repository", () => ({
  loadAppInfo: vi.fn(),
  markAppInfoIngestFailure: vi.fn(),
  upsertAppInfoFromPlayStore: vi.fn(),
}));

vi.mock("./playstore.adapter", () => ({
  fetchNormalizedPlayStoreAppData: vi.fn(),
}));

import { APIError } from "encore.dev/api";
import type { NormalizedPlayStoreAppData, StoredAppInfoRecord } from "./dto";
import { requestAppInfoIngestion } from "./ingest";
import { fetchNormalizedPlayStoreAppData } from "./playstore.adapter";
import { loadAppInfo, markAppInfoIngestFailure, upsertAppInfoFromPlayStore } from "./repository";

/**
 * AppInfo Ingestion Endpoint Tests
 * PURPOSE: Ensure ingestion endpoint handles caching, success, and failure paths.
 */

const loadAppInfoMock = vi.mocked(loadAppInfo);
const markAppInfoIngestFailureMock = vi.mocked(markAppInfoIngestFailure);
const upsertAppInfoFromPlayStoreMock = vi.mocked(upsertAppInfoFromPlayStore);
const fetchNormalizedPlayStoreAppDataMock = vi.mocked(fetchNormalizedPlayStoreAppData);

function buildStoredRecord(overrides: Partial<StoredAppInfoRecord> = {}): StoredAppInfoRecord {
  const base: StoredAppInfoRecord = {
    packageName: "com.example.app",
    displayName: "Example App",
    shortDescription: null,
    longDescription: null,
    developerName: "Example Dev",
    developerId: null,
    developerEmail: null,
    developerWebsite: null,
    developerAddress: null,
    categories: ["productivity"],
    primaryCategory: "productivity",
    contentRating: null,
    installsLabel: null,
    minInstalls: null,
    maxInstalls: null,
    ratingScore: null,
    ratingsCount: null,
    reviewsCount: null,
    isFree: true,
    priceMicros: 0,
    currencyCode: "USD",
    offersInAppPurchases: null,
    supportsAds: null,
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.app",
    iconUrl: null,
    headerImageUrl: null,
    videoTrailerUrl: null,
    privacyPolicyUrl: null,
    latestVersion: null,
    androidVersion: null,
    androidVersionText: null,
    lastStoreUpdate: null,
    ingestStatus: "succeeded",
    ingestedAt: new Date(),
    media: [],
  };
  return { ...base, ...overrides };
}

function buildNormalizedData(
  overrides: Partial<NormalizedPlayStoreAppData> = {},
): NormalizedPlayStoreAppData {
  const base: NormalizedPlayStoreAppData = {
    packageName: "com.example.app",
    displayName: "Example App",
    shortDescription: "Short",
    longDescription: "Long",
    developerName: "Example Dev",
    developerId: "ExampleDev",
    developerEmail: "support@example.dev",
    developerWebsite: "https://example.dev",
    developerAddress: "123 Example Street",
    categories: ["productivity"],
    primaryCategory: "productivity",
    contentRating: "Everyone",
    installsLabel: "1,000+",
    minInstalls: 1000,
    maxInstalls: 5000,
    ratingScore: 4.5,
    ratingsCount: 1200,
    reviewsCount: 800,
    isFree: false,
    priceMicros: 2_990_000,
    currencyCode: "USD",
    offersInAppPurchases: true,
    supportsAds: false,
    playStoreUrl: "https://play.google.com/store/apps/details?id=com.example.app",
    iconUrl: "https://cdn.example/icon.png",
    headerImageUrl: "https://cdn.example/header.png",
    videoTrailerUrl: "https://youtu.be/example",
    privacyPolicyUrl: "https://example.dev/privacy",
    latestVersion: "2.0.0",
    androidVersion: "8.0",
    androidVersionText: "8.0 and up",
    lastStoreUpdate: new Date(1_735_000_000_000),
    media: [],
  };
  return { ...base, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requestAppInfoIngestion", () => {
  it("rejects invalid package names", async () => {
    await expect(requestAppInfoIngestion({ packageName: "bad package" })).rejects.toBeInstanceOf(
      APIError,
    );
    expect(fetchNormalizedPlayStoreAppDataMock).not.toHaveBeenCalled();
  });

  it("returns cached record when recent data exists and forceRefresh is false", async () => {
    const cached = buildStoredRecord();
    loadAppInfoMock.mockResolvedValueOnce(cached);

    const response = await requestAppInfoIngestion({ packageName: cached.packageName });

    expect(response.appInfo).toBe(cached);
    expect(fetchNormalizedPlayStoreAppDataMock).not.toHaveBeenCalled();
    expect(upsertAppInfoFromPlayStoreMock).not.toHaveBeenCalled();
  });

  it("records failure when Play Store fetch throws", async () => {
    loadAppInfoMock.mockResolvedValueOnce(null);
    fetchNormalizedPlayStoreAppDataMock.mockRejectedValueOnce(new Error("network"));

    await expect(
      requestAppInfoIngestion({ packageName: "com.example.app" }),
    ).rejects.toBeInstanceOf(APIError);

    expect(markAppInfoIngestFailureMock).toHaveBeenCalledWith(
      "com.example.app",
      "play_store_fetch_failed",
      "network",
    );
    expect(upsertAppInfoFromPlayStoreMock).not.toHaveBeenCalled();
  });

  it("persists normalized metadata when fetch succeeds", async () => {
    loadAppInfoMock.mockResolvedValueOnce(null);
    const normalized = buildNormalizedData();
    const stored = buildStoredRecord({ ingestedAt: new Date() });

    fetchNormalizedPlayStoreAppDataMock.mockResolvedValueOnce(normalized);
    upsertAppInfoFromPlayStoreMock.mockResolvedValueOnce(stored);

    const response = await requestAppInfoIngestion({
      packageName: "com.example.app",
      forceRefresh: true,
    });

    expect(fetchNormalizedPlayStoreAppDataMock).toHaveBeenCalledWith("com.example.app", {
      language: undefined,
      country: undefined,
    });
    expect(upsertAppInfoFromPlayStoreMock).toHaveBeenCalledWith(normalized);
    expect(response.appInfo).toBe(stored);
  });
});
