<script lang="ts">
import { page } from "$app/state";
import { cancelRun, fetchArtifactDataUrl, streamGraphEvents, streamRunEvents } from "$lib/api";
import ScreenGraph from "$lib/components/ScreenGraph.svelte";
import type { graph, run } from "$lib/encore-client";
import autoAnimate from "@formkit/auto-animate";
import { onDestroy } from "svelte";

let runId = $state("");
let events = $state<run.RunEventMessage[]>([]);
let graphNodes = $state<graph.GraphStreamEventData[]>([]);
let graphEvents = $state<graph.GraphStreamEvent[]>([]);
let loading = $state(true);
let error = $state("");
let cleanup = $state<(() => void) | null>(null);
let graphCleanup = $state<(() => void) | null>(null);
let graphNodeMap = $state(new Map<string, graph.GraphStreamEventData>());

/**
 * Type guard for screenshot event payloads.
 * PURPOSE: Ensure run event data contains the fields required to fetch artifacts.
 */
function isScreenshotEventData(
  data: unknown,
): data is { refId: string; width?: number; height?: number } {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as Record<string, unknown>).refId === "string"
  );
}

/**
 * Type guard for screen perceived event payloads.
 * PURPOSE: Allows us to enrich discovered nodes with perceptual metadata.
 */
function isScreenPerceivedEventData(
  data: unknown,
): data is { screenId: string; perceptualHash64?: string; screenshotRefId?: string } {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof (data as Record<string, unknown>).screenId === "string"
  );
}

/**
 * Persists graph node updates locally and triggers UI reactivity.
 * PURPOSE: Maintain deterministic ordering and ensure Svelte updates subscribers.
 */
function upsertGraphNode(node: graph.GraphStreamEventData) {
  graphNodeMap.set(node.screenId, node);
  graphNodes = Array.from(graphNodeMap.values()).sort((a, b) => a.seqRef - b.seqRef);
}

/**
 * Records graph events (real or synthetic) while deduplicating by sequence reference.
 * PURPOSE: Keeps the graph event log consistent with visualized nodes.
 */
function recordGraphEvent(event: graph.GraphStreamEvent) {
  const existingIndex = graphEvents.findIndex(
    (entry) => entry.data.seqRef === event.data.seqRef && entry.type === event.type,
  );

  if (existingIndex === -1) {
    graphEvents = [...graphEvents, event];
    return;
  }

  graphEvents = graphEvents.map((entry, index) => (index === existingIndex ? event : entry));
}

/**
 * Ensures a graph node contains inline screenshot data before rendering.
 * PURPOSE: Fetches artifact data URLs on-demand when the stream omits them.
 */
async function ensureScreenshotData(
  node: graph.GraphStreamEventData,
): Promise<graph.GraphStreamEventData> {
  const screenshot = node.screenshot;
  if (!screenshot?.refId) {
    return node;
  }

  if (screenshot.dataUrl) {
    return node;
  }

  const dataUrl = await fetchArtifactDataUrl(screenshot.refId);
  if (!dataUrl) {
    return node;
  }

  return {
    ...node,
    screenshot: {
      ...screenshot,
      dataUrl,
    },
  };
}

/**
 * Handles run stream events and hydrates graph nodes when screenshots are captured.
 * PURPOSE: Protects UI rendering even when graph projector backfill is delayed.
 */
async function ingestRunEvent(event: run.RunEventMessage) {
  if (event.kind === "agent.event.screenshot_captured" && isScreenshotEventData(event.data)) {
    const dataUrl = await fetchArtifactDataUrl(event.data.refId);
    if (!dataUrl) {
      console.warn("[Run Stream] Unable to fetch screenshot content", {
        eventSeq: event.seq,
        refId: event.data.refId,
      });
      return;
    }

    // Create temporary node with refId as placeholder screenId
    // This will be replaced when screen_perceived arrives with the real hash
    const node: graph.GraphStreamEventData = {
      runId,
      screenId: event.data.refId, // Temporary - will be updated by screen_perceived
      layoutHash: "",
      perceptualHash: "",
      seqRef: event.seq,
      ts: event.timestamp,
      screenshot: {
        refId: event.data.refId,
        dataUrl,
        width: event.data.width,
        height: event.data.height,
      },
    };

    upsertGraphNode(node);
    recordGraphEvent({ type: "graph.screen.discovered", data: node });
    return;
  }

  if (event.kind === "agent.event.screen_perceived" && isScreenPerceivedEventData(event.data)) {
    // Look for synthetic node by refId (from screenshot_captured event)
    const refId = event.data.screenshotRefId;
    const existing = refId ? graphNodeMap.get(refId) : null;

    if (!existing) {
      // Node doesn't exist yet - graph stream will create it with correct screenId
      // Don't create synthetic nodes here to avoid duplicates
      return;
    }

    // Remove synthetic node - graph stream will send the real one with correct screenId
    graphNodeMap.delete(refId);
    graphNodes = Array.from(graphNodeMap.values()).sort((a, b) => a.seqRef - b.seqRef);
  }
}

/**
 * Reacts to route param changes and resets component state.
 * PURPOSE: Prevents stale screenshots from previous runs appearing when navigating between run pages.
 * BUG-014 FIX: SvelteKit reuses component instances on same-route navigation, so we must explicitly
 * reset state arrays and restart streams when page.params.id changes.
 */
$effect(() => {
  const newRunId = page.params.id || "";

  // Cleanup previous streams if runId changed
  if (newRunId !== runId && runId !== "") {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
    if (graphCleanup) {
      graphCleanup();
      graphCleanup = null;
    }
  }

  // Reset state for new run
  runId = newRunId;
  events = [];
  graphNodes = [];
  graphEvents = [];
  graphNodeMap = new Map();
  loading = true;
  error = "";

  // Start streaming for new run
  if (runId) {
    startStreaming();
    startGraphStreaming();
  }
});

onDestroy(() => {
  if (cleanup) {
    cleanup();
  }
  if (graphCleanup) {
    graphCleanup();
  }
});

/** Handles subscribing to the run event stream so the timeline stays live. */
async function startStreaming() {
  try {
    cleanup = await streamRunEvents(runId, async (event) => {
      events = [...events, event];
      await ingestRunEvent(event);
      loading = false;
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
    loading = false;
  }
}

/** Handles subscribing to the graph stream to visualize screens in real-time */
async function startGraphStreaming() {
  try {
    graphCleanup = await streamGraphEvents(runId, async (event) => {
      // Skip heartbeat events
      if (event.data.screenId === "__heartbeat__") {
        return;
      }

      const hydratedData = await ensureScreenshotData(event.data);
      upsertGraphNode(hydratedData);
      recordGraphEvent({ ...event, data: hydratedData });
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Graph streaming error";
  }
}

/** Cancels the active run when the user no longer wants to continue processing. */
async function handleCancel() {
  try {
    await cancelRun(runId);
    // Cleanup streams after cancellation
    if (cleanup) cleanup();
    if (graphCleanup) graphCleanup();
    loading = false;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to cancel run";
  }
}
</script>

<svelte:head>
  <title>Run Timeline: {runId} - ScreenGraph</title>
  <meta name="description" content="Live run timeline with real-time graph visualization and events." />
</svelte:head>

<div class="container mx-auto p-8">
	<div class="flex justify-between items-center mb-6">
		<h1 class="h1">Run Timeline: {runId}</h1>
		<button
			onclick={handleCancel}
			class="btn variant-filled-error"
		>
			Cancel Run
		</button>
	</div>
	
	{#if loading}
		<div class="card variant-ghost p-6">
			<div class="placeholder animate-pulse">
				<div class="placeholder w-full mb-2"></div>
				<div class="placeholder w-3/4 mb-2"></div>
				<div class="placeholder w-1/2"></div>
			</div>
		</div>
	{/if}
	
	{#if error}
		<aside class="alert variant-filled-error mb-4">
			<div class="alert-message">
				<p>{error}</p>
			</div>
		</aside>
	{/if}

	<!-- Graph Visualization -->
	<div class="mb-8">
		<ScreenGraph bind:nodes={graphNodes} bind:events={graphEvents} />
	</div>
	
	<!-- Run Events List -->
	<div class="card p-6" data-testid="run-events">
		<h2 class="h2 mb-4">Run Events ({events.length})</h2>
		<div class="space-y-4" use:autoAnimate>
		{#each events.slice().reverse() as event}
			<div class="card variant-ghost p-4" data-event-kind={event.kind}>
				<div class="flex justify-between items-start mb-2">
						<span class="chip variant-soft">{event.kind}</span>
						<span class="badge variant-filled">#{event.seq}</span>
					</div>
					<div class="text-sm text-surface-600 dark:text-surface-400 mb-2">{event.timestamp}</div>
					{#if event.data}
						<pre class="mt-2 p-2 bg-surface-200 dark:bg-surface-800 rounded text-xs overflow-x-auto">{JSON.stringify(event.data, null, 2)}</pre>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

