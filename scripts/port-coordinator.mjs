#!/usr/bin/env bun

// PURPOSE: Verify main tree and provide default port configuration.
// Lightweight model: Services run ONLY on main tree with default ports.
// Worktrees are for code editing only - do not run services in worktrees.

import path from "path";
import { execSync } from "child_process";

const args = new Set(process.argv.slice(2));

const REPO_ROOT = (() => {
  try {
    return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  } catch {
    return process.cwd();
  }
})();

function detectWorktreeName() {
  const envName = process.env.WORKTREE_NAME || process.env.CURSOR_WORKTREE_NAME;
  if (envName && envName.trim()) return envName.trim();
  return path.basename(REPO_ROOT);
}

async function resolvePorts() {
  const worktree = detectWorktreeName();
  const isMainTree = worktree === "ScreenGraph";

  if (!isMainTree) {
    console.error(`[dev:ports] ERROR: Detected worktree "${worktree}"`);
    console.error(`[dev:ports] Services should ONLY run on main tree (ScreenGraph).`);
    console.error(`[dev:ports] `);
    console.error(`[dev:ports] Worktrees are for CODE EDITING only.`);
    console.error(`[dev:ports] `);
    console.error(`[dev:ports] To test your changes:`);
    console.error(`[dev:ports]   1. Commit your code in this worktree`);
    console.error(`[dev:ports]   2. cd ~/ScreenGraph/Code/ScreenGraph`);
    console.error(`[dev:ports]   3. git checkout ${process.env.GIT_BRANCH || 'your-branch'}`);
    console.error(`[dev:ports]   4. Services will auto-reload`);
    process.exit(1);
  }

  // Main tree: use default ports from .env
  const assigned = {
    backend: 4000,
    frontend: 5173,
    dashboard: 9400,
    appium: 4723,
  };

  const env = {
    WORKTREE_NAME: worktree,
    WORKTREE_MODE: "main",
    BACKEND_PORT: String(assigned.backend),
    ENCORE_DASHBOARD_PORT: String(assigned.dashboard),
    FRONTEND_PORT: String(assigned.frontend),
    APPIUM_PORT: String(assigned.appium),
    VITE_BACKEND_BASE_URL: `http://localhost:${assigned.backend}`,
  };

  return { worktree, assigned, env, isMainTree };
}

(async () => {
  const { worktree, assigned, env, isMainTree } = await resolvePorts();
  const emitJson = args.has("--json");

  if (emitJson) {
    console.log(JSON.stringify({ worktree, ports: assigned, env }, null, 2));
  } else {
    console.log(`[dev:ports] Main tree - default ports`);
    console.log(`   Backend:   ${assigned.backend}`);
    console.log(`   Frontend:  ${assigned.frontend}`);
    console.log(`   Dashboard: ${assigned.dashboard}`);
    console.log(`   Appium:    ${assigned.appium}`);
  }
})();


