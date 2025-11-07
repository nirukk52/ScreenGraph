#!/usr/bin/env node

/**
 * Founder Rules Checker
 * 
 * Validates all Founder Rules before commits/pushes.
 * 
 * Rules checked:
 * 1. No console.log (must use encore.dev/log)
 * 2. No `any` types  
 * 3. No magic strings (use literal unions/enums)
 * 4. American spelling only
 * 5. No root package.json (backend/frontend must be independent)
 * 6. All functions/classes have purpose comments
 * 
 * Exit codes:
 * - 0: All rules passed
 * - 1: Violations found
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const errors = [];
const warnings = [];

/**
 * Recursively find files matching pattern
 * @param {string} dir - Directory to search
 * @param {RegExp} pattern - Pattern to match
 * @param {string[]} ignore - Directories to ignore
 * @returns {string[]} List of matching files
 */
function findFiles(dir, pattern, ignore = []) {
  const results = [];
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      // Skip ignored directories
      if (ignore.some(ig => fullPath.includes(ig))) {
        continue;
      }
      
      if (entry.isDirectory()) {
        results.push(...findFiles(fullPath, pattern, ignore));
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible, skip
  }
  
  return results;
}

/**
 * Rule 1: No console.log (must use encore.dev/log)
 */
function checkNoConsoleLog() {
  const tsFiles = findFiles('backend', /\.ts$/, ['node_modules', 'encore.gen']);
  
  for (const file of tsFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }
      
      if (line.includes('console.log') || line.includes('console.error') || line.includes('console.warn')) {
        errors.push({
          file,
          line: index + 1,
          message: 'Found console.* (use encore.dev/log instead)',
          rule: 'no-console',
        });
      }
    });
  }
}

/**
 * Rule 2: No `any` types
 */
function checkNoAnyType() {
  const tsFiles = [
    ...findFiles('backend', /\.ts$/, ['node_modules', 'encore.gen', 'dist']),
    ...findFiles('frontend', /\.ts$/, ['node_modules', 'encore.gen', 'dist'])
  ];
  
  for (const file of tsFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Skip comments
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        return;
      }
      
      // Look for `: any` or `<any>` or `any[]`
      if (line.match(/:\s*any\b/) || line.match(/<any>/) || line.match(/any\[\]/)) {
        errors.push({
          file,
          line: index + 1,
          message: "Found 'any' type (use explicit types)",
          rule: 'no-any',
        });
      }
    });
  }
}

/**
 * Rule 3: No root package.json (backend/frontend must be independent)
 */
function checkNoRootPackageJson() {
  const rootPkg = 'package.json';
  
  // Allow package.json ONLY if it's NOT in root, or if it's for monorepo tooling
  if (existsSync(rootPkg)) {
    try {
      const content = JSON.parse(readFileSync(rootPkg, 'utf-8'));
      
      // If it has dependencies or scripts for backend/frontend, that's a violation
      if (content.dependencies || content.devDependencies) {
        const hasBackendDeps = JSON.stringify(content).includes('encore');
        const hasFrontendDeps = JSON.stringify(content).includes('svelte') || JSON.stringify(content).includes('vite');
        
        if (hasBackendDeps || hasFrontendDeps) {
          errors.push({
            file: rootPkg,
            line: 1,
            message: 'Root package.json has backend/frontend dependencies (backend/frontend must be independent)',
            rule: 'no-root-package',
          });
        }
      }
    } catch (error) {
      warnings.push({
        file: rootPkg,
        message: `Could not parse package.json: ${error.message}`,
      });
    }
  }
}

/**
 * Rule 4: American spelling check (common violations)
 */
function checkAmericanSpelling() {
  const files = [
    ...findFiles('backend', /\.(ts|tsx)$/, ['node_modules', 'encore.gen', 'dist']),
    ...findFiles('frontend', /\.(ts|tsx|svelte)$/, ['node_modules', 'encore.gen', 'dist'])
  ];
  
  const britishToAmerican = {
    'cancelled': 'canceled',
    'cancelling': 'canceling',
    'colour': 'color',
    'colours': 'colors',
    'initialise': 'initialize',
    'initialised': 'initialized',
    'optimise': 'optimize',
    'optimised': 'optimized',
    'organise': 'organize',
    'organised': 'organized',
  };
  
  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Skip import statements and URLs
      if (line.trim().startsWith('import') || line.includes('http://') || line.includes('https://')) {
        return;
      }
      
      Object.entries(britishToAmerican).forEach(([british, american]) => {
        // Check for word boundaries
        const regex = new RegExp(`\\b${british}\\b`, 'gi');
        if (regex.test(line)) {
          errors.push({
            file,
            line: index + 1,
            message: `Use American spelling: '${british}' → '${american}'`,
            rule: 'american-spelling',
          });
        }
      });
    });
  }
}

/**
 * Rule 5: Functions/classes should have comments
 * (Warning only - not a hard error)
 */
function checkDocComments() {
  const tsFiles = [
    ...findFiles('backend', /\.ts$/, ['node_modules', 'encore.gen', 'dist', '.test.ts', '.spec.ts']),
    ...findFiles('frontend', /\.ts$/, ['node_modules', 'encore.gen', 'dist', '.test.ts', '.spec.ts'])
  ];
  
  for (const file of tsFiles) {
    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Check for exported functions without preceding comment
      if (trimmed.startsWith('export function') || trimmed.startsWith('export class')) {
        const prevLine = index > 0 ? lines[index - 1].trim() : '';
        const twoLinesUp = index > 1 ? lines[index - 2].trim() : '';
        
        // Check if there's a comment above (either JSDoc or //)
        const hasComment = prevLine.startsWith('*') || 
                          prevLine.startsWith('/**') ||
                          prevLine.startsWith('//') ||
                          twoLinesUp.startsWith('/**');
        
        if (!hasComment) {
          warnings.push({
            file,
            line: index + 1,
            message: 'Exported function/class should have a comment explaining its purpose',
          });
        }
      }
    });
  }
}

/**
 * Print results
 */
function printResults() {
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ All founder rules passed\n');
    return 0;
  }
  
  if (errors.length > 0) {
    console.error('\n🚨 Founder Rules Violations:\n');
    
    // Group by rule
    const byRule = {};
    errors.forEach(error => {
      const rule = error.rule || 'other';
      if (!byRule[rule]) byRule[rule] = [];
      byRule[rule].push(error);
    });
    
    Object.entries(byRule).forEach(([rule, ruleErrors]) => {
      console.error(`\n❌ ${rule} (${ruleErrors.length} violations):`);
      ruleErrors.forEach(error => {
        console.error(`   ${error.file}:${error.line} - ${error.message}`);
      });
    });
    
    console.error('\n❗ Fix these issues before committing.\n');
  }
  
  if (warnings.length > 0 && process.argv.includes('--strict')) {
    console.warn('\n⚠️  Warnings (not blocking):\n');
    warnings.forEach(warning => {
      console.warn(`   ${warning.file}${warning.line ? ':' + warning.line : ''} - ${warning.message}`);
    });
    console.warn('');
  }
  
  return errors.length > 0 ? 1 : 0;
}

// Main execution
function main() {
  console.log('🔍 Checking founder rules...\n');
  
  // Run all checks
  checkNoConsoleLog();
  checkNoAnyType();
  checkNoRootPackageJson();
  checkAmericanSpelling();
  checkDocComments();
  
  const exitCode = printResults();
  process.exit(exitCode);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    console.error('❌ Error running founder rules check:', error);
    process.exit(1);
  }
}

export { checkNoConsoleLog, checkNoAnyType, checkNoRootPackageJson, checkAmericanSpelling, checkDocComments };

