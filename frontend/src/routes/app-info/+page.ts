import { getEncoreClient } from '$lib/getEncoreClient';
import { VITE_DEFAULT_APP_PACKAGE } from '$lib/env';
import type { PageLoad } from './$types';

/** Load function to fetch app info from the backend appinfo service.
 * PURPOSE: SSR-compatible data fetching that provides type-safe app metadata to the page component.
 * Uses requestAppInfoIngestion to fetch fresh data or return cached data (with 6-hour TTL).
 */
export const load: PageLoad = async () => {
  const packageName = VITE_DEFAULT_APP_PACKAGE;

  try {
    const client = await getEncoreClient();
    
    // requestAppInfoIngestion fetches from Play Store and caches the result
    // It returns cached data if available and not expired (6-hour TTL)
    const response = await client.appinfo.requestAppInfoIngestion({ 
      packageName,
      forceRefresh: false 
    });

    return {
      appInfo: response.appInfo,
      packageName,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load app info';
    
    return {
      error: errorMessage,
      packageName,
    };
  }
};

