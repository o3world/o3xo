/**
 * Sticky CTA Controller
 * Handles sticky CTA visibility, dismiss, and mobile menu interaction
 */
(function() {
    'use strict';

    function initStickyCTA() {
        const cta = document.querySelector('[data-sticky-cta]');
        const dismissBtn = document.querySelector('[data-dismiss-cta]');

        if (!cta || !dismissBtn) {
            return;
        }

        // Check if user has dismissed the CTA in this session
        const isDismissed = sessionStorage.getItem('ctaDismissed') === 'true';
        if (isDismissed) {
            cta.remove();
            return;
        }

        let hasShown = false;
        let isVisible = false;

        // Get CTA height and add padding to body
        const updateBodyPadding = () => {
            const ctaHeight = cta.offsetHeight;
            document.body.style.paddingBottom = `${ctaHeight}px`;
        };

        // Show/hide CTA based on scroll position
        const showCTA = () => {
            if (hasShown) return;
            hasShown = true;
            isVisible = true;
            updateBodyPadding();
        };

        const hideCTA = () => {
            if (!isVisible) return;
            isVisible = false;
            cta.style.transform = 'translateY(100%)';
            document.body.style.paddingBottom = '0';
        };

        const revealCTA = () => {
            if (isVisible) return;
            isVisible = true;
            cta.style.transform = 'translateY(0)';
            updateBodyPadding();
        };

        // Check if user is near bottom of page (within 200px of footer)
        const checkScrollPosition = () => {
            const scrollPosition = window.scrollY + window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const distanceFromBottom = documentHeight - scrollPosition;

            // Hide CTA when within 200px of bottom to reveal footer
            if (distanceFromBottom < 200) {
                hideCTA();
            } else if (hasShown) {
                revealCTA();
            }
        };

        // Initial show trigger
        const handleInitialScroll = () => {
            if (window.scrollY > 300) {
                showCTA();
                window.removeEventListener('scroll', handleInitialScroll);
                window.addEventListener('scroll', checkScrollPosition, { passive: true });
                checkScrollPosition(); // Check immediately after showing
            }
        };

        window.addEventListener('scroll', handleInitialScroll, { passive: true });

        // Also show after 3 seconds if not already shown
        setTimeout(() => {
            if (!hasShown) {
                showCTA();
                window.removeEventListener('scroll', handleInitialScroll);
                window.addEventListener('scroll', checkScrollPosition, { passive: true });
            }
        }, 3000);

        // Update padding on window resize
        window.addEventListener('resize', () => {
            if (hasShown && isVisible && cta.offsetHeight) {
                updateBodyPadding();
            }
        }, { passive: true });

        // Dismiss functionality
        dismissBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cta.style.transform = 'translateY(100%)';
            sessionStorage.setItem('ctaDismissed', 'true');
            setTimeout(() => {
                document.body.style.paddingBottom = '0';
                cta.remove();
                window.removeEventListener('scroll', checkScrollPosition);
            }, 500);
        });

        // Hide sticky CTA when mobile menu is open
        const navToggle = document.querySelector('[data-nav-toggle]');
        const navPanel = document.querySelector('[data-nav-panel]');

        if (navToggle && navPanel) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'aria-expanded') {
                        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
                        if (isExpanded && isVisible) {
                            cta.style.transform = 'translateY(100%)';
                        } else if (!isExpanded && hasShown) {
                            // Check if we're near footer before revealing
                            checkScrollPosition();
                        }
                    }
                });
            });

            observer.observe(navToggle, { attributes: true });
        }
    }

    // Initialize when component loads
    document.addEventListener('component:loaded', (e) => {
        if (e.detail && e.detail.name === 'sticky-cta') {
            initStickyCTA();
        }
    });

    // Fallback: also try to initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(initStickyCTA, 100);
        });
    } else {
        setTimeout(initStickyCTA, 100);
    }
})();
