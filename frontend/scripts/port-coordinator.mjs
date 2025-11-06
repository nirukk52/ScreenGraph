#!/usr/bin/env bun

// PURPOSE: Frontend copy of port coordinator to avoid cross-app coupling.

import fs from "fs";
import os from "os";
import path from "path";
import net from "net";
import { execSync } from "child_process";

const REGISTRY_DIR = path.join(os.homedir(), ".screengraph");
const REGISTRY_PATH = path.join(REGISTRY_DIR, "ports.json");

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
  try {
    const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
    return path.basename(root);
  } catch {
    return "unknown";
  }
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

async function pickPort(rangeBase, width, preferred) {
  if (preferred != null) {
    if (await isPortFree(preferred)) return preferred;
    return null;
  }
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

  const offsetSeed = hashString(worktree);
  const assigned = {};

  for (const [name, cfg] of Object.entries(SERVICES)) {
    const envName = cfg.env;
    const override = process.env[envName] ? Number(process.env[envName]) : null;
    const width = cfg.width;
    const offset = offsetSeed % width;
    const base = cfg.base;
    const preferred = override ?? (registry.worktrees[worktree][name] ?? base + offset);
    let port = await pickPort(base, width, preferred);

    if (override != null && (port == null || port !== override)) {
      console.error(`[dev:ports] ERROR ${name}: overridden ${envName}=${override} is busy.`);
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
    BACKEND_PORT: String(assigned.backend),
    ENCORE_DASHBOARD_PORT: String(assigned.dashboard),
    FRONTEND_PORT: String(assigned.frontend),
    APPIUM_PORT: String(assigned.appium),
    VITE_BACKEND_BASE_URL: `http://localhost:${assigned.backend}`,
  };

  return { worktree, assigned, env };
}

function emitShellExports(env) {
  const lines = Object.entries(env).map(([k, v]) => `export ${k}=${JSON.stringify(v)}`);
  return lines.join("\n");
}

function emitSummary(worktree, assigned) {
  return `[dev:ports] worktree=${worktree} backend=${assigned.backend} dashboard=${assigned.dashboard} frontend=${assigned.frontend} appium=${assigned.appium}`;
}

(async () => {
  const { worktree, assigned, env } = await resolvePorts();
  const fmt = process.argv.includes("--json") ? "json" : "shell";
  const noSummary = process.argv.includes("--no-summary");
  if (fmt === "json") {
    console.log(JSON.stringify({ worktree, ports: assigned, env }, null, 2));
  } else {
    if (!noSummary) console.log(emitSummary(worktree, assigned));
    console.log(emitShellExports(env));
  }
})();


