import { getEncoreClient } from "./getEncoreClient";
import type { run } from "./encore-client";

/**
 * Stream run events using the generated Encore client so the frontend always
 * respects the centralized Encore base URL configuration.
 */
export async function streamRunEvents(
  runId: string,
  onEvent: (event: run.RunEventMessage) => void,
) {
  const client = getEncoreClient();
  const stream = await client.run.stream(runId, { lastEventSeq: 0 });
  let active = true;

  const streamPump = (async () => {
    try {
      for await (const event of stream) {
        if (!active) {
          return;
        }
        onEvent(event);
      }
    } catch (error) {
      console.error("Run stream error:", error);
    }
  })();

  streamPump.catch((error) => {
    console.error("Unhandled run stream error:", error);
  });

  stream.socket.on("error", (error) => {
    console.error("Run stream socket error:", error);
  });

  return () => {
    active = false;
    stream.close();
  };
}

/**
 * Cancel a run using the Encore client
 */
export async function cancelRun(runId: string): Promise<run.CancelRunResponse> {
  const client = getEncoreClient();
  return client.run.cancel(runId);
}
