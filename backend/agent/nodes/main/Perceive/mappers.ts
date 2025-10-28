import type { AgentState } from "../../../domain/state";
import type { AgentContext } from "../../types";
import type { PerceiveInput, PerceiveOutput } from "./node";

/**
 * buildPerceiveInput constructs PerceiveInput from agent state and context.
 * PURPOSE: Centralize capture directives (including launch delay) away from handler wiring.
 */
export function buildPerceiveInput(state: AgentState, ctx: AgentContext): PerceiveInput {
  const baseDirectives = ctx.perceive.captureDirectives;
  const delayBeforeCaptureMs = state.nodeName === "LaunchOrAttach" ? baseDirectives.delayBeforeCaptureMs : 0;

  return {
    runId: state.runId,
    stepOrdinal: state.stepOrdinal,
    iterationOrdinalNumber: state.iterationOrdinalNumber,
    randomSeed: state.randomSeed,
    captureDirectives: {
      includeScreenshotPng: baseDirectives.includeScreenshotPng,
      includeUiHierarchyXml: baseDirectives.includeUiHierarchyXml,
      delayBeforeCaptureMs,
    },
    previousPerceptualHash: state.perception.screenPerceptualHash64,
  };
}

/**
 * applyPerceiveOutput mutates agent state with newly captured perception artifacts.
 * PURPOSE: Persist latest screenshot/UI references for downstream planning and diffing.
 */
export function applyPerceiveOutput(prev: AgentState, output: PerceiveOutput): AgentState {
  return {
    ...prev,
    perception: {
      ...prev.perception,
      screenshotRefId: output.perceptionArtifacts.screenshotRefId,
      uiHierarchyXmlRefId: output.perceptionArtifacts.uiHierarchyXmlRefId,
      screenPerceptualHash64: output.perceptionArtifacts.perceptualHash,
    },
  };
}

