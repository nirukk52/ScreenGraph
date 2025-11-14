import { resolve } from "node:path";
import { config } from "dotenv";
import { defineConfig } from "vitest/config";

// Load .env from project root
config({ path: resolve(__dirname, "../.env") });

export default defineConfig({
  resolve: {
    alias: {
      "~encore": resolve(__dirname, "./encore.gen"),
    },
  },
  test: {
    testTimeout: 10000,
    env: process.env, // Pass env vars to test environment
  },
});
