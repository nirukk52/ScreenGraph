import type { ActionDecision, ActionExecutionResult } from "../../domain/actions";
import type { EventKind } from "../../domain/events";
import type { CommonNodeInput, CommonNodeOutput } from "../../domain/state";
import type { InputActionsPort } from "../../ports/appium/input-actions.port";
import type { NavigationPort } from "../../ports/appium/navigation.port";

export interface ActInput extends CommonNodeInput {
  runId: string;
  stepOrdinal: number;
  iterationOrdinalNumber: number;
  randomSeed: number;
  chosenActionDecision: ActionDecision;
}

export interface ActOutput extends CommonNodeOutput {
  actionExecutionOutcomeStatus: "SUCCESS" | "FAILURE" | "TIMEOUT";
  actionExecutionResult: ActionExecutionResult;
}

/**
 * Act node executes the selected UI action using the driver.
 * Maps action kinds to driver methods and handles execution.
 */
export async function act(
  input: ActInput,
  inputActionsPort: InputActionsPort,
  navigationPort: NavigationPort,
): Promise<{
  output: ActOutput;
  events: Array<{ kind: EventKind; payload: Record<string, unknown> }>;
}> {
  const startTime = Date.now();
  const action = input.chosenActionDecision.selectedActionDetails;

  let executionStatus: "SUCCESS" | "FAILURE" | "TIMEOUT" = "SUCCESS";
  let errorMessage: string | null = null;

  try {
    switch (action.actionKind) {
      case "TAP":
        if (action.targetCoordinates) {
          await inputActionsPort.performTap(action.targetCoordinates.x, action.targetCoordinates.y);
        } else {
          throw new Error("TAP action requires targetCoordinates");
        }
        break;

      case "SWIPE":
        if (action.targetCoordinates && action.swipeDirection) {
          const { x, y } = action.targetCoordinates;
          const distance = 500; // pixels
          let endX = x;
          let endY = y;

          switch (action.swipeDirection) {
            case "UP":
              endY = y - distance;
              break;
            case "DOWN":
              endY = y + distance;
              break;
            case "LEFT":
              endX = x - distance;
              break;
            case "RIGHT":
              endX = x + distance;
              break;
          }

          await inputActionsPort.performSwipe(x, y, endX, endY, 300);
        } else {
          throw new Error("SWIPE action requires targetCoordinates and swipeDirection");
        }
        break;

      case "BACK":
        await navigationPort.performBack();
        break;

      case "TEXT_INPUT":
        if (action.textInputValue) {
          await inputActionsPort.performTextInput(action.textInputValue);
        } else {
          throw new Error("TEXT_INPUT action requires textInputValue");
        }
        break;

      case "LONG_PRESS":
        if (action.targetCoordinates) {
          await inputActionsPort.performLongPress(
            action.targetCoordinates.x,
            action.targetCoordinates.y,
            1000,
          );
        } else {
          throw new Error("LONG_PRESS action requires targetCoordinates");
        }
        break;

      default:
        throw new Error(`Unknown action kind: ${action.actionKind}`);
    }
  } catch (error) {
    executionStatus = "FAILURE";
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  const executionDurationMs = Date.now() - startTime;

  const actionExecutionResult: ActionExecutionResult = {
    actionCandidateId: action.candidateId,
    executionStatus,
    executionDurationMs,
    errorMessage,
  };

  return {
    output: {
      runId: input.runId,
      nodeName: "Act",
      stepOrdinal: input.stepOrdinal,
      iterationOrdinalNumber: input.iterationOrdinalNumber,
      policyVersion: 1,
      resumeToken: `${input.runId}-${String(input.stepOrdinal).padStart(3, "0")}`,
      randomSeed: input.randomSeed,
      nodeExecutionOutcomeStatus: executionStatus === "SUCCESS" ? "SUCCESS" : "FAILURE",
      errorId: executionStatus === "SUCCESS" ? null : `ACT_ERROR_${input.stepOrdinal}`,
      retryable: executionStatus === "FAILURE",
      humanReadableFailureSummary: errorMessage,
      actionExecutionOutcomeStatus: executionStatus,
      actionExecutionResult,
    },
    events: [
      {
        kind: "agent.event.action_performed",
        payload: {
          runId: input.runId,
          stepOrdinal: input.stepOrdinal,
          actionCandidateId: action.candidateId,
          actionKind: action.actionKind,
          executionStatus,
          executionDurationMs,
          errorMessage,
        },
      },
    ],
  };
}
