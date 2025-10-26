import { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import { EventKind } from "../../domain/events";
import { VerificationAssessment } from "../../domain/verification";

export interface VerifyInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  perceptualHashBefore: string;
  perceptualHashAfter: string;
}

export interface VerifyOutput extends CommonNodeOutput {
  verificationAssessment: VerificationAssessment;
}

/**
 * Verify node confirms that the action produced a UI change.
 * Compares pre/post perceptual hashes to detect visual changes.
 */
export async function verify(
  input: VerifyInput
): Promise<{
  output: VerifyOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  // Compare perceptual hashes
  const visualChangeDetected = input.perceptualHashBefore !== input.perceptualHashAfter;

  // Calculate Hamming distance for change significance (MVP: simple comparison)
  let changeSignificance: "NONE" | "MINOR" | "MODERATE" | "MAJOR" = "NONE";
  let assessmentRationale = "No visual change detected";

  if (visualChangeDetected) {
    // For MVP, any change is considered MAJOR
    // In production, we'd calculate Hamming distance or use more sophisticated metrics
    changeSignificance = "MAJOR";
    assessmentRationale = "Visual change detected via perceptual hash comparison";
  }

  const verificationAssessment: VerificationAssessment = {
    visualChangeDetected,
    perceptualHashBefore: input.perceptualHashBefore,
    perceptualHashAfter: input.perceptualHashAfter,
    changeSignificance,
    assessmentRationale,
  };

  return {
    output: {
      runId: input.runId,
      nodeName: "Verify",
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
      randomSeed: input.randomSeed,
      nodeExecutionOutcomeStatus: "SUCCESS",
      errorId: null,
      retryable: null,
      humanReadableFailureSummary: null,
      verificationAssessment,
    },
    events: [
      {
        kind: "agent.event.action_verification_completed",
        payload: {
          runId: input.runId,
          stepOrdinal: input.stepOrdinal,
          visualChangeDetected,
          changeSignificance,
          assessmentRationale,
        },
      },
    ],
  };
}
