import Client, { Local } from "./encore-client";
import { VITE_BACKEND_BASE_URL } from "./env";

let cachedClient: Client | null = null;

/**
 * Returns a singleton Encore client configured via validated environment variables.
 * PURPOSE: Guarantee consistent backend communication without fragile port scanning logic.
 */
export async function getEncoreClient(): Promise<Client> {
  if (cachedClient) {
    return cachedClient;
  }

  const endpoint = VITE_BACKEND_BASE_URL || Local;
  cachedClient = new Client(endpoint);
  return cachedClient;
}
