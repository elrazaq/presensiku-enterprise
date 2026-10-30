const fs = require('fs');
const path = require('path');
const sharp = require('./frontend/node_modules/sharp');

const OUT_PATH = path.join(__dirname, 'docs', 'marketing', 'cover_produk_presensiku.png');

async function buildCover() {
  console.log('Generating commercial marketplace cover...');

  // Resize and prepare dashboard screenshot (scaled for mockup)
  const dashboardRaw = path.join(__dirname, 'docs', 'screenshots', '01-dashboard-eksekutif.png');
  const mobileHomeRaw = path.join(__dirname, 'docs', 'screenshots', '08-mobile-home.png');
  const mobileQrRaw = path.join(__dirname, 'docs', 'screenshots', '09-mobile-qr-scanner.png');

  const dashboardImg = await sharp(dashboardRaw)
    .resize(660, 410, { fit: 'cover' })
    .png()
    .toBuffer();

  const mobileHomeImg = await sharp(mobileHomeRaw)
    .resize(230, 490, { fit: 'contain' })
    .png()
    .toBuffer();

  const mobileQrImg = await sharp(mobileQrRaw)
    .resize(210, 450, { fit: 'contain' })
    .png()
    .toBuffer();

  // Base SVG Background and Graphics Layout (1280 x 720)
  const baseSvg = `
  <svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#070C1B"/>
        <stop offset="50%" stop-color="#0F1E36"/>
        <stop offset="100%" stop-color="#091427"/>
      </linearGradient>
      <linearGradient id="glowTeal" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#38BDF8"/>
        <stop offset="100%" stop-color="#0284C7"/>
      </linearGradient>
      <linearGradient id="glowEmerald" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#34D399"/>
        <stop offset="100%" stop-color="#059669"/>
      </linearGradient>
      <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FDE047"/>
        <stop offset="100%" stop-color="#CA8A04"/>
      </linearGradient>
      <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
      <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="60" result="blur"/>
      </filter>
    </defs>

    <!-- Background -->
    <rect width="1280" height="720" fill="url(#bg)"/>

    <!-- Decorative Glow Orbs -->
    <circle cx="150" cy="180" r="220" fill="#0284C7" opacity="0.12" filter="url(#softGlow)"/>
    <circle cx="1100" cy="300" r="280" fill="#0EA5E9" opacity="0.15" filter="url(#softGlow)"/>
    <circle cx="700" cy="650" r="200" fill="#059669" opacity="0.10" filter="url(#softGlow)"/>

    <!-- Subtle Tech Grid Lines -->
    <g stroke="#1E293B" stroke-width="1" opacity="0.4">
      <line x1="0" y1="120" x2="1280" y2="120"/>
      <line x1="0" y1="240" x2="1280" y2="240"/>
      <line x1="0" y1="360" x2="1280" y2="360"/>
      <line x1="0" y1="480" x2="1280" y2="480"/>
      <line x1="0" y1="600" x2="1280" y2="600"/>
      <line x1="160" y1="0" x2="160" y2="720"/>
      <line x1="320" y1="0" x2="320" y2="720"/>
      <line x1="480" y1="0" x2="480" y2="720"/>
      <line x1="640" y1="0" x2="640" y2="720"/>
      <line x1="800" y1="0" x2="800" y2="720"/>
      <line x1="960" y1="0" x2="960" y2="720"/>
      <line x1="1120" y1="0" x2="1120" y2="720"/>
    </g>

    <!-- LEFT SIDE: Marketing Typography & Badges -->
    <g transform="translate(60, 60)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
      <!-- Enterprise Category Pill -->
      <g>
        <rect width="320" height="34" rx="17" fill="#0F172A" stroke="#38BDF8" stroke-width="1.2"/>
        <circle cx="18" cy="17" r="5" fill="#10B981"/>
        <text x="32" y="22" fill="#38BDF8" font-size="12" font-weight="800" letter-spacing="1.5">SOURCE CODE SIAP PAKAI • FULL STACK</text>
      </g>

      <!-- Main Headline -->
      <text x="0" y="85" fill="#FFFFFF" font-size="44" font-weight="900" letter-spacing="-0.5">PresensiKu Enterprise</text>
      <text x="0" y="125" fill="#38BDF8" font-size="24" font-weight="800">Sistem Presensi Anti-Fraud &amp; Geofencing</text>
      
      <text x="0" y="165" fill="#94A3B8" font-size="14.5" font-weight="400">
        Solusi lengkap absensi kantor anti-kecurangan untuk Android &amp; Web Admin.
      </text>
      <text x="0" y="188" fill="#94A3B8" font-size="14.5" font-weight="400">
        Terintegrasi Anti-Fake GPS, Device ID Binding, &amp; Cloudinary CDN Storage.
      </text>

      <!-- Key Features Checkmarks Grid -->
      <g transform="translate(0, 220)">
        <!-- Row 1 -->
        <g transform="translate(0, 0)">
          <circle cx="12" cy="12" r="12" fill="#10B981" fill-opacity="0.2"/>
          <path d="M 7 12 L 10 15 L 17 8" stroke="#10B981" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <text x="32" y="17" fill="#F8FAFC" font-size="14" font-weight="700">Anti-Mock GPS (Fake Location Detector)</text>
        </g>
        <g transform="translate(0, 42)">
          <circle cx="12" cy="12" r="12" fill="#10B981" fill-opacity="0.2"/>
          <path d="M 7 12 L 10 15 L 17 8" stroke="#10B981" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <text x="32" y="17" fill="#F8FAFC" font-size="14" font-weight="700">Device ID Hardware Binding (Anti-Titip Absen)</text>
        </g>
        <g transform="translate(0, 84)">
          <circle cx="12" cy="12" r="12" fill="#10B981" fill-opacity="0.2"/>
          <path d="M 7 12 L 10 15 L 17 8" stroke="#10B981" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <text x="32" y="17" fill="#F8FAFC" font-size="14" font-weight="700">Dynamic QR Kiosk TOTP (Refresh 30 Detik)</text>
        </g>
        <g transform="translate(0, 126)">
          <circle cx="12" cy="12" r="12" fill="#10B981" fill-opacity="0.2"/>
          <path d="M 7 12 L 10 15 L 17 8" stroke="#10B981" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <text x="32" y="17" fill="#F8FAFC" font-size="14" font-weight="700">Selfie Biometrik + Auto-Watermark Cloudinary</text>
        </g>
        <g transform="translate(0, 168)">
          <circle cx="12" cy="12" r="12" fill="#10B981" fill-opacity="0.2"/>
          <path d="M 7 12 L 10 15 L 17 8" stroke="#10B981" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <text x="32" y="17" fill="#F8FAFC" font-size="14" font-weight="700">Shift Malam 24 Jam &amp; Sistem Dispensasi 3x</text>
        </g>
      </g>

      <!-- Technology Stack Badges Bottom -->
      <g transform="translate(0, 450)">
        <!-- Badge 1: Flutter -->
        <g transform="translate(0, 0)">
          <rect width="112" height="34" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1"/>
          <text x="56" y="21" fill="#38BDF8" font-size="12" font-weight="bold" text-anchor="middle">Flutter Android</text>
        </g>
        <!-- Badge 2: Golang -->
        <g transform="translate(122, 0)">
          <rect width="112" height="34" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1"/>
          <text x="56" y="21" fill="#00ADD8" font-size="12" font-weight="bold" text-anchor="middle">Golang REST</text>
        </g>
        <!-- Badge 3: gRPC -->
        <g transform="translate(244, 0)">
          <rect width="90" height="34" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1"/>
          <text x="45" y="21" fill="#244c5a" font-size="12" font-weight="bold" text-anchor="middle">gRPC API</text>
        </g>
        <!-- Badge 4: Next.js 15 -->
        <g transform="translate(344, 0)">
          <rect width="105" height="34" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1"/>
          <text x="52" y="21" fill="#FFFFFF" font-size="12" font-weight="bold" text-anchor="middle">Next.js 15</text>
        </g>
      </g>

      <!-- Commercial Guarantee Box -->
      <g transform="translate(0, 508)">
        <rect width="455" height="74" rx="16" fill="#0F172A" stroke="#FDE047" stroke-width="1.2"/>
        <g transform="translate(20, 20)">
          <!-- Trophy / Star Icon -->
          <circle cx="16" cy="16" r="16" fill="url(#goldGrad)"/>
          <text x="16" y="22" fill="#0B132B" font-size="16" font-weight="bold" text-anchor="middle">★</text>
          <text x="44" y="14" fill="#FDE047" font-size="13" font-weight="bold">PRODUK PREMIUM SIAP DEPLOY &amp; DIJUAL KEMBALI</text>
          <text x="44" y="30" fill="#E2E8F0" font-size="11">Termasuk APK Rilis, Web Dashboard, Database Schema &amp; Dokumentasi</text>
        </g>
      </g>
    </g>

    <!-- RIGHT SIDE: Laptop & Mobile Device Mockup Frames -->
    <!-- Laptop Mockup (Web Admin) Frame -->
    <g transform="translate(560, 65)" filter="url(#dropShadow)">
      <!-- Laptop Top Bezel -->
      <rect width="676" height="428" rx="14" fill="#0F172A" stroke="#334155" stroke-width="2"/>
      <!-- Window Controls -->
      <circle cx="20" cy="16" r="4.5" fill="#EF4444"/>
      <circle cx="34" cy="16" r="4.5" fill="#F59E0B"/>
      <circle cx="48" cy="16" r="4.5" fill="#10B981"/>
      <text x="338" y="19" fill="#64748B" font-size="10.5" font-weight="600" text-anchor="middle">PresensiKu Enterprise — Web Executive Dashboard</text>
      <!-- Screen Area placeholder (composite image placed here at 568, 93) -->
      <rect x="8" y="28" width="660" height="392" fill="#020617"/>
      <!-- Laptop Base -->
      <path d="M -30 428 L 706 428 L 686 442 L -10 442 Z" fill="#1E293B" stroke="#334155" stroke-width="1"/>
      <rect x="300" y="428" width="76" height="4" rx="2" fill="#64748B"/>
    </g>

    <!-- Smartphone Mockup 1 (Mobile Home) Frame -->
    <g transform="translate(930, 205)" filter="url(#dropShadow)">
      <rect width="242" height="502" rx="36" fill="#020617" stroke="#38BDF8" stroke-width="2.5"/>
      <!-- Camera Notch -->
      <rect x="86" y="8" width="70" height="14" rx="7" fill="#0F172A"/>
      <circle cx="106" cy="15" r="3" fill="#1E293B"/>
    </g>

    <!-- Smartphone Mockup 2 (QR Scanner) Frame -->
    <g transform="translate(805, 245)" filter="url(#dropShadow)">
      <rect width="222" height="462" rx="34" fill="#020617" stroke="#10B981" stroke-width="2.5"/>
      <!-- Camera Notch -->
      <rect x="76" y="8" width="70" height="14" rx="7" fill="#0F172A"/>
    </g>
  </svg>
  `;

  // Composite the real screenshots into the mockups
  const baseImg = await sharp(Buffer.from(baseSvg)).png().toBuffer();

  await sharp(baseImg)
    .composite([
      // Web Dashboard inside Laptop
      {
        input: dashboardImg,
        top: 93,
        left: 568,
      },
      // Mobile QR Scanner inside left phone
      {
        input: mobileQrImg,
        top: 251,
        left: 811,
      },
      // Mobile Home inside front phone
      {
        input: mobileHomeImg,
        top: 211,
        left: 936,
      },
    ])
    .png({ quality: 100 })
    .toFile(OUT_PATH);

  console.log('Commercial cover generated successfully at:', OUT_PATH);
}

buildCover().catch(err => {
  console.error('Failed to generate cover:', err);
  process.exit(1);
});
