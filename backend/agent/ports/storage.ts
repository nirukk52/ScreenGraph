export interface StoragePort {
  storeArtifact(
    runId: string,
    artifactType: string,
    content: string | Buffer,
    metadata?: Record<string, unknown>,
  ): Promise<{ refId: string }>;
  retrieveArtifact(
    refId: string,
  ): Promise<{ content: string | Buffer; metadata: Record<string, unknown> }>;
}
