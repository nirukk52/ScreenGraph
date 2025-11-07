#!/usr/bin/env bun

// PURPOSE: Display current port configuration from .env file.
// Simple helper to show what ports are configured.

import { readFileSync } from "fs";
import { join } from "path";

const args = new Set(process.argv.slice(2));

try {
  const envPath = join(process.cwd(), ".env");
  const envContent = readFileSync(envPath, "utf-8");
  
  const parseEnv = (content) => {
    const env = {};
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join("=").trim();
      }
    }
    return env;
  };
  
  const env = parseEnv(envContent);
  
  if (args.has("--json")) {
    console.log(JSON.stringify({
      backend: Number.parseInt(env.BACKEND_PORT || "4000", 10),
      frontend: Number.parseInt(env.FRONTEND_PORT || "5173", 10),
      dashboard: Number.parseInt(env.ENCORE_DASHBOARD_PORT || "9400", 10),
      appium: Number.parseInt(env.APPIUM_PORT || "4723", 10),
    }, null, 2));
  } else {
    console.log(`Backend:   ${env.BACKEND_PORT || 4000}`);
    console.log(`Frontend:  ${env.FRONTEND_PORT || 5173}`);
    console.log(`Dashboard: ${env.ENCORE_DASHBOARD_PORT || 9400}`);
    console.log(`Appium:    ${env.APPIUM_PORT || 4723}`);
  }
} catch (err) {
  console.error("No .env file found. Using defaults:");
  console.log("Backend:   4000");
  console.log("Frontend:  5173");
  console.log("Dashboard: 9400");
  console.log("Appium:    4723");
}
