import { api, APIError } from "encore.dev/api";
import { promises as fs } from "fs";
import path from "path";

interface UpdateDocParams {
  category: string;
  filename: string;
  content: string;
}

interface UpdateDocResponse {
  success: boolean;
}

const STEERING_DOCS_PATH = path.resolve("./backend/steering-docs");

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
  }
);
