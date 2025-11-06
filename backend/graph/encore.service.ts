import { Service } from "encore.dev/service";
import { startGraphProjector } from "./projector";

/**
 * Graph Service boundary.
 * PURPOSE: Hosts the graph projection background worker and graph-facing APIs.
 */
export default new Service("graph");

startGraphProjector();

// Import endpoints to register them with Encore
import "./get-screens";
import "./stream";


