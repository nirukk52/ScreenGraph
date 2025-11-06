import path from "node:path";
import { promises as fs } from "node:fs";
import { computeContentSha256 } from "./hash";
import { getBaseDir, getMetaDir, listCategories, listMarkdownFiles, readJsonFile, writeJsonFile, resolveDocPath, statSafe } from "./repo";
import type { DocumentMetadata, DocumentKey, DocLifecycle } from "./types";

/**
 * PURPOSE: Build and read a derived docs index for fast listing/search and lifecycle tracking.
 */

const INDEX_FILE = path.join(getMetaDir(), "docs.index.json");
const LIFECYCLE_FILE = path.join(getMetaDir(), "lifecycle.json");

interface LifecycleMap { [key: string]: DocLifecycle }

function keyToString(key: DocumentKey): string {
  return `${key.category}/${key.filename}`;
}

function stringToKey(s: string): DocumentKey {
  const [category, ...rest] = s.split("/");
  return { category, filename: rest.join("/") };
}

export async function readIndex(): Promise<DocumentMetadata[] | null> {
  return await readJsonFile<DocumentMetadata[] | null>(INDEX_FILE, null);
}

export async function readLifecycleMap(): Promise<LifecycleMap> {
  return await readJsonFile<LifecycleMap>(LIFECYCLE_FILE, {});
}

export async function writeLifecycle(key: DocumentKey, lifecycle: DocLifecycle): Promise<void> {
  const map = await readLifecycleMap();
  map[keyToString(key)] = lifecycle;
  await writeJsonFile(LIFECYCLE_FILE, map);
}

export async function rebuildIndex(): Promise<DocumentMetadata[]> {
  const categories = await listCategories();
  const lifecycleMap = await readLifecycleMap();

  const docs: DocumentMetadata[] = [];

  for (const category of categories) {
    const files = await listMarkdownFiles(category);
    for (const filename of files) {
      const key: DocumentKey = { category, filename };
      const p = resolveDocPath(category, filename);
      const stat = await statSafe(p);
      const content = await fs.readFile(p, "utf-8");
      const hash = computeContentSha256(content);

      docs.push({
        key,
        lifecycle: lifecycleMap[keyToString(key)] ?? "active",
        createdAt: stat?.ctimeIso ?? new Date().toISOString(),
        updatedAt: stat?.mtimeIso ?? new Date().toISOString(),
        revisionCount: await readRevisionCount(category, filename),
        contentHash: hash,
      });
    }
  }

  await writeJsonFile(INDEX_FILE, docs);
  return docs;
}

async function readRevisionCount(category: string, filename: string): Promise<number> {
  try {
    const manifestPath = getRevisionManifestPath(category, filename);
    const manifest = await readJsonFile<{ revisions: unknown[] }>(manifestPath, { revisions: [] });
    return Array.isArray(manifest.revisions) ? manifest.revisions.length : 0;
  } catch {
    return 0;
  }
}

export function getRevisionBaseDir(category: string, filename: string): string {
  // store revisions under: <category>/.versions/<filename>/
  return path.join(getBaseDir(), category, ".versions", filename);
}

export function getRevisionManifestPath(category: string, filename: string): string {
  return path.join(getRevisionBaseDir(category, filename), "manifest.json");
}


