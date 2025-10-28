import type { StoragePort } from "../../../agent/ports/storage";

/**
 * EncoreStorageAdapter implements StoragePort via Encore-generated client calls.
 * PURPOSE: Provide deterministic, typed storage backed by the Artifacts service.
 * NOTE: Requires `bun run gen` after artifacts service is deployed to generate client.
 */
export class EncoreStorageAdapter implements StoragePort {
  async storeArtifact(
    runId: string,
    artifactType: string,
    content: string | Buffer,
    metadata?: Record<string, unknown>,
  ): Promise<{ refId: string }> {
    const isBuffer = Buffer.isBuffer(content);
    const contentBase64 = isBuffer ? (content as Buffer).toString("base64") : (content as string);

    // Map artifactType to the service's enum values
    const kind = artifactType === "screenshot" ? "screenshot" : "ui_xml";

    // Lazy import to avoid compile-time error before client generation
    const { artifacts } = await import("~encore/clients");
    
    const res = await artifacts.storeArtifact({
      runId,
      kind,
      contentBase64,
      format: (metadata?.format as "png" | "jpg" | undefined) ?? undefined,
      widthPx: (metadata?.widthPx as number | undefined) ?? undefined,
      heightPx: (metadata?.heightPx as number | undefined) ?? undefined,
      captureTimestampMs: (metadata?.captureTimestampMs as number | undefined) ?? undefined,
    });
    return { refId: res.refId };
  }

  async retrieveArtifact(
    refId: string,
  ): Promise<{ content: string | Buffer; metadata: Record<string, unknown> }> {
    // MVP: metadata only via getArtifactMeta; content retrieval not needed by agent loop
    const { artifacts } = await import("~encore/clients");
    const meta = await artifacts.getArtifactMeta({ refId });
    return { content: Buffer.alloc(0), metadata: meta as unknown as Record<string, unknown> };
  }
}


