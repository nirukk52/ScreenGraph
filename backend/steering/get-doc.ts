import { api, APIError } from "encore.dev/api";
import { promises as fs } from "fs";
import path from "path";

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
  }
);
