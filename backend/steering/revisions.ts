import path from "node:path";
import { promises as fs } from "node:fs";
import { computeContentSha256 } from "./hash";
import { ensureDir, readJsonFile, writeJsonFile } from "./repo";
import { getRevisionBaseDir, getRevisionManifestPath } from "./indexer";
import type { RevisionMeta } from "./types";

/**
 * PURPOSE: File-backed revision store per document with manifest tracking.
 */

interface RevisionManifest {
  revisions: RevisionMeta[];
}

export async function listRevisions(category: string, filename: string): Promise<RevisionMeta[]> {
  const manifestPath = getRevisionManifestPath(category, filename);
  const manifest = await readJsonFile<RevisionManifest>(manifestPath, { revisions: [] });
  return manifest.revisions.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getRevisionContent(
  category: string,
  filename: string,
  revisionId: string,
): Promise<{ meta: RevisionMeta; content: string } | null> {
  const manifest = await readJsonFile<RevisionManifest>(
    getRevisionManifestPath(category, filename),
    { revisions: [] },
  );
  const meta = manifest.revisions.find((r) => r.id === revisionId);
  if (!meta) return null;
  const revFile = getRevisionFilePath(category, filename, revisionId);
  const content = await fs.readFile(revFile, "utf-8");
  return { meta, content };
}

export function buildRevisionId(content: string, at?: Date): string {
  const ts = (at ?? new Date()).toISOString().replace(/[:.]/g, "-");
  const sha = computeContentSha256(content).slice(0, 12);
  return `${ts}-${sha}`;
}

export function getRevisionFilePath(category: string, filename: string, revisionId: string): string {
  const dir = getRevisionBaseDir(category, filename);
  return path.join(dir, `${revisionId}.md`);
}

export async function recordRevision(
  category: string,
  filename: string,
  content: string,
  author?: string,
  message?: string,
): Promise<RevisionMeta> {
  const id = buildRevisionId(content);
  const sha = computeContentSha256(content);
  const meta: RevisionMeta = {
    id,
    createdAt: new Date().toISOString(),
    author,
    message,
    sha,
    size: Buffer.byteLength(content, "utf8"),
  };

  const base = getRevisionBaseDir(category, filename);
  const manifestPath = getRevisionManifestPath(category, filename);
  await ensureDir(base);

  const manifest = await readJsonFile<RevisionManifest>(manifestPath, { revisions: [] });
  manifest.revisions.push(meta);

  await fs.writeFile(getRevisionFilePath(category, filename, id), content, "utf-8");
  await writeJsonFile(manifestPath, manifest);
  return meta;
}


