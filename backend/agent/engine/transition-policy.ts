/**
 * computeBackoffDelayMs returns exponential backoff with deterministic jitter.
 * PURPOSE: Ensure bounded, repeatable retry timing across resumes.
 */
export function computeBackoffDelayMs(
  attempt: number,
  baseDelayMs: number,
  maxDelayMs: number,
  seed: number,
): number {
  const exp = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const capped = Math.min(exp, maxDelayMs);
  const jitter = (seed & 0xfff) / 0xfff; // [0,1)
  const jittered = Math.floor(capped * (0.75 + 0.25 * jitter));
  return Math.max(baseDelayMs, Math.min(jittered, maxDelayMs));
}
