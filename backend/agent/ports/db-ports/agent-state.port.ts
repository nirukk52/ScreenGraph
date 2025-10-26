import type { AgentState } from "../../domain/state";

/**
 * AgentStateDbPort encapsulates persistence of full agent state snapshots per step.
 * It enables resume semantics and deterministic recovery across restarts.
 */
export interface AgentStateDbPort {
  /** Persists or updates the snapshot for a given (run, step). */
  saveSnapshot(runId: string, stepOrdinal: number, state: AgentState): Promise<void>;

  /** Loads a specific snapshot for a (run, step); null when missing. */
  getSnapshot(runId: string, stepOrdinal: number): Promise<AgentState | null>;

  /** Returns the most recent snapshot for a run; null when none exist. */
  getLatestSnapshot(runId: string): Promise<AgentState | null>;
}


