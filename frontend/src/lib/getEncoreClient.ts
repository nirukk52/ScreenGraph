import { browser } from '$app/environment';
import Client, { Environment, Local } from './encore-client';

/**
 * Returns the Encore request client for either the local or cloud environment.
 * In development (local), connects to http://localhost:4000
 * In production, connects to the Encore Cloud staging environment
 */
export function getEncoreClient(): Client {
  const target = browser
    ? Local // Browser always connects to local dev server
    : (import.meta.env.PROD ? Environment('staging') : Local); // SSR uses cloud in production
  
  return new Client(target);
}

