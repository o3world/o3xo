# O3XO Includes Directory

This directory contains reusable HTML components that are loaded dynamically via JavaScript.

## Components

- `header.html` - Main navigation header (loaded via JS)
- `header.noscript.html` - **Source of truth** for no-JS navigation fallback
- `footer.html` - Site footer (loaded via JS)
- `sticky-cta.html` - Sticky call-to-action bar (loaded via JS)

## Important: NoScript Navigation Maintenance

### Current Implementation

The `header.noscript.html` file serves as the **single source of truth** for the no-JavaScript navigation fallback. However, due to the nature of `<noscript>` tags, this content must be **inlined directly** in each HTML page.

### Why Inline?

`<noscript>` blocks are only rendered when JavaScript is disabled. They cannot use JavaScript to dynamically load content (which would defeat their purpose). Therefore, the navigation must be present in the HTML source.

### Maintenance Workflow

When updating navigation:

1. **Edit** `includes/header.noscript.html` (single source of truth)
2. **Copy** the updated content to all `<noscript>` blocks across the site
3. **Test** with JavaScript disabled to verify

### Future Enhancement

Consider implementing a build-time solution:
- Use a static site generator (SSG) like 11ty, Hugo, or Jekyll
- Use server-side includes (SSI) if hosting supports it
- Implement a build script that injects noscript content during deployment

### Files with NoScript Blocks

The following pages contain inline noscript navigation (update when changing navigation):

- `/index.html`
- `/contact/index.html`
- `/about/index.html`
- `/about/approach/index.html`
- All case study pages (`/case-studies/*/index.html`)
- All industry pages (`/industries/*/index.html`)
- `/case-studies/index.html`
- `/industries/index.html`

### Automated Update Script

To update all noscript blocks from the source file, you can use this command:

```bash
# Note: This is a placeholder for a future build script
# Manual updates are required for now
```

## Component Loading

Components are loaded via `assets/js/component-loader.js` which:
- Detects placeholders like `<div data-component="header"></div>`
- Fetches the corresponding include file
- Injects the content into the placeholder
- Handles relative path resolution based on page depth
- Adds cache-busting via asset versioning
