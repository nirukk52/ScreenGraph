import type { StoragePort } from "../../ports/storage";

/**
 * Fake implementation of StoragePort for testing.
 * Stores artifacts in-memory without requiring actual object storage.
 */
export class FakeStorageAdapter implements StoragePort {
  private artifacts: Map<string, { content: string | Buffer; metadata: Record<string, unknown> }> =
    new Map();

  async storeArtifact(
    runId: string,
    artifactType: string,
    content: string | Buffer,
    metadata?: Record<string, unknown>,
  ): Promise<{ refId: string }> {
    const refId = `fake://${runId}/${artifactType}/${Date.now()}`;
    this.artifacts.set(refId, { content, metadata: metadata || {} });
    return { refId };
  }

  async retrieveArtifact(
    refId: string,
  ): Promise<{ content: string | Buffer; metadata: Record<string, unknown> }> {
    const artifact = this.artifacts.get(refId);
    if (!artifact) {
      throw new Error(`Artifact not found: ${refId}`);
    }
    return artifact;
  }
}
