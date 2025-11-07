#!/usr/bin/env node

/**
 * Validation script for .cursor documentation standards
 * 
 * Checks all FR/BUG/TD/CHORE items for:
 * - Required files exist (handoff.md, main.md, status.md)
 * - Line limits enforced (handoff ≤50, main ≤150, status ≤100)
 * - Valid todo format in status.md
 * - Valid handoff chains
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const JIRA_DIR = path.join(__dirname, '../../jira');
const LINE_LIMITS = {
  'handoff.md': 50,
  'main.md': 150,
  'status.md': 100,
  'retro.md': 100
};

const CATEGORIES = {
  'feature-requests': 'FR',
  'bugs': 'BUG',
  'tech-debt': 'TD',
  'chores': 'CHORE'
};

const REQUIRED_FILES = ['handoff.md', 'main.md', 'status.md'];

// Colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

// Statistics
let stats = {
  totalItems: 0,
  validItems: 0,
  errors: [],
  warnings: []
};

/**
 * Count non-empty lines in a file
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    return lines.length;
  } catch (err) {
    return -1;
  }
}

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

/**
 * Validate a single item directory
 */
function validateItem(itemDir, itemId, category) {
  const errors = [];
  const warnings = [];
  
  // Check required files exist
  for (const requiredFile of REQUIRED_FILES) {
    const filePath = path.join(itemDir, requiredFile);
    if (!fileExists(filePath)) {
      errors.push(`Missing required file: ${requiredFile}`);
      continue;
    }
    
    // Check line limits
    const lineCount = countLines(filePath);
    const limit = LINE_LIMITS[requiredFile];
    
    if (lineCount > limit) {
      errors.push(
        `${requiredFile} exceeds limit: ${lineCount} > ${limit} lines`
      );
    } else if (lineCount === limit) {
      warnings.push(
        `${requiredFile} at limit: ${lineCount}/${limit} lines (consider splitting)`
      );
    }
  }
  
  // Check status.md has todos section
  const statusPath = path.join(itemDir, 'status.md');
  if (fileExists(statusPath)) {
    const content = fs.readFileSync(statusPath, 'utf8');
    if (!content.includes('## Todos')) {
      warnings.push('status.md missing "## Todos" section');
    }
    if (!content.includes('## Manual Testing Required')) {
      warnings.push('status.md missing "## Manual Testing Required" section');
    }
  }
  
  // Check handoff.md has handoff entries
  const handoffPath = path.join(itemDir, 'handoff.md');
  if (fileExists(handoffPath)) {
    const content = fs.readFileSync(handoffPath, 'utf8');
    if (!content.includes('## Handoff #')) {
      warnings.push('handoff.md has no handoff entries yet');
    }
  }
  
  return { errors, warnings };
}

/**
 * Scan a category directory for items
 */
function scanCategory(categoryName, prefix) {
  const categoryPath = path.join(JIRA_DIR, categoryName);
  
  if (!fs.existsSync(categoryPath)) {
    return;
  }
  
  const entries = fs.readdirSync(categoryPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('TEMPLATE')) continue;
    
    // Check if directory matches expected pattern
    const itemMatch = entry.name.match(new RegExp(`^${prefix}-\\d+`));
    if (!itemMatch) continue;
    
    const itemId = itemMatch[0];
    const itemDir = path.join(categoryPath, entry.name);
    
    stats.totalItems++;
    
    const { errors, warnings } = validateItem(itemDir, itemId, categoryName);
    
    if (errors.length === 0) {
      stats.validItems++;
      console.log(`${GREEN}✓${RESET} ${itemId} - ${entry.name}`);
    } else {
      console.log(`${RED}✗${RESET} ${itemId} - ${entry.name}`);
    }
    
    // Print errors
    for (const error of errors) {
      console.log(`  ${RED}ERROR${RESET}: ${error}`);
      stats.errors.push(`${itemId}: ${error}`);
    }
    
    // Print warnings
    for (const warning of warnings) {
      console.log(`  ${YELLOW}WARN${RESET}: ${warning}`);
      stats.warnings.push(`${itemId}: ${warning}`);
    }
  }
}

/**
 * Main validation function
 */
function main() {
  console.log(`${BLUE}Validating .cursor documentation standards...${RESET}\n`);
  
  // Check jira directory exists
  if (!fs.existsSync(JIRA_DIR)) {
    console.error(`${RED}ERROR${RESET}: jira/ directory not found`);
    process.exit(1);
  }
  
  // Scan all categories
  for (const [categoryName, prefix] of Object.entries(CATEGORIES)) {
    console.log(`\n${BLUE}Scanning ${categoryName}/${RESET}`);
    scanCategory(categoryName, prefix);
  }
  
  // Print summary
  console.log(`\n${BLUE}═══════════════════════════════════════${RESET}`);
  console.log(`${BLUE}Summary${RESET}`);
  console.log(`${BLUE}═══════════════════════════════════════${RESET}`);
  console.log(`Total items: ${stats.totalItems}`);
  console.log(`Valid items: ${GREEN}${stats.validItems}${RESET}`);
  console.log(`Invalid items: ${RED}${stats.totalItems - stats.validItems}${RESET}`);
  console.log(`Errors: ${RED}${stats.errors.length}${RESET}`);
  console.log(`Warnings: ${YELLOW}${stats.warnings.length}${RESET}`);
  
  // Exit with error code if validation failed
  if (stats.errors.length > 0) {
    console.log(`\n${RED}✗ Validation failed${RESET}`);
    process.exit(1);
  } else if (stats.warnings.length > 0) {
    console.log(`\n${YELLOW}⚠ Validation passed with warnings${RESET}`);
    process.exit(0);
  } else {
    console.log(`\n${GREEN}✓ All validation checks passed${RESET}`);
    process.exit(0);
  }
}

main();

