# O3XO Website

AI strategy & implementation partner website built with Tailwind CSS and vanilla JavaScript.

## Project Structure

```
o3xo/
├── index.html              # Main homepage
├── assets/
│   ├── css/
│   │   ├── styles.css      # Tailwind v4 CSS with Figtree fonts
│   │   ├── main.css        # Core styles and variables
│   │   └── animations.css  # Animation keyframes and transitions
│   ├── js/
│   │   ├── animations.js   # Scroll animation controller (Intersection Observer)
│   │   └── component-loader.js # Component loader for static hosting
│   └── images/
│       ├── yellow-card-bg.png  # Background texture for stat cards
│       └── sticky-cta-bg.png   # Background for sticky CTA banner
└── includes/               # Reusable HTML components
    ├── header.html         # Site header with logo and navigation
    ├── footer.html         # Site footer with links
    └── sticky-cta.html     # Sticky call-to-action banner
```

## Technology Stack

- **HTML5**: Semantic markup with WCAG AA accessibility compliance
- **Tailwind CSS v4**: Utility-first CSS framework via CDN
- **Vanilla JavaScript**: No frameworks, lightweight and performant
- **Figtree Font**: Via Google Fonts for typography
- **Netlify**: Static hosting platform

## Features

### Accessibility
- WCAG AA compliant
- Skip navigation link
- Proper heading hierarchy (H1→H2→H3)
- ARIA labels for interactive elements
- Focus indicators on all interactive elements
- `prefers-reduced-motion` support

### Animations
- **Load animations**: Hero section elements fade in sequentially
- **Scroll animations**: Sections animate as they enter viewport
- **Stagger effects**: Grid items appear one after another
- **Hover effects**: Consistent lift and scale transitions
- **Performance**: Uses Intersection Observer API for efficient scroll detection
- **Accessibility**: Respects `prefers-reduced-motion` user preference

### SEO
- Semantic HTML5 structure
- Meta tags for title, description, Open Graph
- Proper heading hierarchy
- Alt text for images
- Descriptive link text

## Adding New Pages

### 1. Create new HTML file

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title | O3XO</title>
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="assets/css/main.css">
    <link rel="stylesheet" href="assets/css/animations.css">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white text-gray-900">
    <!-- Header placeholder -->
    <div data-component="header"></div>

    <main id="main-content">
        <!-- Your page content here -->
    </main>

    <!-- Footer placeholder -->
    <div data-component="footer"></div>

    <!-- Sticky CTA placeholder (optional) -->
    <div data-component="sticky-cta"></div>

    <!-- Scripts -->
    <script src="assets/js/component-loader.js"></script>
    <script src="assets/js/animations.js"></script>
</body>
</html>
```

### 2. Use shared components

The component loader automatically injects shared HTML:
- `data-component="header"` - Site header with logo
- `data-component="footer"` - Site footer with links
- `data-component="sticky-cta"` - Sticky CTA banner

### 3. Add scroll animations

Add animation classes to elements:

```html
<!-- Fade in on scroll -->
<section class="animate-on-scroll fade-in">
    <h2>Section Title</h2>
</section>

<!-- Slide in from left -->
<div class="animate-on-scroll slide-in-left">
    <p>Content</p>
</div>

<!-- Slide in from right -->
<div class="animate-on-scroll slide-in-right">
    <p>Content</p>
</div>

<!-- Stagger animations in grids -->
<div class="grid grid-cols-3 gap-8">
    <div class="animate-on-scroll fade-in stagger-1">Item 1</div>
    <div class="animate-on-scroll fade-in stagger-2">Item 2</div>
    <div class="animate-on-scroll fade-in stagger-3">Item 3</div>
</div>
```

## CSS Variables

Defined in [assets/css/main.css](assets/css/main.css):

```css
:root {
    --color-yellow: rgb(255, 215, 0);    /* Brand yellow */
    --color-gray-bg: rgb(243, 243, 243); /* Light gray background */
}
```

## Layout Guidelines

- **Max width**: 1280px (7xl) with 24px (px-6) padding
- **Backgrounds**: Can extend full width
- **Responsive**: Mobile-first approach with md: and lg: breakpoints

## Animation Timing

- **Hero load**: 0.1s - 0.8s (title → text → stats)
- **Scroll animations**: 0.5s duration
- **Stagger delays**: 0.05s - 0.3s increments
- **Hover transitions**: 0.3s

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Intersection Observer API required for scroll animations
- Graceful degradation for `prefers-reduced-motion`

## Development

### Local Testing

Open `index.html` directly in browser or use a local server:

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server

# PHP
php -S localhost:8000
```

### Deployment

This site is optimized for Netlify:
1. Connect GitHub repository to Netlify
2. No build command needed (static site)
3. Publish directory: `/` (root)

## Performance Optimization

- **CSS**: Minimal custom CSS, leverages Tailwind utilities
- **JavaScript**: < 100 lines total, vanilla JS only
- **Images**: Compressed PNGs for backgrounds
- **Fonts**: Google Fonts with `font-display: swap`
- **Animations**: CSS-based with Intersection Observer (no animation libraries)

## Accessibility Testing

Passes WCAG AA compliance:
- ✅ Skip navigation link
- ✅ Proper heading hierarchy
- ✅ ARIA labels on interactive elements
- ✅ Focus indicators
- ✅ Keyboard navigation
- ✅ Color contrast ratios
- ✅ Reduced motion support

## License

© 2025 O3 World, LLC. All rights reserved.
