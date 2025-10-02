#!/usr/bin/env node

/**
 * Inject NoScript Navigation from Single Source
 *
 * Replaces <!-- #include virtual="/includes/header.noscript.html" -->
 * with the actual content from includes/header.noscript.html
 *
 * This runs during Netlify build time (free tier compatible)
 */

const fs = require('fs');
const path = require('path');

// Read the source noscript file
const noscriptPath = path.join(__dirname, '../includes/header.noscript.html');
const noscriptContent = fs.readFileSync(noscriptPath, 'utf8');

console.log('📝 NoScript injection starting...');
console.log(`   Source: ${noscriptPath}`);
console.log(`   Content length: ${noscriptContent.length} bytes\n`);

// Recursively find all HTML files
function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // Skip excluded directories
    const excluded = ['node_modules', 'includes', 'netlify', 'captured-site', '.git'];
    if (stat.isDirectory()) {
      if (!excluded.includes(file)) {
        findHtmlFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Process all HTML files
const rootDir = path.join(__dirname, '..');
const htmlFiles = findHtmlFiles(rootDir);

console.log(`🔍 Found ${htmlFiles.length} HTML files to scan\n`);

let processedCount = 0;
let replacedCount = 0;

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Look for the include directive
  const includePattern = /<!--\s*#include\s+virtual=["']\/includes\/header\.noscript\.html["']\s*-->/g;
  const matches = content.match(includePattern);

  if (matches) {
    // Replace with actual content
    content = content.replace(includePattern, noscriptContent);
    fs.writeFileSync(file, content, 'utf8');

    const relativePath = path.relative(rootDir, file);
    console.log(`   ✓ ${relativePath} (${matches.length} replacement${matches.length > 1 ? 's' : ''})`);

    processedCount++;
    replacedCount += matches.length;
  }
});

console.log('\n✅ NoScript injection complete!');
console.log(`   Processed: ${processedCount} files`);
console.log(`   Replacements: ${replacedCount} total\n`);

if (processedCount === 0) {
  console.log('⚠️  No files with include directives found.');
  console.log('   Make sure HTML files contain:');
  console.log('   <!-- #include virtual="/includes/header.noscript.html" -->\n');
}
