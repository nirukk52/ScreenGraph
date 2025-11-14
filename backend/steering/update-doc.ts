import { promises as fs } from "node:fs";
import path from "node:path";
import { APIError, api } from "encore.dev/api";

interface UpdateDocParams {
  category: string;
  filename: string;
  content: string;
}

interface UpdateDocResponse {
  success: boolean;
}

const STEERING_DOCS_PATH = path.resolve("../steering-docs");

export const updateDoc = api<UpdateDocParams, UpdateDocResponse>(
  {
    expose: true,
    method: "PATCH",
    path: "/steering/docs/:category/:filename",
  },
  async ({ category, filename, content }) => {
    const filePath = path.join(STEERING_DOCS_PATH, category, filename);
    const resolvedPath = path.resolve(filePath);
    const basePath = path.resolve(STEERING_DOCS_PATH);

    if (!resolvedPath.startsWith(basePath)) {
      throw APIError.invalidArgument("Invalid file path");
    }

    try {
      await fs.access(resolvedPath);
      await fs.writeFile(resolvedPath, content, "utf-8");
      return { success: true };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw APIError.notFound("Documentation file not found");
      }
      throw APIError.internal("Failed to update documentation file");
    }
  },
);
