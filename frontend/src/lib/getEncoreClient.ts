import Client, { Environment, Local } from "./encore-client";

/**
 * Common Encore local development ports in order of preference
 */
const LOCAL_PORTS = [4000, 4002, 4001, 4003];

/**
 * Test if a URL is reachable
 */
async function testUrl(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);
    const response = await fetch(`${url}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Find the first working local Encore instance
 */
async function findLocalEndpoint(): Promise<string> {
  for (const port of LOCAL_PORTS) {
    const url = `http://localhost:${port}`;
    if (await testUrl(url)) {
      console.log(`Found Encore backend at ${url}`);
      return url;
    }
  }
  console.warn(`No Encore backend found on ports ${LOCAL_PORTS.join(', ')}, using fallback ${Local}`);
  return Local;
}

// Cache the discovered endpoint
let cachedEndpoint: string | null = null;
let client: Client | null = null;

/**
 * Returns the Encore request client for either the local or cloud environment.
 * Automatically detects which local port the backend is running on by trying
 * ports 4000, 4002, 4001, 4003 in order.
 */
export async function getEncoreClient(): Promise<Client> {
  const isBrowser = typeof window !== "undefined";
  const envBase = (import.meta as any)?.env?.VITE_BACKEND_BASE_URL as string | undefined;
  if (envBase && typeof envBase === "string" && envBase.length > 0) {
    // Prefer explicit env in both browser and SSR
    return new Client(envBase);
  }
  
  if (isBrowser) {
    // Use cached client if available
    if (client && cachedEndpoint) {
      return client;
    }
    
    // Use port detection in browser
    const endpoint = await findLocalEndpoint();
    cachedEndpoint = endpoint;
    client = new Client(endpoint);
    return client;
  }
  
  // SSR uses cloud in production, local otherwise
  const target = process.env.NODE_ENV === "production"
    ? Environment("staging")
    : Local;
  
  return new Client(target);
}
