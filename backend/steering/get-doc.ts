import { promises as fs } from "node:fs";
import path from "node:path";
import { APIError, api } from "encore.dev/api";

interface GetDocParams {
  category: string;
  filename: string;
}

interface GetDocResponse {
  content: string;
  category: string;
  filename: string;
}

const STEERING_DOCS_PATH = path.resolve("../steering-docs");

export const getDoc = api<GetDocParams, GetDocResponse>(
  { expose: true, method: "GET", path: "/steering/docs/:category/:filename" },
  async ({ category, filename }) => {
    const filePath = path.join(STEERING_DOCS_PATH, category, filename);
    const resolvedPath = path.resolve(filePath);
    const basePath = path.resolve(STEERING_DOCS_PATH);

    if (!resolvedPath.startsWith(basePath)) {
      throw APIError.invalidArgument("Invalid file path");
    }

    try {
      const content = await fs.readFile(resolvedPath, "utf-8");
      return {
        content,
        category,
        filename,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw APIError.notFound("Documentation file not found");
      }
      throw APIError.internal("Failed to read documentation file");
    }
  },
);
