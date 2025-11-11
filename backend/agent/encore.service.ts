import { Service } from "encore.dev/service";

// Import subscription to register it with Encore
// The `new Subscription()` call in subscription.ts runs as a side effect
import "./orchestrator/subscription";

export default new Service("agent");
