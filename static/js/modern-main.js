/* ===================================
   GFG IEC - Modern Core Logic
   =================================== */

document.addEventListener('DOMContentLoaded', () => {
    initLoader();
    initNavigation();
    initScrollEffects();
    initImageModal();

    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p !== '' && p !== 'index.html');

    // Determine page from last part of path before index.html
    const currentPage = parts.length > 0 ? parts[parts.length - 1] : 'home';
    console.log(`Detected page: ${currentPage}, depth: ${parts.length}`);

    if (currentPage === 'home') {
        initHomePage();
    } else if (currentPage === 'events') {
        initEventsPage();
    } else if (currentPage === 'team') {
        initTeamPage();
    } else if (currentPage === 'deals') {
        initDealsPage();
    } else if (currentPage === 'partners') {
        initPartnersPage();
    } else if (currentPage === 'sponsors') {
        initSponsorsPage();
    }
});

// Modal Logic
function initImageModal() {
    // Inject modal HTML if not present
    if (!document.getElementById('image-modal')) {
        const modal = document.createElement('div');
        modal.id = 'image-modal';
        modal.className = 'image-modal';
        modal.innerHTML = `
            <div class="image-modal-close"><i data-lucide="x"></i></div>
            <img src="" alt="Full size" class="image-modal-content">
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target !== modal.querySelector('.image-modal-content')) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Use event delegation for zoomable images
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('zoomable')) {
            const modal = document.getElementById('image-modal');
            const modalImg = modal.querySelector('.image-modal-content');
            modalImg.src = e.target.src;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            lucide.createIcons();
        }
    });
}

// UI Logic
function initLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                loader.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }, 1000);
        });
        // Fallback
        setTimeout(() => loader.classList.add('hidden'), 3000);
    }
}

function initNavigation() {
    const nav = document.querySelector('.premium-nav');
    const toggle = document.getElementById('mobile-toggle');
    const drawer = document.getElementById('mobile-drawer');
    const close = document.getElementById('drawer-close');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });

    if (toggle) {
        toggle.addEventListener('click', () => {
            drawer.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }

    if (close) {
        close.addEventListener('click', () => {
            drawer.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Close drawer on link click
    const drawerLinks = document.querySelectorAll('.drawer-link');
    drawerLinks.forEach(link => {
        link.addEventListener('click', () => {
            drawer.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });
}

function initScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up, .grid > *, .section-header').forEach(el => {
        observer.observe(el);
    });
}

// Data Fetching
function getRelativeDataPath() {
    const path = window.location.pathname;

    // Known subdirectories in the project
    const knownDirs = ['events', 'team', 'deals', 'partners', 'sponsors', 'student-id', 'secret-id-gen'];

    // Check if we're in a subdirectory by looking at the last meaningful part of the path
    let depth = 0;

    // Split path and filter out empty strings
    const parts = path.split('/').filter(p => p !== '');

    // If we have parts, check the last non-index.html part
    if (parts.length > 0) {
        // Get the last part (could be index.html or a directory name)
        let lastPart = parts[parts.length - 1];

        // If it's index.html, check the part before it
        if (lastPart === 'index.html' && parts.length > 1) {
            lastPart = parts[parts.length - 2];
        }

        // If the last part is a known directory, we're one level deep
        if (knownDirs.includes(lastPart)) {
            depth = 1;
        }
    }

    return "../".repeat(depth) + "data/";
}

async function fetchData(url) {
    try {
        const relativeDataPath = getRelativeDataPath();
        const dataUrl = relativeDataPath + url.replace(/^\/data\//, '');
        console.log(`Fetching: ${dataUrl}`);
        const response = await fetch(dataUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (e) {
        console.error(`Could not fetch data from ${url}: `, e);
        return null;
    }
}

function fixImagePath(path) {
    if (!path) return '/static/assets/logo.png';
    if (path.startsWith('http') || path.startsWith('/') || path.startsWith('data:')) return path;

    // If it's a relative path from the JSON (like static/assets/...)
    // we need to make it relative to the root
    const rootPath = getRelativeDataPath().replace('data/', '');
    return rootPath + path;
}

function fixRelativePath(path) {
    if (!path || path.startsWith('http') || path.startsWith('/') || path.startsWith('#')) return path;
    const rootPath = getRelativeDataPath().replace('data/', '');
    return rootPath + path;
}

// Home Page Logic
async function initHomePage() {
    const deals = await fetchData('/data/deals.json');
    const team = await fetchData('/data/team.json');
    const allEvents = await fetchData('/data/events.json') || [];

    const upcoming = allEvents.filter(e => e.status === 'upcoming');
    const ongoing = allEvents.filter(e => e.status === 'ongoing');
    const past = allEvents.filter(e => e.status === 'past');

    const partners = await fetchData('/data/partners.json');
    const sponsors = await fetchData('/data/sponsors.json');

    // Stats
    const totalEvents = allEvents.length;
    const eventsCountEl = document.getElementById('events-count');
    if (eventsCountEl) eventsCountEl.innerText = `${totalEvents}+`;

    // Render Ongoing
    if (ongoing && ongoing.length > 0) {
        const ongoingSection = document.getElementById('ongoing-section');
        const container = document.getElementById('ongoing-container');
        ongoingSection.style.display = 'block';
        ongoing.forEach(event => {
            container.innerHTML += renderOngoingCard(event);
        });
    }

    // Render Upcoming (max 3)
    const upcomingContainer = document.getElementById('upcoming-container');
    if (upcoming && upcomingContainer) {
        upcoming.slice(0, 3).forEach(event => {
            upcomingContainer.innerHTML += renderEventCard(event);
        });
    }

    // Render Deals (max 3)
    const dealsContainer = document.getElementById('deals-container');
    if (deals && dealsContainer) {
        deals.slice(0, 3).forEach(deal => {
            dealsContainer.innerHTML += renderDealCard(deal);
        });
    }


    // Hero Highlight
    const heroHighlight = document.getElementById('hero-event-highlight');
    if (upcoming && upcoming.length > 0 && heroHighlight) {
        const event = upcoming[0];
        heroHighlight.innerHTML = `
            <div class="highlight-item">
                <span class="highlight-tag">Next Event</span>
                <h3>${event.title}</h3>
                <p>${event.date} • ${event.venue}</p>
                <a href="${fixRelativePath(event.link) || '/events/'}" class="btn-primary btn-sm">Register Now</a>
            </div>
        `;
    }

    // Render Partners (all)
    const partnersContainer = document.getElementById('home-partners-container');
    if (partners && partnersContainer) {
        let partnersHTML = '';
        partners.forEach(partner => {
            partnersHTML += renderSimpleCard(partner);
        });
        // Duplicate for marquee effect
        partnersContainer.innerHTML = `<div class="marquee-track">${partnersHTML}${partnersHTML}</div>`;
    }

    // Render Sponsors (all)
    const sponsorsContainer = document.getElementById('home-sponsors-container');
    if (sponsors && sponsorsContainer) {
        let sponsorsHTML = '';
        sponsors.forEach(sponsor => {
            sponsorsHTML += renderSimpleCard(sponsor);
        });
        // Duplicate for marquee effect
        sponsorsContainer.innerHTML = `<div class="marquee-track">${sponsorsHTML}${sponsorsHTML}</div>`;
    }

    // Initialize auto-scroll after content is loaded
    setTimeout(() => {
        initAutoScroll();
    }, 500);

    lucide.createIcons();
}

// Events Page Logic
async function initEventsPage() {
    const allEvents = await fetchData('/data/events.json') || [];

    const grid = document.getElementById('events-grid');
    const tabBtns = document.querySelectorAll('.tab-btn');

    const setActiveTab = (type) => {
        tabBtns.forEach(b => {
            if (b.dataset.tab === type) {
                b.classList.add('active');
                b.style.color = 'var(--text-primary)';
            } else {
                b.classList.remove('active');
                b.style.color = 'var(--text-secondary)';
            }
        });
    };

    const renderEvents = (type) => {
        grid.innerHTML = '';
        const data = allEvents.filter(e => e.status === type);

        if (!data || data.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-secondary);">No events found in this category.</div>';
            return;
        }

        data.forEach(event => {
            grid.innerHTML += renderEventCard(event);
        });
        lucide.createIcons();
    };

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.tab;
            setActiveTab(type);
            renderEvents(type);
            // Update URL without reloading (optional, but requested support implies this might be useful)
            const newUrl = window.location.pathname + '?' + type;
            window.history.pushState({path:newUrl}, '', newUrl);
        });
    });

    // Handle URL parameters
    const search = window.location.search;
    let initialTab = 'upcoming';
    
    if (search.includes('past')) initialTab = 'past';
    else if (search.includes('ongoing')) initialTab = 'ongoing';
    else if (search.includes('upcoming')) initialTab = 'upcoming';

    setActiveTab(initialTab);
    renderEvents(initialTab);
}


// Team Page Logic
async function initTeamPage() {
    const team = await fetchData('/data/team.json');
    const container = document.getElementById('team-container');

    if (team && container) {
        const urlParams = new URLSearchParams(window.location.search);
        const filterName = urlParams.get('name');

        let displayTeam = team;
        if (filterName) {
            displayTeam = team.filter(m => m.name.toLowerCase().includes(filterName.toLowerCase()));
        }

        if (displayTeam.length === 0) {
            container.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-secondary);">No team member found.</div>';
            return;
        }

        // Profile View (Single Result)
        if (filterName && displayTeam.length === 1) {
            const member = displayTeam[0];
            const heroTitle = document.querySelector('.hero-title');
            const heroDesc = document.querySelector('.hero-description');

            if (heroTitle) heroTitle.innerHTML = `Team <span class="text-gradient">Profile</span>`;
            if (heroDesc) heroDesc.innerText = `Detailed profile and contact information for ${member.name}.`;

            container.style.gridTemplateColumns = '1fr';
            container.style.maxWidth = '800px';
            container.style.margin = '0 auto';
            container.innerHTML = renderProfileCard(member);
            lucide.createIcons();
            return;
        }

        // Pinned roles that should always stay at the top
        const pinnedRoles = ["Faculty Coordinator", "Chapter Lead"];

        const pinnedMembers = displayTeam.filter(m => pinnedRoles.includes(m.role));
        const otherMembers = displayTeam.filter(m => !pinnedRoles.includes(m.role));

        // Fisher-Yates shuffle for other members
        for (let i = otherMembers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [otherMembers[i], otherMembers[j]] = [otherMembers[j], otherMembers[i]];
        }

        const finalTeam = [...pinnedMembers, ...otherMembers];

        container.innerHTML = ''; // Clear container before rendering
        finalTeam.forEach(member => {
            container.innerHTML += renderTeamCard(member);
        });
    }

    setTimeout(() => {
        initAutoScroll();
    }, 500);
    lucide.createIcons();
}

// Deals Page Logic
async function initDealsPage() {
    const deals = await fetchData('/data/deals.json');
    const container = document.getElementById('deals-container');
    if (deals && container) {
        deals.forEach(deal => {
            container.innerHTML += renderDealCard(deal);
        });
    }
    lucide.createIcons();
}

// Partners & Sponsors
async function initPartnersPage() {
    const data = await fetchData('/data/partners.json');
    const container = document.getElementById('partners-container');
    if (data && container) {
        data.forEach(item => {
            container.innerHTML += renderSimpleCard(item);
        });
    }
    lucide.createIcons();
}

async function initSponsorsPage() {
    const data = await fetchData('/data/sponsors.json');
    const container = document.getElementById('sponsors-container');
    if (data && container) {
        data.forEach(item => {
            container.innerHTML += renderSimpleCard(item);
        });
    }
    lucide.createIcons();
}

// Card Renderers
function renderEventCard(event) {
    return `
        <div class="card event-card" style="padding: 28px;">
            <div class="event-status">${event.status || 'UPCOMING'}</div>
            <div class="event-date" style="margin-bottom: 16px;">
                <i data-lucide="calendar"></i>
                <span>${event.date}</span>
            </div>
            <h3 class="event-title" style="margin-bottom: 16px;">${event.title}</h3>
            <p class="event-description" style="margin-bottom: 28px;">${(event.description || '').substring(0, 100)}...</p>
            <div class="event-footer" style="gap: 12px;">
                <span class="event-venue"><i data-lucide="map-pin" style="width:14px"></i> ${event.venue}</span>
                <a href="${fixRelativePath(event.link) || '#'}" class="btn-primary btn-sm">Join</a>
            </div>
        </div>
    `;
}

function renderOngoingCard(event) {
    return `
        <div class="card event-card" style="border-color: var(--primary); padding: 28px;">
            <div class="event-status" style="background:#2f8d46; color:white">LIVE</div>
            <h3 class="event-title" style="margin-bottom: 16px; margin-top: 8px;">${event.title}</h3>
            <p class="event-description" style="margin-bottom: 28px;">${event.description}</p>
            <a href="${fixRelativePath(event.link)}" target="_blank" class="btn-primary">Join Now <i data-lucide="external-link"></i></a>
        </div>
    `;
}

function renderDealCard(deal) {
    return `
        <div class="card deal-card" style="padding: 28px;">
            <div class="badge" style="margin-bottom:16px">Coupon</div>
            <h3 class="event-title" style="margin-bottom: 14px;">${deal.title}</h3>
            <p class="event-description" style="margin-bottom: 24px;">${deal.benefit}</p>
            <div class="coupon-box" onclick="copyCode('${deal.code}')" style="background:var(--glass); padding:14px 16px; border-radius:12px; cursor:pointer; display:flex; justify-content:space-between; align-items:center; gap: 12px;">
                <code style="color:var(--primary); font-weight:bold; font-size: 15px;">${deal.code}</code>
                <i data-lucide="copy" style="width:18px; flex-shrink: 0;"></i>
            </div>
        </div>
    `;
}


function renderTeamCard(member) {
    const socials = `
        <div class="socials" style="margin-top: 20px; justify-content: center; gap: 12px;">
            ${member.linkedin ? `<a href="${member.linkedin}" target="_blank"><i data-lucide="linkedin"></i></a>` : ''}
            ${member.email ? `<a href="mailto:${member.email}"><i data-lucide="mail"></i></a>` : ''}
        </div>
    `;

    return `
        <div class="card team-card" style="text-align:center; padding: 36px 28px;">
            <div style="width:140px; height:140px; border-radius:100px; overflow:hidden; margin: 0 auto 28px; border: 3px solid var(--primary); box-shadow: var(--shadow-primary);">
                <img src="${fixImagePath(member.image)}" alt="${member.name}" class="zoomable" style="width:100%; height:100%; object-fit:cover; object-position: top center; border-radius: 100px;">
            </div>
            <h3 class="event-title" style="margin-bottom:12px; font-size: 19px;">${member.name}</h3>
            <span style="color:var(--primary); font-weight:700; font-size:13px; text-transform:uppercase; letter-spacing: 1.2px; display: block; margin-bottom: 20px;">${member.role}</span>
            <p class="event-description" style="margin-top:0; line-height: 1.8; font-size: 14px; margin-bottom: 0;">${member.details}</p>
            ${(member.linkedin || member.email) ? socials : ''}
        </div>
    `;
}

function renderProfileCard(member) {
     const socials = `
        <div class="socials" style="margin-top: 10px; justify-content: center; gap: 24px; transform: scale(1.3);">
            ${member.linkedin ? `<a href="${member.linkedin}" target="_blank"><i data-lucide="linkedin"></i></a>` : ''}
            ${member.email ? `<a href="mailto:${member.email}"><i data-lucide="mail"></i></a>` : ''}
        </div>
    `;

    return `
        <div class="card profile-card fade-in-up" style="padding: 60px 40px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 40px; border-color: var(--primary);">
            <div style="width: 200px; height: 200px; border-radius: 50%; overflow: hidden; border: 4px solid var(--primary); box-shadow: var(--shadow-primary);">
                <img src="${fixImagePath(member.image)}" alt="${member.name}" class="zoomable" style="width: 100%; height: 100%; object-fit: cover; object-position: top center;">
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 16px; align-items: center;">
                <h2 style="font-size: 42px; margin: 0; color: var(--text-primary);">${member.name}</h2>
                <div class="badge" style="font-size: 14px; padding: 6px 24px;">${member.role}</div>
            </div>

            <p style="font-size: 18px; line-height: 1.8; color: var(--text-secondary); max-width: 600px; margin: 0;">
                ${member.details}
            </p>

            ${(member.linkedin || member.email) ? socials : ''}

            <div style="margin-top: 20px; padding-top: 40px; border-top: 1px solid var(--glass-border); width: 100%;">
                <a href="?" class="btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 10px;">
                    <i data-lucide="arrow-left" style="width:16px"></i>
                    <span>Explore Other Members</span>
                </a>
            </div>
        </div>
    `;
}

function renderSimpleCard(item) {
    const imgUrl = fixImagePath(item.image || item.logo);
    const website = item.website || item.link;
    return `
        <div class="card" style="text-align:center; display: flex; flex-direction: column; padding: 36px 28px; height: 340px;">
            <div style="flex: 0 0 auto; display: flex; align-items: center; justify-content: center; height: 100px; margin-bottom: 28px;">
                <img src="${imgUrl}" alt="${item.name}" class="zoomable" style="max-height: 100%; max-width: 100%; object-fit: contain; border-radius: 8px;">
            </div>
            <h3 class="event-title" style="margin-bottom: 0; font-size: 18px; flex: 0 0 auto;">${item.name}</h3>
            ${(item.details || item.description) ? `<p class="event-description" style="margin-top:16px; margin-bottom: 0; line-height: 1.7; flex: 1 1 auto; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;">${item.details || item.description}</p>` : '<div style="flex: 1 1 auto;"></div>'}
            ${website ? `
                <a href="${website}" target="_blank" class="btn-secondary btn-sm" style="margin-top: 24px; flex: 0 0 auto;">
                    <span>Visit Website</span>
                    <i data-lucide="external-link" style="width:14px"></i>
                </a>
            ` : ''}
        </div>
    `;
}

// Global copy function
window.copyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
        alert('Coupon code copied!');
    });
};
