declare module "google-play-scraper" {
  /**
   * GooglePlayAppOptions provides parameters accepted by the app details fetcher.
   * PURPOSE: Supply TypeScript support for the subset used by ScreenGraph.
   */
  export interface GooglePlayAppOptions {
    readonly appId: string;
    readonly lang?: string;
    readonly country?: string;
  }

  /**
   * GooglePlayAppDetails describes the primary fields returned by the library.
   * PURPOSE: Downstream code narrows this to the properties ScreenGraph uses.
   */
  export interface GooglePlayAppDetails {
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
   * app queries the Google Play backend and returns structured metadata.
   * PURPOSE: Core entry point utilized by ScreenGraph ingestion flows.
   */
  export function app(options: GooglePlayAppOptions): Promise<GooglePlayAppDetails>;

  /**
   * default export exposes the full scraper surface while retaining named access.
   * PURPOSE: Support both default and named imports across build targets.
   */
  const _default: {
    app(options: GooglePlayAppOptions): Promise<GooglePlayAppDetails>;
  };

  export default _default;
}
