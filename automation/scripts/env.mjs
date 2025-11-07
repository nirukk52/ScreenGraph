#!/usr/bin/env node

/**
 * Environment Configuration Module
 * 
 * Central module for resolving all environment variables including:
 * - Port assignments (backend, frontend, dashboard, appium)
 * - Worktree information
 * - Service status
 * 
 * Used by: Taskfile, Husky hooks, Cursor commands, GitHub workflows
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Parse .env file content
 * @param {string} content - Content of .env file
 * @returns {Record<string, string>} Parsed environment variables
 */
function parseEnv(content) {
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts.join('=').trim();
    }
  }
  return env;
}

/**
 * Get port configuration from .env or defaults (single environment policy)
 * @returns {{ backend: number, frontend: number, dashboard: number, appium: number }}
 */
export function getPorts() {
  try {
    const envPath = join(process.cwd(), '.env');
    if (!existsSync(envPath)) {
      return getDefaultPorts();
    }
    
    const envContent = readFileSync(envPath, 'utf-8');
    const env = parseEnv(envContent);
    
    return {
      backend: Number.parseInt(env.BACKEND_PORT || '4000', 10),
      frontend: Number.parseInt(env.FRONTEND_PORT || '5173', 10),
      dashboard: Number.parseInt(env.ENCORE_DASHBOARD_PORT || '9400', 10),
      appium: Number.parseInt(env.APPIUM_PORT || '4723', 10),
    };
  } catch (error) {
    console.error('⚠️  Error reading .env:', error.message);
    return getDefaultPorts();
  }
}

/**
 * Get default port configuration
 * @returns {{ backend: number, frontend: number, dashboard: number, appium: number }}
 */
export function getDefaultPorts() {
  return {
    backend: 4000,
    frontend: 5173,
    dashboard: 9400,
    appium: 4723,
  };
}

/**
 * Print service status (single environment summary)
 */
export function printStatus() {
  const ports = getPorts();
  console.log('\n📍 Environment: single .env configuration');
  console.log('🔢 Assigned Ports (static):');
  console.log(`   backend   -> ${ports.backend}`);
  console.log(`   frontend  -> ${ports.frontend}`);
  console.log(`   dashboard -> ${ports.dashboard}`);
  console.log(`   appium    -> ${ports.appium}`);
  console.log('');
}

/**
 * Print environment variables
 */
export function printEnv() {
  const ports = getPorts();
  console.log(`BACKEND_PORT=${ports.backend}`);
  console.log(`FRONTEND_PORT=${ports.frontend}`);
  console.log(`ENCORE_DASHBOARD_PORT=${ports.dashboard}`);
  console.log(`APPIUM_PORT=${ports.appium}`);
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || 'status';
  
  switch (command) {
    case 'status':
      printStatus();
      break;
    
    case 'print':
      printEnv();
      break;
    
    case 'backend-port': {
      const ports = getPorts();
      console.log(ports.backend);
      break;
    }
    
    case 'frontend-port': {
      const ports = getPorts();
      console.log(ports.frontend);
      break;
    }
    
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: env.mjs [status|print|backend-port|frontend-port]');
      process.exit(1);
  }
}

