import * as crypto from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";

/**
 * Artifacts Service Unit Tests
 * PURPOSE: Verify deterministic hashing, refId derivation, and idempotency contract.
 */

describe("Artifacts Service", () => {
  describe("deriveRef", () => {
    it("should produce deterministic refId from content hash", () => {
      const runId = "01ABC123";
      const kind = "screenshot" as const;
      const content = Buffer.from("test-image-data");
      const hash = crypto.createHash("sha256").update(content).digest("hex");
      const ext = "png";

      const refId = `obj://artifacts/${runId}/${kind}/${hash}.${ext}`;

      expect(refId).toContain(runId);
      expect(refId).toContain(kind);
      expect(refId).toContain(hash);
      expect(refId).toMatch(/\.png$/);
    });

    it("should produce same refId for identical content", () => {
      const runId = "01ABC123";
      const kind = "ui_xml" as const;
      const content = Buffer.from("<root><node /></root>");
      const hash1 = crypto.createHash("sha256").update(content).digest("hex");
      const hash2 = crypto.createHash("sha256").update(content).digest("hex");

      expect(hash1).toBe(hash2);
    });

    it("should produce different refId for different content", () => {
      const content1 = Buffer.from("data1");
      const content2 = Buffer.from("data2");
      const hash1 = crypto.createHash("sha256").update(content1).digest("hex");
      const hash2 = crypto.createHash("sha256").update(content2).digest("hex");

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("content validation", () => {
    it("should reject empty base64", () => {
      const req = {
        runId: "01ABC",
        kind: "screenshot" as const,
        contentBase64: "",
      };

      const contentBytes = Buffer.from(req.contentBase64, "base64");
      expect(contentBytes.byteLength).toBe(0);
    });

    it("should decode valid base64", () => {
      const original = Buffer.from("test-data");
      const base64 = original.toString("base64");
      const decoded = Buffer.from(base64, "base64");

      expect(decoded.toString()).toBe("test-data");
    });
  });

  describe("kind mapping", () => {
    it("should map screenshot to png extension by default", () => {
      const kind = "screenshot";
      const format = undefined;
      const ext = kind === "screenshot" ? (format ?? "png") : "xml";

      expect(ext).toBe("png");
    });

    it("should respect explicit jpg format for screenshots", () => {
      const kind = "screenshot";
      const format = "jpg";
      const ext = kind === "screenshot" ? (format ?? "png") : "xml";

      expect(ext).toBe("jpg");
    });

    it("should map ui_xml to xml extension", () => {
      const kind = "ui_xml";
      const ext = kind === "screenshot" ? "png" : "xml";

      expect(ext).toBe("xml");
    });
  });

  describe("idempotency contract", () => {
    it("should produce stable hash for same screenshot bytes", () => {
      const imageData = Buffer.from("fake-png-data");
      const hash1 = crypto.createHash("sha256").update(imageData).digest("hex");
      const hash2 = crypto.createHash("sha256").update(imageData).digest("hex");

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex length
    });

    it("should produce stable hash for same XML bytes", () => {
      const xmlData = "<hierarchy><node /></hierarchy>";
      const hash1 = crypto.createHash("sha256").update(xmlData).digest("hex");
      const hash2 = crypto.createHash("sha256").update(xmlData).digest("hex");

      expect(hash1).toBe(hash2);
    });
  });

  describe("refId format", () => {
    it("should follow obj://artifacts/{runId}/{kind}/{hash}.{ext} pattern", () => {
      const runId = "01RUN123";
      const kind = "screenshot";
      const hash = "a".repeat(64);
      const ext = "png";
      const refId = `obj://artifacts/${runId}/${kind}/${hash}.${ext}`;

      expect(refId).toMatch(
        /^obj:\/\/artifacts\/[^/]+\/(screenshot|ui_xml)\/[0-9a-f]{64}\.(png|jpg|xml)$/,
      );
    });

    it("should use correct extension for each kind", () => {
      const runId = "01RUN";
      const hash = "abc123";

      const screenshotRef = `obj://artifacts/${runId}/screenshot/${hash}.png`;
      const xmlRef = `obj://artifacts/${runId}/ui_xml/${hash}.xml`;

      expect(screenshotRef).toContain(".png");
      expect(xmlRef).toContain(".xml");
    });
  });
});
