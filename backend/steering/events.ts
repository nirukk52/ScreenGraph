import { StreamOut, api } from "encore.dev/api";
import log from "encore.dev/log";
import type { SteeringEvent, SteeringEventType } from "./types";

/**
 * PURPOSE: In-memory pub/sub for steering-docs SSE events.
 */

type Subscriber = StreamOut<SteeringEvent>;

const subscribers: Set<Subscriber> = new Set();

export function getLogger() {
  return log.with({ module: "steering", actor: "events" });
}

export function subscribe(stream: Subscriber): void {
  subscribers.add(stream);
}

export function unsubscribe(stream: Subscriber): void {
  subscribers.delete(stream);
}

export async function publish(type: SteeringEventType, data: Record<string, unknown>): Promise<void> {
  const event: SteeringEvent = { type, data, ts: new Date().toISOString() };
  const logger = getLogger();
  for (const s of subscribers) {
    try {
      await s.send(event);
    } catch (err) {
      logger.warn("failed to deliver event", { err });
    }
  }
}


