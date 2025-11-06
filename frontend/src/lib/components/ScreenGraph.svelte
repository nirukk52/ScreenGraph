<!--
ScreenGraph Component
PURPOSE: Displays a simple visual representation of discovered screens with screenshots
-->
<script lang="ts">
import type { graph } from "$lib/encore-client";

/**
 * Component props for graph nodes and events
 */
let { 
  nodes = $bindable([]),
  events = $bindable([])
}: { 
  nodes: graph.GraphStreamEventData[];
  events: graph.GraphStreamEvent[];
} = $props();
</script>

{#if nodes.length === 0}
	<div class="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
		<p class="text-lg">Waiting for screens to be discovered...</p>
		<p class="text-sm mt-2">The graph will populate as the agent explores the app</p>
	</div>
{:else}
	<div class="space-y-6">
		<!-- Screen Grid -->
		<div class="bg-white rounded-lg border p-6">
			<h2 class="text-xl font-semibold mb-4">Discovered Screens ({nodes.length})</h2>
			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
				{#each nodes as node}
					<div class="border rounded-lg p-2 bg-gray-50 hover:bg-gray-100 transition-colors">
						{#if node.screenshot?.dataUrl}
							<img 
								src={node.screenshot.dataUrl} 
								alt="Screen {node.screenId}" 
								class="w-full h-auto rounded border mb-2"
							/>
						{:else}
							<div class="w-full aspect-[9/16] bg-gray-200 rounded border mb-2 flex items-center justify-center">
								<span class="text-gray-400 text-xs">No screenshot</span>
							</div>
						{/if}
						<div class="text-xs space-y-1">
							<div class="font-mono truncate text-gray-600" title={node.screenId}>
								{node.screenId.slice(0, 12)}...
							</div>
							<div class="text-gray-400">
								#{node.seqRef}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Event Log -->
		<div class="bg-white rounded-lg border p-6">
			<h2 class="text-xl font-semibold mb-4">Graph Events ({events.length})</h2>
			<div class="space-y-2 max-h-64 overflow-y-auto">
				{#each events.slice().reverse() as event}
					<div class="text-sm font-mono p-2 bg-gray-50 rounded border">
						<span class="font-semibold text-blue-600">{event.type}</span>
						<span class="text-gray-400 ml-2">#{event.data.seqRef}</span>
						<span class="text-gray-500 ml-2">{event.data.screenId.slice(0, 16)}...</span>
						<span class="text-gray-400 ml-2 text-xs">{new Date(event.data.ts).toLocaleTimeString()}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
{/if}

