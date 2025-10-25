<script>
	let url = $state('');
	let loading = $state(false);
	let error = $state('');

	async function startRun() {
		if (!url.trim()) {
			error = 'Please enter a URL';
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await fetch('http://localhost:4000/run.Start', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: url.trim() })
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

<div class="container mx-auto p-8 max-w-2xl">
	<h1 class="text-3xl font-bold mb-8">ScreenGraph Agent</h1>
	
	<div class="bg-white rounded-lg shadow-md p-6">
		<h2 class="text-xl font-semibold mb-4">Start a New Run</h2>
		
		{#if error}
			<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
				{error}
			</div>
		{/if}

		<div class="mb-4">
			<label for="url" class="block text-sm font-medium text-gray-700 mb-2">
				Website URL
			</label>
			<input
				id="url"
				type="url"
				bind:value={url}
				placeholder="https://example.com"
				class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				disabled={loading}
			/>
		</div>

		<button
			onclick={startRun}
			disabled={loading || !url.trim()}
			class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
		>
			{loading ? 'Starting...' : 'Start Run'}
		</button>
	</div>
</div>

