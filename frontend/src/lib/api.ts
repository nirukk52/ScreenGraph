import { getEncoreClient } from './getEncoreClient';
import type { run } from './encore-client';

/**
 * Stream run events via WebSocket
 * Uses the generated Encore client for type safety
 */
export async function streamRunEvents(runId: string, onEvent: (event: run.RunEventMessage) => void) {
	const ws = new WebSocket(`ws://localhost:4000/run.Stream?id=${runId}`);
	
	ws.onmessage = (e) => {
		const event = JSON.parse(e.data);
		onEvent(event);
	};
	
	ws.onerror = (error) => {
		console.error('WebSocket error:', error);
	};
	
	return () => ws.close();
}

/**
 * Cancel a run using the Encore client
 */
export async function cancelRun(runId: string): Promise<run.CancelRunResponse> {
	const client = getEncoreClient();
	return client.run.cancel(runId);
}

