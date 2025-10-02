# Build Instructions

This project uses Tailwind CSS v3 and Terser for production builds.

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

```bash
npm install
```

## Development

Watch for Tailwind CSS changes and rebuild automatically:

```bash
npm run dev
```

This will watch for changes in HTML and JS files and rebuild `assets/css/tailwind.css` automatically.

## Production Build

Build minified CSS and JS for production:

```bash
npm run build
```

This command:
1. Compiles and minifies Tailwind CSS → `assets/css/tailwind.css`
2. Minifies and bundles JavaScript → `assets/js/bundle.min.js`

### Individual build commands:

```bash
# Build CSS only
npm run build:css

# Build JS only
npm run build:js
```

## File Structure

- **Source files:**
  - `assets/css/tailwind-source.css` - Tailwind directives (source)
  - `assets/js/component-loader.js` - Component loading system
  - `assets/js/navigation.js` - Navigation and mobile menu
  - `assets/js/sticky-cta.js` - Sticky CTA behavior
  - `assets/js/animations.js` - Scroll animations

- **Built files (committed to git):**
  - `assets/css/tailwind.css` - Compiled and minified Tailwind CSS
  - `assets/js/bundle.min.js` - Minified and bundled JavaScript (optional)

## Deployment

The compiled `assets/css/tailwind.css` file should be committed to the repository so the site works immediately on static hosting (Netlify, etc.) without requiring a build step.

All HTML files reference the compiled CSS file:
```html
<link rel="stylesheet" href="assets/css/tailwind.css">
```

## Notes

- The project has been migrated from Tailwind CDN to compiled CSS for production use
- JavaScript files can be used individually or as a minified bundle (`bundle.min.js`)
- Currently using individual JS files for easier debugging
