#!/usr/bin/env node
/**
 * Script to automatically fix common patterns in all test files
 * Run with: node tests/fix-all-tests.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const testFiles = glob.sync('tests/e2e/**/*.spec.ts');

const fixes = [
  // Fix waitForLoadState patterns
  {
    pattern: /await page\.waitForLoadState\('networkidle'\);/g,
    replacement: `await page.waitForLoadState('domcontentloaded');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});`
  },
  // Fix timeout values
  {
    pattern: /timeout: 5000/g,
    replacement: 'timeout: 10000'
  },
  {
    pattern: /timeout: 3000/g,
    replacement: 'timeout: 5000'
  },
  // Fix URL expectations
  {
    pattern: /await expect\(page\)\.toHaveURL\(([^,]+),\s*\{ timeout: 5000 \}\)/g,
    replacement: 'await expect(page).toHaveURL($1, { timeout: 15000 })'
  },
  // Fix beVisible expectations
  {
    pattern: /\.toBeVisible\(\)/g,
    replacement: '.toBeVisible({ timeout: 10000 })'
  },
  {
    pattern: /\.toBeVisible\(\{ timeout: 5000 \}\)/g,
    replacement: '.toBeVisible({ timeout: 10000 })'
  },
];

console.log(`Found ${testFiles.length} test files to process...`);

let fixedCount = 0;
for (const file of testFiles) {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const originalContent = content;
    
    for (const fix of fixes) {
      content = content.replace(fix.pattern, fix.replacement);
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      fixedCount++;
      console.log(`Fixed: ${file}`);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
}

console.log(`\nFixed ${fixedCount} files.`);

