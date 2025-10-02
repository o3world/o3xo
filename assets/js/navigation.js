/**
 * Primary navigation controller for mega menus and mobile toggle
 */
(function() {
    'use strict';

    const DESKTOP_QUERY = '(min-width: 1024px)';

    function initNavigation(detail) {
        const scope = detail && detail.element instanceof Element ? detail.element : document;
        const header = scope.querySelector ? scope.querySelector('[data-site-header]') : null;

        if (!header || header.dataset.navInitialized === 'true') {
            return;
        }

        header.dataset.navInitialized = 'true';

        const mediaQuery = window.matchMedia(DESKTOP_QUERY);
        const navToggle = header.querySelector('[data-nav-toggle]');
        const navPanel = header.querySelector('[data-nav-panel]');
        const menuItems = Array.from(header.querySelectorAll('[data-menu-item]'));
        const menuIcon = navToggle ? navToggle.querySelector('[data-icon="menu"]') : null;
        const closeIcon = navToggle ? navToggle.querySelector('[data-icon="close"]') : null;

        const isDesktop = () => mediaQuery.matches;

        const getPanel = (trigger) => {
            if (!trigger) return null;
            const panelId = trigger.getAttribute('aria-controls');
            if (!panelId) return null;
            return header.querySelector(`#${panelId}`);
        };

        const closeSubmenu = (trigger, panel) => {
            if (!trigger || !panel) return;
            trigger.setAttribute('aria-expanded', 'false');
            panel.classList.add('opacity-0', 'pointer-events-none');
            panel.classList.remove('opacity-100');
            // Rotate chevron back
            const chevron = trigger.querySelector('svg');
            if (chevron) chevron.style.transform = 'rotate(0deg)';
            // Wait for transition then fully hide
            setTimeout(() => {
                if (panel.classList.contains('opacity-0')) {
                    panel.classList.add('invisible');
                }
            }, 200);
        };

        const openSubmenu = (trigger, panel) => {
            if (!trigger || !panel) return;
            closeAllSubmenus(panel);
            trigger.setAttribute('aria-expanded', 'true');
            panel.classList.remove('invisible', 'opacity-0', 'pointer-events-none');
            // Rotate chevron down
            const chevron = trigger.querySelector('svg');
            if (chevron) chevron.style.transform = 'rotate(180deg)';
            // Force reflow then add opacity
            panel.offsetHeight;
            panel.classList.add('opacity-100');
        };

        const closeAllSubmenus = (exceptPanel) => {
            menuItems.forEach((item) => {
                const trigger = item.querySelector('[data-menu-trigger]');
                const panel = getPanel(trigger);
                if (!trigger || !panel) return;
                if (panel !== exceptPanel) {
                    // Only close on desktop, leave open on mobile
                    if (isDesktop()) {
                        closeSubmenu(trigger, panel);
                    }
                }
            });
        };

        const updateToggleIcons = (expanded) => {
            if (!navToggle) return;
            if (menuIcon) menuIcon.classList.toggle('hidden', expanded);
            if (closeIcon) closeIcon.classList.toggle('hidden', !expanded);
        };

        const syncPanelForViewport = () => {
            if (!navPanel) return;
            if (isDesktop()) {
                navPanel.classList.remove('hidden');
                if (navToggle) {
                    navToggle.setAttribute('aria-expanded', 'false');
                    updateToggleIcons(false);
                }
            } else if (!navToggle || navToggle.getAttribute('aria-expanded') !== 'true') {
                navPanel.classList.add('hidden');
            }
        };

        const setMenuVisibility = (expanded) => {
            if (!navPanel || !navToggle) return;
            navToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            updateToggleIcons(expanded);
            if (expanded) {
                navPanel.classList.remove('hidden');
                // Disable body scroll on mobile
                if (!isDesktop()) {
                    document.body.style.overflow = 'hidden';
                    document.body.style.position = 'fixed';
                    document.body.style.width = '100%';
                    document.body.style.top = `-${window.scrollY}px`;

                    // Show all submenu panels on mobile
                    menuItems.forEach((item) => {
                        const panel = item.querySelector('[role="menu"]');
                        if (panel) {
                            panel.classList.remove('invisible', 'opacity-0', 'pointer-events-none');
                            panel.classList.add('opacity-100');
                        }
                    });
                }
            } else {
                // Re-enable body scroll on mobile
                if (!isDesktop()) {
                    const scrollY = document.body.style.top;
                    document.body.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.width = '';
                    document.body.style.top = '';
                    window.scrollTo(0, parseInt(scrollY || '0') * -1);
                }
                navPanel.classList.add('hidden');
            }
            if (!expanded) {
                closeAllSubmenus();
            }
        };

        // Initialise current state
        setMenuVisibility(false);
        syncPanelForViewport();
        closeAllSubmenus();

        if (navToggle && navPanel) {
            navToggle.addEventListener('click', (event) => {
                event.stopPropagation();
                const expanded = navToggle.getAttribute('aria-expanded') === 'true';
                setMenuVisibility(!expanded);
            });
        }

        // Close menu on outside click
        document.addEventListener('click', (event) => {
            if (!header.contains(event.target)) {
                if (navToggle && navToggle.getAttribute('aria-expanded') === 'true') {
                    setMenuVisibility(false);
                }
                closeAllSubmenus();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            const mobileOpen = navToggle && navToggle.getAttribute('aria-expanded') === 'true';
            if (mobileOpen) {
                setMenuVisibility(false);
                navToggle.focus();
                return;
            }
            menuItems.forEach((item) => {
                const trigger = item.querySelector('[data-menu-trigger]');
                const panel = getPanel(trigger);
                if (!trigger || !panel) return;
                if (panel.classList.contains('hidden')) return;
                closeSubmenu(trigger, panel);
                trigger.focus();
            });
        });

        const handleViewportChange = () => {
            setMenuVisibility(false);
            syncPanelForViewport();

            // On desktop, ensure all panels are closed
            // On mobile, panels will be shown when menu is opened
            menuItems.forEach((item) => {
                const trigger = item.querySelector('[data-menu-trigger]');
                const panel = getPanel(trigger);
                if (!trigger || !panel) return;
                if (isDesktop()) {
                    closeSubmenu(trigger, panel);
                } else {
                    // On mobile, hide panels when nav is closed
                    panel.classList.add('invisible', 'opacity-0', 'pointer-events-none');
                    panel.classList.remove('opacity-100');
                }
            });
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleViewportChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleViewportChange);
        }

        menuItems.forEach((item) => {
            const trigger = item.querySelector('[data-menu-trigger]');
            const panel = getPanel(trigger);
            if (!trigger || !panel) {
                return;
            }

            let leaveTimeout;
            let isHovering = false;

            trigger.addEventListener('click', (event) => {
                // Allow buttons to toggle on both desktop and mobile
                event.preventDefault();
                const isOpen = trigger.getAttribute('aria-expanded') === 'true';
                if (isOpen) {
                    closeSubmenu(trigger, panel);
                } else {
                    openSubmenu(trigger, panel);
                    if (!isDesktop()) {
                        panel.scrollIntoView({ block: 'start', behavior: 'smooth' });
                    }
                }
            });

            trigger.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    closeSubmenu(trigger, panel);
                    trigger.blur();
                } else if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openSubmenu(trigger, panel);
                    // Focus first link in panel
                    const firstLink = panel.querySelector('a[role="menuitem"]');
                    if (firstLink) {
                        setTimeout(() => firstLink.focus(), 50);
                    }
                } else if (event.key === 'ArrowRight') {
                    // Move to next menu item
                    const currentIndex = menuItems.indexOf(item);
                    const nextItem = menuItems[currentIndex + 1];
                    if (nextItem) {
                        const nextTrigger = nextItem.querySelector('[data-menu-trigger]');
                        if (nextTrigger) nextTrigger.focus();
                    }
                } else if (event.key === 'ArrowLeft') {
                    // Move to previous menu item
                    const currentIndex = menuItems.indexOf(item);
                    const prevItem = menuItems[currentIndex - 1];
                    if (prevItem) {
                        const prevTrigger = prevItem.querySelector('[data-menu-trigger]');
                        if (prevTrigger) prevTrigger.focus();
                    }
                }
            });

            panel.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    closeSubmenu(trigger, panel);
                    trigger.focus();
                } else if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    // Move to next focusable item in panel
                    const focusables = Array.from(panel.querySelectorAll('a[role="menuitem"]'));
                    const currentIndex = focusables.indexOf(document.activeElement);
                    if (currentIndex < focusables.length - 1) {
                        focusables[currentIndex + 1].focus();
                    }
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    // Move to previous focusable item in panel
                    const focusables = Array.from(panel.querySelectorAll('a[role="menuitem"]'));
                    const currentIndex = focusables.indexOf(document.activeElement);
                    if (currentIndex > 0) {
                        focusables[currentIndex - 1].focus();
                    } else {
                        // If at first item, focus the trigger
                        closeSubmenu(trigger, panel);
                        trigger.focus();
                    }
                }
            });

            const handleMouseEnter = () => {
                if (!isDesktop()) return;
                isHovering = true;
                clearTimeout(leaveTimeout);

                // Open immediately if not already open
                if (trigger.getAttribute('aria-expanded') !== 'true') {
                    openSubmenu(trigger, panel);
                }
            };

            const handleMouseLeave = () => {
                if (!isDesktop()) return;
                isHovering = false;

                // Use a longer delay for more stable behavior - 350ms is a sweet spot
                leaveTimeout = setTimeout(() => {
                    // Double-check: only close if still not hovering
                    if (!isHovering && trigger.getAttribute('aria-expanded') === 'true') {
                        closeSubmenu(trigger, panel);
                    }
                }, 350);
            };

            // Add listeners to the item wrapper (includes button + hover bridge)
            item.addEventListener('mouseenter', handleMouseEnter);
            item.addEventListener('mouseleave', handleMouseLeave);

            // Add listeners to the panel (dropdown content)
            panel.addEventListener('mouseenter', () => {
                if (!isDesktop()) return;
                isHovering = true;
                clearTimeout(leaveTimeout);

                // Ensure panel stays open when entering from the hover bridge
                if (trigger.getAttribute('aria-expanded') !== 'true') {
                    openSubmenu(trigger, panel);
                }
            });

            panel.addEventListener('mouseleave', () => {
                if (!isDesktop()) return;
                isHovering = false;
                handleMouseLeave();
            });

            item.addEventListener('focusout', (event) => {
                if (event.relatedTarget && item.contains(event.relatedTarget)) {
                    return;
                }
                closeSubmenu(trigger, panel);
            });
        });
    }

    const ready = () => initNavigation();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ready);
    } else {
        ready();
    }

    document.addEventListener('component:loaded', (event) => {
        if (event.detail && event.detail.name === 'header') {
            initNavigation(event.detail);
        }
    });
})();
