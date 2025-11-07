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
import { execSync } from 'child_process';
import { getCurrentWorktree } from './worktree-detection.mjs';

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
 * Get port configuration from .env or defaults
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
 * Check if a port is in use
 * @param {number} port - Port number to check
 * @returns {{ inUse: boolean, pid?: number, process?: string }}
 */
export function checkPort(port) {
  try {
    const pid = execSync(`lsof -ti:${port} 2>/dev/null || true`, {
      encoding: 'utf-8',
    }).trim();
    
    if (!pid) {
      return { inUse: false };
    }
    
    const processName = execSync(`ps -p ${pid} -o comm= 2>/dev/null || echo "unknown"`, {
      encoding: 'utf-8',
    }).trim();
    
    return {
      inUse: true,
      pid: Number.parseInt(pid, 10),
      process: processName,
    };
  } catch (error) {
    return { inUse: false };
  }
}

/**
 * Get status of all services
 * @returns {Record<string, { port: number, status: string, pid?: number, process?: string }>}
 */
export function getServiceStatus() {
  const ports = getPorts();
  const worktree = getCurrentWorktree();
  
  return {
    worktree,
    services: {
      backend: {
        port: ports.backend,
        ...checkPort(ports.backend),
      },
      frontend: {
        port: ports.frontend,
        ...checkPort(ports.frontend),
      },
      dashboard: {
        port: ports.dashboard,
        ...checkPort(ports.dashboard),
      },
      appium: {
        port: ports.appium,
        ...checkPort(ports.appium),
      },
    },
  };
}

/**
 * Print service status in a formatted way
 */
export function printStatus() {
  const status = getServiceStatus();
  
  console.log(`\n📍 Worktree: ${status.worktree}\n`);
  console.log('🔢 Port Configuration:\n');
  
  Object.entries(status.services).forEach(([service, info]) => {
    const statusIcon = info.inUse ? '🟢' : '⚪';
    const statusText = info.inUse 
      ? `Running (PID ${info.pid}, ${info.process})`
      : 'Available';
    
    console.log(`   ${statusIcon} ${service.padEnd(10)} Port ${info.port} - ${statusText}`);
  });
  
  console.log('');
}

/**
 * Print environment variables
 */
export function printEnv() {
  const ports = getPorts();
  const worktree = getCurrentWorktree();
  
  console.log(`WORKTREE_NAME=${worktree}`);
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
    
    case 'json': {
      const status = getServiceStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
    }
    
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
    
    case 'worktree-name': {
      const worktree = getCurrentWorktree();
      console.log(worktree);
      break;
    }
    
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: env.mjs [status|print|json|backend-port|frontend-port|worktree-name]');
      process.exit(1);
  }
}

