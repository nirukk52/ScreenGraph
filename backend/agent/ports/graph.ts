import type { ActionCandidate } from "../domain/actions";
import {
  type ActionRecordIdentity,
  GraphPersistenceOutcome,
  type ScreenRecordIdentity,
} from "../domain/graph";

export interface GraphPort {
  persistScreen(
    perceptualHash: string,
    screenshotRefId: string,
    uiHierarchyXmlRefId: string,
    metadata: Record<string, unknown>,
  ): Promise<ScreenRecordIdentity>;

  persistAction(
    sourceScreenId: string,
    targetScreenId: string,
    actionCandidate: ActionCandidate,
    executionStatus: string,
  ): Promise<ActionRecordIdentity>;

  getGraphStatistics(): Promise<{
    totalScreens: number;
    totalActions: number;
    totalUniqueScreens: number;
  }>;

  findScreenByHash(perceptualHash: string): Promise<ScreenRecordIdentity | null>;

  getScreenDiscoveryCount(since: number): Promise<number>;
}
