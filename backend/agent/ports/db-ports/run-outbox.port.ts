/**
 * RunOutboxDbPort abstracts the outbox pattern cursor table that tracks publishing progress per run.
 * It maintains next_seq and last_published_seq cursors to enable reliable, ordered event publishing.
 */
export interface RunOutboxDbPort {
  /**
   * Ensures run_outbox cursor exists for a run. Called once when run starts.
   * Creates initial cursor if missing, otherwise does nothing.
   */
  ensureOutboxCursor(runId: string): Promise<void>;

  /**
   * Gets the current cursor state for a run.
   * Returns { next_seq, last_published_seq } or null if not found.
   */
  getCursor(runId: string): Promise<{ nextSeq: number; lastPublishedSeq: number } | null>;

  /**
   * Advances the cursor after successfully publishing events.
   * Updates both next_seq and last_published_seq based on published sequence range.
   */
  advanceCursor(runId: string, publishedSeq: number): Promise<void>;
}
