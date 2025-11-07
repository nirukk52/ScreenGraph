#!/usr/bin/env node

/**
 * Worktree Detection Module
 * 
 * Provides utilities for detecting current worktree, checking isolation,
 * and validating multi-worktree setup.
 * 
 * Used by: Husky hooks, Cursor commands, GitHub workflows
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Get the current worktree name
 * @returns {string} Name of the current worktree (e.g., "jcCtc" or "ScreenGraph")
 */
export function getCurrentWorktree() {
  try {
    const toplevel = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
    }).trim();
    return toplevel.split('/').pop();
  } catch (error) {
    console.error('❌ Failed to detect worktree:', error.message);
    process.exit(1);
  }
}

/**
 * Check if we're in the main tree
 * @returns {boolean} True if in main tree (ScreenGraph)
 */
export function isMainTree() {
  const worktree = getCurrentWorktree();
  return worktree === 'ScreenGraph';
}

/**
 * Get the registry path
 * @returns {string} Path to the port registry file
 */
export function getRegistryPath() {
  return join(homedir(), '.screengraph', 'ports.json');
}

/**
 * Check if worktree is registered in port registry
 * @param {string} worktree - Name of worktree to check
 * @returns {boolean} True if worktree is registered
 */
export function isWorktreeRegistered(worktree) {
  const registryPath = getRegistryPath();
  
  if (!existsSync(registryPath)) {
    return false;
  }
  
  try {
    const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
    return worktree in registry;
  } catch (error) {
    console.error('⚠️  Failed to read registry:', error.message);
    return false;
  }
}

/**
 * Get all registered worktrees
 * @returns {string[]} Array of registered worktree names
 */
export function getRegisteredWorktrees() {
  const registryPath = getRegistryPath();
  
  if (!existsSync(registryPath)) {
    return [];
  }
  
  try {
    const registry = JSON.parse(readFileSync(registryPath, 'utf-8'));
    return Object.keys(registry);
  } catch (error) {
    console.error('⚠️  Failed to read registry:', error.message);
    return [];
  }
}

/**
 * Validate worktree isolation (fails if attempting to run from main tree)
 * @param {boolean} strict - If true, exit on main tree detection
 */
export function validateWorktreeIsolation(strict = false) {
  const worktree = getCurrentWorktree();
  const isMain = isMainTree();
  
  if (isMain) {
    console.error('⚠️  You are on the MAIN tree (ScreenGraph)');
    
    if (strict) {
      console.error('❌ Cannot run this command from main tree. Use a worktree.');
      console.error('\nCreate a worktree with:');
      console.error('   git worktree add ../worktree-name');
      process.exit(1);
    } else {
      console.log('   Main tree uses base ports with offset.');
    }
  }
  
  return {
    worktree,
    isMain,
    isRegistered: isWorktreeRegistered(worktree),
  };
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || 'info';
  
  switch (command) {
    case 'info': {
      const { worktree, isMain, isRegistered } = validateWorktreeIsolation();
      console.log(JSON.stringify({ worktree, isMain, isRegistered }, null, 2));
      break;
    }
    
    case 'validate': {
      const strict = process.argv.includes('--strict');
      validateWorktreeIsolation(strict);
      console.log('✅ Worktree validation passed');
      break;
    }
    
    case 'list': {
      const worktrees = getRegisteredWorktrees();
      console.log('Registered worktrees:');
      worktrees.forEach(wt => console.log(`  - ${wt}`));
      break;
    }
    
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Usage: worktree-detection.mjs [info|validate|list]');
      process.exit(1);
  }
}

