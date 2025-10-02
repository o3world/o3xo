/**
 * Lazy Loading for Background Images
 * Uses Intersection Observer to load background images when they enter viewport
 */

(function() {
    'use strict';

    // Check if Intersection Observer is supported
    if (!('IntersectionObserver' in window)) {
        // Fallback: load all backgrounds immediately
        document.querySelectorAll('[data-bg]').forEach(function(element) {
            element.style.backgroundImage = 'url(' + element.getAttribute('data-bg') + ')';
        });
        return;
    }

    // Configuration
    const config = {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01
    };

    // Create observer
    const imageObserver = new IntersectionObserver(function(entries, observer) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                const element = entry.target;
                const bgUrl = element.getAttribute('data-bg');
                const bgOverlay = element.getAttribute('data-bg-overlay');

                if (bgUrl) {
                    // Preload the image
                    const img = new Image();
                    img.onload = function() {
                        // Apply background image once loaded
                        if (bgOverlay) {
                            // Combine overlay gradient with image
                            element.style.background = bgOverlay + ', url(' + bgUrl + ')';
                            element.style.backgroundSize = 'cover';
                        } else {
                            element.style.backgroundImage = 'url(' + bgUrl + ')';
                        }
                        element.classList.add('bg-loaded');
                    };
                    img.src = bgUrl;

                    // Stop observing this element
                    observer.unobserve(element);
                }
            }
        });
    }, config);

    // Observe all elements with data-bg attribute
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('[data-bg]').forEach(function(element) {
            imageObserver.observe(element);
        });
    });
})();
