// ===================================
// GFG IEC - Main JavaScript
// ===================================

// Initialization
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initNavigation();
    initRevealAnimations();
    initTabs();
    initCounterAnimation();
});

// ===================================
// Loader
// ===================================
function initLoader() {
    const loader = document.getElementById('loader');
    if (!loader) return;

    // Hide loader after video plays or timeout
    const video = loader.querySelector('video');
    if (video) {
        video.addEventListener('loadeddata', () => {
            setTimeout(() => hideLoader(), 2000);
        });
    }

    // Fallback timeout
    setTimeout(() => hideLoader(), 3000);
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
    }
}

// ===================================
// Navigation
// ===================================
function initNavigation() {
    const nav = document.querySelector('.glass-nav');
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const drawer = document.getElementById('mobile-drawer');
    const drawerBackdrop = document.getElementById('mobile-drawer-backdrop');
    const drawerClose = document.getElementById('drawer-close');
    const drawerLinks = document.querySelectorAll('.drawer-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Open drawer
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            openDrawer();
        });
    }

    // Close drawer
    if (drawerClose) {
        drawerClose.addEventListener('click', () => {
            closeDrawer();
        });
    }

    // Close on backdrop click
    if (drawerBackdrop) {
        drawerBackdrop.addEventListener('click', () => {
            closeDrawer();
        });
    }

    // Close on link click
    drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeDrawer();
        });
    });
}

function openDrawer() {
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    if (drawer) drawer.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDrawer() {
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    if (drawer) drawer.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
}

// ===================================
// Reveal Animations
// ===================================
function initRevealAnimations() {
    const options = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, options);

    // Observe all reveal elements
    document.querySelectorAll('.reveal-up, .reveal-item').forEach(el => {
        observer.observe(el);
    });
}

// ===================================
// Tab System
// ===================================
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabBtns.length === 0) return;

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // Update buttons
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                    // Re-trigger animations
                    content.querySelectorAll('.reveal-item').forEach(el => {
                        el.classList.remove('revealed');
                        setTimeout(() => el.classList.add('revealed'), 100);
                    });
                }
            });
        });
    });
}

// ===================================
// Counter Animation
// ===================================
function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-number[data-count]');

    if (counters.length === 0) return;

    const options = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, options);

    counters.forEach(counter => observer.observe(counter));
}

function animateCount(element) {
    const target = parseInt(element.dataset.count);
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const updateCount = () => {
        current += step;
        if (current < target) {
            element.textContent = Math.floor(current);
            requestAnimationFrame(updateCount);
        } else {
            element.textContent = target;
        }
    };

    requestAnimationFrame(updateCount);
}

// ===================================
// Utility Functions
// ===================================
function copyCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showToast('Coupon code copied: ' + code);
    }).catch(() => {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Coupon code copied: ' + code);
    });
}

function showToast(message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <i data-lucide="check-circle"></i>
        <span>${message}</span>
    `;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: #2ed573;
        color: white;
        padding: 1rem 2rem;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 9999;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        transition: transform 0.4s ease;
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);

    // Remove after 3s
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);

    // Recreate icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Make copyCode globally available
window.copyCode = copyCode;
