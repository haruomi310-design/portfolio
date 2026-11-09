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

    const splitRevealText = (target) => {
        const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
        const textNodes = [];

        while (walker.nextNode()) {
            const textNode = walker.currentNode;
            const parent = textNode.parentElement;

            if (
                !textNode.textContent.trim()
                || parent.closest('.reveal') !== target
                || parent.closest('.reveal-char, [aria-hidden="true"], script, style')
            ) {
                continue;
            }

            textNodes.push(textNode);
        }

        const segmenter = 'Segmenter' in Intl
            ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
            : null;

        textNodes.forEach((textNode) => {
            const fragment = document.createDocumentFragment();
            const characters = segmenter
                ? Array.from(segmenter.segment(textNode.textContent), ({ segment }) => segment)
                : Array.from(textNode.textContent);
            let characterIndex = 0;

            characters.forEach((character) => {
                if (/^\s+$/u.test(character)) {
                    fragment.append(document.createTextNode(character));
                    return;
                }

                const characterSpan = document.createElement('span');
                characterSpan.className = 'reveal-char';
                characterSpan.style.setProperty('--reveal-char-index', characterIndex);
                characterSpan.textContent = character;
                fragment.append(characterSpan);
                characterIndex += 1;
            });

            textNode.replaceWith(fragment);
        });
    };

    revealTargets.forEach(splitRevealText);

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
            // 下端を縮めると、要素が画面のより上まで来てから表示判定されます。
            // %の値を調整して、revealの再生開始位置を変更できます。
            rootMargin: '0px 0px -6%'
        });

        revealTargets.forEach((target) => revealObserver.observe(target));
    } else {
        revealTargets.forEach((target) => target.classList.add('is-visible'));
    }

    const heroTitle = document.querySelector('.better-notch-title');
    const hero = document.querySelector('.better-notch-hero');

    if (heroTitle && hero) {
        const headerTop = 14;
        const compactFontSize = 50;
        let heroTop;
        let heroBottom;
        let titleBottomOffset;
        let initialFontSize;
        let frameRequested = false;

        const measureHero = () => {
            const inlineStyles = heroTitle.getAttribute('style');
            heroTitle.removeAttribute('style');
            const heroRect = hero.getBoundingClientRect();
            const titleRect = heroTitle.getBoundingClientRect();

            heroTop = heroRect.top + window.scrollY;
            heroBottom = heroRect.bottom + window.scrollY;
            titleBottomOffset = heroBottom - titleRect.bottom - window.scrollY;
            initialFontSize = parseFloat(getComputedStyle(heroTitle).fontSize);

            // 一時的に外したインラインスタイルを戻して、表示位置を保つ。
            if (inlineStyles !== null) heroTitle.setAttribute('style', inlineStyles);
        };

        measureHero();
        heroTitle.style.position = 'fixed';
        heroTitle.style.zIndex = '10';
        heroTitle.style.left = `${hero.getBoundingClientRect().left}px`;
        heroTitle.style.transformOrigin = 'left bottom';
        heroTitle.style.mixBlendMode = 'normal';
        heroTitle.style.marginBottom = '0';
        heroTitle.style.willChange = 'top, font-size, color';
        document.body.classList.add('better-notch-title-ready');

        const updateHeroTitle = () => {
            const currentHeroBottom = heroBottom - window.scrollY;
            // タイトル上端が画面上端に届くまでは動かさず、届いてから変形を始める。
            const transitionStart = Math.max(heroTop, heroBottom - initialFontSize - titleBottomOffset);
            const progressDistance = Math.max(1, heroBottom - transitionStart);
            const progress = Math.min(1, Math.max(0, (window.scrollY - transitionStart) / progressDistance));
            const fontSize = initialFontSize + (compactFontSize - initialFontSize) * progress;
            const naturalTop = currentHeroBottom - fontSize - titleBottomOffset;
            // ヒーローを抜ける間に、タイトルを固定ヘッダーの位置へなめらかにつなぐ。
            const top = naturalTop * (1 - progress) + headerTop * progress;
            const colorChannel = Math.round(255 - 238 * progress);

            heroTitle.style.top = `${top}px`;
            heroTitle.style.fontSize = `${fontSize}px`;
            heroTitle.style.letterSpacing = `${-0.06 + 0.04 * progress}em`;
            heroTitle.style.color = `rgb(${colorChannel}, ${colorChannel}, ${colorChannel})`;
            document.body.style.setProperty('--hero-header-progress', progress.toString());
            document.body.classList.toggle('better-notch-header-active', progress > 0);
            frameRequested = false;
        };

        const requestHeroTitleUpdate = () => {
            if (frameRequested) return;
            frameRequested = true;
            // スクロール中の連続更新を1フレームにまとめる。
            window.requestAnimationFrame(updateHeroTitle);
        };

        const requestHeroTitleLayoutUpdate = () => {
            if (frameRequested) return;
            frameRequested = true;
            window.requestAnimationFrame(() => {
                measureHero();
                heroTitle.style.left = `${hero.getBoundingClientRect().left}px`;
                updateHeroTitle();
            });
        };

        updateHeroTitle();
        window.addEventListener('scroll', requestHeroTitleUpdate, { passive: true });
        window.addEventListener('resize', requestHeroTitleLayoutUpdate);
    }

    const homeTitle = document.querySelector('.hero-name .hrr');
    const homeHero = document.querySelector('.pararax_frame');
    const homeNav = document.querySelector('.home-header-nav');

    if (homeTitle && homeHero && homeNav) {
        const homeTitleDuration = 1000;
        let initialFontSize;
        let prefixSpace;
        let titleLeft;
        let homeTitleAnimation;

        const measureHomeTitle = () => {
            const inlineStyles = homeTitle.getAttribute('style');
            homeTitle.removeAttribute('style');

            initialFontSize = parseFloat(getComputedStyle(homeTitle).fontSize);

            if (inlineStyles !== null) homeTitle.setAttribute('style', inlineStyles);
        };

        document.body.classList.add('home-header-ready');
        measureHomeTitle();

        prefixSpace = document.createElement('span');
        prefixSpace.className = 'hrr-placeholder';
        prefixSpace.setAttribute('aria-hidden', 'true');
        homeTitle.before(prefixSpace);
        titleLeft = homeTitle.getBoundingClientRect().left;

        homeTitle.style.position = 'fixed';
        homeTitle.style.zIndex = '10';
        homeTitle.style.left = `${titleLeft}px`;
        homeTitle.style.transformOrigin = 'left top';
        homeTitle.style.mixBlendMode = 'normal';
        homeTitle.style.willChange = 'top, left, font-size, color';
        homeTitle.style.setProperty('--home-header-title-left', `${titleLeft}px`);
        homeTitle.style.setProperty('--home-header-title-size', `${initialFontSize}px`);
        prefixSpace.style.width = `${homeTitle.getBoundingClientRect().width}px`;
        prefixSpace.style.height = `${homeTitle.getBoundingClientRect().height}px`;

        const updateHomeHeader = () => {
            const placeholderRect = prefixSpace.getBoundingClientRect();
            const currentHeroBottom = homeHero.getBoundingClientRect().bottom;
            const transitionStart = placeholderRect.top + window.scrollY;
            const heroBottom = currentHeroBottom + window.scrollY;
            // HRRが画面上端に触れるまでは元の位置に留め、そこからヘッダーへ移動する。
            const progressDistance = Math.max(1, heroBottom - transitionStart);
            const progress = Math.min(1, Math.max(0, (window.scrollY - transitionStart) / progressDistance));

            if (progress > 0) {
                if (!homeTitleAnimation) {
                    document.body.classList.add('home-header-transition');
                    homeTitleAnimation = homeTitle.getAnimations().find(
                        (animation) => animation.animationName === 'home-header-title'
                    );
                }

                if (homeTitleAnimation) {
                    homeTitleAnimation.currentTime = progress * homeTitleDuration;
                }
            } else {
                document.body.classList.remove('home-header-transition');
                homeTitleAnimation = null;
                homeTitle.style.top = `${placeholderRect.top}px`;
                homeTitle.style.left = `${placeholderRect.left}px`;
                homeTitle.style.fontSize = `${initialFontSize}px`;
                homeTitle.style.letterSpacing = '-0.2em';
                homeTitle.style.color = '#fff';
            }

            document.body.style.setProperty('--home-header-progress', progress.toString());
            document.body.classList.toggle('home-header-active', progress > 0);
        };

        updateHomeHeader();
        window.requestAnimationFrame(updateHomeHeader);
        window.addEventListener('scroll', updateHomeHeader, { passive: true });
        window.addEventListener('resize', () => {
            measureHomeTitle();
            titleLeft = prefixSpace.getBoundingClientRect().left;
            homeTitle.style.left = `${titleLeft}px`;
            homeTitle.style.setProperty('--home-header-title-left', `${titleLeft}px`);
            homeTitle.style.setProperty('--home-header-title-size', `${initialFontSize}px`);
            prefixSpace.style.width = `${homeTitle.getBoundingClientRect().width}px`;
            prefixSpace.style.height = `${homeTitle.getBoundingClientRect().height}px`;
            updateHomeHeader();
        });
        document.fonts?.ready.then(() => {
            measureHomeTitle();
            prefixSpace.style.width = `${homeTitle.getBoundingClientRect().width}px`;
            prefixSpace.style.height = `${homeTitle.getBoundingClientRect().height}px`;
            homeTitle.style.setProperty('--home-header-title-size', `${initialFontSize}px`);
            updateHomeHeader();
        });
    }

    const demoVideo = document.querySelector('.device-demo-video');

    if (demoVideo) {
        const demoContainer = demoVideo.closest('.device-demo');
        let playbackRequested = false;

        const playDemoOnce = () => {
            if (playbackRequested) return;
            playbackRequested = true;

            demoVideo.play().catch((error) => {
                playbackRequested = false;
                console.error('BetterNotchのデモ動画を再生できませんでした。', error);
            });
        };

        const handleDemoPlaying = () => {
            demoContainer?.classList.add('is-playing');
            window.removeEventListener('scroll', checkDemoCenter);
            window.removeEventListener('resize', checkDemoCenter);
        };

        const handleDemoWaiting = () => {
            demoContainer?.classList.remove('is-playing');
        };

        const checkDemoCenter = () => {
            const rect = demoContainer?.getBoundingClientRect();
            if (!rect) return;
            const viewportCenter = window.innerHeight / 2;

            if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
                playDemoOnce();
            }
        };

        window.addEventListener('scroll', checkDemoCenter, { passive: true });
        window.addEventListener('resize', checkDemoCenter);
        checkDemoCenter();

        demoVideo.addEventListener('error', () => {
            demoVideo.dataset.loadError = 'true';
            window.removeEventListener('scroll', checkDemoCenter);
            window.removeEventListener('resize', checkDemoCenter);
            console.error('BetterNotchのデモ動画を読み込めませんでした。', demoVideo.error);
        });

        demoVideo.addEventListener('playing', handleDemoPlaying);
        demoVideo.addEventListener('waiting', handleDemoWaiting);
    }

    const stretchText = document.querySelector('.stretch-text');

    if (stretchText) {
        const startStretchAnimation = () => {
            const rect = stretchText.getBoundingClientRect();
            const viewportCenter = window.innerHeight / 2;

            if (rect.top > viewportCenter || rect.bottom < viewportCenter) return;

            stretchText.classList.add('is-animating');
            window.removeEventListener('scroll', checkStretchCenter);
            window.removeEventListener('resize', checkStretchCenter);
        };

        const checkStretchCenter = () => startStretchAnimation();
        window.addEventListener('scroll', checkStretchCenter, { passive: true });
        window.addEventListener('resize', checkStretchCenter);
        checkStretchCenter();
    }
