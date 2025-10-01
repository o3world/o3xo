/**
 * Scroll animation controller using Intersection Observer
 * Triggers animations when elements enter the viewport
 */
(function() {
    'use strict';

    // Respect user motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Intersection Observer configuration
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    // Create observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add(entry.target.dataset.animation);
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Observe all elements with animation classes
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
        // Store the animation type
        if (el.classList.contains('fade-in')) {
            el.dataset.animation = 'fade-in';
        } else if (el.classList.contains('slide-in-left')) {
            el.dataset.animation = 'slide-in-left';
        } else if (el.classList.contains('slide-in-right')) {
            el.dataset.animation = 'slide-in-right';
        }

        observer.observe(el);
    });
})();
