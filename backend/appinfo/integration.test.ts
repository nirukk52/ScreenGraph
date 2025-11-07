import { describe, it, expect } from "vitest";
import { requestAppInfoIngestion, getAppInfo } from "./ingest";

/**
 * AppInfo Integration Tests
 * PURPOSE: Test real Play Store data fetching with Spotify and Pinterest.
 */

describe("AppInfo Integration Tests", () => {
  it("should fetch Spotify metadata", async () => {
    const response = await requestAppInfoIngestion({ 
      packageName: "com.spotify.music" 
    });

    expect(response.appInfo.packageName).toBe("com.spotify.music");
    expect(response.appInfo.displayName).toBe("Spotify: Music and Podcasts");
    expect(response.appInfo.primaryCategory).toBe("music_and_audio");
    expect(response.appInfo.isFree).toBe(true);
    expect(response.appInfo.ingestStatus).toBe("succeeded");
  }, 30000);

  it("should fetch Pinterest metadata", async () => {
    const response = await requestAppInfoIngestion({ 
      packageName: "com.pinterest" 
    });

    expect(response.appInfo.packageName).toBe("com.pinterest");
    expect(response.appInfo.displayName).toBe("Pinterest");
    expect(response.appInfo.primaryCategory).toBe("lifestyle");
    expect(response.appInfo.contentRating).toBe("Teen");
    expect(response.appInfo.ingestStatus).toBe("succeeded");
  }, 30000);

  it("should return cached data on second request", async () => {
    // First request
    await requestAppInfoIngestion({ packageName: "com.spotify.music" });
    
    // Second request should hit cache (fast)
    const start = Date.now();
    const response = await requestAppInfoIngestion({ 
      packageName: "com.spotify.music" 
    });
    const duration = Date.now() - start;
    
    expect(response.appInfo.displayName).toBe("Spotify: Music and Podcasts");
    expect(duration).toBeLessThan(1000); // Cache hit is fast
  });

  it("should retrieve via GET endpoint", async () => {
    const response = await getAppInfo({ packageName: "com.pinterest" });
    
    expect(response.appInfo.packageName).toBe("com.pinterest");
    expect(response.appInfo.displayName).toBe("Pinterest");
  });

  it("should reject invalid package names", async () => {
    await expect(
      requestAppInfoIngestion({ packageName: "invalid name" })
    ).rejects.toThrow();
  });
});

