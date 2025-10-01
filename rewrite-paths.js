const fs = require('fs');
const path = require('path');

// Script to rewrite existing HTML files to use local asset paths

const CAPTURED_SITE_DIR = './captured-site';
const ASSETS_DIR = './captured-site/assets';

console.log('🔄 Rewriting HTML files to use local asset paths...\n');

// Build a map of all downloaded assets
const assetMap = {};

function scanAssetsDirectory(dir, type) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true });

  files.forEach(file => {
    if (file.isFile()) {
      const fullPath = path.join(file.path, file.name);

      // Get the path relative to the type directory (css/, js/, images/, fonts/)
      const relativePath = fullPath
        .replace(dir, '')
        .replace(/\\/g, '/')
        .replace(/^\//, ''); // Remove leading slash

      // The original path is the file path within the asset type directory
      const originalPath = '/' + relativePath;
      const localPath = `assets/${type}/${relativePath}`;

      assetMap[originalPath] = localPath;

      // Also map with the base URL
      assetMap[`https://tilt-neon-91239537.figma.site${originalPath}`] = localPath;
    }
  });
}

// Scan all asset directories
['css', 'js', 'json', 'images', 'fonts'].forEach(type => {
  const dir = path.join(ASSETS_DIR, type);
  scanAssetsDirectory(dir, type);
});

console.log(`📦 Found ${Object.keys(assetMap).length / 2} assets to map\n`);

// Rewrite HTML files
const htmlFiles = fs.readdirSync(CAPTURED_SITE_DIR)
  .filter(f => f.endsWith('.html'));

htmlFiles.forEach(filename => {
  const filepath = path.join(CAPTURED_SITE_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  let replacements = 0;

  // Replace all asset references
  Object.entries(assetMap).forEach(([original, local]) => {
    // Escape special characters
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Replace in various contexts
    const patterns = [
      { regex: new RegExp(`href="${escaped}"`, 'g'), replace: `href="${local}"` },
      { regex: new RegExp(`src="${escaped}"`, 'g'), replace: `src="${local}"` },
      { regex: new RegExp(`url\\("${escaped}"\\)`, 'g'), replace: `url("${local}")` },
      { regex: new RegExp(`url\\('${escaped}'\\)`, 'g'), replace: `url('${local}')` },
      { regex: new RegExp(`url\\(${escaped}\\)`, 'g'), replace: `url(${local})` },
      { regex: new RegExp(`from '${escaped}'`, 'g'), replace: `from './${local}'` }
    ];

    patterns.forEach(({ regex, replace }) => {
      const matches = (html.match(regex) || []).length;
      if (matches > 0) {
        html = html.replace(regex, replace);
        replacements += matches;
      }
    });
  });

  // Write back
  fs.writeFileSync(filepath, html);
  console.log(`✓ ${filename}: ${replacements} paths rewritten`);
});

console.log('\n✅ Done!');
