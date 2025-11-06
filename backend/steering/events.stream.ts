import { api, StreamOut } from "encore.dev/api";
import log from "encore.dev/log";
import type { SteeringEvent } from "./types";
import { subscribe, unsubscribe } from "./events";

/**
 * PURPOSE: SSE endpoint to stream steering-docs events to clients (Onyx/agents).
 */

interface EventsHandshake {}

export const streamSteeringEvents = api.streamOut<EventsHandshake, SteeringEvent>(
  { expose: true, path: "/steering/events" },
  async (_handshake, stream) => {
    const logger = log.with({ module: "steering", actor: "api", op: "events.stream" });
    logger.info("client connected");

    subscribe(stream as unknown as StreamOut<SteeringEvent>);

    let closed = false;
    const HEARTBEAT_MS = 30000;
    const heartbeat = setInterval(async () => {
      if (closed) return;
      try {
        await stream.send({ type: "docs.index.rebuilt", data: { heartbeat: true }, ts: new Date().toISOString() });
      } catch (err) {
        logger.warn("heartbeat failed", { err });
      }
    }, HEARTBEAT_MS);

    try {
      // Keep open until runtime closes; nothing to do here
      // Encore manages the lifecycle of the stream function
    } finally {
      clearInterval(heartbeat);
      unsubscribe(stream as unknown as StreamOut<SteeringEvent>);
      closed = true;
      logger.info("client disconnected");
    }
  },
);


