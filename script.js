document.addEventListener('DOMContentLoaded', () => {

    // --- ELEMENT SELECTORS ---
    const themeToggleButton = document.getElementById('theme-toggle');
    const langToggleButton = document.getElementById('lang-toggle');
    const langOptions = document.querySelector('.lang-options');
    const hamburgerButton = document.getElementById('hamburger-btn');
    const navLinks = document.getElementById('nav-links');
    const searchInput = document.getElementById('search-input');

    // --- STATE MANAGEMENT ---
    let currentLang = localStorage.getItem('lang') || 'eng';
    let currentTheme = localStorage.getItem('theme') || 'system';

    // --- THEME SWITCHER LOGIC ---
    const applyTheme = (theme) => {
        const root = document.documentElement;
        const icon = themeToggleButton.querySelector('i');
        const isDark = (theme === 'dark') || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
        localStorage.setItem('theme', theme);
        currentTheme = theme;
    };

    themeToggleButton.addEventListener('click', () => {
        const newTheme = (document.documentElement.getAttribute('data-theme') === 'dark') ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (currentTheme === 'system') {
            apyTheme('system');
        }
    });

    // --- LANGUAGE SWITCHER LOGIC ---
    const updateContent = (content) => {
        document.querySelectorAll('[data-lang-key]').forEach(el => {
            const key = el.dataset.langKey;
            if (content[key]) el.textContent = content[key];
        });

        document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
            const key = el.dataset.langKeyPlaceholder;
            if (content[key]) el.placeholder = content[key];
        });

        const createProjectCard = (p) => `
            <div class="project-card" data-search-text="${p.name.toLowerCase()} ${p.description.toLowerCase()} ${p.type.toLowerCase()}">
                <img src="${p.image}" alt="${p.name}">
                <div class="project-content">
                    <h4>${p.name}</h4>
                    <p>${p.description}</p>
                    <div class="project-tags">
                        <span><i class="fas fa-info-circle"></i> ${p.status}</span>
                        <span><i class="fas fa-code"></i> ${p.type}</span>
                    </div>
                    <a href="${p.link}" class="project-link" target="_blank">${content.projectLinkText} <i class="fas fa-arrow-right"></i></a>
                </div>
            </div>`;

        document.getElementById('minecraft-projects-container').innerHTML = content.projects.minecraft.map(createProjectCard).join('');
        document.getElementById('other-projects-container').innerHTML = content.projects.other.map(createProjectCard).join('');

        document.getElementById('partnerships-container').innerHTML = content.partnerships.map(p => `
            <div class="partner-card">
                ${p.image ? `<img src="${p.image}" alt="${p.name} Logo" class="partner-logo">` : ''}
                <h4>${p.name}</h4>
                <p>${p.description}</p>
                <p><strong>${p.duration.from} - ${p.duration.to}</strong></p>
                ${p.link ? `<a href="${p.link}" target="_blank" class="partner-link cta-button">${content.partnerLinkText}</a>` : ''}
            </div>`).join('');
        
        document.getElementById('reviews-container').innerHTML = content.reviews.map(r => `
            <div class="review-card">
                <img src="${r.avatar}" alt="${r.author}"><p>"${r.opinion}"</p><strong>- ${r.author}</strong>
            </div>`).join('');

        document.getElementById('contact-container').innerHTML = `
            <div class="contact-card">
                <h3>${content.contactDetailsTitle}</h3>
                ${content.contact.emails.map(email => `<p><i class="fas fa-envelope"></i> ${email}</p>`).join('')}
                <p><i class="fab fa-discord"></i> ${content.contact.discord}</p>
            </div>
            <div class="contact-card">
                <h3>${content.socialMediaTitle}</h3>
                ${Object.entries(content.contact.social).map(([key, value]) => 
                    `<a href="${value.url}" target="_blank"><i class="${value.icon}"></i> ${key}</a>`
                ).join('')}
            </div>`;
    };

    const loadLanguage = async (lang) => {
        try {
            const response = await fetch(`contents-${lang}.json`);
            if (!response.ok) throw new Error('Network response was not ok');
            const content = await response.json();
            updateContent(content);
            document.documentElement.lang = lang;
            localStorage.setItem('lang', lang);
            currentLang = lang;
        } catch (error) {
            console.error('Failed to load language content:', error);
        }
    };

    langToggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        langOptions.classList.toggle('show');
    });

    document.addEventListener('click', () => langOptions.classList.remove('show'));

    langOptions.addEventListener('click', (e) => {
        e.preventDefault();
        const lang = e.target.dataset.lang;
        if (lang && lang !== currentLang) {
            loadLanguage(lang);
        }
    });

    // --- SEARCH FILTER ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.project-card').forEach(card => {
            const cardText = card.dataset.searchText;
            card.style.display = cardText.includes(searchTerm) ? '' : 'none';
        });
    });

    // --- MOBILE MENU ---
    hamburgerButton.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = hamburgerButton.querySelector('i');
        icon.className = navLinks.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
    });

    // --- INITIALIZATION ---
    applyTheme(currentTheme);
    loadLanguage(currentLang);

});

