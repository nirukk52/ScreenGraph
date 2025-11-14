import { Service } from "encore.dev/service";

/**
 * Artifacts Service
 * PURPOSE: Hosts endpoints for storing and querying artifact metadata
 * (screenshots and UI XML dumps). Internal-only; consumed by the Agent via
 * generated Encore clients for deterministic, typed access.
 */
export default new Service("artifacts");
