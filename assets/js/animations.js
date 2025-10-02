/**
 * Premium Micro-Animations & Scroll Effects
 * Respects user motion preferences and provides smooth, accessible interactions
 */
(function() {
    'use strict';

    // Respect user motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /**
     * 1. PAGE LOAD SEQUENCE
     * Staggered fade-in animation for hero elements
     */
    if (!prefersReducedMotion) {
        window.addEventListener('DOMContentLoaded', () => {
            const header = document.querySelector('[data-site-header]');
            const heroElements = document.querySelectorAll('[data-hero-animate]');

            // Header fade in immediately
            if (header) {
                header.style.opacity = '0';
                header.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                    header.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                    header.style.opacity = '1';
                    header.style.transform = 'translateY(0)';
                }, 100);
            }

            // Stagger hero elements
            heroElements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, 200 + (index * 150));
            });
        });
    }

    /**
     * 2. SCROLL ANIMATIONS
     * Intersection Observer for scroll-triggered animations
     */
    if (!prefersReducedMotion) {
        const observerOptions = {
            threshold: 0.15,
            rootMargin: '0px 0px -10% 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const animationClass = entry.target.dataset.animation;
                    if (animationClass) {
                        entry.target.classList.add(animationClass);
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Animation classes to observe
        const animationClasses = ['fade-in', 'slide-in-left', 'slide-in-right', 'slide-in-up', 'scale-in'];

        document.querySelectorAll('.animate-on-scroll').forEach((el) => {
            const appliedClass = animationClasses.find(cls => el.classList.contains(cls));

            if (appliedClass) {
                el.dataset.animation = appliedClass;
                el.classList.remove(appliedClass);
            }

            observer.observe(el);
        });

        // Stagger children animation
        document.querySelectorAll('[data-stagger-children]').forEach(container => {
            const children = container.children;
            Array.from(children).forEach((child, index) => {
                child.style.opacity = '0';
                child.style.transform = 'translateY(20px)';

                const childObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            setTimeout(() => {
                                child.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                                child.style.opacity = '1';
                                child.style.transform = 'translateY(0)';
                            }, index * 100);
                            childObserver.unobserve(child);
                        }
                    });
                }, observerOptions);

                childObserver.observe(child);
            });
        });
    }

    /**
     * 3. HOVER LIFT EFFECT
     * Adds subtle lift to interactive cards
     */
    document.querySelectorAll('.hover-lift').forEach(card => {
        card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';

        card.addEventListener('mouseenter', () => {
            if (!prefersReducedMotion) {
                card.style.transform = 'translateY(-4px)';
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

    /**
     * 4. MAGNETIC BUTTONS
     * Subtle magnetic pull effect on hover
     */
    if (!prefersReducedMotion) {
        document.querySelectorAll('[data-magnetic]').forEach(button => {
            const rect = button.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            button.addEventListener('mousemove', (e) => {
                const deltaX = (e.clientX - centerX) * 0.15;
                const deltaY = (e.clientY - centerY) * 0.15;
                button.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            });

            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translate(0, 0)';
            });
        });
    }

    /**
     * 5. SMOOTH SCROLL
     * Enhanced smooth scrolling for anchor links
     */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#main-content') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    /**
     * 6. PARALLAX EFFECT
     * Subtle parallax for hero sections
     */
    if (!prefersReducedMotion) {
        const parallaxElements = document.querySelectorAll('[data-parallax]');

        if (parallaxElements.length > 0) {
            let ticking = false;

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    window.requestAnimationFrame(() => {
                        const scrolled = window.pageYOffset;

                        parallaxElements.forEach(el => {
                            const speed = el.dataset.parallax || 0.5;
                            el.style.transform = `translateY(${scrolled * speed}px)`;
                        });

                        ticking = false;
                    });

                    ticking = true;
                }
            });
        }
    }

    /**
     * 7. NUMBER COUNTER ANIMATION
     * Animates numbers counting up when visible
     */
    if (!prefersReducedMotion) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseFloat(counter.dataset.count);
                    const duration = 2000;
                    const step = target / (duration / 16);
                    let current = 0;

                    const updateCounter = () => {
                        current += step;
                        if (current < target) {
                            counter.textContent = Math.floor(current).toLocaleString();
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.textContent = counter.dataset.countSuffix
                                ? target.toLocaleString() + counter.dataset.countSuffix
                                : target.toLocaleString();
                        }
                    };

                    updateCounter();
                    counterObserver.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('[data-count]').forEach(counter => {
            counterObserver.observe(counter);
        });
    }

    /**
     * 8. GRADIENT ANIMATION
     * Subtle animated gradient backgrounds
     */
    if (!prefersReducedMotion) {
        document.querySelectorAll('[data-animated-gradient]').forEach(el => {
            el.style.backgroundSize = '200% 200%';
            el.style.animation = 'gradientShift 15s ease infinite';
        });
    }

    /**
     * 9. TYPING EFFECT (Optional)
     * Typewriter effect for hero text
     */
    function typeWriter(element, text, speed = 50) {
        if (prefersReducedMotion) {
            element.textContent = text;
            return;
        }

        let i = 0;
        element.textContent = '';

        function type() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }

        type();
    }

    // Expose for manual use
    window.O3XO = window.O3XO || {};
    window.O3XO.typeWriter = typeWriter;

})();
