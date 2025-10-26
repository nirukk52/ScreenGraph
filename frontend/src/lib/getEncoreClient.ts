import Client, { Environment, Local } from "./encore-client";

/**
 * Returns the Encore request client for either the local or cloud environment.
 * In development (local), connects to http://localhost:4000
 * In production, connects to the Encore Cloud staging environment
 */
export function getEncoreClient(): Client {
  const isBrowser = typeof window !== "undefined";
  const target = isBrowser
    ? Local // Browser always connects to local dev server
    : process.env.NODE_ENV === "production"
      ? Environment("staging")
      : Local; // SSR uses cloud in production

  return new Client(target);
}
