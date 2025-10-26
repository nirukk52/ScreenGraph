/**
 * ScreenGraphDbPort abstracts write-only persistence of the discovered UI graph artifacts
 * (screens, actions, edges, artifacts index). Reads are intentionally omitted for MVP.
 */
export interface ScreenGraphDbPort {
  /** Upserts a screen record and indexes associated artifacts for the run. */
  upsertScreen(
    runId: string,
    screenId: string,
    perceptualHash64: string,
    screenshotRef: string,
    xmlRef: string,
  ): Promise<void>;

  /** Upserts an action and the corresponding edge relationship with evidence increment. */
  upsertAction(
    runId: string,
    actionId: string,
    fromScreenId: string,
    toScreenId: string,
    actionKind: string,
  ): Promise<void>;
}


