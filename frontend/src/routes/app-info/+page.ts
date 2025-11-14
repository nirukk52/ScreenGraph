import { VITE_DEFAULT_APP_PACKAGE } from "$lib/env";
import { getEncoreClient } from "$lib/getEncoreClient";
import type { PageLoad } from "./$types";

/** Load function to fetch app info from the backend appinfo service.
 * PURPOSE: SSR-compatible data fetching that provides type-safe app metadata to the page component.
 */
export const load: PageLoad = async () => {
  const packageName = VITE_DEFAULT_APP_PACKAGE;

  try {
    const client = await getEncoreClient();
    const response = await client.appinfo.getAppInfo(packageName);

    return {
      appInfo: response.appInfo,
      packageName,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Failed to load app info";

    return {
      error: errorMessage,
      packageName,
    };
  }
};
