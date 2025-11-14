import { promises as fs } from "node:fs";
import path from "node:path";
import { api } from "encore.dev/api";

interface DocFile {
  filename: string;
  title: string;
}

interface DocCategory {
  name: string;
  files: DocFile[];
}

interface ListDocsResponse {
  categories: DocCategory[];
}

const STEERING_DOCS_PATH = path.resolve("../steering-docs");

export const listDocs = api<void, ListDocsResponse>(
  { expose: true, method: "GET", path: "/steering/docs" },
  async () => {
    const categories: DocCategory[] = [];

    try {
      const entries = await fs.readdir(STEERING_DOCS_PATH, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const categoryPath = path.join(STEERING_DOCS_PATH, entry.name);
          const files = await fs.readdir(categoryPath);
          const mdFiles = files.filter((f) => f.endsWith(".md"));

          const docFiles: DocFile[] = mdFiles.map((filename) => ({
            filename,
            title: filename.replace(".md", "").replace(/-/g, " "),
          }));

          if (docFiles.length > 0) {
            categories.push({
              name: entry.name,
              files: docFiles,
            });
          }
        }
      }

      categories.sort((a, b) => a.name.localeCompare(b.name));
      return { categories };
    } catch (error) {
      throw new Error("Failed to list documentation files");
    }
  },
);
