import { describe, it, expect } from "vitest";
import { normalizeFilename, computeContentSha256 } from "./hash";
import { rebuildIndex, readIndex } from "./indexer";

/**
 * PURPOSE: Basic smoke tests for steering-docs utilities.
 */

describe("hash utilities", () => {
  it("normalizes filenames to kebab-case .md", () => {
    expect(normalizeFilename("My New_Doc.MD")).toBe("my-new-doc.md");
    expect(normalizeFilename("already-good.md")).toBe("already-good.md");
  });

  it("computes sha256 digest of content", () => {
    const a = computeContentSha256("hello");
    const b = computeContentSha256("hello");
    const c = computeContentSha256("world");
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe("indexer", () => {
  it("rebuilds and reads index", async () => {
    const docs = await rebuildIndex();
    expect(Array.isArray(docs)).toBe(true);
    expect(docs.length).toBeGreaterThan(0);
    const idx = await readIndex();
    expect(idx && idx.length).toBeGreaterThan(0);
  });
});


