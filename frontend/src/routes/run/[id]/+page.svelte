<script>
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { streamRunEvents, cancelRun } from '$lib/api';

	let runId = '';
	let events = [];
	let loading = true;
	let error = '';
	let cleanup = null;

	onMount(() => {
		runId = $page.params.id || '';
		startStreaming();
	});

	onDestroy(() => {
		if (cleanup) {
			cleanup();
		}
	});

	async function startStreaming() {
		try {
			cleanup = await streamRunEvents(runId, (event) => {
				events = [...events, event];
				loading = false;
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
			loading = false;
		}
	}

	async function handleCancel() {
		try {
			await cancelRun(runId);
			alert('Run cancelled');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
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
	
	<div class="space-y-4">
		{#each events as event}
			<div class="p-4 border rounded-lg">
				<div class="font-semibold">{event.type}</div>
				<div class="text-sm text-gray-600">{event.timestamp}</div>
				{#if event.message}
					<div class="mt-2">{event.message}</div>
				{/if}
			</div>
		{/each}
	</div>
</div>

