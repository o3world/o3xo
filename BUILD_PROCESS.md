# Build Process for Netlify Deployment

## Recommended: Use a Simple Build Script

For a Netlify-hosted static site, the **simplest and most reliable** approach is to use a build script that injects the noscript content before deployment.

## Option 1: Node.js Build Script (Recommended)

### Setup

1. Install dependencies:
```bash
npm install --save-dev glob fs-extra
```

2. Create `scripts/inject-noscript.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs-extra');
const glob = require('glob');
const path = require('path');

// Read the source noscript file
const noscriptContent = fs.readFileSync('includes/header.noscript.html', 'utf8');

// Find all HTML files (excluding node_modules and includes)
const htmlFiles = glob.sync('**/*.html', {
  ignore: ['node_modules/**', 'includes/**', 'netlify/**', 'captured-site/**']
});

console.log(`Found ${htmlFiles.length} HTML files to process`);

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace the include directive with actual content
  const includePattern = /<!--\s*#include\s+virtual=["']\/includes\/header\.noscript\.html["']\s*-->/g;

  if (includePattern.test(content)) {
    content = content.replace(includePattern, noscriptContent);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✓ Processed: ${file}`);
  }
});

console.log('✓ Build complete');
```

3. Update `package.json`:
```json
{
  "scripts": {
    "prebuild": "node scripts/inject-noscript.js",
    "build": "echo 'Build complete'",
    "dev": "echo 'Development server'"
  },
  "devDependencies": {
    "glob": "^10.3.10",
    "fs-extra": "^11.2.0"
  }
}
```

4. Update `netlify.toml`:
```toml
[build]
  command = "npm run prebuild"
  publish = "."
```

### Usage

Now you can:

1. **Edit** `includes/header.noscript.html` (single source)
2. **Replace** inline noscript with: `<!-- #include virtual="/includes/header.noscript.html" -->`
3. **Run** `npm run prebuild` locally or let Netlify run it
4. **Deploy** - noscript content auto-injected

## Option 2: Bash Script (Simpler, No Dependencies)

Create `scripts/inject-noscript.sh`:

```bash
#!/bin/bash

# Read the noscript content
NOSCRIPT_CONTENT=$(cat includes/header.noscript.html)

# Escape special characters for sed
NOSCRIPT_ESCAPED=$(echo "$NOSCRIPT_CONTENT" | sed 's/[&/\]/\\&/g')

# Find and process all HTML files
find . -name "*.html" \
  -not -path "./node_modules/*" \
  -not -path "./includes/*" \
  -not -path "./netlify/*" \
  -not -path "./captured-site/*" \
  -exec grep -l "#include virtual=\"/includes/header.noscript.html\"" {} \; | \
while read file; do
  echo "Processing: $file"
  sed -i.bak "s|<!-- #include virtual=\"/includes/header.noscript.html\" -->|$NOSCRIPT_ESCAPED|g" "$file"
  rm "${file}.bak"
done

echo "✓ Build complete"
```

Then in `netlify.toml`:
```toml
[build]
  command = "bash scripts/inject-noscript.sh"
  publish = "."
```

## Option 3: Netlify Snippet Injection (UI-Based)

For very simple cases, you can use Netlify's UI to inject snippets:

1. Go to **Site settings → Build & deploy → Post processing**
2. Add **Snippet injection**
3. Configure injection rules

However, this is **not recommended** for noscript blocks as it's less flexible.

## Comparison

| Method | Pros | Cons | Recommended? |
|--------|------|------|--------------|
| **Node.js Script** | Full control, easy to debug, works locally | Requires Node.js | ✅ **Yes** |
| **Bash Script** | No dependencies, fast | Less portable, harder to debug | ⚠️ Maybe |
| **Edge Functions** | Real-time injection | Complex, slower, overkill | ❌ No |
| **Manual Updates** | No build step | Error-prone, tedious | ❌ No |

## Recommended Implementation Steps

1. Choose **Node.js build script** (Option 1)
2. Update all HTML pages to use `<!-- #include -->` directive
3. Test locally with `npm run prebuild`
4. Commit and deploy to Netlify
5. Netlify automatically runs build script before deploy

## Benefits

✅ Single source of truth maintained
✅ No manual duplication
✅ Works perfectly with Netlify
✅ Fast build times
✅ Easy to debug locally
✅ No runtime overhead
✅ Version control friendly

## Migration Path

To migrate existing pages:

1. Keep `includes/header.noscript.html` as source
2. Replace noscript blocks with:
   ```html
   <noscript>
       <!-- #include virtual="/includes/header.noscript.html" -->
   </noscript>
   ```
3. Run build script
4. Test in browser with JS disabled
5. Deploy to Netlify
