export interface ScreenRecordIdentity {
  screenId: string;
  perceptualHash: string;
  isNewDiscovery: boolean;
}

export interface ActionRecordIdentity {
  actionId: string;
  sourceScreenId: string;
  targetScreenId: string;
  actionKind: string;
}

export interface GraphPersistenceOutcome {
  screenRecordIdentity: ScreenRecordIdentity;
  actionRecordIdentity: ActionRecordIdentity | null;
  totalScreensInGraph: number;
  totalActionsInGraph: number;
}
