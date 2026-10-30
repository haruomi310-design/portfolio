    const customCursor = document.querySelector('.custom-cursor');
    const hoverTargets = document.querySelectorAll('a, button, [role="button"]');

    if (customCursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.addEventListener('pointermove', (event) => {
            customCursor.style.left = `${event.clientX}px`;
            customCursor.style.top = `${event.clientY}px`;
            customCursor.classList.remove('is-hidden');
        });

        document.addEventListener('pointerleave', () => {
            customCursor.classList.add('is-hidden');
        });

        hoverTargets.forEach((target) => {
            target.addEventListener('pointerenter', () => {
                customCursor.classList.add('is-hovering');
            });
            target.addEventListener('pointerleave', () => {
                customCursor.classList.remove('is-hovering');
            });
        });
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        customCursor?.remove();
    }

    const revealTargets = document.querySelectorAll('.reveal');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealTargets.forEach((target) => target.classList.add('is-visible'));
    } else if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;

                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -8%'
        });

        revealTargets.forEach((target) => revealObserver.observe(target));
    } else {
        revealTargets.forEach((target) => target.classList.add('is-visible'));
    }