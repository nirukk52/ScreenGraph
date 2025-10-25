const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export async function streamRunEvents(runId: string, onEvent: (event: any) => void) {
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

export async function cancelRun(runId: string) {
	const response = await fetch(`${API_BASE}/run.Cancel`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id: runId })
	});
	
	if (!response.ok) {
		throw new Error('Failed to cancel run');
	}
	
	return response.json();
}

