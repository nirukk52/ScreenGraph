#!/usr/bin/env bun

import { spawnSync } from "child_process";
import path from "path";
import url from "url";

const rootScript = path.join(
  url.fileURLToPath(new URL("../../scripts/port-coordinator.mjs", import.meta.url))
);

const result = spawnSync("bun", [rootScript, ...process.argv.slice(2)], {
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
