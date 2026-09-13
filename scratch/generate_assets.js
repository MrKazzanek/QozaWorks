const fs = require('fs');
const path = require('path');

const base = 'c:/Users/mrkaz/Desktop/QozaWorks';
fs.mkdirSync(path.join(base, 'assets/site'), { recursive: true });
fs.mkdirSync(path.join(base, 'assets/projects'), { recursive: true });

const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="600" viewBox="0 0 1200 600">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f1015"/>
      <stop offset="50%" stop-color="#1e2029"/>
      <stop offset="100%" stop-color="#2a2c3a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="600" fill="url(#g)"/>
  <circle cx="600" cy="250" r="280" fill="#3a3d52" opacity="0.3"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="42" font-family="sans-serif" opacity="0.25">KAZANEK HERO BANNER</text>
</svg>`;

const avatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" rx="40" fill="#1c1e28"/>
  <circle cx="200" cy="140" r="75" fill="#e0e0e0"/>
  <path d="M70 340 C70 240 120 210 200 210 C280 210 330 240 330 340 Z" fill="#e0e0e0"/>
</svg>`;

fs.writeFileSync(path.join(base, 'assets/site/banner.svg'), bannerSvg);
fs.writeFileSync(path.join(base, 'assets/site/avatar.svg'), avatarSvg);
fs.writeFileSync(path.join(base, 'assets/site/banner.png'), bannerSvg); // fallback reference
fs.writeFileSync(path.join(base, 'assets/site/avatar.png'), avatarSvg); // fallback reference

console.log('Asset placeholders generated cleanly.');
