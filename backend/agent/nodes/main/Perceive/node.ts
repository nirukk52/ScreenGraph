import * as crypto from "node:crypto";
import log from "encore.dev/log";
import { AGENT_ACTORS, MODULES } from "../../../../logging/logger";
import type { EventKind } from "../../../domain/events";
import type { PerceptionArtifacts } from "../../../domain/perception";
import type { CommonNodeInput, CommonNodeOutput } from "../../../domain/state";
import type { DeviceInfoPort } from "../../../ports/appium/device-info.port";
import type { PerceptionPort } from "../../../ports/appium/perception.port";
import type { StoragePort } from "../../../ports/storage";

export interface PerceiveCaptureDirectives {
  includeScreenshotPng: boolean;
  includeUiHierarchyXml: boolean;
  delayBeforeCaptureMs: number;
}

export interface PerceiveInput extends CommonNodeInput {
  runId: string;
  captureDirectives: PerceiveCaptureDirectives;
  previousPerceptualHash: string | null;
}

export interface PerceiveOutput extends CommonNodeOutput {
  runId: string;
  perceptionArtifacts: PerceptionArtifacts;
}

/**
 * perceive captures visual state artifacts (screenshot + UI hierarchy) and persists them deterministically.
 * PURPOSE: Enable downstream perception diffing and splash-screen capture immediately after app launch.
 */
export async function perceive(
  input: PerceiveInput,
  perceptionPort: PerceptionPort,
  deviceInfoPort: DeviceInfoPort,
  storagePort: StoragePort,
): Promise<{
  output: PerceiveOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const logger = log.with({
    module: MODULES.AGENT,
    actor: AGENT_ACTORS.ORCHESTRATOR,
    runId: input.runId,
    nodeName: "Perceive",
  });
  logger.info("Perceive INPUT", { input });

  if (input.captureDirectives.delayBeforeCaptureMs > 0) {
    await new Promise((resolve) =>
      setTimeout(resolve, input.captureDirectives.delayBeforeCaptureMs),
    );
  }

  const screenshotPromise = input.captureDirectives.includeScreenshotPng
    ? perceptionPort.captureScreenshot()
    : Promise.resolve(null);
  const uiHierarchyPromise = input.captureDirectives.includeUiHierarchyXml
    ? perceptionPort.dumpUiHierarchy()
    : Promise.resolve(null);

  const [screenshotData, uiHierarchyData, screenDimensions] = await Promise.all([
    screenshotPromise,
    uiHierarchyPromise,
    deviceInfoPort.getScreenDimensions(),
  ]);

  const captureTimestampMs = Date.now();

  if (!screenshotData) {
    throw new Error("Screenshot capture returned null despite being required");
  }

  if (!uiHierarchyData) {
    throw new Error("UI hierarchy capture returned null despite being required");
  }

  const screenshotResult = await storagePort.storeArtifact(
    input.runId,
    "screenshot",
    screenshotData.base64Image,
    {
      format: screenshotData.format,
      widthPx: screenshotData.widthPx,
      heightPx: screenshotData.heightPx,
      captureTimestampMs,
    },
  );

  const uiHierarchyResult = await storagePort.storeArtifact(
    input.runId,
    "ui_hierarchy",
    uiHierarchyData.xmlContent,
    {
      captureTimestampMs: uiHierarchyData.captureTimestampMs ?? captureTimestampMs,
    },
  );

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

  const events: Array<{ kind: EventKind; payload: Record<string, unknown> }> = [];

  events.push({
    kind: "agent.event.screenshot_captured",
    payload: {
      refId: screenshotResult.refId,
      width: screenshotData.widthPx,
      height: screenshotData.heightPx,
    },
  });

  const elementCount = (uiHierarchyData.xmlContent.match(/<node/gi) ?? []).length;
  events.push({
    kind: "agent.event.ui_hierarchy_captured",
    payload: {
      refId: uiHierarchyResult.refId,
      elementCount,
    },
  });

  events.push({
    kind: "agent.event.screen_perceived",
    payload: {
      screenId: screenshotResult.refId,
      perceptualHash64: perceptualHash,
    },
  });

  const output: PerceiveOutput = {
    runId: input.runId,
    perceptionArtifacts,
    nodeName: "Perceive",
    stepOrdinal: input.stepOrdinal ?? 4,
    iterationOrdinalNumber: input.iterationOrdinalNumber ?? 0,
    policyVersion: 1,
    resumeToken: `${input.runId}-${String(input.stepOrdinal ?? 4).padStart(3, "0")}`,
    randomSeed: input.randomSeed ?? 0,
    nodeExecutionOutcomeStatus: "SUCCESS",
    errorId: null,
    retryable: null,
    humanReadableFailureSummary: null,
  };

  logger.info("Perceive OUTPUT", { output });

  return {
    output,
    events,
  };
}
