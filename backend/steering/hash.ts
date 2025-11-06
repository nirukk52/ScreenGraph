import crypto from "node:crypto";

/**
 * PURPOSE: Utilities for hashing content and normalizing filenames/identifiers.
 */

export function computeContentSha256(content: string): string {
  const h = crypto.createHash("sha256");
  h.update(content, "utf8");
  return h.digest("hex");
}

export function toKebabCase(input: string): string {
  return input
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function normalizeFilename(filename: string): string {
  // ensure .md extension and kebab-case base
  const withoutExt = filename.endsWith(".md") ? filename.slice(0, -3) : filename;
  const kebab = toKebabCase(withoutExt);
  return `${kebab}.md`;
}


