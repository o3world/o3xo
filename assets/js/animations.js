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
        threshold: 0.2,
        rootMargin: '0px 0px -20% 0px'
    };

    // Create observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const animationClass = entry.target.dataset.animation;
                if (animationClass) {
                    entry.target.classList.add(animationClass);
                }
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Observe all elements with animation classes
    const animationClasses = ['fade-in', 'slide-in-left', 'slide-in-right'];

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
        const appliedClass = animationClasses.find(cls => el.classList.contains(cls));

        if (appliedClass) {
            el.dataset.animation = appliedClass;
            el.classList.remove(appliedClass);
        }

        observer.observe(el);
    });
})();
