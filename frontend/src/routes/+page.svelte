<script>
	let runId = '';
	let error = '';
	let loading = false;

	async function startRun() {
		if (!runId) return;
		
		loading = true;
		error = '';
		
		try {
			const response = await fetch('http://localhost:4000/run.Start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: runId })
			});
			
			if (!response.ok) {
				throw new Error('Failed to start run');
			}
			
			const data = await response.json();
			window.location.href = `/run/${data.id}`;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto p-8">
	<h1 class="text-3xl font-bold mb-8">ScreenGraph Agent</h1>
	
	<div class="max-w-md mx-auto">
		<div class="mb-4">
			<label for="url" class="block text-sm font-medium mb-2">Website URL</label>
			<input
				id="url"
				type="text"
				bind:value={runId}
				placeholder="https://example.com"
				class="w-full px-4 py-2 border rounded-lg"
				disabled={loading}
			/>
		</div>
		
		{#if error}
			<div class="mb-4 p-3 bg-red-100 text-red-700 rounded">
				{error}
			</div>
		{/if}
		
		<button
			onclick={startRun}
			disabled={loading || !runId}
			class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
		>
			{loading ? 'Starting...' : 'Start Agent Run'}
		</button>
	</div>
</div>

