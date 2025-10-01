/**
 * Component loader for static hosting (Netlify)
 * Loads reusable HTML components into the page
 */
(function() {
    'use strict';

    /**
     * Determines the correct path to includes directory based on current page location
     * @returns {string} Path to includes directory
     */
    function getIncludesPath() {
        const path = window.location.pathname;
        // If we're in a subdirectory (e.g., /about/, /contact/), use relative path
        if (path !== '/' && path !== '/index.html' && path.includes('/')) {
            return '../includes/';
        }
        // Otherwise we're at root
        return 'includes/';
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
                target.innerHTML = html;
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
