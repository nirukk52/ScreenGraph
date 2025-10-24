import { AgentState, RunStatus } from "../domain/state";
import { DomainEvent } from "../domain/events";

export interface RunRecord {
  runId: string;
  tenantId: string;
  projectId: string;
  status: RunStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RepoPort {
  createRun(runId: string, tenantId: string, projectId: string, now: string): Promise<void>;
  
  getRun(runId: string): Promise<RunRecord | null>;
  
  updateRunStatus(runId: string, newStatus: RunStatus, now: string): Promise<boolean>;
  
  appendEvent(event: DomainEvent): Promise<void>;
  
  getEvents(runId: string): Promise<DomainEvent[]>;
  
  saveSnapshot(runId: string, stepOrdinal: number, state: AgentState): Promise<void>;
  
  getSnapshot(runId: string, stepOrdinal: number): Promise<AgentState | null>;
  
  upsertScreen(
    runId: string,
    screenId: string,
    perceptualHash64: string,
    screenshotRef: string,
    xmlRef: string
  ): Promise<void>;
  
  upsertAction(
    runId: string,
    actionId: string,
    fromScreenId: string,
    toScreenId: string,
    actionKind: string
  ): Promise<void>;
}
