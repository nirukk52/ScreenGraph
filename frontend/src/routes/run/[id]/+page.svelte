<script lang="ts">
import { onDestroy } from "svelte";
import { page } from "$app/state";
import autoAnimate from "@formkit/auto-animate";
import { streamRunEvents, streamGraphEvents, cancelRun } from "$lib/api";
import ScreenGraph from "$lib/components/ScreenGraph.svelte";

let runId = $state("");
let events = $state([]);
let graphNodes = $state([]);
let graphEvents = $state([]);
let loading = $state(true);
let error = $state("");
let cleanup = $state(null);
let graphCleanup = $state(null);

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
    cleanup = await streamRunEvents(runId, (event) => {
      events = [...events, event];
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
    console.log("[Graph Stream] Starting connection for runId:", runId);
    graphCleanup = await streamGraphEvents(runId, (event) => {
      console.log("[Graph Stream] Received event:", event);
      
      // Skip heartbeat events
      if (event.data.screenId === "__heartbeat__") {
        console.log("[Graph Stream] Skipping heartbeat");
        return;
      }
      
      console.log("[Graph Stream] Processing event:", {
        type: event.type,
        screenId: event.data.screenId,
        seqRef: event.data.seqRef
      });
      
      // Add to events log
      graphEvents = [...graphEvents, event];
      
      // Add or update nodes
      const existingIndex = graphNodes.findIndex(n => n.screenId === event.data.screenId);
      if (existingIndex === -1) {
        console.log("[Graph Stream] Adding new node:", event.data.screenId);
        graphNodes = [...graphNodes, event.data];
      } else {
        console.log("[Graph Stream] Updating existing node:", event.data.screenId);
        // Update existing node
        graphNodes = graphNodes.map((n, i) => 
          i === existingIndex ? event.data : n
        );
      }
      
      console.log("[Graph Stream] Current graphNodes count:", graphNodes.length);
    });
    console.log("[Graph Stream] Connection established");
  } catch (e) {
    console.error("[Graph Stream] Streaming error:", e);
  }
}

/** Cancels the active run when the user no longer wants to continue processing. */
async function handleCancel() {
  try {
    await cancelRun(runId);
    alert("Run cancelled");
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
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
				<div
					class="card variant-ghost p-4"
					data-event-kind={event.kind}
					data-event-seq={event.seq}
				>
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

