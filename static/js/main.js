// ===================================
// GFG IEC - Main JavaScript
// ===================================

// Configuration
const API_BASE = '/api';
const STORAGE_KEY = 'gfg_handle';

// State
let currentUser = localStorage.getItem(STORAGE_KEY) || null;

// ===================================
// Initialization
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initNavigation();
    initRevealAnimations();
    initTabs();
    initProfile();
    initLeaderboard();
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
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('active');
        });

        // Close on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('active');
            });
        });
    }

    // Update nav username if logged in
    if (currentUser) {
        const navUsername = document.getElementById('nav-username');
        if (navUsername) {
            navUsername.textContent = currentUser;
        }
    }
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
// Profile System
// ===================================
function initProfile() {
    const profileForm = document.getElementById('profile-form');
    const handleInput = document.getElementById('gfg-handle');
    const clearBtn = document.getElementById('clear-data');
    const syncStatus = document.getElementById('sync-status');

    // Load saved handle
    if (handleInput && currentUser) {
        handleInput.value = currentUser;
        updateProfileDisplay(currentUser);
    }

    // Save handler
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const handle = handleInput.value.trim();

            if (handle) {
                localStorage.setItem(STORAGE_KEY, handle);
                currentUser = handle;

                // Update UI
                updateProfileDisplay(handle);
                updateNavUsername(handle);

                // Sync with backend
                await syncUserWithBackend(handle);

                // Show success
                if (syncStatus) {
                    syncStatus.classList.add('show');
                    setTimeout(() => syncStatus.classList.remove('show'), 3000);
                }
            }
        });
    }

    // Clear data
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear your data?')) {
                localStorage.removeItem(STORAGE_KEY);
                currentUser = null;
                handleInput.value = '';
                updateProfileDisplay(null);
                updateNavUsername('Profile');
            }
        });
    }
}

function updateProfileDisplay(handle) {
    const displayHandle = document.getElementById('display-handle');
    const displayTier = document.getElementById('display-tier');
    const profileRank = document.getElementById('profile-rank');
    const profileScore = document.getElementById('profile-score');

    if (displayHandle) {
        displayHandle.textContent = handle || 'Set Your Handle';
    }

    // Fetch user stats if handle exists
    if (handle) {
        fetchUserStats(handle);
    }
}

function updateNavUsername(name) {
    const navUsername = document.getElementById('nav-username');
    if (navUsername) {
        navUsername.textContent = name;
    }
}

async function fetchUserStats(handle) {
    try {
        const response = await fetch(`${API_BASE}/rank/${handle}`);
        if (!response.ok) throw new Error('User not found');

        const data = await response.json();

        // Update profile page
        const profileRank = document.getElementById('profile-rank');
        const profileScore = document.getElementById('profile-score');
        const userRank = document.getElementById('user-rank');
        const userScore = document.getElementById('user-score');
        const userTier = document.getElementById('user-tier');

        if (profileRank) profileRank.textContent = `#${data.rank}`;
        if (profileScore) profileScore.textContent = data.score;
        if (userRank) userRank.textContent = `#${data.rank}`;
        if (userScore) userScore.textContent = data.score;
        if (userTier) userTier.textContent = data.tier || '--';

    } catch (err) {
        console.log('Stats fetch failed:', err.message);
    }
}

async function syncUserWithBackend(handle) {
    try {
        await fetch(`${API_BASE}/user/${handle}`, { method: 'POST' });
    } catch (err) {
        console.log('Backend sync failed (server may not be running)');
    }
}

// ===================================
// Leaderboard
// ===================================
function initLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    const refreshBtn = document.getElementById('refresh-lb');

    if (!leaderboardBody) return;

    loadLeaderboard();

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadLeaderboard();
        });
    }

    // Load user stats if logged in
    if (currentUser) {
        fetchUserStats(currentUser);
    }
}

async function loadLeaderboard() {
    const leaderboardBody = document.getElementById('leaderboard-body');
    if (!leaderboardBody) return;

    try {
        const response = await fetch(`${API_BASE}/leaderboard`);
        if (!response.ok) throw new Error('API Error');

        const data = await response.json();

        if (data && Array.isArray(data) && data.length > 0) {
            leaderboardBody.innerHTML = data.map((user, index) => `
                <tr class="${index === 0 ? 'first-place' : ''} reveal-item">
                    <td>
                        <span class="rank-badge">#${index + 1}</span>
                    </td>
                    <td>
                        <span class="handle-name">${user.handle}</span>
                    </td>
                    <td class="score-cell">${user.score}</td>
                    <td>${user.tier}</td>
                </tr>
            `).join('');

            // Re-initialize reveal animations for new rows
            initRevealAnimations();
        } else {
            leaderboardBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty-state">
                        <div class="empty-content">
                            <i data-lucide="users"></i>
                            <p>No rankings available yet. Be the first to join!</p>
                        </div>
                    </td>
                </tr>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    } catch (err) {
        console.error('Leaderboard Fetch Error:', err);
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <div class="empty-content">
                        <p>Unable to connect to leaderboard. Please try again later.</p>
                    </div>
                </td>
            </tr>
        `;
    }
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
        background: var(--primary);
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

    // Remove after delay
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
