#!/usr/bin/env node

/**
 * PURPOSE: Minimal, local-first agent registry and message bus to enable
 *          "worktree == one agent" discovery and simple communication.
 *
 * Why it exists in the codebase?
 * - To let multiple Cursor worktrees (each running one agent) announce
 *   themselves and exchange lightweight messages without external services.
 * - Forms the foundation for "easy communication and picking each other's changes".
 *
 * Design:
 * - Registry JSON at ~/.screengraph/agents.json { version, agents: { [worktree]: {...} } }
 * - Bus JSONL at ~/.screengraph/agent-bus.jsonl with one JSON event per line
 * - Atomic writes for JSON; append-only for JSONL
 * - Zero dependencies; Bun/Node compatible
 */

import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

const CONFIG_DIR = path.join(os.homedir(), ".screengraph");
const AGENTS_JSON = path.join(CONFIG_DIR, "agents.json");
const BUS_JSONL = path.join(CONFIG_DIR, "agent-bus.jsonl");
const PORTS_JSON = path.join(CONFIG_DIR, "ports.json");

/** Ensure config directory exists with 0700 permissions. */
function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { mode: 0o700, recursive: true });
  }
}

/** Read JSON file if exists, else default. */
function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const text = fs.readFileSync(filePath, "utf8");
    return JSON.parse(text);
  } catch {
    return defaultValue;
  }
}

/** Atomic JSON write via temp file + rename. */
function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, filePath);
}

/** Append one JSON line to bus file. */
function appendBusEvent(event) {
  const line = JSON.stringify(event);
  fs.appendFileSync(BUS_JSONL, `${line}\n`);
}

/** Generate a stable-ish agent id for the first time. */
function generateAgentId(worktreeName) {
  const rand = crypto.randomBytes(8).toString("hex");
  return `agt-${worktreeName}-${rand}`;
}

/** Get worktree name from env or directory name. */
function resolveWorktreeName() {
  const fromEnv = process.env.WORKTREE_NAME;
  if (fromEnv && fromEnv.trim().length > 0) return fromEnv.trim();
  return path.basename(process.cwd());
}

/** Load ports assigned to this worktree from ports.json, if any. */
function loadPortsForWorktree(worktreeName) {
  const data = readJson(PORTS_JSON, { worktrees: {} });
  const wt = data?.worktrees?.[worktreeName];
  if (!wt) return null;
  return {
    backend: wt.backend,
    dashboard: wt.dashboard,
    frontend: wt.frontend,
    appium: wt.appium,
  };
}

/**
 * Register the agent for the current worktree into agents.json, creating an
 * agentId if missing, linking to ports, and updating status.
 */
function commandRegister(argv) {
  ensureConfigDir();
  const worktreeArgIdx = argv.indexOf("--worktree");
  const worktree = worktreeArgIdx >= 0 && argv[worktreeArgIdx + 1]
    ? argv[worktreeArgIdx + 1]
    : resolveWorktreeName();

  const agents = readJson(AGENTS_JSON, { version: 1, agents: {} });
  const existing = agents.agents[worktree];
  const ports = loadPortsForWorktree(worktree);
  const now = new Date().toISOString();

  const agentId = existing?.agentId ?? generateAgentId(worktree);
  const record = {
    agentId,
    worktree,
    status: "active",
    task: process.env.AGENT_TASK || "",
    portsRef: ports ? `ports.worktrees.${worktree}` : undefined,
    updatedAt: now,
  };

  agents.agents[worktree] = record;
  writeJsonAtomic(AGENTS_JSON, agents);

  // Emit a status event on the bus for visibility
  appendBusEvent({
    ts: now,
    worktree,
    agentId,
    channel: "global",
    type: "status",
    payload: { status: "active", task: record.task, ports },
  });

  // Human-readable output
  process.stdout.write(
    `[agent:comm] registered worktree=${worktree} agentId=${agentId} task="${record.task}"\n`
  );
}

/** Broadcast one event to the bus: broadcast <type> <jsonPayload> [--channel <name>] */
function commandBroadcast(argv) {
  ensureConfigDir();
  const type = argv[0];
  const payloadRaw = argv[1];
  if (!type || !payloadRaw) {
    process.stderr.write(
      "Usage: agent-comm.mjs broadcast <type> <jsonPayload> [--channel <name>]\n"
    );
    process.exit(2);
  }
  const channelIdx = argv.indexOf("--channel");
  const channel = channelIdx >= 0 && argv[channelIdx + 1] ? argv[channelIdx + 1] : "global";

  const worktree = resolveWorktreeName();
  const agents = readJson(AGENTS_JSON, { version: 1, agents: {} });
  const agentId = agents.agents[worktree]?.agentId || generateAgentId(worktree);
  const now = new Date().toISOString();

  let payload;
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    process.stderr.write("jsonPayload must be valid JSON\n");
    process.exit(2);
  }

  appendBusEvent({ ts: now, worktree, agentId, channel, type, payload });
  process.stdout.write(
    `[agent:comm] broadcast type=${type} channel=${channel} worktree=${worktree}\n`
  );
}

/** List known agents. */
function commandList() {
  ensureConfigDir();
  const agents = readJson(AGENTS_JSON, { version: 1, agents: {} });
  const entries = Object.entries(agents.agents);
  for (const [wt, rec] of entries) {
    process.stdout.write(`worktree=${wt} agentId=${rec.agentId} status=${rec.status}\n`);
  }
}

function main() {
  const [, , cmd, ...rest] = process.argv;
  switch (cmd) {
    case "register":
      commandRegister(rest);
      return;
    case "broadcast":
      commandBroadcast(rest);
      return;
    case "list":
      commandList();
      return;
    default:
      process.stderr.write(
        "Usage: agent-comm.mjs <register|broadcast|list> [args]\n"
      );
      process.exit(2);
  }
}

main();


