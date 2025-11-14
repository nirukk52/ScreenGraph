import type { graph, run } from "./encore-client";
import { getEncoreClient } from "./getEncoreClient";

/**
 * Start a new run using the Encore client
 */
export async function startRun(params: run.StartRunRequest): Promise<run.StartRunResponse> {
  const client = await getEncoreClient();
  return client.run.start(params);
}

/**
 * Stream run events using the generated Encore client so the frontend always
 * respects the centralized Encore base URL configuration.
 */
export async function streamRunEvents(
  runId: string,
  onEvent: (event: run.RunEventMessage) => void | Promise<void>,
) {
  const client = await getEncoreClient();
  const stream = await client.run.stream(runId, { lastEventSeq: 0 });
  let active = true;

  const streamPump = (async () => {
    try {
      for await (const event of stream) {
        if (!active) {
          return;
        }
        await onEvent(event);
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
 * Stream graph events using the generated Encore client to visualize the screen graph in real-time
 */
export async function streamGraphEvents(
  runId: string,
  onEvent: (event: graph.GraphStreamEvent) => void | Promise<void>,
) {
  const client = await getEncoreClient();

  try {
    console.log("[Graph Stream] Creating stream for runId:", runId);
    const stream = await client.graph.streamGraphForRun(runId, { replay: true, fromSeq: 0 });
    console.log("[Graph Stream] Stream created, socket state:", stream.socket.ws.readyState);

    let active = true;

    stream.socket.on("open", () => {
      console.log("[Graph Stream] WebSocket opened");
    });

    stream.socket.on("close", (event) => {
      const closeEvent = event as CloseEvent;
      console.log("[Graph Stream] WebSocket closed", {
        code: closeEvent?.code,
        reason: closeEvent?.reason,
        wasClean: closeEvent?.wasClean,
        type: closeEvent?.type,
        target: closeEvent?.target,
      });
      active = false;
    });

    stream.socket.on("error", (error) => {
      console.error("[Graph Stream] Socket error:", error);
      console.error("[Graph Stream] Error details:", {
        type: error?.type,
        message: error?.message || String(error),
        target: error?.target,
        error: error,
      });
      active = false;
    });

    const streamPump = (async () => {
      try {
        console.log("[Graph Stream] Starting to read from stream...");
        for await (const event of stream) {
          if (!active) {
            console.log("[Graph Stream] Stream inactive, stopping");
            return;
          }
          console.log("[Graph Stream] Received event from stream:", event);
          await onEvent(event);
        }
        console.log("[Graph Stream] Stream ended (no more events)");
      } catch (error) {
        console.error("[Graph Stream] Error reading from stream:", error);
        console.error(
          "[Graph Stream] Error stack:",
          error instanceof Error ? error.stack : String(error),
        );
      }
    })();

    streamPump.catch((error) => {
      console.error("[Graph Stream] Unhandled stream pump error:", error);
    });

    return () => {
      console.log("[Graph Stream] Cleanup called");
      active = false;
      stream.close();
    };
  } catch (error) {
    console.error("[Graph Stream] Failed to create stream:", error);
    throw error;
  }
}

/**
 * Cancel a run using the Encore client
 */
export async function cancelRun(runId: string): Promise<run.CancelRunResponse> {
  const client = await getEncoreClient();
  return client.run.cancel(runId);
}

/**
 * fetchArtifactDataUrl downloads artifact content and returns a browser-friendly data URL.
 * PURPOSE: Provide frontend rendering support for screenshots stored in object storage.
 */
export async function fetchArtifactDataUrl(refId: string): Promise<string | null> {
  const client = await getEncoreClient();

  try {
    const response = await client.artifacts.getArtifactContent({ refId });
    return response.dataUrl ?? null;
  } catch (error) {
    console.error("Failed to fetch artifact data URL", { error, refId });
    return null;
  }
}
