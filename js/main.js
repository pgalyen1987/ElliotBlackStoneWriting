// Mobile Navigation Toggle
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add subtle parallax effect to forest background
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const forest = document.querySelector('.forest-background');
    const fog = document.querySelector('.fog-overlay');
    if (forest) {
        forest.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
    if (fog) {
        fog.style.transform = `translateY(${scrolled * 0.2}px)`;
    }
});

// Add fade-in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe story cards
document.querySelectorAll('.story-card, .story-card-large').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Add reading progress indicator for story pages
const storyBody = document.querySelector('.story-body');
if (storyBody) {
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--accent-primary), var(--accent-secondary));
        width: 0%;
        z-index: 1001;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
}

// Add typewriter effect to tagline (optional enhancement)
const tagline = document.querySelector('.tagline');
if (tagline) {
    const text = tagline.textContent;
    tagline.textContent = '';
    let i = 0;
    
    function typeWriter() {
        if (i < text.length) {
            tagline.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 50);
        }
    }
    
    // Start typewriter effect after a short delay
    setTimeout(typeWriter, 1000);
}

// Add hover effect to story cards
document.querySelectorAll('.story-card, .story-card-large').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s ease';
    });
});

// Social share bar (auto-injected on individual story pages)
(function () {
    const storyPage = document.querySelector('.story-page');
    const anchor = storyPage && storyPage.querySelector('.story-body');
    if (!storyPage || !anchor) {
        return;
    }

    // Prefer the canonical URL / og:title so shares use clean, absolute values.
    const canonical = document.querySelector('link[rel="canonical"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const shareUrl = (canonical && canonical.href) || window.location.href;
    const rawTitle = (ogTitle && ogTitle.content) ||
        document.title.replace(/\s*[-|]\s*Elliot Blackstone\s*$/i, '').trim();
    const shareTitle = rawTitle ? rawTitle + ' — a story by Elliot Blackstone' : document.title;

    const u = encodeURIComponent(shareUrl);
    const t = encodeURIComponent(shareTitle);
    const bsky = encodeURIComponent(shareTitle + ' ' + shareUrl);

    const ICONS = {
        x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"/></svg>',
        bluesky: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078-.139-.017-.277-.034-.415-.056.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364C23.622 9.418 24 4.458 24 3.768c0-.689-.139-1.86-.902-2.203-.659-.299-1.664-.621-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"/></svg>',
        reddit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 11.779c0-1.459-1.192-2.645-2.657-2.645-.715 0-1.363.286-1.84.746-1.81-1.191-4.259-1.949-6.971-2.046l1.483-4.669 4.016.941-.006.058c0 1.193.975 2.163 2.174 2.163 1.198 0 2.173-.97 2.173-2.163s-.975-2.164-2.173-2.164c-.84 0-1.569.481-1.926 1.182l-4.491-1.052c-.218-.051-.438.086-.49.301l-1.638 5.183c-2.747.076-5.228.834-7.066 2.034-.477-.462-1.124-.748-1.839-.748C1.192 9.135 0 10.321 0 11.78c0 1.073.645 1.994 1.564 2.399-.038.222-.057.447-.057.673 0 3.428 3.99 6.207 8.913 6.207 4.922 0 8.913-2.779 8.913-6.207 0-.226-.019-.45-.057-.672.919-.405 1.564-1.326 1.564-2.4zm-17.224 1.816c0-.918.745-1.663 1.663-1.663.918 0 1.663.745 1.663 1.663 0 .918-.745 1.663-1.663 1.663-.918 0-1.663-.745-1.663-1.663zm9.987 4.298c-1.226 1.226-3.574 1.319-4.263 1.319-.689 0-3.037-.093-4.262-1.319-.183-.183-.183-.479 0-.662.183-.183.479-.183.662 0 .772.772 2.422.99 3.6.99 1.179 0 2.829-.218 3.601-.99.183-.183.479-.183.662 0 .183.183.183.479 0 .662zm-.314-2.635c-.918 0-1.663-.745-1.663-1.663 0-.918.745-1.663 1.663-1.663.918 0 1.663.745 1.663 1.663 0 .918-.745 1.663-1.663 1.663z"/></svg>',
        facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z"/></svg>',
        linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.74v20.52C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0Z"/></svg>',
        copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1Zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm0 16H8V7h11v14Z"/></svg>'
    };

    const bar = document.createElement('div');
    bar.className = 'story-share';
    bar.innerHTML =
        '<span class="story-share__label">Share this story</span>' +
        '<div class="story-share__buttons">' +
        '<a class="share-btn share-btn--x" target="_blank" rel="noopener" ' +
        'href="https://twitter.com/intent/tweet?url=' + u + '&text=' + t + '">' +
        ICONS.x + '<span>X</span></a>' +
        '<a class="share-btn share-btn--bsky" target="_blank" rel="noopener" ' +
        'href="https://bsky.app/intent/compose?text=' + bsky + '">' +
        ICONS.bluesky + '<span>Bluesky</span></a>' +
        '<a class="share-btn share-btn--reddit" target="_blank" rel="noopener" ' +
        'href="https://www.reddit.com/submit?url=' + u + '&title=' + t + '">' +
        ICONS.reddit + '<span>Reddit</span></a>' +
        '<a class="share-btn share-btn--fb" target="_blank" rel="noopener" ' +
        'href="https://www.facebook.com/sharer/sharer.php?u=' + u + '">' +
        ICONS.facebook + '<span>Facebook</span></a>' +
        '<a class="share-btn share-btn--li" target="_blank" rel="noopener" ' +
        'href="https://www.linkedin.com/sharing/share-offsite/?url=' + u + '">' +
        ICONS.linkedin + '<span>LinkedIn</span></a>' +
        '<button type="button" class="share-btn share-btn--copy">' +
        ICONS.copy + '<span>Copy link</span></button>' +
        '</div>';

    anchor.insertAdjacentElement('afterend', bar);

    // Open social links in a centered popup rather than a full new tab.
    bar.querySelectorAll('a.share-btn').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const w = 600, h = 540;
            const x = window.screenX + (window.outerWidth - w) / 2;
            const y = window.screenY + (window.outerHeight - h) / 2;
            window.open(link.href, 'share', 'width=' + w + ',height=' + h +
                ',left=' + x + ',top=' + y + ',noopener');
        });
    });

    // Copy-to-clipboard with graceful fallback + transient confirmation.
    const copyBtn = bar.querySelector('.share-btn--copy');
    const copyLabel = copyBtn.querySelector('span');
    copyBtn.addEventListener('click', () => {
        const done = () => {
            copyBtn.classList.add('copied');
            copyLabel.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyLabel.textContent = 'Copy link';
            }, 2000);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl).then(done).catch(done);
        } else {
            const ta = document.createElement('textarea');
            ta.value = shareUrl;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch (err) { /* no-op */ }
            document.body.removeChild(ta);
            done();
        }
    });
}());

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (navMenu && hamburger) {
        if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
            navMenu.classList.remove('active');
            hamburger.classList.remove('active');
        }
    }
});
