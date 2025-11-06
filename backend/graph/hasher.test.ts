import { describe, it, expect } from "vitest";
import {
  computeLayoutHash,
  deriveDeterministicScreenId,
  normalizeUiHierarchyXml,
} from "./hasher";
import { buildOutcomeId } from "./repo";

describe("Graph hashing utilities", () => {
  it.skip("normalizes UI XML by trimming declarations and whitespace", () => {
    const rawXml = `<?xml version="1.0" encoding="utf-8"?>
      <hierarchy>
        <node  text= "Hello"  />
      </hierarchy>
    `;

    const normalized = normalizeUiHierarchyXml(rawXml);

    expect(normalized).toBe("<hierarchy>\n<node  text= \"Hello\"  />\n</hierarchy>");
  });

  it("computes identical layout hashes for identical inputs", () => {
    const appId = "com.example.app";
    const xml = "<root><child id=\"1\" /></root>";
    const normalized = normalizeUiHierarchyXml(xml);

    const hashA = computeLayoutHash(appId, normalized);
    const hashB = computeLayoutHash(appId, normalized);

    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64);
  });

  it("computes different layout hashes when XML differs", () => {
    const appId = "com.example.app";
    const normalizedA = normalizeUiHierarchyXml("<root><child /></root>");
    const normalizedB = normalizeUiHierarchyXml("<root><child /><child /></root>");

    const hashA = computeLayoutHash(appId, normalizedA);
    const hashB = computeLayoutHash(appId, normalizedB);

    expect(hashA).not.toBe(hashB);
  });

  it("derives deterministic screen identifiers", () => {
    const appId = "com.test.demo";
    const layoutHash = "abc123";

    const screenIdA = deriveDeterministicScreenId(appId, layoutHash);
    const screenIdB = deriveDeterministicScreenId(appId, layoutHash);

    expect(screenIdA).toBe(screenIdB);
    expect(screenIdA).toHaveLength(32);
  });

  it("builds deterministic graph outcome identifiers", () => {
    const outcomeId = buildOutcomeId("01RUN", 5);

    expect(outcomeId).toBe("01RUN-000005");
  });
});







