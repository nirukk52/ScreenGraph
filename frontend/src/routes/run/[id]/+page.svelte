<script lang="ts">
import { onMount, onDestroy } from "svelte";
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

onMount(() => {
  runId = page.params.id || "";
  startStreaming();
  startGraphStreaming();
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
		<h1 class="text-3xl font-bold">Run Timeline: {runId}</h1>
		<button
			onclick={handleCancel}
			class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
		>
			Cancel Run
		</button>
	</div>
	
	{#if loading}
		<div class="text-center">Loading events...</div>
	{/if}
	
	{#if error}
		<div class="p-4 bg-red-100 text-red-700 rounded mb-4">
			{error}
		</div>
	{/if}

	<!-- Graph Visualization -->
	<div class="mb-8">
		<ScreenGraph bind:nodes={graphNodes} bind:events={graphEvents} />
	</div>
	
	<!-- Run Events List -->
	<div class="bg-white rounded-lg border p-6">
		<h2 class="text-xl font-semibold mb-4">Run Events ({events.length})</h2>
		<div class="space-y-4" use:autoAnimate>
			{#each events.slice().reverse() as event}
				<div class="p-4 border rounded-lg bg-gray-50">
					<div class="flex justify-between items-start mb-2">
						<div class="font-semibold text-lg">{event.kind}</div>
						<div class="text-xs text-gray-500">#{event.seq}</div>
					</div>
					<div class="text-sm text-gray-600 mb-2">{event.timestamp}</div>
					{#if event.data}
						<pre class="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">{JSON.stringify(event.data, null, 2)}</pre>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

