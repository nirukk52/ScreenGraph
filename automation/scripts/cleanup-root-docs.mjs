#!/usr/bin/env node
/**
 * Root Documentation Cleanup Script
 * 
 * PURPOSE: Vibe Manager maintains clean root directory by moving temporary/analysis docs to jira/reports/
 * 
 * Strategy:
 * - Keep: Core docs (CLAUDE.md, README.md, *_HANDOFF.md, WHAT_WE_ARE_MAKING.md, VIBE_*.md)
 * - Move to jira/reports/: Analysis docs, testing docs, architecture reviews
 * - Delete: Truly temporary files
 */

import { readdirSync, statSync, renameSync, unlinkSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '../../');
const JIRA_REPORTS = join(ROOT, 'jira/reports');

// Ensure reports directory exists
mkdirSync(JIRA_REPORTS, { recursive: true });

/** Core documentation that must stay at root */
const KEEP_AT_ROOT = new Set([
  'CLAUDE.md',
  'README.md',
  'WHAT_WE_ARE_MAKING.md',
  'BACKEND_HANDOFF.md',
  'FRONTEND_HANDOFF.md',
  'VIBE_LAYERING_ARCHITECTURE.md',
  'VIBE_OWNERSHIP_MAP.md',
  'VIBE_MANAGER_SUMMARY.md',
  'FOUNDERS_NOTEPAD.md',
]);

/** Pattern-based keeps (e.g., all VIBE_*.md files) */
const KEEP_PATTERNS = [
  /^VIBE_.*\.md$/,
];

/** Files to move to jira/reports/ */
const MOVE_TO_REPORTS = [
  'TESTING_COMMANDS_ANALYSIS.md',
  'TESTING_CONSOLIDATION_SUMMARY.md',
  'TESTING_QUICK_REFERENCE.md',
  'TESTING_COMMAND_TREE.txt',
  'ARCHITECTURE_REVIEW.md',
  'ARCHITECTURE_REVIEW_RETRO.md',
  'BROWSER_DEBUGGING_OPTIONS_ANALYSIS.md',
];

/** Files to delete (truly temporary) */
const DELETE = [];

function shouldKeep(filename) {
  if (KEEP_AT_ROOT.has(filename)) return true;
  for (const pattern of KEEP_PATTERNS) {
    if (pattern.test(filename)) return true;
  }
  return false;
}

function cleanupRootDocs() {
  console.log('🧹 Vibe Manager: Cleaning up root documentation...\n');
  
  const files = readdirSync(ROOT);
  let moved = 0;
  let deleted = 0;
  let kept = 0;
  
  for (const file of files) {
    const fullPath = join(ROOT, file);
    const stat = statSync(fullPath);
    
    // Only process markdown files at root
    if (!stat.isFile() || !file.endsWith('.md')) continue;
    
    if (shouldKeep(file)) {
      console.log(`✅ Keep: ${file}`);
      kept++;
      continue;
    }
    
    if (MOVE_TO_REPORTS.includes(file)) {
      const destPath = join(JIRA_REPORTS, file);
      try {
        renameSync(fullPath, destPath);
        console.log(`📦 Moved to jira/reports/: ${file}`);
        moved++;
      } catch (err) {
        console.warn(`⚠️  Failed to move ${file}:`, err.message);
      }
      continue;
    }
    
    if (DELETE.includes(file)) {
      try {
        unlinkSync(fullPath);
        console.log(`🗑️  Deleted: ${file}`);
        deleted++;
      } catch (err) {
        console.warn(`⚠️  Failed to delete ${file}:`, err.message);
      }
      continue;
    }
    
    // Unknown markdown file
    console.log(`⚠️  Unknown: ${file} (not in keep/move/delete lists)`);
  }
  
  console.log('');
  console.log(`📊 Summary: ${kept} kept, ${moved} moved, ${deleted} deleted`);
  
  if (moved > 0 || deleted > 0) {
    console.log('');
    console.log('⚠️  Root documentation was modified. These changes are NOT staged.');
    console.log('   Review and commit if needed: git add jira/reports/');
  }
  
  console.log('');
}

cleanupRootDocs();

