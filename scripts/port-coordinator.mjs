#!/usr/bin/env bun

// PURPOSE: Resolve deterministic, non-conflicting local dev ports per Cursor worktree
// and emit shell exports (or JSON) for backend/frontend/appium services.

import fs from "fs";
import os from "os";
import path from "path";
import net from "net";
import { execSync } from "child_process";

const args = new Set(process.argv.slice(2));

const REGISTRY_DIR = path.join(os.homedir(), ".screengraph");
const REGISTRY_PATH = path.join(REGISTRY_DIR, "ports.json");
const REPO_ROOT = (() => {
  try {
    return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
  } catch {
    return process.cwd();
  }
})();

const SERVICES = {
  backend: { base: 4000, width: 10, env: "BACKEND_PORT" },
  dashboard: { base: 9400, width: 10, env: "ENCORE_DASHBOARD_PORT" },
  frontend: { base: 5173, width: 11, env: "FRONTEND_PORT" },
  appium: { base: 4723, width: 10, env: "APPIUM_PORT" },
};

function hashString(input) {
  let h = 2166136261 >>> 0; // FNV-1a
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function detectWorktreeName() {
  const envName = process.env.WORKTREE_NAME || process.env.CURSOR_WORKTREE_NAME;
  if (envName && envName.trim()) return envName.trim();
  return path.basename(REPO_ROOT);
}

function loadRegistry() {
  try {
    const data = fs.readFileSync(REGISTRY_PATH, "utf8");
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== "object") return { version: 1, worktrees: {} };
    if (!parsed.version) parsed.version = 1;
    if (!parsed.worktrees) parsed.worktrees = {};
    return parsed;
  } catch {
    return { version: 1, worktrees: {} };
  }
}

function saveRegistry(registry) {
  if (!fs.existsSync(REGISTRY_DIR)) fs.mkdirSync(REGISTRY_DIR, { mode: 0o700, recursive: true });
  const tmp = `${REGISTRY_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(registry, null, 2));
  fs.renameSync(tmp, REGISTRY_PATH);
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen({ port, host: "127.0.0.1" }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function pickPort(rangeBase, width, preferred, allowOccupied = false) {
  // Try preferred first
  if (preferred != null) {
    const isFree = await isPortFree(preferred);
    if (isFree || allowOccupied) {
      return preferred;
    }
    return null;
  }
  // Linear probe within range
  for (let i = 0; i < width; i++) {
    const candidate = rangeBase + i;
    if (await isPortFree(candidate)) return candidate;
  }
  return null;
}

async function resolvePorts() {
  const worktree = detectWorktreeName();
  const registry = loadRegistry();
  const now = new Date().toISOString();
  if (!registry.worktrees[worktree]) registry.worktrees[worktree] = {};

  const isMainTree = worktree === "ScreenGraph";
  const offsetSeed = isMainTree ? 0 : hashString(worktree);
  const assigned = {};

  for (const [name, cfg] of Object.entries(SERVICES)) {
    const envName = cfg.env;
    const override = process.env[envName] ? Number(process.env[envName]) : null;
    const width = cfg.width;
    const offset = isMainTree ? 0 : offsetSeed % width;
    const base = cfg.base;
    const preferredFromRegistry = registry.worktrees[worktree][name];
    const preferred = override ?? preferredFromRegistry ?? base + offset;

    const allowOccupied = preferredFromRegistry === preferred;
    const port = await pickPort(base, width, preferred, allowOccupied);

    if (override != null && (port == null || port !== override)) {
      console.error(
        `[dev:ports] ERROR ${name}: overridden ${envName}=${override} is busy. Please free it or choose another.`
      );
      process.exit(2);
    }

    if (port == null) {
      console.error(`[dev:ports] ERROR ${name}: no free port in range ${base}-${base + width - 1}`);
      process.exit(3);
    }

    assigned[name] = port;
  }

  registry.worktrees[worktree] = {
    ...registry.worktrees[worktree],
    ...assigned,
    updatedAt: now,
  };
  saveRegistry(registry);

  const env = {
    WORKTREE_NAME: worktree,
    WORKTREE_MODE: isMainTree ? "main" : "worktree",
    BACKEND_PORT: String(assigned.backend),
    ENCORE_DASHBOARD_PORT: String(assigned.dashboard),
    FRONTEND_PORT: String(assigned.frontend),
    APPIUM_PORT: String(assigned.appium),
    VITE_BACKEND_BASE_URL: `http://localhost:${assigned.backend}`,
  };

  return { worktree, assigned, env, isMainTree };
}

function emitShellExports(env) {
  const lines = Object.entries(env).map(([k, v]) => `export ${k}=${JSON.stringify(v)}`);
  return lines.join("\n");
}

function emitSummary(worktree, assigned) {
  return `[dev:ports] worktree=${worktree} backend=${assigned.backend} dashboard=${assigned.dashboard} frontend=${assigned.frontend} appium=${assigned.appium}`;
}

function formatEnvFile(worktree, assigned) {
  const lines = [
    "# Auto-generated by scripts/port-coordinator.mjs",
    `# Generated at: ${new Date().toISOString()}`,
    "",
    "# Backend URL (used by Vite)",
    `VITE_BACKEND_BASE_URL=http://localhost:${assigned.backend}`,
    "",
    "# Service ports",
    `BACKEND_PORT=${assigned.backend}`,
    `FRONTEND_PORT=${assigned.frontend}`,
    `ENCORE_DASHBOARD_PORT=${assigned.dashboard}`,
    `APPIUM_PORT=${assigned.appium}`,
    "",
    "# Metadata",
    "WORKTREE_MODE=worktree",
    `WORKTREE_NAME=${worktree}`,
    "NODE_ENV=development",
    "",
    "# Feature flags (override as needed)",
    "ENABLE_MULTI_WORKTREE=true",
    "ENABLE_GRAPH_STREAM=true",
  ];

  return `${lines.join("\n")}\n`;
}

async function writeEnvLocal(worktree, assigned, isMainTree) {
  const envPath = path.join(REPO_ROOT, ".env.local");
  const baseEnvPath = path.join(REPO_ROOT, ".env");
  const exampleEnvPath = path.join(REPO_ROOT, ".env.example");

  if (!fs.existsSync(baseEnvPath) && fs.existsSync(exampleEnvPath)) {
    fs.copyFileSync(exampleEnvPath, baseEnvPath);
  }

  if (isMainTree) {
    return;
  }

  const content = formatEnvFile(worktree, assigned);
  fs.writeFileSync(envPath, content, "utf8");
}

(async () => {
  const { worktree, assigned, env, isMainTree } = await resolvePorts();
  const writeEnv = args.has("--write-env");
  const emitJson = args.has("--json");
  const emitShell = !emitJson && !args.has("--no-shell");
  const noSummary = args.has("--no-summary");

  if (writeEnv) {
    await writeEnvLocal(worktree, assigned, isMainTree);
  }

  if (emitJson) {
    console.log(JSON.stringify({ worktree, ports: assigned, env }, null, 2));
    return;
  }

  if (!noSummary) {
    console.log(emitSummary(worktree, assigned));
  }

  if (emitShell) {
    console.log(emitShellExports(env));
  }
})();


