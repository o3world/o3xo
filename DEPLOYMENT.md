# Deployment Guide

## ✅ Build Process Setup Complete

Your site now uses an automated build process that maintains a single source of truth for no-JavaScript navigation while remaining **100% Netlify free tier compatible**.

## Quick Start

### Local Development
```bash
# Run the build process (includes noscript injection)
npm run build

# Or run just the noscript injection
npm run inject:noscript

# Development mode (CSS watch)
npm run dev
```

### Netlify Deployment

Netlify is already configured via `netlify.toml` to run the build automatically on every deploy:

```toml
[build]
  command = "npm run build"
  publish = "."
```

Every time you push to your repository, Netlify will:
1. Run `npm run build`
2. Execute `inject:noscript` (replaces include directives)
3. Build CSS and JavaScript
4. Deploy the processed files

## How It Works

### 1. Source of Truth
- **File**: `includes/header.noscript.html`
- **Size**: 5,349 bytes
- **Purpose**: Single source for all no-JS navigation

### 2. HTML Pages Use Directives
All HTML pages now contain:
```html
<noscript>
    <!-- #include virtual="/includes/header.noscript.html" -->
</noscript>
```

### 3. Build Script Replaces Directives
During `npm run build`, the script:
- Reads `includes/header.noscript.html`
- Finds all pages with `<!-- #include -->` directive
- Replaces directive with actual content
- Writes processed HTML files

### 4. Result
Final HTML has full navigation embedded:
```html
<noscript>
    <!-- Static header fallback for no-JS environments -->
    <a href="#main-content" class="sr-only ...">Skip to main content</a>
    <div class="fixed top-0 left-0 right-0 z-50 bg-black">
        <!-- ...full navigation... -->
    </div>
</noscript>
```

## Current Status

✅ **11 files processed**:
- index.html
- contact/index.html
- about/index.html
- case-studies/index.html
- All 7 case study detail pages

✅ **Build scripts created**:
- `scripts/inject-noscript.js` - Main injection script
- `scripts/replace-noscript-blocks.sh` - One-time migration (already run)

✅ **Configuration updated**:
- `package.json` - Added `inject:noscript` and updated `build` command
- `netlify.toml` - Set build command to `npm run build`

✅ **Documentation created**:
- `NOSCRIPT_SETUP.md` - Detailed setup and maintenance guide
- `BUILD_PROCESS.md` - Technical implementation details
- `DEPLOYMENT.md` - This file
- `includes/README.md` - Include directory documentation

## Updating Navigation

### To change the navigation menu:

1. **Edit** the source file:
   ```bash
   vim includes/header.noscript.html
   ```

2. **Run** the build locally (optional but recommended):
   ```bash
   npm run inject:noscript
   ```

3. **Commit** your changes:
   ```bash
   git add includes/header.noscript.html
   git add **/*.html  # Optional: commit generated files
   git commit -m "Update navigation structure"
   ```

4. **Push** to deploy:
   ```bash
   git push
   ```

5. **Netlify** automatically:
   - Runs `npm run build`
   - Injects noscript content
   - Builds CSS/JS
   - Deploys

## Benefits

✅ **Free** - Works on Netlify free tier
✅ **Fast** - Build-time processing, zero runtime overhead
✅ **Simple** - Standard Node.js, easy to debug
✅ **Reliable** - Static files, no dynamic dependencies
✅ **SEO-friendly** - Pre-rendered HTML
✅ **Accessible** - Works with JavaScript disabled
✅ **Maintainable** - Single source of truth
✅ **Version controlled** - All changes tracked in Git

## Troubleshooting

### Build fails on Netlify

Check Netlify build logs for errors:
1. Go to Netlify dashboard
2. Click on failed deploy
3. View build log
4. Look for errors in `npm run inject:noscript`

### Navigation not updating

Make sure you:
1. Edited `includes/header.noscript.html` (not individual HTML files)
2. Committed and pushed changes
3. Netlify build succeeded

### Local testing

Test with JavaScript disabled:
1. Open DevTools (F12)
2. Settings → Debugger → Disable JavaScript
3. Reload page
4. Navigation should still work

## Files Reference

```
o3xo/
├── includes/
│   ├── header.noscript.html    # ← Edit this to update navigation
│   ├── header.html              # JS-enabled navigation
│   ├── footer.html
│   ├── sticky-cta.html
│   └── README.md
├── scripts/
│   ├── inject-noscript.js       # Build-time injection
│   └── replace-noscript-blocks.sh  # Migration script (one-time)
├── netlify.toml                 # Netlify configuration
├── package.json                 # npm scripts
├── NOSCRIPT_SETUP.md           # Setup guide
├── BUILD_PROCESS.md            # Technical details
└── DEPLOYMENT.md               # This file
```

## Cost Summary

| Item | Cost |
|------|------|
| Netlify Hosting | $0/month (free tier) |
| Build Minutes | Included in free tier |
| Bandwidth | 100GB/month included |
| Edge Functions | **Not used** (would be $25/month) |
| **Total** | **$0/month** |

## Next Steps

1. **Test locally**: Run `npm run build` and verify
2. **Commit changes**: Push to trigger Netlify deploy
3. **Monitor**: Check Netlify dashboard for successful build
4. **Verify**: Test site with JS disabled

## Support

For issues:
1. Check build logs in Netlify dashboard
2. Run locally: `npm run inject:noscript`
3. Review `NOSCRIPT_SETUP.md` for troubleshooting
4. Check `scripts/inject-noscript.js` output

---

**Status**: ✅ Production Ready
**Last Updated**: 2025-10-02
**Netlify Compatible**: Yes (Free Tier)
