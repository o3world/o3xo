/**
 * Component loader for static hosting (Netlify)
 * Loads reusable HTML components into the page
 */
(function() {
    'use strict';

    /**
     * Calculates the relative path prefix based on current page depth
     * @returns {string} Relative path prefix (e.g., '', '../', '../../')
     */
    function getRelativePrefix() {
        const path = window.location.pathname;
        const cleanPath = path.replace(/\/(index\.html)?$/, '');
        const segments = cleanPath.split('/').filter(seg => seg.length > 0);

        if (segments.length === 0) {
            return '';
        }

        return '../'.repeat(segments.length);
    }

    /**
     * Determines the correct path to includes directory based on current page location
     * @returns {string} Path to includes directory
     */
    function getIncludesPath() {
        return getRelativePrefix() + 'includes/';
    }

    /**
     * Loads an HTML component and inserts it into the target element
     * @param {string} componentPath - Path to the HTML component file
     * @param {string} targetSelector - CSS selector for the target element
     */
    function loadComponent(componentPath, targetSelector) {
        const target = document.querySelector(targetSelector);
        if (!target) {
            console.warn(`Target element not found: ${targetSelector}`);
            return;
        }

        fetch(componentPath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.text();
            })
            .then(html => {
                // Replace root-absolute asset paths with relative paths
                const relativePrefix = getRelativePrefix();
                const processedHtml = html.replace(/url\(['"]?\/assets\//g, `url('${relativePrefix}assets/`);
                target.innerHTML = processedHtml;
            })
            .catch(error => {
                console.error(`Error loading component ${componentPath}:`, error);
            });
    }

    // Load components when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initComponents);
    } else {
        initComponents();
    }

    function initComponents() {
        const includesPath = getIncludesPath();

        // Load header if header placeholder exists
        if (document.querySelector('[data-component="header"]')) {
            loadComponent(includesPath + 'header.html', '[data-component="header"]');
        }

        // Load footer if footer placeholder exists
        if (document.querySelector('[data-component="footer"]')) {
            loadComponent(includesPath + 'footer.html', '[data-component="footer"]');
        }

        // Load sticky CTA if placeholder exists
        if (document.querySelector('[data-component="sticky-cta"]')) {
            loadComponent(includesPath + 'sticky-cta.html', '[data-component="sticky-cta"]');
        }
    }
})();
