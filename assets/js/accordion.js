/**
 * Accordion Component
 * Handles expandable/collapsible FAQ sections
 */
(function() {
    'use strict';

    function initAccordion() {
        const accordion = document.querySelector('[data-accordion]');
        if (!accordion) return;

        const items = accordion.querySelectorAll('[data-accordion-item]');

        items.forEach(item => {
            const trigger = item.querySelector('[data-accordion-trigger]');
            const content = item.querySelector('[data-accordion-content]');
            const chevron = trigger.querySelector('svg:last-child');

            if (!trigger || !content) return;

            // Ensure all items start closed
            content.style.maxHeight = '0px';
            if (chevron) {
                chevron.style.transform = 'rotate(0deg)';
            }

            trigger.addEventListener('click', () => {
                const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';

                // Close all items
                items.forEach(otherItem => {
                    const otherContent = otherItem.querySelector('[data-accordion-content]');
                    const otherChevron = otherItem.querySelector('[data-accordion-trigger] svg:last-child');
                    if (otherContent) {
                        otherContent.style.maxHeight = '0px';
                    }
                    if (otherChevron) {
                        otherChevron.style.transform = 'rotate(0deg)';
                    }
                });

                // Toggle current item
                if (!isOpen) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    if (chevron) {
                        chevron.style.transform = 'rotate(180deg)';
                    }
                }
            });
        });
    }

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccordion);
    } else {
        initAccordion();
    }
})();
