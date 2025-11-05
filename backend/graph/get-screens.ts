import { api } from "encore.dev/api";
import db from "../db";

/**
 * GetScreensResponse contains a sample of projected screens.
 * PURPOSE: Allows verification that screens are being projected correctly.
 */
interface GetScreensResponse {
  screens: Array<{
    screenId: string;
    appPackage: string;
    layoutHash: string;
    perceptualHash: string;
    firstSeenAt: string;
    lastSeenAt: string;
  }>;
}

/**
 * GetScreens endpoint returns a sample of screens from the graph.
 * PURPOSE: Quick verification that graph projection is populating screens table.
 */
export const getScreens = api(
  { expose: true, method: "GET", path: "/graph/screens" },
  async (): Promise<GetScreensResponse> => {
    const screens = await db.queryAll<{
      screen_id: string;
      app_package: string;
      layout_hash: string;
      perceptual_hash: string;
      first_seen_at: string;
      last_seen_at: string;
    }>`
      SELECT screen_id, app_package, layout_hash, perceptual_hash, first_seen_at, last_seen_at
      FROM screens
      ORDER BY last_seen_at DESC
      LIMIT 20
    `;

    return {
      screens: screens.map((row) => ({
        screenId: row.screen_id,
        appPackage: row.app_package,
        layoutHash: row.layout_hash,
        perceptualHash: row.perceptual_hash,
        firstSeenAt: row.first_seen_at,
        lastSeenAt: row.last_seen_at,
      })),
    };
  }
);

