import "dotenv/config";
import { url, bool, cleanEnv, num, port, str } from "envalid";

/**
 * env exposes validated, typed environment variables for the backend runtime.
 * PURPOSE: Guarantee consistent configuration across main tree and worktree dev setups while
 * providing clear defaults for Encore services.
 */
export const env = cleanEnv(process.env, {
  VITE_BACKEND_BASE_URL: url({
    default: "http://localhost:4000",
    desc: "Base URL that the frontend uses to reach the Encore backend",
  }),
  BACKEND_PORT: port({
    default: 4000,
    desc: "Port used by encore run during local development",
  }),
  FRONTEND_PORT: port({
    default: 5173,
    desc: "Port served by the SvelteKit dev server",
  }),
  ENCORE_DASHBOARD_PORT: port({
    default: 9400,
    desc: "Port for the Encore developer dashboard",
  }),
  APPIUM_PORT: port({
    default: 4723,
    desc: "Port for the local Appium service",
  }),
  ENABLE_MOBILE_MCP: bool({
    default: false,
    desc: "Feature flag enabling mobile-mcp integration for agent device provisioning",
  }),
  WORKTREE_MODE: str({
    choices: ["main", "worktree"],
    default: "main",
    desc: "Indicates whether this runtime is executing inside the main repo or a worktree",
  }),
  WORKTREE_NAME: str({
    default: "ScreenGraph",
    desc: "Friendly identifier for the current worktree (or main repo)",
  }),
  NODE_ENV: str({
    choices: ["development", "test", "production"],
    default: "development",
  }),
  ENABLE_MULTI_WORKTREE: bool({
    default: true,
    desc: "Feature flag controlling multi-worktree helpers",
  }),
  ENABLE_GRAPH_STREAM: bool({
    default: true,
    desc: "Feature flag to enable the graph WebSocket stream",
  }),
  XSTATE_INSPECTOR_ENABLED: bool({
    default: true,
    desc: "Toggle for enabling the cloud-based XState inspector",
  }),
  EXPECTED_UNIQUE_SCREENS_DISCOVERED: num({
    default: 1,
    desc: "Expected number of unique screens discovered for deterministic testing with default app config",
  }),
});

export const {
  VITE_BACKEND_BASE_URL,
  BACKEND_PORT,
  FRONTEND_PORT,
  ENCORE_DASHBOARD_PORT,
  APPIUM_PORT,
  ENABLE_MOBILE_MCP,
  WORKTREE_MODE,
  WORKTREE_NAME,
  NODE_ENV,
  ENABLE_MULTI_WORKTREE,
  ENABLE_GRAPH_STREAM,
  XSTATE_INSPECTOR_ENABLED,
  EXPECTED_UNIQUE_SCREENS_DISCOVERED,
} = env;
