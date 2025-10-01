const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Script to convert captured Puppeteer HTML files into a proper static site

const CAPTURED_DIR = './captured-site';
const OUTPUT_DIR = './static-site';
const ASSETS_DIR = path.join(OUTPUT_DIR, 'assets');

console.log('🏗️  Building static site from captured HTML...\n');

// Create output directory
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true });
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Copy assets
console.log('📦 Copying assets...');
if (fs.existsSync(path.join(CAPTURED_DIR, 'assets'))) {
  fs.cpSync(path.join(CAPTURED_DIR, 'assets'), ASSETS_DIR, { recursive: true });
  console.log('   ✓ Assets copied\n');
}

// Process HTML files
console.log('📄 Processing HTML files...');
const htmlFiles = fs.readdirSync(CAPTURED_DIR)
  .filter(f => f.endsWith('.html'))
  .sort();

const pageMap = {};

htmlFiles.forEach(filename => {
  const filepath = path.join(CAPTURED_DIR, filename);
  let html = fs.readFileSync(filepath, 'utf8');
  const $ = cheerio.load(html);

  // Remove or disable the Figma Sites runtime scripts
  $('script[type="module"]').remove();
  $('link[rel="preload"][as="script"]').remove();
  $('link[rel="preload"][as="fetch"]').remove();

  // Get page title for navigation
  const title = $('title').text() || filename.replace('.html', '');

  // Determine output filename
  let outputName;
  if (filename === 'index.html') {
    outputName = 'index.html';
  } else if (filename.startsWith('page-')) {
    // Convert page-00-home.html to home.html, etc.
    const parts = filename.replace('page-', '').replace('.html', '').split('-');
    const pageNum = parts[0];
    const pageName = parts.slice(1).join('-');
    outputName = pageName ? `${pageName}.html` : `page-${pageNum}.html`;
  } else {
    outputName = filename;
  }

  pageMap[outputName] = {
    original: filename,
    title: title
  };

  // Write cleaned HTML
  const outputPath = path.join(OUTPUT_DIR, outputName);
  fs.writeFileSync(outputPath, $.html());
  console.log(`   ✓ ${filename} → ${outputName}`);
});

console.log(`\n✅ Created ${Object.keys(pageMap).length} static HTML pages`);
console.log(`\n📋 Page structure:`);
Object.entries(pageMap).forEach(([name, info]) => {
  console.log(`   - ${name}: ${info.title}`);
});

console.log(`\n🌐 Static site created in: ${OUTPUT_DIR}/`);
console.log(`   Run: cd ${OUTPUT_DIR} && python3 -m http.server 8000`);
