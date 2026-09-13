let config = {};
let projectsData = [];
let youtubeData = [];
let socialsData = [];
let partnersData = [];
let contactsData = [];
let translationsData = {};
let currentLang = "pl";
let currentCategoryFilter = "all";
let currentSearchQuery = "";
let keyBuffer = "";

async function loadData() {
    try {
        const [configRes, projectsRes, youtubeRes, socialsRes, partnersRes, contactsRes, transRes] = await Promise.all([
            fetch('data/config.json').then(r => r.json()).catch(() => ({ defaultLang: 'pl' })),
            fetch('data/projects.json').then(r => r.json()).catch(() => []),
            fetch('data/youtube.json').then(r => r.json()).catch(() => []),
            fetch('data/socials.json').then(r => r.json()).catch(() => []),
            fetch('data/partners.json').then(r => r.json()).catch(() => []),
            fetch('data/contacts.json').then(r => r.json()).catch(() => []),
            fetch('data/translations.json').then(r => r.json()).catch(() => ({}))
        ]);

        config = configRes || {};
        projectsData = Array.isArray(projectsRes) ? projectsRes : [];
        youtubeData = Array.isArray(youtubeRes) ? youtubeRes : [];
        socialsData = Array.isArray(socialsRes) ? socialsRes : [];
        partnersData = Array.isArray(partnersRes) ? partnersRes : [];
        contactsData = Array.isArray(contactsRes) ? contactsRes : [];
        translationsData = transRes || {};

        const savedLang = localStorage.getItem('kazanek_lang');
        currentLang = savedLang || config.defaultLang || 'pl';

        initUI();
    } catch (err) {
        console.error("Error loading data:", err);
    }
}

function initUI() {
    updateTranslations();
    renderHero();
    renderAbout();
    renderProjects();
    renderYoutube();
    renderSocials();
    renderPartners();
    renderContacts();
    setupEventListeners();

    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 700,
            easing: 'ease-out-cubic',
            once: true,
            offset: 40
        });
    }
}

function updateTranslations() {
    const langDict = translationsData[currentLang] || {};

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langDict[key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = langDict[key];
            } else {
                el.innerText = langDict[key];
            }
        }
    });

    const langTextEl = document.getElementById('current-lang-text');
    if (langTextEl) {
        langTextEl.innerText = currentLang.toUpperCase();
    }

    document.documentElement.lang = currentLang;
}

function toggleLanguage() {
    currentLang = currentLang === 'pl' ? 'en' : 'pl';
    localStorage.setItem('kazanek_lang', currentLang);
    updateTranslations();
    renderProjects();
    renderYoutube();
    renderPartners();
    renderContacts();
    showToast(currentLang === 'pl' ? 'Język zmieniony na Polski' : 'Language switched to English');
}

function renderHero() {
    const bannerEl = document.getElementById('hero-banner-bg') || document.querySelector('.hero-banner-bg');
    if (bannerEl && config.heroBanner) {
        bannerEl.style.backgroundImage = `url('${config.heroBanner}')`;
    }
}

function renderAbout() {
    const avatarEl = document.getElementById('about-avatar-img');
    if (avatarEl && config.avatar) {
        avatarEl.src = config.avatar;
        avatarEl.onerror = () => { avatarEl.src = 'assets/site/avatar.svg'; };
    }
}

function openProjectWithAnimation(event, url) {
    if (event) event.preventDefault();

    const overlay = document.getElementById('project-launch-overlay');
    if (overlay) {
        overlay.classList.add('active');
        setTimeout(() => {
            window.open(url, '_blank', 'noopener,noreferrer');
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 300);
        }, 700);
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container) return;

    const t = translationsData[currentLang] || {};
    const query = currentSearchQuery.toLowerCase().trim();

    const filtered = projectsData.filter(proj => {
        if (currentCategoryFilter !== 'all' && proj.type !== currentCategoryFilter) {
            return false;
        }

        if (!query) return true;

        const title = (proj.title || "").toLowerCase();
        const desc = (proj.description?.[currentLang] || proj.description?.pl || "").toLowerCase();
        const tags = (proj.tags || []).join(" ").toLowerCase();
        const typeStr = (proj.type || "").toLowerCase();

        return title.includes(query) || desc.includes(query) || tags.includes(query) || typeStr.includes(query);
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="grid-column: 1/-1; text-align: center; padding: 40px; color: rgba(255,255,255,0.6);">
                <i class="fa-solid fa-folder-open" style="font-size: 42px; margin-bottom: 12px; display: block;"></i>
                <p>${t.noProjectsFound || 'Brak projektów spełniających podane kryteria.'}</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(proj => {
        const descText = proj.description?.[currentLang] || proj.description?.pl || "";
        const typeLabel = proj.typeName?.[currentLang] || proj.typeName?.pl || getProjectTypeLabel(proj.type, t);
        const statusLabel = getStatusLabel(proj.status, t);
        const bannerSrc = proj.banner || 'assets/site/banner.svg';

        let linksHtml = "";
        if (proj.type === 'mc_mod' && Array.isArray(proj.links)) {
            linksHtml = proj.links.map(l => `
                <button onclick="openProjectWithAnimation(event, '${l.url}')" class="project-link-btn">
                    <i class="${l.icon || 'fa-solid fa-link'}"></i> ${l.name || 'Strona'}
                </button>
            `).join("");
        } else if (proj.link) {
            const btnText = proj.type === 'www' ? (t.btnOpenWebsite || 'Otwórz Stronę') :
                            proj.type === 'app' ? (t.btnOpenApp || 'Otwórz Aplikację') :
                            (t.btnOpenProject || 'Otwórz Projekt');
            linksHtml = `
                <button onclick="openProjectWithAnimation(event, '${proj.link}')" class="project-link-btn">
                    <i class="fa-solid fa-arrow-up-right-from-square"></i> ${btnText}
                </button>
            `;
        }

        const tagsHtml = (proj.tags || []).map(tag => `<span class="project-tag">#${tag}</span>`).join("");

        return `
            <div class="project-card">
                <div class="project-banner-wrapper">
                    <img src="${bannerSrc}" alt="${proj.title}" class="project-banner-img" onerror="this.src='assets/site/banner.svg'">
                    <span class="project-type-badge">${typeLabel}</span>
                    <span class="project-status-badge">
                        <span class="status-dot ${proj.status || 'in_progress'}"></span>
                        ${statusLabel}
                    </span>
                </div>
                <div class="project-body">
                    <h3 class="project-title">${proj.title}</h3>
                    <p class="project-desc">${descText}</p>
                    <div class="project-tags">${tagsHtml}</div>
                    <div class="project-links">${linksHtml}</div>
                </div>
            </div>
        `;
    }).join("");
}

function getProjectTypeLabel(type, t) {
    switch (type) {
        case 'www': return t.filterWww || 'Strona WWW';
        case 'app': return t.filterApp || 'Aplikacja';
        case 'mc_mod': return t.filterMcMod || 'Mod Minecraft';
        default: return t.filterOther || 'Inne';
    }
}

function getStatusLabel(status, t) {
    switch (status) {
        case 'completed': return t.statusCompleted || 'Zakończony';
        case 'paused': return t.statusPaused || 'Wstrzymany';
        default: return t.statusInProgress || 'Nadal rozwijany';
    }
}

function renderYoutube() {
    const container = document.getElementById('youtube-container');
    if (!container) return;

    const t = translationsData[currentLang] || {};

    if (youtubeData.length === 0) {
        container.innerHTML = `<p style="color: rgba(255,255,255,0.6);">Brak filmów na kanale.</p>`;
        return;
    }

    container.innerHTML = youtubeData.map(v => {
        const titleText = typeof v.title === 'object' ? (v.title?.[currentLang] || v.title?.pl || "") : v.title;
        const descText = typeof v.description === 'object' ? (v.description?.[currentLang] || v.description?.pl || "") : v.description;
        const thumbSrc = v.thumbnail || 'assets/projects/portfolio.png';

        return `
            <div class="youtube-card">
                <div class="youtube-thumb-wrapper" onclick="openProjectWithAnimation(event, '${v.url}')">
                    <img src="${thumbSrc}" alt="${titleText}" class="youtube-thumb-img" onerror="this.src='assets/site/banner.svg'">
                    <div class="youtube-play-overlay">
                        <i class="fa-brands fa-youtube youtube-play-icon"></i>
                    </div>
                    ${v.views ? `<span class="youtube-meta-badge"><i class="fa-solid fa-eye"></i> ${v.views}</span>` : ''}
                </div>
                <div class="youtube-body">
                    <h3 class="youtube-title">${titleText}</h3>
                    <p class="youtube-desc">${descText}</p>
                    <button onclick="openProjectWithAnimation(event, '${v.url}')" class="project-link-btn" style="align-self: flex-start;">
                        <i class="fa-brands fa-youtube" style="color: #ff0000;"></i> ${t.btnWatchYoutube || 'Obejrzyj na YouTube'}
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function renderSocials() {
    const container = document.getElementById('socials-container');
    if (!container) return;

    container.innerHTML = socialsData.map(s => `
        <a href="${s.url}" target="_blank" rel="noopener noreferrer" class="social-card">
            <div class="social-icon" style="color: ${s.color || '#ffffff'};">
                <i class="${s.icon || 'fa-solid fa-share-nodes'}"></i>
            </div>
            <div class="social-info">
                <span class="social-name">${s.name}</span>
                <span class="social-user">${s.username}</span>
            </div>
        </a>
    `).join("");
}

function renderPartners() {
    const container = document.getElementById('partners-container');
    if (!container) return;

    const t = translationsData[currentLang] || {};

    if (partnersData.length === 0) {
        container.innerHTML = `<p style="color: rgba(255,255,255,0.6);">Brak wpisanych partnerów.</p>`;
        return;
    }

    container.innerHTML = partnersData.map(p => {
        const desc = p.description?.[currentLang] || p.description?.pl || "";
        const presentText = t.partnerDatePresent || "Obecnie";
        const dateRangeStr = p.dateTo ? `${p.dateFrom} - ${p.dateTo}` : `${p.dateFrom} - ${presentText}`;

        return `
            <div class="partner-card">
                <div class="partner-header">
                    <img src="${p.logo || 'assets/site/logo.png'}" alt="${p.name}" class="partner-logo-img" onerror="this.src='assets/site/logo.png'">
                    <div class="partner-info">
                        <h3>${p.name}</h3>
                        <span class="partner-date-badge"><i class="fa-regular fa-calendar"></i> ${dateRangeStr}</span>
                    </div>
                </div>
                <p class="partner-desc">${desc}</p>
                ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener noreferrer" class="project-link-btn" style="align-self: flex-start;"><i class="fa-solid fa-link"></i> ${p.name}</a>` : ''}
            </div>
        `;
    }).join("");
}

function renderContacts() {
    const container = document.getElementById('contact-cards-container');
    if (!container) return;

    container.innerHTML = contactsData.map(c => {
        const labelText = c.label?.[currentLang] || c.label?.pl || c.id;
        const toastMsg = c.toastText?.[currentLang] || c.toastText?.pl || `Skopiowano: ${c.value}`;

        return `
            <div class="contact-item-card" onclick="copyToClipboard('${c.value}', '${toastMsg.replace(/'/g, "\\'")}')">
                <div class="contact-item-icon">
                    <i class="${c.icon || 'fa-solid fa-envelope'}"></i>
                </div>
                <div class="contact-item-details">
                    <h4>${labelText}</h4>
                    <p>${c.value}</p>
                </div>
            </div>
        `;
    }).join("");
}

function copyToClipboard(text, toastMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast(toastMsg);
        }).catch(() => {
            fallbackCopyText(text, toastMsg);
        });
    } else {
        fallbackCopyText(text, toastMsg);
    }
}

function fallbackCopyText(text, toastMsg) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showToast(toastMsg);
    } catch (e) {
        showToast(`Wartość: ${text}`);
    }
    document.body.removeChild(textarea);
}

function showToast(message) {
    let toastBox = document.getElementById('toast-container');
    if (!toastBox) {
        toastBox = document.createElement('div');
        toastBox.id = 'toast-container';
        document.body.appendChild(toastBox);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #22c55e;"></i> <span>${message}</span>`;

    toastBox.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

async function handleContactFormSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById('form-submit-btn');
    const t = translationsData[currentLang] || {};

    const form = event.target;
    const nameInput = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const messageInput = form.querySelector('[name="message"]');

    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const message = messageInput ? messageInput.value.trim() : '';

    if (!name || !email || !message) return;

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t.formSending || 'Wysyłanie...'}`;
    }

    const targetEmail = config.contactEmail || (contactsData.find(c => c.id === 'email') || contactsData.find(c => c.id === 'email-project'))?.value || 'mr.kazanek@gmail.com';

    try {
        const response = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email,
                message: message,
                _subject: `Nowa wiadomość ze strony QozaWorks od ${name}`,
                _captcha: "false"
            })
        });

        const data = await response.json();

        if (response.ok || data.success === "true" || data.success === true) {
            showToast(t.formSuccess || 'Dziękuję! Twoja wiadomość została pomyślnie wysłana.');
            form.reset();
        } else {
            showToast(t.formError || 'Wystąpił błąd podczas wysyłania wiadomości.');
        }
    } catch (err) {
        showToast(t.formError || 'Wystąpił błąd podczas wysyłania wiadomości.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span data-i18n="formSubmit">${t.formSubmit || 'Wyślij Wiadomość'}</span>`;
        }
    }
}

function backToHome() {
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMobileMenu(event) {
    if (event) event.stopPropagation();
    const menuBtn = document.getElementById('mobile-menu-btn');
    const siteNav = document.getElementById('site-nav');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (menuBtn && siteNav) {
        const isOpen = siteNav.classList.toggle('active');
        menuBtn.classList.toggle('active');
        backdrop?.classList.toggle('active', isOpen);
        menuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }
}

function closeMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const siteNav = document.getElementById('site-nav');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (menuBtn && siteNav) {
        menuBtn.classList.remove('active');
        siteNav.classList.remove('active');
        backdrop?.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('project-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value;
            renderProjects();
        });
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategoryFilter = btn.getAttribute('data-filter') || 'all';
            renderProjects();
        });
    });

    document.addEventListener('click', (e) => {
        const headerContainer = document.getElementById('site-header-container');
        if (headerContainer && !headerContainer.contains(e.target)) {
            closeMobileMenu();
        }
    });

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const siteHeader = document.getElementById('site-header');
                if (window.scrollY > 20) {
                    siteHeader?.classList.add('scrolled');
                } else {
                    siteHeader?.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || document.activeElement.isContentEditable) {
            return;
        }

        keyBuffer += e.key.toLowerCase();
        if (keyBuffer.length > 20) keyBuffer = keyBuffer.slice(-20);

        if (keyBuffer.endsWith('koza')) {
            keyBuffer = '';
            triggerGoatEasterEgg();
        }
    });
}

function triggerGoatEasterEgg() {
    const t = translationsData[currentLang] || {};
    showToast(t.easterEggToast || '🐐 Znalazłeś easter egga! Koza została przywołana!');

    try {
        const goatAudio = new Audio(config.goatSound || 'assets/goat.mp3');
        goatAudio.play().catch(() => {
            playSyntheticGoat();
        });
    } catch (e) {
        playSyntheticGoat();
    }
}

function playSyntheticGoat() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(280, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.45);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
    } catch (err) {}
}

document.addEventListener('DOMContentLoaded', loadData);