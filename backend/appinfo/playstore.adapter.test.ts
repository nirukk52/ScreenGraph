import { describe, it, expect } from "vitest";
import { APP_INFO_MEDIA_KINDS } from "./dto";
import { __testUtils__ } from "./playstore.adapter";

/**
 * PlayStore Adapter Unit Tests
 * PURPOSE: Validate normalization helpers that transform raw scraper payloads.
 */

describe("PlayStore adapter normalization", () => {
  it("maps genre identifiers to known categories with fallback", () => {
    const { mapCategoryId } = __testUtils__;
    expect(mapCategoryId("GAME_ROLE_PLAYING")).toBe("game_role_playing");
    expect(mapCategoryId("NON_EXISTENT_CATEGORY" as unknown as string)).toBe("unknown");
    expect(mapCategoryId(undefined)).toBe("unknown");
  });

  it("derives ordered media assets for screenshots, feature graphics, and trailers", () => {
    const { deriveMediaAssets } = __testUtils__;
    const media = deriveMediaAssets({
      appId: "com.example.app",
      title: "Demo",
      url: "https://play.google.com/store/apps/details?id=com.example.app",
      screenshots: ["https://cdn.example/app/shot1.png", "https://cdn.example/app/shot2.png"],
      tabletScreenshots: ["https://cdn.example/app/tablet1.png"],
      headerImage: "https://cdn.example/app/header.png",
      video: "https://youtu.be/demo",
      videoImage: "https://cdn.example/app/trailer.png",
    });

    expect(media).toHaveLength(5);
    expect(media[0]).toEqual({
      kind: "phone_screenshot",
      position: 0,
      assetUrl: "https://cdn.example/app/shot1.png",
      thumbnailUrl: null,
    });
    expect(media[3]).toEqual({
      kind: "feature_graphic",
      position: 0,
      assetUrl: "https://cdn.example/app/header.png",
      thumbnailUrl: null,
    });
    expect(media[4]).toEqual({
      kind: "video_trailer",
      position: 0,
      assetUrl: "https://youtu.be/demo",
      thumbnailUrl: "https://cdn.example/app/trailer.png",
    });
  });

  it("normalizes scraper payloads into ScreenGraph DTO format", () => {
    const { toNormalizedPlayStoreAppData } = __testUtils__;
    const normalized = toNormalizedPlayStoreAppData({
      appId: "com.acme.demo",
      title: "Acme Demo",
      summary: "Short summary",
      description: "Long description",
      url: "https://play.google.com/store/apps/details?id=com.acme.demo",
      genreId: "PRODUCTIVITY",
      familyGenreId: "PARENTING",
      developer: "Acme Labs",
      developerId: "AcmeLabs",
      developerEmail: "support@acme.dev",
      developerWebsite: "https://acme.dev",
      developerAddress: "123 Street, City",
      contentRating: "Everyone",
      minInstalls: 1000,
      maxInstalls: 5000,
      installs: "1,000+",
      score: 4.6,
      ratings: 1200,
      reviews: 800,
      price: 2.99,
      free: false,
      currency: "USD",
      offersIAP: true,
      adSupported: false,
      androidVersion: "8.0",
      androidVersionText: "8.0 and up",
      version: "2.3.4",
      updated: 1_735_000_000_000,
      privacyPolicy: "https://acme.dev/privacy",
      icon: "https://cdn.example/icon.png",
      headerImage: "https://cdn.example/header.png",
      video: "https://youtu.be/acme",
      videoImage: "https://cdn.example/video.png",
      screenshots: ["https://cdn.example/s1.png"],
      tabletScreenshots: [],
    });

    expect(normalized.packageName).toBe("com.acme.demo");
    expect(normalized.displayName).toBe("Acme Demo");
    expect(normalized.primaryCategory).toBe("productivity");
    expect(normalized.categories).toEqual(["productivity", "parenting"]);
    expect(normalized.priceMicros).toBe(2_990_000);
    expect(normalized.isFree).toBe(false);
    expect(normalized.supportsAds).toBe(false);
    expect(normalized.media[0].kind).toBe(APP_INFO_MEDIA_KINDS[0]);
    expect(normalized.lastStoreUpdate).toBeInstanceOf(Date);
  });
});

