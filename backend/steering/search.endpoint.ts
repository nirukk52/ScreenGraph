import { api } from "encore.dev/api";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { SearchRequest, SearchResponse, SearchHit } from "./types";
import { listCategories, listMarkdownFiles } from "./repo";

/**
 * PURPOSE: Simple content search across steering-docs with basic ranking.
 */

function tokenize(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function scoreMatch(filename: string, content: string, q: string): { score: number; snippet: string } {
  const qTokens = tokenize(q);
  const fTokens = tokenize(filename);
  const cTokens = tokenize(content).slice(0, 2000); // cap for perf

  let score = 0;
  for (const qt of qTokens) {
    if (fTokens.includes(qt)) score += 5; // filename boost
    const count = cTokens.filter((t) => t === qt).length;
    score += Math.min(count, 5); // up to +5 per token
  }

  const idx = content.toLowerCase().indexOf(qTokens[0] ?? "");
  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, start + 160);
  const snippet = idx >= 0 ? content.slice(start, end) : content.slice(0, 160);
  return { score, snippet };
}

export const searchDocs = api<SearchRequest, SearchResponse>(
  { expose: true, method: "GET", path: "/steering/search" },
  async ({ q, category }) => {
    const qStr = String(q ?? "").trim();
    if (!qStr) return { hits: [] };

    const categories = category ? [String(category)] : await listCategories();
    const base = path.resolve("../steering-docs");

    const hits: SearchHit[] = [];
    for (const cat of categories) {
      const files = await listMarkdownFiles(cat);
      for (const filename of files) {
        const p = path.resolve(path.join(base, cat, filename));
        const content = await fs.readFile(p, "utf-8");
        const { score, snippet } = scoreMatch(filename, content, qStr);
        if (score > 0) {
          hits.push({ key: { category: cat, filename }, score, snippet });
        }
      }
    }

    hits.sort((a, b) => b.score - a.score);
    return { hits };
  },
);


