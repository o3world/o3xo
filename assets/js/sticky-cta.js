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

        // Hide CTA initially
        cta.style.transform = 'translateY(100%)';

        // Get CTA height and add padding to body
        const updateBodyPadding = () => {
            // Use getBoundingClientRect for accurate height including borders/padding
            const ctaHeight = cta.getBoundingClientRect().height;
            // Add extra buffer for iOS Safari's dynamic toolbar (44px is typical iOS toolbar height)
            const isMobile = window.innerWidth < 768;
            const iosBuffer = isMobile ? 10 : 0; // Extra 10px buffer on mobile
            const totalHeight = Math.ceil(ctaHeight + iosBuffer);
            document.body.style.paddingBottom = `max(${totalHeight}px, calc(${totalHeight}px + env(safe-area-inset-bottom, 0px)))`;
        };

        // Show/hide CTA based on scroll position
        const showCTA = () => {
            if (hasShown) return;
            hasShown = true;
            isVisible = true;
            cta.style.transform = 'translateY(0)';
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

        // Check if user is near bottom of page
        const checkScrollPosition = () => {
            const footer = document.querySelector('footer');
            if (!footer) {
                return;
            }

            const footerRect = footer.getBoundingClientRect();
            const viewportHeight = window.innerHeight;

            // Hide CTA when footer is visible in viewport (top of footer is in view)
            if (footerRect.top < viewportHeight) {
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
                checkScrollPosition(); // Check immediately after showing
            }
        }, 3000);

        // Update padding on window resize and iOS Safari viewport changes
        let resizeTimer;
        window.addEventListener('resize', () => {
            if (hasShown && isVisible && cta.offsetHeight) {
                // Debounce resize events for iOS Safari toolbar state changes
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    updateBodyPadding();
                }, 100);
            }
        }, { passive: true });

        // Listen for iOS visualViewport changes (iOS Safari dynamic toolbar)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                if (hasShown && isVisible) {
                    updateBodyPadding();
                }
            });
        }

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
