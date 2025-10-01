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
            panel.classList.add('hidden');
        };

        const openSubmenu = (trigger, panel) => {
            if (!trigger || !panel) return;
            closeAllSubmenus(panel);
            trigger.setAttribute('aria-expanded', 'true');
            panel.classList.remove('hidden');
        };

        const closeAllSubmenus = (exceptPanel) => {
            menuItems.forEach((item) => {
                const trigger = item.querySelector('[data-menu-trigger]');
                const panel = getPanel(trigger);
                if (!trigger || !panel) return;
                if (panel !== exceptPanel) {
                    closeSubmenu(trigger, panel);
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
            } else if (!isDesktop()) {
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
                }
            });

            panel.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    closeSubmenu(trigger, panel);
                    trigger.focus();
                }
            });

            item.addEventListener('mouseenter', () => {
                if (!isDesktop()) return;
                openSubmenu(trigger, panel);
            });

            item.addEventListener('mouseleave', () => {
                if (!isDesktop()) return;
                closeSubmenu(trigger, panel);
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
