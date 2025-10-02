# NoScript Navigation Setup for Netlify

## ✅ Free Tier Compatible Build-Time Solution

This project uses a **build-time injection script** to maintain a single source of truth for no-JavaScript navigation. This approach:

- ✅ Works on **Netlify free tier**
- ✅ No runtime overhead
- ✅ Fast build times
- ✅ Single source of truth
- ✅ Easy to maintain

## How It Works

1. **Source of Truth**: `includes/header.noscript.html`
2. **HTML Pages**: Use `<!-- #include virtual="/includes/header.noscript.html" -->` directive
3. **Build Script**: `scripts/inject-noscript.js` replaces directives with actual content
4. **Netlify**: Runs `npm run build` which includes injection step

## Setup Instructions

### 1. Update Your HTML Pages

Replace inline noscript blocks with the include directive:

**Before:**
```html
<noscript>
    <!-- Static header fallback for no-JS environments -->
    <a href="#main-content" class="sr-only ...">Skip to main content</a>
    <div class="fixed top-0 left-0 right-0 z-50 bg-black">
        <!-- ...full navigation markup... -->
    </div>
</noscript>
```

**After:**
```html
<noscript>
    <!-- #include virtual="/includes/header.noscript.html" -->
</noscript>
```

### 2. Local Testing

Test the build script locally:

```bash
# Run injection script
npm run inject:noscript

# Or run full build (includes CSS and JS)
npm run build
```

The script will:
- Find all HTML files with the include directive
- Replace with content from `includes/header.noscript.html`
- Report what was processed

### 3. Verify Output

After running the script:

1. Open any processed HTML file
2. The `<!-- #include -->` comment should be replaced with full navigation
3. Test in browser with JavaScript disabled (DevTools → Disable JavaScript)

### 4. Deploy to Netlify

Netlify will automatically run `npm run build` on every deploy:

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "."
```

## Maintenance Workflow

### To Update Navigation:

1. **Edit**: `includes/header.noscript.html`
2. **Commit**: Push changes to Git
3. **Deploy**: Netlify auto-runs build script
4. **Done**: All pages updated automatically

### Before Committing:

**IMPORTANT**: Run `git add -p` to review changes carefully.

The build script modifies HTML files in place. When you edit `includes/header.noscript.html`, you'll see changes in **two types of files**:

1. ✅ **Source file**: `includes/header.noscript.html` - COMMIT THIS
2. ⚠️ **Generated files**: All HTML pages - OPTIONAL TO COMMIT

**Two valid approaches:**

#### Option A: Commit Generated Files (Recommended)
```bash
npm run inject:noscript
git add includes/header.noscript.html
git add **/*.html  # Commit updated HTML files
git commit -m "Update navigation structure"
git push
```

**Pros**:
- Netlify build faster (no injection needed)
- Easier to diff and review
- Works if Netlify build fails

#### Option B: Don't Commit Generated Files
```bash
git add includes/header.noscript.html
# Don't add HTML files
git commit -m "Update navigation structure"
git push
```

**Pros**:
- Cleaner git history
- Smaller diffs

**Cons**:
- Must run on every Netlify build
- If build script fails, navigation breaks

## Files

```
o3xo/
├── includes/
│   ├── header.noscript.html      # ← SOURCE OF TRUTH (edit this)
│   ├── header.html                # JS navigation
│   ├── footer.html
│   ├── sticky-cta.html
│   └── README.md
├── scripts/
│   └── inject-noscript.js         # Build-time injection
├── netlify.toml                   # Netlify config
├── package.json                   # npm scripts
└── NOSCRIPT_SETUP.md             # This file
```

## Build Script Details

### What It Does:

```javascript
// 1. Read source
const noscriptContent = fs.readFileSync('includes/header.noscript.html', 'utf8');

// 2. Find all HTML files with directive
const includePattern = /<!-- #include virtual="\/includes\/header\.noscript\.html" -->/g;

// 3. Replace directive with actual content
content = content.replace(includePattern, noscriptContent);

// 4. Write back to file
fs.writeFileSync(file, content, 'utf8');
```

### Running Manually:

```bash
# Just inject noscript
npm run inject:noscript

# Full build (inject + CSS + JS)
npm run build

# Development mode (CSS watch)
npm run dev
```

## Troubleshooting

### Script Reports "No files found"

Make sure HTML files contain the exact directive:
```html
<!-- #include virtual="/includes/header.noscript.html" -->
```

### Navigation Not Updating on Netlify

1. Check Netlify build logs for errors
2. Verify `netlify.toml` has correct build command
3. Ensure `scripts/inject-noscript.js` is committed

### JavaScript Version Still Showing

This is normal! With JS enabled, you should see the full interactive navigation. The noscript version only shows when JavaScript is disabled.

To test:
1. Open DevTools
2. Settings → Debugger → Disable JavaScript
3. Reload page
4. Should see simplified navigation

## Why This Approach?

| Approach | Free Tier? | Build Time | Runtime | Maintenance |
|----------|-----------|------------|---------|-------------|
| **Build Script** | ✅ Yes | Fast | None | Easy |
| Edge Functions | ❌ No | N/A | Slow | Medium |
| Manual Updates | ✅ Yes | None | None | Hard |
| SSI | ⚠️ Maybe | N/A | Fast | Easy |

The build script is the best option for Netlify free tier.

## Support

For issues or questions:
1. Check Netlify build logs
2. Run locally: `npm run inject:noscript`
3. Review `scripts/inject-noscript.js` output

## License

Same as main project.
