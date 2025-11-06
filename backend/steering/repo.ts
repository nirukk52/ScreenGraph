import path from "node:path";
import { promises as fs } from "node:fs";
import log from "encore.dev/log";

/**
 * PURPOSE: File-system repository helpers for steering docs with strict path guards.
 * All functions ensure resolved paths remain within the steering-docs base directory.
 */

const BASE_DIR = path.resolve("../steering-docs");
const META_DIR = path.join(BASE_DIR, ".meta");

export function getBaseDir(): string {
  return BASE_DIR;
}

export function getMetaDir(): string {
  return META_DIR;
}

export function resolveWithinBase(...segments: string[]): string {
  const p = path.resolve(path.join(BASE_DIR, ...segments));
  const base = path.resolve(BASE_DIR);
  if (!p.startsWith(base)) {
    throw new Error("Path escapes base directory");
  }
  return p;
}

export function resolveDocPath(category: string, filename: string): string {
  return resolveWithinBase(category, filename);
}

export async function ensureDir(p: string): Promise<void> {
  await fs.mkdir(p, { recursive: true });
}

export async function readJsonFile<T>(p: string, defaultVal: T): Promise<T> {
  try {
    const buf = await fs.readFile(p, "utf-8");
    return JSON.parse(buf) as T;
  } catch (err) {
    return defaultVal;
  }
}

export async function writeJsonFile<T>(p: string, data: T): Promise<void> {
  const tmp = `${p}.tmp`;
  const json = JSON.stringify(data, null, 2);
  await ensureDir(path.dirname(p));
  await fs.writeFile(tmp, json, "utf-8");
  await fs.rename(tmp, p);
}

export async function listMarkdownFiles(category: string): Promise<string[]> {
  const dir = resolveWithinBase(category);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith(".md"))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function listCategories(): Promise<string[]> {
  const entries = await fs.readdir(BASE_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));
}

export async function statSafe(p: string): Promise<{ mtimeIso: string; ctimeIso: string; size: number } | null> {
  try {
    const st = await fs.stat(p);
    return { mtimeIso: st.mtime.toISOString(), ctimeIso: st.ctime.toISOString(), size: st.size };
  } catch {
    return null;
  }
}

export const logger = log.with({ module: "steering", actor: "service" });


