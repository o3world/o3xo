#!/usr/bin/env node

/**
 * Inject cache-busting version into HTML files
 *
 * This script:
 * 1. Generates a version string from git commit hash (or timestamp as fallback)
 * 2. Injects/updates version in CSS and JS file references
 * 3. Adds a meta tag with the version for component-loader.js to use
 *
 * Usage: node scripts/inject-version.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Generate version string from git commit hash (short) or timestamp
function generateVersion() {
    try {
        // Try to get git commit hash (short version)
        const gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
        return gitHash;
    } catch (error) {
        // Fallback to timestamp if not in a git repo
        const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '.');
        return timestamp;
    }
}

// Find all HTML files (excluding node_modules and includes)
function findHtmlFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Skip node_modules and includes directories
            if (entry.name === 'node_modules' || entry.name === 'includes') {
                continue;
            }
            files.push(...findHtmlFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('.html')) {
            files.push(fullPath);
        }
    }

    return files;
}

// Update HTML file with version
function updateHtmlFile(filePath, version) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Update or add meta tag for asset-version
    const metaTagPattern = /<meta\s+name="asset-version"\s+content="[^"]*"\s*\/?>/;
    const newMetaTag = `<meta name="asset-version" content="${version}">`;

    if (metaTagPattern.test(content)) {
        // Update existing meta tag
        content = content.replace(metaTagPattern, newMetaTag);
        modified = true;
    } else {
        // Insert meta tag before closing </head>
        const headClosePattern = /<\/head>/;
        if (headClosePattern.test(content)) {
            content = content.replace(headClosePattern, `    ${newMetaTag}\n</head>`);
            modified = true;
        }
    }

    // Update CSS file references
    const cssPattern = /href="([^"]*\.css)(\?v=[^"]*)?"/g;
    const updatedCss = content.replace(cssPattern, (match, path) => {
        return `href="${path}?v=${version}"`;
    });

    if (updatedCss !== content) {
        content = updatedCss;
        modified = true;
    }

    // Update JS file references
    const jsPattern = /src="([^"]*\.js)(\?v=[^"]*)?"/g;
    const updatedJs = content.replace(jsPattern, (match, path) => {
        return `src="${path}?v=${version}"`;
    });

    if (updatedJs !== content) {
        content = updatedJs;
        modified = true;
    }

    // Write back only if modified
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    }

    return false;
}

// Main execution
function main() {
    const projectRoot = path.resolve(__dirname, '..');
    const version = generateVersion();

    console.log(`🔄 Injecting asset version: ${version}`);

    const htmlFiles = findHtmlFiles(projectRoot);
    let updatedCount = 0;

    for (const file of htmlFiles) {
        const relativePath = path.relative(projectRoot, file);
        const wasUpdated = updateHtmlFile(file, version);

        if (wasUpdated) {
            console.log(`   ✓ ${relativePath}`);
            updatedCount++;
        }
    }

    console.log(`\n✅ Updated ${updatedCount} file(s) with version ${version}`);
}

// Run the script
main();
