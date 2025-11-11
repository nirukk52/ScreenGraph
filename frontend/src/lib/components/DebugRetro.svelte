<!--
Debugging Retrospective Component
PURPOSE: Shows what we learned during debugging sessions with visual timeline
-->
<script lang="ts">
/**
 * Debugging session entry for retro display
 */
interface DebugSession {
  id: string;
  title: string;
  description: string;
  status: "solved" | "investigating" | "blocked";
  findings: string[];
  learnings: string[];
  resolution?: string;
  date: string;
}

/**
 * Debugging sessions we've done
 */
const sessions: DebugSession[] = $state([
  {
    id: "graph-stream-connection",
    title: "Graph Stream WebSocket Connection Failure",
    description:
      "Graph visualization not receiving events - WebSocket connection fails immediately",
    status: "solved",
    findings: [
      "WebSocket connection attempted but returns no status code (fails before upgrade)",
      "Run stream WebSocket works perfectly (status 101)",
      "Backend endpoint returns 404 Not Found when tested directly",
      "Other graph endpoints (/graph/diagnostics, /graph/screens) work fine",
      "Graph service is loaded (diagnostics returns 'initialized')",
      "Endpoint pattern matches working run stream: api.streamOut with path parameter",
    ],
    learnings: [
      "Browser MCP tools essential for debugging: browser_console_messages() shows connection lifecycle",
      "Network tab (browser_network_requests()) reveals WebSocket status codes",
      "404 on endpoint means it's not registered - backend needs restart for new endpoints",
      "Encore automatically extracts path parameters (:runId → handshake.runId)",
      "Systematic debugging: compare working vs failing implementations side-by-side",
      "Console logging with prefixes ([Graph Stream]) enables easy filtering",
    ],
    resolution:
      "Root cause identified: Endpoint code is correct but backend needs restart to register new endpoints. After restart, WebSocket should upgrade successfully (status 101) and graph visualization will populate with events.",
    date: new Date().toISOString().split("T")[0],
  },
]);

/**
 * Get status color for visual display
 */
function getStatusColor(status: DebugSession["status"]): string {
  switch (status) {
    case "solved":
      return "bg-green-100 text-green-800 border-green-300";
    case "investigating":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "blocked":
      return "bg-red-100 text-red-800 border-red-300";
  }
}
</script>

<div class="space-y-6">
	<h2 class="text-2xl font-semibold text-[var(--color-charcoal)] mb-4">
		🔍 Debugging Retrospective
	</h2>
	
	<p class="text-[var(--color-text-secondary)] mb-6">
		What we learned from debugging sessions using browser tools, systematic procedures, and cross-stack investigation.
	</p>

	{#each sessions as session}
		<div class="border-2 rounded-lg p-6 {getStatusColor(session.status)}">
			<div class="flex items-start justify-between mb-4">
				<div>
					<h3 class="text-xl font-semibold mb-1">{session.title}</h3>
					<p class="text-sm opacity-80">{session.description}</p>
					<span class="inline-block mt-2 text-xs px-2 py-1 rounded bg-white/50">
						{session.date}
					</span>
				</div>
				<span class="px-3 py-1 rounded-full text-xs font-semibold bg-white/50">
					{session.status.toUpperCase()}
				</span>
			</div>

			<div class="grid md:grid-cols-2 gap-4 mt-4">
				<div>
					<h4 class="font-semibold mb-2 text-sm">🔎 Findings</h4>
					<ul class="space-y-1 text-sm">
						{#each session.findings as finding}
							<li class="flex items-start gap-2">
								<span class="text-xs mt-1">•</span>
								<span>{finding}</span>
							</li>
						{/each}
					</ul>
				</div>
				
				<div>
					<h4 class="font-semibold mb-2 text-sm">💡 Learnings</h4>
					<ul class="space-y-1 text-sm">
						{#each session.learnings as learning}
							<li class="flex items-start gap-2">
								<span class="text-xs mt-1">•</span>
								<span>{learning}</span>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			{#if session.resolution}
				<div class="mt-4 pt-4 border-t-2 border-white/50">
					<h4 class="font-semibold mb-2 text-sm">✅ Resolution</h4>
					<p class="text-sm">{session.resolution}</p>
				</div>
			{/if}
		</div>
	{/each}

	<div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
		<h4 class="font-semibold text-blue-900 mb-2">📚 Debugging Tools We Used</h4>
		<div class="grid md:grid-cols-2 gap-3 text-sm text-blue-800">
			<div>
				<strong>Browser MCP Tools:</strong>
				<ul class="list-disc list-inside mt-1 space-y-1">
					<li>browser_navigate() - Load pages</li>
					<li>browser_console_messages() - Check logs</li>
					<li>browser_network_requests() - Inspect connections</li>
					<li>browser_snapshot() - Get element refs</li>
				</ul>
			</div>
			<div>
				<strong>Systematic Process:</strong>
				<ul class="list-disc list-inside mt-1 space-y-1">
					<li>Compare working vs failing implementations</li>
					<li>Check network tab for WebSocket status</li>
					<li>Verify endpoint registration</li>
					<li>Test endpoints directly with curl</li>
				</ul>
			</div>
		</div>
	</div>
</div>

