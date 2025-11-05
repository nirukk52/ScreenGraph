<script>
import { onMount, onDestroy } from "svelte";
import { page } from "$app/state";
import autoAnimate from "@formkit/auto-animate";
import { streamRunEvents, cancelRun } from "$lib/api";

let runId = $state("");
let events = $state([]);
let loading = $state(true);
let error = $state("");
let cleanup = $state(null);

onMount(() => {
  runId = page.params.id || "";
  startStreaming();
});

onDestroy(() => {
  if (cleanup) {
    cleanup();
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
	
    <div class="space-y-4" use:autoAnimate>
		{#each events.slice().reverse() as event}
			<div class="p-4 border rounded-lg bg-white dark:bg-gray-800">
				<div class="flex justify-between items-start mb-2">
					<div class="font-semibold text-lg">{event.kind}</div>
					<div class="text-xs text-gray-500">#{event.seq}</div>
				</div>
				<div class="text-sm text-gray-600 mb-2">{event.timestamp}</div>
				{#if event.data}
					<pre class="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-x-auto">{JSON.stringify(event.data, null, 2)}</pre>
				{/if}
			</div>
		{/each}
	</div>
</div>

