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
    initModal();
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

    // Update nav username and points if logged in
    if (currentUser) {
        updateNavUsername(currentUser);
        updateDrawerUserInfo(currentUser);

        // Initial fetch from DB
        fetchUserStats(currentUser).then(() => {
            // Background sync from GFG API to DB
            syncUserWithBackend(currentUser).then(() => {
                // Refresh UI with latest data from DB after sync
                fetchUserStats(currentUser);

                // If on leaderboard page, refresh it to show updated stats
                if (document.getElementById('leaderboard-body')) {
                    loadLeaderboard();
                }
            });
        });
    }
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

function updateDrawerUserInfo(username, points = 0) {
    const drawerUsername = document.getElementById('drawer-username');
    const drawerPoints = document.getElementById('drawer-points');

    if (drawerUsername) {
        drawerUsername.textContent = username || 'Guest User';
    }
    if (drawerPoints) {
        drawerPoints.textContent = `${points} Points`;
    }
}

function updateNavPoints(points) {
    const navPointsValue = document.getElementById('nav-points-value');
    if (navPointsValue) {
        navPointsValue.textContent = points || '0';
    }
}

// ===================================
// Modal
// ===================================
function initModal() {
    const profileBtn = document.getElementById('profile-btn');
    const modal = document.getElementById('profile-modal');
    const closeBtn = modal?.querySelector('.close-modal');

    if (!profileBtn || !modal) return;

    // Open modal
    profileBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });

    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            modal.classList.remove('active');
        }
    });
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
    // Modal Elements (Home Page)
    const modalSaveBtn = document.getElementById('save-profile');
    const modalInput = document.getElementById('username-input');
    const modalUserStats = document.getElementById('user-stats-display');
    const modal = document.getElementById('profile-modal');

    // Profile Page Elements
    const profileForm = document.getElementById('profile-form');
    const profileInput = document.getElementById('gfg-handle');
    const clearBtn = document.getElementById('clear-data');
    const syncStatus = document.getElementById('sync-status');

    // Load saved handle into both possible inputs
    if (currentUser) {
        if (modalInput) modalInput.value = currentUser;
        if (profileInput) profileInput.value = currentUser;

        updateProfileDisplay(currentUser);

        if (modalUserStats) {
            modalUserStats.classList.remove('hidden');
        }
    }

    // Modal Save Handler
    if (modalSaveBtn && modalInput) {
        modalSaveBtn.addEventListener('click', async () => {
            let input = modalInput.value.trim();
            if (input) {
                let handle = extractUsernameFromURL(input);
                if (handle) {
                    const success = await saveHandle(handle);
                    if (success) {
                        // Show stats in modal
                        if (modalUserStats) modalUserStats.classList.remove('hidden');

                        // Close modal after short delay
                        setTimeout(() => {
                            if (modal) modal.classList.remove('active');
                        }, 1000);
                    }
                } else {
                    showToast('Please use a valid GFG profile URL. If you don\'t have an account, please make one on GFG and come back!');
                }
            } else {
                showToast('Please enter your GFG profile URL or username');
            }
        });
    }

    // Profile Page Form Handler
    if (profileForm && profileInput) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let input = profileInput.value.trim();
            if (input) {
                let handle = extractUsernameFromURL(input);
                if (handle) {
                    const success = await saveHandle(handle);

                    if (success) {
                        // Show success on profile page
                        if (syncStatus) {
                            syncStatus.classList.add('show');
                            setTimeout(() => syncStatus.classList.remove('show'), 3000);
                        }
                    }
                } else {
                    showToast('Please use a valid GFG profile URL. If you don\'t have an account, please make one on GFG and come back!');
                }
            } else {
                showToast('Please enter your GFG profile URL or username');
            }
        });
    }

    // Clear data handler
    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear your data?')) {
                showValidationModal('Clearing Profile...');

                // Simulate brief delay for UX
                await new Promise(r => setTimeout(r, 800));

                localStorage.removeItem(STORAGE_KEY);
                currentUser = null;
                if (modalInput) modalInput.value = '';
                if (profileInput) profileInput.value = '';
                updateProfileDisplay(null);
                updateNavUsername('Profile');

                hideValidationModal();
                showToast('Data cleared successfully');
            }
        });
    }

    // Check for referral code on load
    checkReferralParam();
}

function checkReferralParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const referCode = urlParams.get('refer');
    if (referCode) {
        localStorage.setItem('pending_referral', referCode);
        // Optional: Clean URL
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({ path: newUrl }, '', newUrl);

        // If user is already logged in, try to redeem immediately
        if (currentUser) {
            redeemReferral(currentUser, referCode);
        } else {
            showToast('Referral code saved! Sign in to redeem +5 points.');
        }
    }
}

async function redeemReferral(username, code) {
    try {
        const response = await fetch(`${API_BASE}/referral/use`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, code: code })
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message);
            localStorage.removeItem('pending_referral');
            fetchUserStats(username); // Update points
        } else {
            // If already used, also clear it so we don't spam
            if (result.error && (result.error.includes('already used') || result.error.includes('own referral'))) {
                localStorage.removeItem('pending_referral');
            }
            // Optional: still show error if it's relevant, or silent fail if just "already used"
            if (result.error && !result.error.includes('already used')) {
                console.log("Referral error:", result.error);
            }
        }
    } catch (err) {
        console.error("Referral redemption failed", err);
    }
}

// Shared save logic with validation
async function saveHandle(handle) {
    showValidationModal('Verifying Profile...');

    try {
        // Validate and Sync with Backend
        const response = await fetch(`${API_BASE}/user/${handle}`, { method: 'POST' });
        const result = await response.json();

        if (!response.ok || result.error) {
            hideValidationModal();
            showToast(result.error || 'Invalid GFG handle. Please make sure your profile is public and username is correct.');
            return false;
        }

        // Delay for smooth UX
        await new Promise(r => setTimeout(r, 1000));

        // Fetch stats
        await fetchUserStats(handle);

        // If successful, save locally
        localStorage.setItem(STORAGE_KEY, handle);
        currentUser = handle;

        // Update UI
        updateProfileDisplay(handle);
        updateNavUsername(handle);

        // Check for pending referral
        const pendingReferral = localStorage.getItem('pending_referral');
        if (pendingReferral) {
            await redeemReferral(handle, pendingReferral);
        }

        await new Promise(r => setTimeout(r, 600));
        hideValidationModal();
        showToast(`Profile verified & saved: ${handle}`);
        return true;

    } catch (err) {
        console.error("Validation failed:", err);
        hideValidationModal();
        showToast('Connection error. Please try again later.');
        return false;
    }
}

// Validation Modal Helpers
function showValidationModal(text = 'Processing...') {
    const modal = document.getElementById('validation-modal');
    if (modal) {
        const title = document.getElementById('validation-title');
        if (title) title.textContent = text;

        modal.classList.add('active');

        if (typeof lucide !== 'undefined') {
            setTimeout(() => lucide.createIcons(), 100);
        }
    }
}

function hideValidationModal() {
    const modal = document.getElementById('validation-modal');
    if (modal) modal.classList.remove('active');
}

// Extract username from GFG profile URL
function extractUsernameFromURL(input) {
    if (!input) return null;

    const lowerInput = input.toLowerCase();

    // Check if input is a URL
    if (lowerInput.includes('geeksforgeeks.org') || lowerInput.includes('gfg.org')) {
        // Strict check: it MUST contain /profile/ to be valid
        if (lowerInput.includes('/profile/')) {
            const parts = input.split(/\/profile\//i);
            if (parts.length > 1) {
                // Remove trailing slashes and query parameters
                let username = parts[1].split('/')[0].split('?')[0];
                return username || null;
            }
        }
        // If it's any other GFG URL (like /connect/explore), it's invalid
        return null;
    }

    // If it's not a URL at all (no http, no domain), check if it looks like a username
    if (!input.includes('.') && !input.includes('/')) {
        return input; // Assume it's a handle
    }

    // Otherwise it's an invalid URL or weird format
    return null;
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

        // Update profile page & Modal IDs
        const profileRank = document.getElementById('profile-rank');
        const profileScore = document.getElementById('profile-score');
        const profileTierText = document.getElementById('profile-tier-text');
        const displayTier = document.getElementById('display-tier');


        // Apply updates
        const rankFormatted = `#${data.rank}`;
        const scoreFormatted = data.score;
        const tierName = data.tier || 'Bronze';

        // Define tier badges
        const tierBadges = {
            'Diamond': '💎 Diamond',
            'Gold': '🥇 Gold',
            'Silver': '🥈 Silver',
            'Bronze': '🥉 Bronze'
        };

        if (profileRank) profileRank.textContent = rankFormatted;
        if (profileScore) profileScore.textContent = scoreFormatted;
        if (profileTierText) profileTierText.textContent = tierName;
        if (displayTier) displayTier.textContent = tierBadges[tierName] || `🥉 ${tierName}`;

        // Update nav points and drawer
        updateNavPoints(scoreFormatted);
        updateDrawerUserInfo(handle, scoreFormatted);

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
            let html = data.map((user, index) => {
                const rank = index + 1;
                let rankClass = '';
                let rankEmoji = '';

                if (rank === 1) {
                    rankClass = 'rank-1';
                    rankEmoji = '🥇';
                } else if (rank === 2) {
                    rankClass = 'rank-2';
                    rankEmoji = '🥈';
                } else if (rank === 3) {
                    rankClass = 'rank-3';
                    rankEmoji = '🥉';
                }

                return `
                    <tr class="${rankClass} ${user.handle === currentUser ? 'user-row' : ''} reveal-item">
                        <td>
                            <div class="rank-container">
                                <span class="rank-badge">#${rank}</span>
                                ${rankEmoji ? `<span class="rank-emoji">${rankEmoji}</span>` : ''}
                            </div>
                        </td>
                        <td>
                            <span class="handle-name">${user.handle}</span>
                            ${user.handle === currentUser ? '<span class="you-badge">You</span>' : ''}
                        </td>
                        <td class="score-cell">${user.score}</td>
                        <td>${user.tier}</td>
                    </tr>
                `;
            }).join('');

            // Check if user is in top 10
            const userInTop10 = data.some(user => user.handle === currentUser);

            if (currentUser && !userInTop10) {
                // Fetch user's actual rank
                try {
                    const userRes = await fetch(`${API_BASE}/rank/${currentUser}`);
                    if (userRes.ok) {
                        const userData = await userRes.json();
                        html += `
                            <tr class="user-row-divider"><td colspan="4"></td></tr>
                            <tr class="user-row reveal-item">
                                <td>
                                    <span class="rank-badge">#${userData.rank}</span>
                                </td>
                                <td>
                                    <span class="handle-name">${userData.handle}</span>
                                    <span class="you-badge">You</span>
                                </td>
                                <td class="score-cell">${userData.score}</td>
                                <td>${userData.tier}</td>
                            </tr>
                        `;
                    }
                } catch (rankErr) {
                    console.error('Error fetching user rank:', rankErr);
                }
            }

            leaderboardBody.innerHTML = html;

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
