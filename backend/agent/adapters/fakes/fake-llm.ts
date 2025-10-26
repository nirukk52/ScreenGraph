import { LLMPort } from "../../ports/llm.port";
import { ActionCandidate } from "../../domain/entities";
import { StoragePort } from "../../ports/storage.port";

export class FakeLLM implements LLMPort {
  constructor(
    private storage: StoragePort,
    private seed: number,
  ) {}

  async enumerateActions(
    uiHierarchyXmlRefId: string,
    maxActions: number,
  ): Promise<ActionCandidate[]> {
    const xml = await this.storage.get(uiHierarchyXmlRefId);
    if (!xml) {
      return [];
    }

    const clickableMatches = xml.matchAll(
      /clickable="true".*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g,
    );
    const candidates: ActionCandidate[] = [];
    let index = 0;

    for (const match of clickableMatches) {
      if (index >= maxActions) break;

      const x = parseInt(match[1]);
      const y = parseInt(match[2]);
      const width = parseInt(match[3]) - x;
      const height = parseInt(match[4]) - y;

      candidates.push({
        actionCandidateId: `01ACTCAND-${String(index + 1).padStart(2, "0")}`,
        actionKind: "TAP",
        hitTargetBounds: { x, y, width, height },
        elementStableIdentitySignature: `sig:${x}:${y}:${width}:${height}`,
        confidenceScore: 0.9,
      });
      index++;
    }

    candidates.push({
      actionCandidateId: `01ACTCAND-${String(index + 1).padStart(2, "0")}`,
      actionKind: "BACK",
      hitTargetBounds: { x: 0, y: 0, width: 0, height: 0 },
      elementStableIdentitySignature: "sig:back",
      confidenceScore: 0.8,
    });

    return candidates.sort((a, b) => a.actionCandidateId.localeCompare(b.actionCandidateId));
  }

  async chooseAction(candidates: ActionCandidate[], strategy: string): Promise<string> {
    if (candidates.length === 0) {
      throw new Error("No candidates available");
    }

    const seededIndex = this.seed % candidates.length;
    return candidates[seededIndex].actionCandidateId;
  }
}
