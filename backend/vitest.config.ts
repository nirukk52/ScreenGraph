import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import { resolve } from "node:path";

// Load .env from project root
config({ path: resolve(__dirname, "../.env") });

export default defineConfig({
  test: {
    testTimeout: 10000,
    env: process.env, // Pass env vars to test environment
  },
});
