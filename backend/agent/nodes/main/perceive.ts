import { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import { EventKind } from "../../domain/events";
import { PerceptionArtifacts } from "../../domain/perception";
import { DriverPort } from "../../ports/driver";
import { StoragePort } from "../../ports/storage";
import * as crypto from "crypto";

export interface PerceiveInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
}

export interface PerceiveOutput extends CommonNodeOutput {
  perceptionArtifacts: PerceptionArtifacts;
}

/**
 * Perceive node captures the current UI state through screenshot and hierarchy dump.
 * Returns perception artifacts with object storage references.
 */
export async function perceive(
  input: PerceiveInput,
  driver: DriverPort,
  storage: StoragePort,
): Promise<{
  output: PerceiveOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const captureTimestampMs = Date.now();

  // Capture screenshot and UI hierarchy in parallel
  const [screenshotData, uiHierarchyData, screenDimensions] = await Promise.all([
    driver.captureScreenshot(),
    driver.dumpUiHierarchy(),
    driver.getScreenDimensions(),
  ]);

  // Store artifacts in object storage
  const [screenshotResult, uiHierarchyResult] = await Promise.all([
    storage.storeArtifact(input.runId, "screenshot", screenshotData.base64Image, {
      format: screenshotData.format,
      widthPx: screenshotData.widthPx,
      heightPx: screenshotData.heightPx,
      captureTimestampMs,
    }),
    storage.storeArtifact(input.runId, "ui_hierarchy", uiHierarchyData.xmlContent, {
      captureTimestampMs: uiHierarchyData.captureTimestampMs,
    }),
  ]);

  // Compute perceptual hash (simple checksum for MVP)
  const perceptualHash = crypto
    .createHash("sha256")
    .update(screenshotData.base64Image)
    .digest("hex")
    .substring(0, 16);

  const perceptionArtifacts: PerceptionArtifacts = {
    screenshotRefId: screenshotResult.refId,
    uiHierarchyXmlRefId: uiHierarchyResult.refId,
    perceptualHash,
    captureTimestampMs,
    deviceScreenDimensions: screenDimensions,
  };

  return {
    output: {
      runId: input.runId,
      nodeName: "Perceive",
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
      randomSeed: input.randomSeed,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
      perceptionArtifacts,
    },
    events: [],
  };
}
