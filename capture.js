const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

const CONFIG = {
  baseUrl: 'https://tilt-neon-91239537.figma.site/',
  outputDir: './captured-site',
  assetsDir: './captured-site/assets',
  screenshotsDir: './captured-site/screenshots',
  waitTime: 3000,
  captureScreenshots: true,
  downloadAssets: true, // NEW: Download CSS, JS, images, fonts
  logFile: './captured-site/capture-log.json',
  maxDepth: 3, // How many levels deep to follow prototype links
  clickDelay: 1500 // Delay after clicking to let animations complete
};

const captureLog = {
  timestamp: new Date().toISOString(),
  baseUrl: CONFIG.baseUrl,
  pages: [],
  errors: [],
  metadata: {},
  prototypeFlow: [],
  downloadedAssets: [] // Track downloaded assets
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to download a file
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        return downloadFile(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const fileStream = fs.createWriteStream(outputPath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve(outputPath);
      });

      fileStream.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(err);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(30000, () => {
      req.abort();
      reject(new Error('Request timeout'));
    });
  });
}

// Helper to extract all asset URLs from a page
async function extractAssetUrls(page) {
  return await page.evaluate(() => {
    const assets = {
      stylesheets: [],
      scripts: [],
      images: [],
      fonts: []
    };

    // Get all stylesheets
    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      if (link.href) assets.stylesheets.push(link.href);
    });

    // Get inline styles with URLs (for fonts, etc.)
    document.querySelectorAll('style').forEach(style => {
      const urls = style.textContent.match(/url\(['"]?([^'"()]+)['"]?\)/g);
      if (urls) {
        urls.forEach(url => {
          const match = url.match(/url\(['"]?([^'"()]+)['"]?\)/);
          if (match && match[1]) {
            if (match[1].includes('.woff') || match[1].includes('.ttf') || match[1].includes('.otf')) {
              assets.fonts.push(match[1]);
            }
          }
        });
      }
    });

    // Get all scripts
    document.querySelectorAll('script[src]').forEach(script => {
      if (script.src) assets.scripts.push(script.src);
    });

    // Get preloaded scripts (common in Figma sites)
    document.querySelectorAll('link[rel="preload"][as="script"]').forEach(link => {
      if (link.href) assets.scripts.push(link.href);
    });

    // Get preloaded JSON/fetch resources (common in Figma sites)
    document.querySelectorAll('link[rel="preload"][as="fetch"]').forEach(link => {
      if (link.href) assets.scripts.push(link.href); // Store in scripts for now, will organize by extension
    });

    // Get all images
    document.querySelectorAll('img[src]').forEach(img => {
      if (img.src) assets.images.push(img.src);
    });

    // Get background images from inline styles
    document.querySelectorAll('[style*="background-image"]').forEach(el => {
      const style = el.getAttribute('style');
      const match = style.match(/background-image:\s*url\(['"]?([^'"()]+)['"]?\)/);
      if (match && match[1]) {
        assets.images.push(match[1]);
      }
    });

    return assets;
  });
}

// Download assets and update HTML references
async function downloadPageAssets(page, baseUrl) {
  if (!CONFIG.downloadAssets) return [];

  console.log('   📦 Downloading assets...');
  const assets = await extractAssetUrls(page);
  const downloaded = [];

  const downloadAsset = async (url, type) => {
    try {
      // Make URL absolute
      const absoluteUrl = new URL(url, baseUrl).href;

      // Parse the URL to create a local path
      const urlObj = new URL(absoluteUrl);
      const pathname = urlObj.pathname;

      // Determine actual type based on file extension if type is 'js'
      let actualType = type;
      if (type === 'js' && pathname.endsWith('.json')) {
        actualType = 'json';
      }

      // Create local file path
      const localPath = path.join(CONFIG.assetsDir, actualType, pathname);

      // Skip if already downloaded
      if (fs.existsSync(localPath)) {
        downloaded.push({
          url: absoluteUrl,
          localPath,
          type: actualType,
          cached: true,
          originalPath: pathname
        });
        return;
      }

      await downloadFile(absoluteUrl, localPath);
      downloaded.push({
        url: absoluteUrl,
        localPath,
        type: actualType,
        cached: false,
        originalPath: pathname
      });
      console.log(`      ✓ ${actualType}: ${pathname}`);

    } catch (error) {
      console.log(`      ✗ Failed: ${url} - ${error.message}`);
      captureLog.errors.push({
        type: 'asset-download',
        url,
        error: error.message
      });
    }
  };

  // Download all asset types
  const allDownloads = [
    ...assets.stylesheets.map(url => downloadAsset(url, 'css')),
    ...assets.scripts.map(url => downloadAsset(url, 'js')),
    ...assets.images.map(url => downloadAsset(url, 'images')),
    ...assets.fonts.map(url => downloadAsset(url, 'fonts'))
  ];

  await Promise.all(allDownloads);

  console.log(`      Downloaded ${downloaded.filter(d => !d.cached).length} assets (${downloaded.filter(d => d.cached).length} cached)`);

  return downloaded;
}

// Rewrite HTML to use local asset paths
function rewriteHtmlAssetPaths(html, downloadedAssets) {
  let updatedHtml = html;

  // Create a map of original URLs to local paths
  const assetMap = {};
  downloadedAssets.forEach(asset => {
    // Map both the full URL and the pathname
    assetMap[asset.url] = `assets/${asset.type}${asset.originalPath}`;
    assetMap[asset.originalPath] = `assets/${asset.type}${asset.originalPath}`;
  });

  // Replace all asset references
  Object.entries(assetMap).forEach(([original, local]) => {
    // Escape special characters in the original path for regex
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Replace in various contexts: href="...", src="...", url("..."), url('...')
    const patterns = [
      new RegExp(`href="${escaped}"`, 'g'),
      new RegExp(`src="${escaped}"`, 'g'),
      new RegExp(`url\\("${escaped}"\\)`, 'g'),
      new RegExp(`url\\('${escaped}'\\)`, 'g'),
      new RegExp(`url\\(${escaped}\\)`, 'g')
    ];

    patterns.forEach(pattern => {
      updatedHtml = updatedHtml.replace(pattern, (match) => {
        if (match.includes('href=')) return `href="${local}"`;
        if (match.includes('src=')) return `src="${local}"`;
        if (match.includes('url("')) return `url("${local}")`;
        if (match.includes("url('")) return `url('${local}')`;
        return `url(${local})`;
      });
    });
  });

  return updatedHtml;
}

async function ensureDirectories() {
  [CONFIG.outputDir, CONFIG.assetsDir, CONFIG.screenshotsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

async function extractPageMetadata(page) {
  return await page.evaluate(() => {
    const getMetaContent = (name) => {
      const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      return meta ? meta.getAttribute('content') : null;
    };

    return {
      title: document.title,
      description: getMetaContent('description'),
      ogTitle: getMetaContent('og:title'),
      ogDescription: getMetaContent('og:description'),
      ogImage: getMetaContent('og:image'),
      lang: document.documentElement.lang,
      h1s: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
      linkCount: document.querySelectorAll('a[href]').length,
      divClickables: document.querySelectorAll('div[onclick]').length,
      hasSemanticHTML: {
        header: !!document.querySelector('header'),
        nav: !!document.querySelector('nav'),
        main: !!document.querySelector('main'),
        footer: !!document.querySelector('footer'),
        article: !!document.querySelector('article')
      }
    };
  });
}

async function findPrototypeInteractions(page) {
  // Find all clickable elements that might trigger prototype navigation
  const interactions = await page.evaluate(() => {
    const clickables = [];
    
    // Look for various clickable patterns in Figma prototypes
    const selectors = [
      'a[href]',
      '[onclick]',
      '[data-href]',
      '[data-link]',
      '[data-url]',
      '[role="button"]',
      'button',
      '[class*="hotspot"]',
      '[class*="clickable"]',
      '[style*="cursor: pointer"]'
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        // Get position for clicking
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const href = el.href || el.getAttribute('data-href') || el.getAttribute('data-link');
          const text = el.textContent.trim().substring(0, 50);
          
          clickables.push({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            href: href,
            text: text || 'Untitled',
            selector: selector,
            tagName: el.tagName
          });
        }
      });
    });
    
    return clickables;
  });
  
  return interactions;
}

async function getPageState(page) {
  // Get unique identifiers for this page state
  return await page.evaluate(() => {
    // Try to find frame identifier in URL or DOM
    const url = window.location.href;
    const hash = window.location.hash;
    const pathname = window.location.pathname;
    
    // Look for Figma-specific identifiers
    const frameId = document.querySelector('[data-frame-id]')?.getAttribute('data-frame-id');
    
    // Get first few visible text elements as a content fingerprint
    const visibleText = Array.from(document.querySelectorAll('h1, h2, h3, [class*="heading"]'))
      .slice(0, 3)
      .map(el => el.textContent.trim())
      .join('|');
    
    return {
      url,
      hash,
      pathname,
      frameId,
      contentFingerprint: visibleText
    };
  });
}

async function captureCurrentState(page, stateName, index) {
  console.log(`\n📄 Capturing state ${index}: ${stateName}`);

  try {
    // Wait for content to settle
    await wait(CONFIG.waitDelay || 1000);

    const metadata = await extractPageMetadata(page);
    const pageState = await getPageState(page);

    console.log(`   Content: ${pageState.contentFingerprint.substring(0, 60)}...`);
    console.log(`   URL: ${pageState.url}`);

    // Download assets first (before getting HTML)
    const downloadedAssets = await downloadPageAssets(page, CONFIG.baseUrl);

    // Get page content
    let html = await page.content();

    // Rewrite HTML to use local asset paths
    if (CONFIG.downloadAssets && downloadedAssets.length > 0) {
      html = rewriteHtmlAssetPaths(html, downloadedAssets);
      console.log(`   🔄 Rewrote ${downloadedAssets.length} asset paths to local`);
    }

    // Generate filename
    const filename = `${stateName}.html`;
    const filepath = path.join(CONFIG.outputDir, filename);
    fs.writeFileSync(filepath, html);
    console.log(`   ✓ Saved: ${filename}`);

    // Capture screenshot
    if (CONFIG.captureScreenshots) {
      const screenshotPath = path.join(
        CONFIG.screenshotsDir,
        `${stateName}.png`
      );
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      console.log(`   ✓ Screenshot saved`);
    }

    // Log this state
    captureLog.pages.push({
      index,
      stateName,
      filename,
      metadata,
      pageState,
      assets: downloadedAssets,
      capturedAt: new Date().toISOString()
    });

    // Add to global assets list
    downloadedAssets.forEach(asset => {
      if (!captureLog.downloadedAssets.find(a => a.url === asset.url)) {
        captureLog.downloadedAssets.push(asset);
      }
    });

    return { success: true, stateName, filename, pageState };

  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
    captureLog.errors.push({
      stateName,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    return { success: false, stateName, error: error.message };
  }
}

async function explorePrototype(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('🔍 Exploring prototype flow...');
  
  // Start at home
  await page.goto(CONFIG.baseUrl, { 
    waitUntil: 'networkidle0',
    timeout: 30000 
  });
  await wait(CONFIG.waitTime);
  
  // Track visited states to avoid infinite loops
  const visitedStates = new Set();
  const statesToExplore = [];
  let stateIndex = 0;
  
  // Capture initial state
  const initialState = await getPageState(page);
  const initialStateId = `${initialState.url}|${initialState.contentFingerprint}`;
  visitedStates.add(initialStateId);
  
  await captureCurrentState(page, 'page-00-home', stateIndex++);
  
  // Find all interactions on home page
  const homeInteractions = await findPrototypeInteractions(page);
  console.log(`\n   Found ${homeInteractions.length} interactive elements on home page`);
  
  // Queue up states to explore
  homeInteractions.forEach((interaction, idx) => {
    statesToExplore.push({
      parentState: 'home',
      interaction,
      depth: 1,
      path: ['home', interaction.text]
    });
  });
  
  // Explore each state
  while (statesToExplore.length > 0) {
    const stateToExplore = statesToExplore.shift();
    const { parentState, interaction, depth, path } = stateToExplore;
    
    if (depth > CONFIG.maxDepth) {
      console.log(`\n⏭️  Skipping (max depth reached): ${path.join(' > ')}`);
      continue;
    }
    
    console.log(`\n🔗 Following: ${path.join(' > ')}`);
    console.log(`   Click target: ${interaction.text}`);
    
    try {
      // Navigate back to parent state first
      await page.goto(CONFIG.baseUrl, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      await wait(CONFIG.waitTime);
      
      // Try clicking the interaction
      if (interaction.href && interaction.href.includes('figma.site')) {
        // If it's a direct link, navigate to it
        await page.goto(interaction.href, { 
          waitUntil: 'networkidle0',
          timeout: 30000 
        });
      } else {
        // Try to click at the coordinates
        await page.mouse.click(interaction.x, interaction.y);
        await wait(CONFIG.clickDelay);
      }
      
      // Check if we reached a new state
      const newState = await getPageState(page);
      const newStateId = `${newState.url}|${newState.contentFingerprint}`;
      
      if (visitedStates.has(newStateId)) {
        console.log(`   ⏭️  Already visited this state`);
        continue;
      }
      
      visitedStates.add(newStateId);
      
      // Capture this new state
      const stateName = `page-${String(stateIndex).padStart(2, '0')}-${interaction.text.replace(/[^a-z0-9]/gi, '-').toLowerCase().substring(0, 30)}`;
      await captureCurrentState(page, stateName, stateIndex++);
      
      // Log the flow
      captureLog.prototypeFlow.push({
        from: parentState,
        to: stateName,
        trigger: interaction.text,
        depth,
        path
      });
      
      // Find interactions on this new page
      const newInteractions = await findPrototypeInteractions(page);
      console.log(`   Found ${newInteractions.length} more interactive elements`);
      
      // Queue up new states to explore (if not too deep)
      if (depth < CONFIG.maxDepth) {
        newInteractions.forEach(newInteraction => {
          statesToExplore.push({
            parentState: stateName,
            interaction: newInteraction,
            depth: depth + 1,
            path: [...path, newInteraction.text]
          });
        });
      }
      
    } catch (error) {
      console.log(`   ✗ Failed to explore: ${error.message}`);
      captureLog.errors.push({
        interaction: interaction.text,
        path: path.join(' > '),
        error: error.message
      });
    }
  }
  
  await page.close();
  return visitedStates.size;
}

async function analyzeAccessibility(browser) {
  console.log('\n🔍 Running accessibility analysis...');
  
  const page = await browser.newPage();
  await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0' });
  await wait(CONFIG.waitTime);
  
  const a11yIssues = await page.evaluate(() => {
    const issues = {
      missingAltText: [],
      improperHeadingOrder: false,
      divLinks: 0,
      properLinks: 0,
      missingLandmarks: [],
      contrastIssues: 0
    };
    
    document.querySelectorAll('img').forEach(img => {
      if (!img.alt || img.alt.trim() === '') {
        issues.missingAltText.push(img.src);
      }
    });
    
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    if (headings.length > 0) {
      const levels = headings.map(h => parseInt(h.tagName[1]));
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i-1] > 1) {
          issues.improperHeadingOrder = true;
          break;
        }
      }
    }
    
    issues.divLinks = document.querySelectorAll('div[onclick], div[data-href]').length;
    issues.properLinks = document.querySelectorAll('a[href]').length;
    
    const landmarks = ['header', 'nav', 'main', 'footer', 'aside'];
    landmarks.forEach(landmark => {
      if (!document.querySelector(landmark)) {
        issues.missingLandmarks.push(landmark);
      }
    });
    
    return issues;
  });
  
  await page.close();
  
  captureLog.metadata.accessibility = a11yIssues;
  
  console.log(`   Images missing alt text: ${a11yIssues.missingAltText.length}`);
  console.log(`   Proper <a> links: ${a11yIssues.properLinks}`);
  console.log(`   Div-based "links": ${a11yIssues.divLinks}`);
  console.log(`   Missing landmarks: ${a11yIssues.missingLandmarks.join(', ')}`);
  
  return a11yIssues;
}

async function generateRebuildNotes(a11yIssues) {
  const notes = `# Figma Prototype Export - Lessons Learned & Rebuild Notes

## Export Details
- **Date**: ${new Date().toISOString().split('T')[0]}
- **Source**: ${CONFIG.baseUrl}
- **Pages Captured**: ${captureLog.pages.length}
- **Prototype Flow Paths**: ${captureLog.prototypeFlow.length}
- **Errors**: ${captureLog.errors.length}

## Prototype Flow Map
${captureLog.prototypeFlow.length > 0 ? captureLog.prototypeFlow.map(flow => 
  `- **${flow.from}** → **${flow.to}** (via "${flow.trigger}")`
).join('\n') : 'No prototype flows detected'}

## Critical Issues Found

### 1. Accessibility Problems (MUST FIX in rebuild)
- **Missing Alt Text**: ${a11yIssues.missingAltText.length} images without descriptions
- **Non-semantic Navigation**: ${a11yIssues.divLinks} div-based clickables instead of proper <a> tags
- **Missing Landmarks**: No semantic HTML5 elements (${a11yIssues.missingLandmarks.join(', ')})
- **Heading Structure**: ${a11yIssues.improperHeadingOrder ? 'Improper heading hierarchy' : 'Heading order acceptable'}

### 2. SEO Issues
- Figma Sites use div soup instead of semantic HTML
- Links rendered as divs with onclick handlers (not crawlable)
- Limited meta tag control
- No proper sitemap generation
- Poor indexing in search engines

### 3. Code Quality
- Auto-generated class names (not maintainable)
- Deeply nested div structures
- Inline styles mixed with style tags
- No separation of concerns (HTML/CSS/JS)

## Rebuild Recommendations

### Must-Have Improvements
1. **Semantic HTML Structure**
   \`\`\`html
   <header>
     <nav>
       <ul>
         <li><a href="/">Home</a></li>
       </ul>
     </nav>
   </header>
   <main>
     <article>
       <!-- Content -->
     </article>
   </main>
   <footer>
     <!-- Footer content -->
   </footer>
   \`\`\`

2. **Proper Link Structure**
   - Replace all div onclick handlers with proper <a href=""> tags
   - Ensure keyboard navigation works
   - Add proper focus states

3. **Accessibility Compliance (WCAG 2.1 AA)**
   - Add alt text to all images
   - Use proper heading hierarchy (h1 → h2 → h3)
   - Add ARIA labels where appropriate
   - Ensure color contrast meets standards
   - Test with screen readers

4. **SEO Optimization**
   - Unique page titles and meta descriptions
   - Proper Open Graph tags
   - Schema.org structured data
   - XML sitemap
   - robots.txt configuration

5. **Performance**
   - Optimize images (WebP format, proper sizing)
   - Minimize CSS/JS
   - Implement proper caching headers
   - Target Core Web Vitals metrics

### Technology Stack Recommendations
Given your background with WordPress/Drupal:

**Option A: Static Site Generator (Fastest rebuild)**
- **Astro** - Great for content sites, excellent SEO defaults
- **11ty** - Minimal, flexible, clean HTML output
- **Hugo** - Blazing fast builds

**Option B: Headless CMS**
- **Sanity** - You're already familiar with it
- **Contentful** - Good for marketing sites
- **Strapi** - Self-hosted option

**Option C: WordPress (If you need it)**
- Custom block theme with ACF
- Sage/Roots for modern workflow
- Headless WordPress if you want to keep React frontend

### File Reference
- **HTML files**: See ./captured-site/*.html
- **Screenshots**: See ./captured-site/screenshots/ for visual reference
- **Capture log**: See ./captured-site/capture-log.json for metadata

## Page Inventory
${captureLog.pages.map((p, i) => 
  `${i + 1}. **${p.stateName}** - ${p.metadata.title || 'Untitled'}
   - File: \`${p.filename}\`
   - Content: ${p.pageState.contentFingerprint.substring(0, 60)}...
`).join('\n')}

## Next Steps
1. Review captured HTML and screenshots
2. Map out proper URL structure based on prototype flow
3. Create content inventory/sitemap
4. Design proper information architecture
5. Choose CMS/framework
6. Build with accessibility and SEO from day one
7. Test with real screen readers and SEO tools

## Resources
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [WebAIM Accessibility Testing](https://webaim.org/)
- [Google Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Schema.org Documentation](https://schema.org/)

---
*Generated by Figma Prototype Capture Script*
`;

  const notesPath = path.join(CONFIG.outputDir, 'REBUILD-NOTES.md');
  fs.writeFileSync(notesPath, notes);
  console.log(`\n📝 Rebuild notes saved to: ${notesPath}`);
}

async function main() {
  console.log('🚀 Starting Figma Prototype Capture');
  console.log(`📍 Target: ${CONFIG.baseUrl}\n`);
  
  await ensureDirectories();
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null 
  });
  
  try {
    // Explore the entire prototype
    const totalStates = await explorePrototype(browser);
    console.log(`\n✅ Explored ${totalStates} unique prototype states`);
    
    // Analyze accessibility
    const a11yIssues = await analyzeAccessibility(browser);
    
    // Generate rebuild documentation
    await generateRebuildNotes(a11yIssues);
    
    // Save capture log
    fs.writeFileSync(
      CONFIG.logFile, 
      JSON.stringify(captureLog, null, 2)
    );
    
    console.log('\n✅ Capture complete!');
    console.log(`   Pages captured: ${captureLog.pages.length}`);
    console.log(`   Prototype flows: ${captureLog.prototypeFlow.length}`);
    console.log(`   Assets downloaded: ${captureLog.downloadedAssets.length}`);
    console.log(`   Errors: ${captureLog.errors.length}`);
    console.log(`   Output directory: ${CONFIG.outputDir}`);
    console.log(`\n📊 Asset breakdown:`);
    const assetsByType = captureLog.downloadedAssets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + 1;
      return acc;
    }, {});
    Object.entries(assetsByType).forEach(([type, count]) => {
      console.log(`      ${type}: ${count}`);
    });
    console.log(`\n📖 Review REBUILD-NOTES.md for lessons learned and next steps`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    captureLog.errors.push({
      fatal: true,
      error: error.message,
      stack: error.stack
    });
  } finally {
    await browser.close();
  }
}

main().catch(console.error);