/// <reference types="vitest" />
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "~encore": path.resolve(__dirname, "./encore.gen"),
      "~backend": path.resolve(__dirname, "./backend"),
    },
  },
  test: {
    fileParallelism: false, // Required for Encore integration
  },
});
