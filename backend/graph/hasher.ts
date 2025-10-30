import * as crypto from "node:crypto";

/**
 * normalizeUiHierarchyXml strips volatile formatting from the raw UI hierarchy XML.
 * PURPOSE: Ensures layout hashing is based on structural content rather than whitespace variance.
 */
export function normalizeUiHierarchyXml(rawXml: string): string {
  const withoutDeclaration = rawXml.replace(/<\?xml[^>]*>/gi, "");
  const collapsedWhitespace = withoutDeclaration
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
  return collapsedWhitespace.replace(/>\s+</g, "><");
}

/**
 * computeLayoutHash returns a stable structural hash scoped to an application identifier.
 * PURPOSE: Provides the canonical signature stored on the `screens` table for deduplication.
 */
export function computeLayoutHash(appId: string, normalizedXml: string): string {
  return crypto.createHash("sha256").update(`${appId}::${normalizedXml}`).digest("hex");
}

/**
 * deriveDeterministicScreenId produces a short identifier for the screen row.
 * PURPOSE: Guarantees idempotent inserts without relying on database-generated UUIDs.
 */
export function deriveDeterministicScreenId(appId: string, layoutHash: string): string {
  return crypto.createHash("sha256").update(`${appId}::${layoutHash}`).digest("hex").slice(0, 32);
}


