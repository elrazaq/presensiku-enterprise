const fs = require('fs');
const path = require('path');
const sharp = require('./frontend/node_modules/sharp');
const QRCode = require('./frontend/node_modules/qrcode');

const OUT_DIR = path.join(__dirname, 'docs', 'screenshots');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function getCommonPhoneFrame(innerSvg, title = '') {
  return `
  <svg width="430" height="920" viewBox="0 0 430 920" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0B132B"/>
        <stop offset="100%" stop-color="#0F1E36"/>
      </linearGradient>
      <linearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#0EA5E9"/>
        <stop offset="100%" stop-color="#0284C7"/>
      </linearGradient>
      <linearGradient id="wineGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#9F1239"/>
        <stop offset="100%" stop-color="#881337"/>
      </linearGradient>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#1E293B"/>
        <stop offset="100%" stop-color="#0F172A"/>
      </linearGradient>
      <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.35"/>
      </filter>
    </defs>

    <!-- Phone Screen Background -->
    <rect width="430" height="920" fill="url(#bgGrad)"/>

    <!-- Android Status Bar -->
    <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
      <text x="24" y="28" fill="#FFFFFF" font-size="13" font-weight="600">08:15</text>
      <!-- Status Icons Right -->
      <g transform="translate(345, 17)">
        <!-- 5G -->
        <text x="0" y="11" fill="#FFFFFF" font-size="10" font-weight="bold">5G</text>
        <!-- Wifi icon -->
        <path d="M 24 10 A 6 6 0 0 1 34 10 M 26 12 A 3 3 0 0 1 32 12 M 29 14 A 1 1 0 0 1 29 14.5" stroke="#FFFFFF" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <!-- Battery Icon -->
        <rect x="42" y="2" width="22" height="11" rx="2.5" fill="none" stroke="#FFFFFF" stroke-width="1.2"/>
        <rect x="64.5" y="5" width="2" height="5" rx="0.8" fill="#FFFFFF"/>
        <rect x="44" y="4" width="16" height="7" rx="1.5" fill="#10B981"/>
      </g>
    </g>

    <!-- Dynamic App Screen Content -->
    ${innerSvg}
  </svg>
  `;
}

// 1. SCREEN 7: Login &amp; Device ID Binding
function renderLoginScreen() {
  const content = `
    <!-- Logo &amp; Branding -->
    <g transform="translate(215, 140)">
      <circle r="44" fill="url(#tealGrad)" filter="url(#shadow)"/>
      <!-- Shield Icon -->
      <path d="M -16 -12 L 0 -22 L 16 -12 L 16 6 C 16 18 0 26 0 26 C 0 26 -16 18 -16 6 Z" fill="#0B132B"/>
      <path d="M -7 4 L -1 10 L 9 -2" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <text y="75" fill="#FFFFFF" font-size="22" font-weight="bold" text-anchor="middle">PresensiKu</text>
      <text y="95" fill="#38BDF8" font-size="12" font-weight="700" letter-spacing="3" text-anchor="middle">ENTERPRISE EDITION</text>
      <text y="115" fill="#94A3B8" font-size="11" text-anchor="middle">Sistem Absensi Geofence &amp; Audit Integritas</text>
    </g>

    <!-- Login Card -->
    <g transform="translate(24, 305)">
      <rect width="382" height="360" rx="24" fill="#162032" stroke="#1E293B" stroke-width="1.5" filter="url(#shadow)"/>

      <!-- NIP Field -->
      <g transform="translate(20, 30)">
        <text x="0" y="0" fill="#E2E8F0" font-size="12" font-weight="600">Nomor Induk Pegawai (NIP)</text>
        <rect y="10" width="342" height="48" rx="14" fill="#0B132B" stroke="#334155" stroke-width="1.2"/>
        <!-- User Icon -->
        <circle cx="24" cy="34" r="6" fill="#64748B"/>
        <path d="M 16 46 A 8 6 0 0 1 32 46" fill="#64748B"/>
        <text x="44" y="40" fill="#FFFFFF" font-size="14" font-weight="600" font-family="monospace">19920315002</text>
      </g>

      <!-- Password Field -->
      <g transform="translate(20, 110)">
        <text x="0" y="0" fill="#E2E8F0" font-size="12" font-weight="600">Kata Sandi</text>
        <rect y="10" width="342" height="48" rx="14" fill="#0B132B" stroke="#334155" stroke-width="1.2"/>
        <!-- Lock Icon -->
        <rect x="18" y="30" width="14" height="12" rx="2" fill="#64748B"/>
        <path d="M 21 30 L 21 25 A 4 4 0 0 1 29 25 L 29 30" stroke="#64748B" stroke-width="2" fill="none"/>
        <text x="44" y="40" fill="#FFFFFF" font-size="14" font-weight="bold">••••••••••••••••</text>
      </g>

      <!-- Remember &amp; Forgot -->
      <g transform="translate(20, 190)">
        <circle cx="8" cy="8" r="8" fill="#0EA5E9"/>
        <path d="M 5 8 L 8 11 L 12 5" stroke="#FFFFFF" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <text x="24" y="12" fill="#94A3B8" font-size="12">Ingat perangkat ini</text>
        <text x="342" y="12" fill="#38BDF8" font-size="12" font-weight="600" text-anchor="end">Lupa Sandi?</text>
      </g>

      <!-- Submit Button -->
      <g transform="translate(20, 225)">
        <rect width="342" height="50" rx="16" fill="url(#tealGrad)" filter="url(#shadow)"/>
        <text x="171" y="31" fill="#FFFFFF" font-size="15" font-weight="bold" text-anchor="middle">Masuk ke Akun Pegawai</text>
      </g>

      <!-- Device Binding Notice -->
      <g transform="translate(20, 298)">
        <rect width="342" height="42" rx="12" fill="#0B132B" stroke="#0EA5E9" stroke-width="1" stroke-dasharray="4,4"/>
        <circle cx="22" cy="21" r="9" fill="#10B981" fill-opacity="0.2"/>
        <path d="M 18 21 L 21 24 L 27 18" stroke="#10B981" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <text x="38" y="18" fill="#F8FAFC" font-size="10.5" font-weight="bold">Device Hardware Binding Aktif</text>
        <text x="38" y="31" fill="#94A3B8" font-size="9.5">ID: SM-G998B • Terverifikasi pada Database Enterprise</text>
      </g>
    </g>

    <!-- Footer -->
    <text x="215" y="880" fill="#64748B" font-size="11" text-anchor="middle">PT PresensiKu Enterprise Indonesia • Hak Cipta Dilindungi</text>
  `;
  return getCommonPhoneFrame(content);
}

// 2. SCREEN 8: Mobile Home Dashboard
function renderHomeScreen() {
  const content = `
    <!-- Header -->
    <g transform="translate(24, 60)">
      <text x="0" y="0" fill="#94A3B8" font-size="12" font-weight="500">Welcome Back,</text>
      <text x="0" y="24" fill="#FFFFFF" font-size="20" font-weight="bold">Budi Santoso, S.Kom</text>
      <!-- Notification Icon -->
      <g transform="translate(350, 6)">
        <circle cx="12" cy="12" r="18" fill="#1E293B"/>
        <path d="M 7 14 C 7 10 9 8 12 8 C 15 8 17 10 17 14 L 18 16 L 6 16 Z M 10 17 A 2 2 0 0 0 14 17" fill="#E2E8F0"/>
        <circle cx="18" cy="6" r="4.5" fill="#EF4444"/>
      </g>
    </g>

    <!-- Executive Card (Shift &amp; Attendance Status) -->
    <g transform="translate(24, 115)">
      <rect width="382" height="175" rx="24" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" filter="url(#shadow)"/>

      <!-- Card Top: Company &amp; Badge -->
      <text x="20" y="32" fill="#38BDF8" font-size="11" font-weight="800" letter-spacing="1.5">PRESENSIKU ENTERPRISE</text>
      <rect x="290" y="18" width="72" height="20" rx="10" fill="#10B981" fill-opacity="0.2"/>
      <text x="326" y="32" fill="#10B981" font-size="9.5" font-weight="bold" text-anchor="middle">● AKTIF</text>

      <!-- Middle: NIP -->
      <text x="20" y="65" fill="#64748B" font-size="11">Nomor Induk Pegawai</text>
      <text x="20" y="90" fill="#FFFFFF" font-size="19" font-family="monospace" font-weight="700" letter-spacing="2">19920315002</text>

      <!-- Bottom Info &amp; Action -->
      <g transform="translate(20, 115)">
        <text x="0" y="15" fill="#E2E8F0" font-size="12" font-weight="600">Shift Reguler Pagi (08:00 - 17:00)</text>
        <text x="0" y="32" fill="#FDE047" font-size="11" font-weight="bold">Batas Masuk: 12:00 WIB (Cut-Off)</text>

        <!-- Primary Action Button (Absen QR) -->
        <g transform="translate(225, 3)">
          <rect width="117" height="38" rx="12" fill="url(#tealGrad)" filter="url(#shadow)"/>
          <!-- QR icon -->
          <rect x="14" y="11" width="16" height="16" fill="none" stroke="#FFFFFF" stroke-width="2"/>
          <text x="70" y="24" fill="#FFFFFF" font-size="12" font-weight="bold" text-anchor="middle">Absen QR</text>
        </g>
      </g>
    </g>

    <!-- Grid Title -->
    <text x="24" y="322" fill="#FFFFFF" font-size="14" font-weight="bold">Menu Layanan Presensi</text>

    <!-- 8 Action Tiles (2 rows x 4 columns) -->
    <g transform="translate(24, 338)">
      <!-- Row 1 -->
      <!-- Tile 1: Absen QR -->
      <g transform="translate(0, 0)">
        <rect width="80" height="74" rx="16" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <circle cx="40" cy="28" r="16" fill="#0EA5E9" fill-opacity="0.15"/>
        <rect x="33" y="21" width="14" height="14" fill="none" stroke="#0EA5E9" stroke-width="1.8"/>
        <text x="40" y="58" fill="#E2E8F0" font-size="10.5" font-weight="600" text-anchor="middle">Absen QR</text>
      </g>
      <!-- Tile 2: Selfie -->
      <g transform="translate(100, 0)">
        <rect width="80" height="74" rx="16" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <circle cx="40" cy="28" r="16" fill="#E11D48" fill-opacity="0.15"/>
        <circle cx="40" cy="26" r="6" stroke="#FB7185" stroke-width="1.6" fill="none"/>
        <path d="M 32 37 A 8 5 0 0 1 48 37" fill="#FB7185"/>
        <text x="40" y="58" fill="#E2E8F0" font-size="10.5" font-weight="600" text-anchor="middle">Selfie Wajah</text>
      </g>
      <!-- Tile 3: Dispensasi -->
      <g transform="translate(200, 0)">
        <rect width="80" height="74" rx="16" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <circle cx="40" cy="28" r="16" fill="#0EA5E9" fill-opacity="0.15"/>
        <rect x="34" y="21" width="12" height="15" rx="1.5" stroke="#38BDF8" stroke-width="1.6" fill="none"/>
        <text x="40" y="58" fill="#E2E8F0" font-size="10.5" font-weight="600" text-anchor="middle">Dispensasi</text>
      </g>
      <!-- Tile 4: Riwayat -->
      <g transform="translate(300, 0)">
        <rect width="82" height="74" rx="16" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <circle cx="41" cy="28" r="16" fill="#3B82F6" fill-opacity="0.15"/>
        <circle cx="41" cy="28" r="7" stroke="#60A5FA" stroke-width="1.6" fill="none"/>
        <path d="M 41 24 L 41 28 L 44 28" stroke="#60A5FA" stroke-width="1.6" stroke-linecap="round"/>
        <text x="41" y="58" fill="#E2E8F0" font-size="10.5" font-weight="600" text-anchor="middle">Riwayat</text>
      </g>

      <!-- Row 2 -->
      <!-- Tile 5: Geofence -->
      <g transform="translate(0, 88)">
        <rect width="80" height="74" rx="16" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <circle cx="40" cy="28" r="16" fill="#10B981" fill-opacity="0.15"/>
        <circle cx="40" cy="27" r="4" fill="#34D399"/>
        <circle cx="40" cy="27" r="8" stroke="#34D399" stroke-width="1.4" fill="none"/>
        <text x="40" y="58" fill="#E2E8F0" font-size="10.5" font-weight="600" text-anchor="middle">Geofence</text>
      </g>
      <!-- Tile 6: Jadwal -->
      <g transform="translate(100, 88)">
        <rect width="80" height="74" rx="16" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <circle cx="40" cy="28" r="16" fill="#F59E0B" fill-opacity="0.15"/>
        <rect x="33" y="22" width="14" height="13" rx="2" stroke="#FBBF24" stroke-width="1.6" fill="none"/>
        <text x="40" y="58" fill="#E2E8F0" font-size="10.5" font-weight="600" text-anchor="middle">Jadwal Shift</text>
      </g>
      <!-- Tile 7: Perangkat -->
      <g transform="translate(200, 88)">
        <rect width="80" height="74" rx="16" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <circle cx="40" cy="28" r="16" fill="#8B5CF6" fill-opacity="0.15"/>
        <rect x="35" y="21" width="10" height="15" rx="2" stroke="#A78BFA" stroke-width="1.6" fill="none"/>
        <text x="40" y="58" fill="#E2E8F0" font-size="10.5" font-weight="600" text-anchor="middle">Perangkat</text>
      </g>
      <!-- Tile 8: HRD -->
      <g transform="translate(300, 88)">
        <rect width="82" height="74" rx="16" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <circle cx="41" cy="28" r="16" fill="#EC4899" fill-opacity="0.15"/>
        <circle cx="41" cy="28" r="6" fill="#F472B6"/>
        <text x="41" y="58" fill="#E2E8F0" font-size="10.5" font-weight="600" text-anchor="middle">Layanan HRD</text>
      </g>
    </g>

    <!-- Monthly Statistics -->
    <text x="24" y="534" fill="#FFFFFF" font-size="14" font-weight="bold">Statistik Presensi Bulan Ini</text>
    <g transform="translate(24, 548)">
      <rect width="118" height="85" rx="18" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
      <text x="16" y="28" fill="#94A3B8" font-size="11">Kehadiran</text>
      <text x="16" y="54" fill="#10B981" font-size="20" font-weight="bold">96.8%</text>
      <text x="16" y="72" fill="#64748B" font-size="10">21 Hari Hadir</text>

      <g transform="translate(132, 0)">
        <rect width="118" height="85" rx="18" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <text x="16" y="28" fill="#94A3B8" font-size="11">Keterlambatan</text>
        <text x="16" y="54" fill="#38BDF8" font-size="20" font-weight="bold">0x</text>
        <text x="16" y="72" fill="#64748B" font-size="10">Disiplin Penuh</text>
      </g>

      <g transform="translate(264, 0)">
        <rect width="118" height="85" rx="18" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <text x="16" y="28" fill="#94A3B8" font-size="11">Dispensasi</text>
        <text x="16" y="54" fill="#F59E0B" font-size="20" font-weight="bold">1 / 3</text>
        <text x="16" y="72" fill="#64748B" font-size="10">Sisa 2 Kuota</text>
      </g>
    </g>

    <!-- Recent Attendance Log Card -->
    <text x="24" y="665" fill="#FFFFFF" font-size="14" font-weight="bold">Aktivitas Presensi Terkini</text>
    <g transform="translate(24, 680)">
      <rect width="382" height="74" rx="18" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
      <circle cx="36" cy="37" r="18" fill="#10B981" fill-opacity="0.15"/>
      <path d="M 28 37 L 34 43 L 44 31" stroke="#10B981" stroke-width="2.5" fill="none" stroke-linecap="round"/>

      <text x="68" y="30" fill="#FFFFFF" font-size="13" font-weight="bold">Presensi Masuk • 07:54 WIB</text>
      <text x="68" y="48" fill="#94A3B8" font-size="11">QR TOTP Kiosk • Jarak 14.2m dari Kantor</text>

      <rect x="290" y="24" width="76" height="24" rx="12" fill="#10B981" fill-opacity="0.2"/>
      <text x="328" y="40" fill="#10B981" font-size="10.5" font-weight="bold" text-anchor="middle">TEPAT WAKTU</text>
    </g>

    <!-- Bottom Navigation Bar -->
    <g transform="translate(0, 836)">
      <rect width="430" height="84" fill="#0B132B" stroke="#1E293B" stroke-width="1"/>
      <g transform="translate(54, 18)">
        <circle cx="0" cy="0" r="14" fill="#0EA5E9" fill-opacity="0.2"/>
        <!-- Home icon -->
        <path d="M -7 2 L 0 -5 L 7 2 L 7 9 L -7 9 Z" fill="#38BDF8"/>
        <text x="0" y="22" fill="#38BDF8" font-size="10.5" font-weight="bold" text-anchor="middle">Beranda</text>
      </g>
      <g transform="translate(162, 18)">
        <rect x="-7" y="-6" width="14" height="15" rx="2" stroke="#64748B" stroke-width="1.6" fill="none"/>
        <text x="0" y="22" fill="#64748B" font-size="10.5" font-weight="500" text-anchor="middle">Riwayat</text>
      </g>
      <g transform="translate(270, 18)">
        <circle cx="0" cy="0" r="7" stroke="#64748B" stroke-width="1.6" fill="none"/>
        <text x="0" y="22" fill="#64748B" font-size="10.5" font-weight="500" text-anchor="middle">Izin</text>
      </g>
      <g transform="translate(376, 18)">
        <circle cx="0" cy="-3" r="5" fill="#64748B"/>
        <path d="M -6 8 A 6 5 0 0 1 6 8" fill="#64748B"/>
        <text x="0" y="22" fill="#64748B" font-size="10.5" font-weight="500" text-anchor="middle">Profil</text>
      </g>
    </g>
  `;
  return getCommonPhoneFrame(content);
}

// 3. SCREEN 9: QR Scanner Screen
async function renderQrScannerScreen() {
  const qrDataUrl = await QRCode.toDataURL('PKQR:V2:ENT:K7B94X2L9001:HMACSHA256:EXP30S', { margin: 1, width: 170 });
  const content = `
    <!-- Top App Bar -->
    <g transform="translate(24, 60)">
      <circle cx="16" cy="16" r="16" fill="#1E293B"/>
      <path d="M 20 10 L 14 16 L 20 22" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>
      <text x="44" y="22" fill="#FFFFFF" font-size="16" font-weight="bold">Scan Dynamic QR Kiosk (Masuk)</text>
      <!-- Flashlight &amp; Switch Camera -->
      <circle cx="340" cy="16" r="16" fill="#1E293B"/>
      <path d="M 340 9 L 336 17 L 341 17 L 339 23 L 344 15 L 340 15 Z" fill="#FDE047"/>
      <circle cx="380" cy="16" r="16" fill="#1E293B"/>
      <path d="M 374 13 A 6 6 0 0 1 386 13 M 386 19 A 6 6 0 0 1 374 19" stroke="#38BDF8" stroke-width="1.8" fill="none"/>
    </g>

    <!-- Mode Selector Toggle -->
    <g transform="translate(24, 115)">
      <rect width="382" height="46" rx="16" fill="#162D50" stroke="#1E293B" stroke-width="1"/>
      <!-- Absen Masuk (Active) -->
      <rect x="4" y="4" width="185" height="38" rx="12" fill="url(#tealGrad)" filter="url(#shadow)"/>
      <path d="M 50 23 L 56 23 M 53 19 L 57 23 L 53 27" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>
      <text x="105" y="28" fill="#FFFFFF" font-size="13" font-weight="bold" text-anchor="middle">Absen Masuk</text>

      <!-- Absen Pulang (Inactive) -->
      <path d="M 240 23 L 246 23 M 244 19 L 240 23 L 244 27" stroke="#94A3B8" stroke-width="2" fill="none" stroke-linecap="round"/>
      <text x="295" y="28" fill="#94A3B8" font-size="13" font-weight="500" text-anchor="middle">Absen Pulang</text>
    </g>

    <!-- Camera Viewfinder Simulation -->
    <g transform="translate(55, 200)">
      <!-- Outer Dark Vignette -->
      <rect width="320" height="320" rx="36" fill="#030712" stroke="#1E293B" stroke-width="2"/>

      <!-- QR Scanner Target Box -->
      <rect x="30" y="30" width="260" height="260" rx="28" fill="#0A0F1D" stroke="#0EA5E9" stroke-width="3" filter="url(#shadow)"/>

      <!-- Corner Highlights -->
      <path d="M 30 65 L 30 30 L 65 30" stroke="#38BDF8" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M 255 30 L 290 30 L 290 65" stroke="#38BDF8" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M 30 255 L 30 290 L 65 290" stroke="#38BDF8" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M 255 290 L 290 290 L 290 255" stroke="#38BDF8" stroke-width="5" fill="none" stroke-linecap="round"/>

      <!-- Embedded Clean QR Code -->
      <image href="${qrDataUrl}" x="75" y="75" width="170" height="170"/>

      <!-- Scanning Laser Line -->
      <line x1="40" y1="160" x2="280" y2="160" stroke="#38BDF8" stroke-width="2" opacity="0.8"/>
      <rect x="40" y="157" width="240" height="6" fill="#38BDF8" opacity="0.25"/>

      <!-- Security Badge Top -->
      <rect x="70" y="42" width="180" height="22" rx="11" fill="#0F172A" fill-opacity="0.9" stroke="#38BDF8" stroke-width="1"/>
      <circle cx="86" cy="53" r="4" fill="#10B981"/>
      <text x="165" y="57" fill="#F8FAFC" font-size="9.5" font-weight="bold" text-anchor="middle">HMAC-SHA256 TOTP Validator</text>
    </g>

    <!-- Geofence Safe GPS Pill Indicator -->
    <g transform="translate(24, 550)">
      <rect width="382" height="48" rx="24" fill="#064E3B" fill-opacity="0.85" stroke="#10B981" stroke-width="1.5"/>
      <circle cx="28" cy="24" r="10" fill="#10B981"/>
      <path d="M 24 24 L 27 27 L 33 21" stroke="#064E3B" stroke-width="2" fill="none" stroke-linecap="round"/>
      <text x="48" y="22" fill="#FFFFFF" font-size="12" font-weight="bold">Lokasi Valid • Dalam Radius Kantor</text>
      <text x="48" y="36" fill="#6EE7B7" font-size="10.5">Jarak 14.2m dari Titik Acuan (Toleransi Maksimal 30m)</text>
    </g>

    <!-- Anti-Fraud Info Card -->
    <g transform="translate(24, 620)">
      <rect width="382" height="110" rx="20" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
      <text x="24" y="32" fill="#FFFFFF" font-size="13" font-weight="bold">Petunjuk Presensi Kiosk</text>
      <text x="24" y="54" fill="#94A3B8" font-size="11.5">1. Arahkan kamera smartphone ke monitor layar lobi kantor.</text>
      <text x="24" y="74" fill="#94A3B8" font-size="11.5">2. QR Code terenkripsi otomatis diperbarui setiap 30 detik.</text>
      <text x="24" y="94" fill="#38BDF8" font-size="11" font-weight="600">✓ Proteksi Anti-Foto Layar &amp; Anti-Fake GPS Aktif</text>
    </g>
  `;
  return getCommonPhoneFrame(content);
}

// 4. SCREEN 10: Selfie Attendance Screen
function renderSelfieScreen() {
  const content = `
    <!-- Top App Bar -->
    <g transform="translate(24, 60)">
      <circle cx="16" cy="16" r="16" fill="#1E293B"/>
      <path d="M 20 10 L 14 16 L 20 22" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>
      <text x="44" y="22" fill="#FFFFFF" font-size="16" font-weight="bold">Presensi Foto Wajah (Masuk)</text>
      <!-- Switch Camera &amp; Refresh GPS -->
      <circle cx="340" cy="16" r="16" fill="#1E293B"/>
      <path d="M 334 13 A 6 6 0 0 1 346 13 M 346 19 A 6 6 0 0 1 334 19" stroke="#38BDF8" stroke-width="1.8" fill="none"/>
      <circle cx="380" cy="16" r="16" fill="#1E293B"/>
      <path d="M 380 10 L 380 22 M 374 16 L 386 16" stroke="#38BDF8" stroke-width="1.8" fill="none"/>
    </g>

    <!-- Mode Selector Toggle -->
    <g transform="translate(24, 115)">
      <rect width="382" height="46" rx="16" fill="#162D50" stroke="#1E293B" stroke-width="1"/>
      <!-- Absen Masuk (Active) -->
      <rect x="4" y="4" width="185" height="38" rx="12" fill="url(#tealGrad)" filter="url(#shadow)"/>
      <text x="96" y="28" fill="#FFFFFF" font-size="13" font-weight="bold" text-anchor="middle">Absen Masuk</text>
      <!-- Absen Pulang (Inactive) -->
      <text x="287" y="28" fill="#94A3B8" font-size="13" font-weight="500" text-anchor="middle">Absen Pulang</text>
    </g>

    <!-- Camera Preview Simulated View -->
    <g transform="translate(35, 180)">
      <rect width="360" height="460" rx="32" fill="#111827" stroke="#1E293B" stroke-width="2"/>

      <!-- Simulated Human Face Silhouette &amp; Oval Contour -->
      <ellipse cx="180" cy="205" rx="88" ry="118" fill="#1E293B" stroke="#0EA5E9" stroke-width="2.5" stroke-dasharray="6,4"/>
      <!-- Face Silhouette -->
      <circle cx="180" cy="175" r="50" fill="#334155"/>
      <ellipse cx="180" cy="285" rx="72" ry="48" fill="#334155"/>

      <!-- Facial Biometric Landmarks Guidance -->
      <circle cx="158" cy="170" r="4" fill="#38BDF8"/>
      <circle cx="202" cy="170" r="4" fill="#38BDF8"/>
      <path d="M 172 195 L 180 200 L 188 195" stroke="#38BDF8" stroke-width="2" fill="none"/>
      <path d="M 166 220 Q 180 228 194 220" stroke="#38BDF8" stroke-width="2" fill="none"/>

      <!-- Status Pill in Camera -->
      <rect x="90" y="24" width="180" height="26" rx="13" fill="#0F172A" fill-opacity="0.9" stroke="#10B981" stroke-width="1"/>
      <circle cx="106" cy="37" r="4" fill="#10B981"/>
      <text x="185" y="41" fill="#F8FAFC" font-size="10" font-weight="bold" text-anchor="middle">Wajah &amp; Liveness Terverifikasi</text>

      <!-- Watermark Card Overlay Bottom (Cloudinary Sync) -->
      <g transform="translate(20, 360)">
        <rect width="320" height="82" rx="16" fill="#0B132B" fill-opacity="0.92" stroke="#38BDF8" stroke-width="1"/>
        <text x="160" y="24" fill="#38BDF8" font-size="11" font-weight="bold" letter-spacing="1" text-anchor="middle">PRESENSI MASUK VERIFIED</text>
        <text x="160" y="44" fill="#FFFFFF" font-size="13" font-weight="bold" text-anchor="middle">Budi Santoso • NIP 19920315002</text>
        <text x="160" y="64" fill="#FDE047" font-size="10.5" font-weight="600" text-anchor="middle">2026-10-22 08:15:32 WIB • Cloudinary CDN</text>
      </g>
    </g>

    <!-- Geofence Safe GPS Pill Indicator -->
    <g transform="translate(24, 660)">
      <rect width="382" height="44" rx="22" fill="#064E3B" fill-opacity="0.85" stroke="#10B981" stroke-width="1.2"/>
      <circle cx="28" cy="22" r="8" fill="#10B981"/>
      <text x="46" y="26" fill="#FFFFFF" font-size="11.5" font-weight="bold">GPS Terverifikasi: 11.6m dari Titik Acuan Kantor</text>
    </g>

    <!-- Big Capture Button -->
    <g transform="translate(175, 725)">
      <circle cx="40" cy="40" r="38" fill="none" stroke="#38BDF8" stroke-width="3"/>
      <circle cx="40" cy="40" r="30" fill="url(#tealGrad)" filter="url(#shadow)"/>
      <circle cx="40" cy="40" r="12" fill="#FFFFFF"/>
    </g>
    <text x="215" y="825" fill="#E2E8F0" font-size="13" font-weight="bold" text-anchor="middle">Ambil Foto &amp; Catat Presensi</text>
  `;
  return getCommonPhoneFrame(content);
}

// 5. SCREEN 11: Dispensasi Screen
function renderDispensasiScreen() {
  const content = `
    <!-- Top App Bar -->
    <g transform="translate(24, 60)">
      <circle cx="16" cy="16" r="16" fill="#1E293B"/>
      <path d="M 20 10 L 14 16 L 20 22" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>
      <text x="44" y="22" fill="#FFFFFF" font-size="16" font-weight="bold">Formulir Pengajuan Dispensasi</text>
    </g>

    <!-- Quota Card Banner -->
    <g transform="translate(24, 110)">
      <rect width="382" height="85" rx="20" fill="url(#wineGrad)" filter="url(#shadow)"/>
      <circle cx="40" cy="42" r="22" fill="#FFFFFF" fill-opacity="0.2"/>
      <text x="40" y="48" fill="#FFFFFF" font-size="18" font-weight="bold" text-anchor="middle">2</text>
      <text x="75" y="34" fill="#FFFFFF" font-size="14" font-weight="bold">Sisa Kuota: 2 dari 3 Dispensasi</text>
      <text x="75" y="52" fill="#FDE047" font-size="11" font-weight="600">Batas toleransi maksimal cut-off: 12:00 WIB</text>
      <text x="75" y="68" fill="#FFFFFF" fill-opacity="0.8" font-size="10">Digunakan untuk izin keterlambatan atau keperluan khusus</text>
    </g>

    <!-- Form Inputs Card -->
    <g transform="translate(24, 215)">
      <rect width="382" height="520" rx="24" fill="#162032" stroke="#1E293B" stroke-width="1.5" filter="url(#shadow)"/>

      <!-- Field 1: Jenis Izin -->
      <g transform="translate(20, 25)">
        <text x="0" y="0" fill="#E2E8F0" font-size="12" font-weight="600">Jenis Dispensasi Kehadiran</text>
        <rect y="10" width="342" height="46" rx="14" fill="#0B132B" stroke="#334155" stroke-width="1.2"/>
        <text x="16" y="38" fill="#FFFFFF" font-size="13">Terlambat Karena Kendala Transportasi</text>
        <path d="M 314 34 L 322 42 L 330 34" stroke="#94A3B8" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>

      <!-- Field 2: Tanggal &amp; Waktu -->
      <g transform="translate(20, 100)">
        <text x="0" y="0" fill="#E2E8F0" font-size="12" font-weight="600">Waktu Kedatangan</text>
        <rect y="10" width="342" height="46" rx="14" fill="#0B132B" stroke="#334155" stroke-width="1.2"/>
        <text x="16" y="38" fill="#FFFFFF" font-size="13">Kamis, 22 Oktober 2026 • 08:35 WIB</text>
      </g>

      <!-- Field 3: Alasan Rinci -->
      <g transform="translate(20, 175)">
        <text x="0" y="0" fill="#E2E8F0" font-size="12" font-weight="600">Alasan Keterlambatan / Izin Resmi</text>
        <rect y="10" width="342" height="120" rx="14" fill="#0B132B" stroke="#334155" stroke-width="1.2"/>
        <text x="16" y="34" fill="#FFFFFF" font-size="12.5" font-family="sans-serif">Kereta KRL Commuter Line mengalami</text>
        <text x="16" y="54" fill="#FFFFFF" font-size="12.5" font-family="sans-serif">gangguan persinyalan di Stasiun Manggarai</text>
        <text x="16" y="74" fill="#FFFFFF" font-size="12.5" font-family="sans-serif">selama 45 menit. Surat bukti resmi dari</text>
        <text x="16" y="94" fill="#FFFFFF" font-size="12.5" font-family="sans-serif">PT Kereta Commuter Indonesia terlampir.</text>
      </g>

      <!-- Field 4: Lampiran Bukti File -->
      <g transform="translate(20, 325)">
        <text x="0" y="0" fill="#E2E8F0" font-size="12" font-weight="600">Lampiran Bukti (Opsional)</text>
        <rect y="10" width="342" height="54" rx="14" fill="#0B132B" stroke="#10B981" stroke-width="1.2" stroke-dasharray="4,4"/>
        <circle cx="34" cy="37" r="12" fill="#10B981" fill-opacity="0.2"/>
        <path d="M 28 37 L 32 41 L 40 33" stroke="#10B981" stroke-width="2" fill="none" stroke-linecap="round"/>
        <text x="56" y="32" fill="#FFFFFF" font-size="12" font-weight="bold">Surat_Keterangan_KRL_22Okt.jpg</text>
        <text x="56" y="47" fill="#6EE7B7" font-size="10.5">Berkas Terverifikasi Siap Dikirim (1.4 MB)</text>
      </g>

      <!-- Submit Button -->
      <g transform="translate(20, 425)">
        <rect width="342" height="50" rx="16" fill="url(#tealGrad)" filter="url(#shadow)"/>
        <text x="171" y="31" fill="#FFFFFF" font-size="14.5" font-weight="bold" text-anchor="middle">Kirim Pengajuan Dispensasi</text>
      </g>
    </g>
  `;
  return getCommonPhoneFrame(content);
}

// 6. SCREEN 12: Riwayat Presensi
function renderRiwayatScreen() {
  const content = `
    <!-- Top App Bar -->
    <g transform="translate(24, 60)">
      <circle cx="16" cy="16" r="16" fill="#1E293B"/>
      <path d="M 20 10 L 14 16 L 20 22" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>
      <text x="44" y="22" fill="#FFFFFF" font-size="17" font-weight="bold">Riwayat Presensi Pegawai</text>
    </g>

    <!-- Month Selector -->
    <g transform="translate(24, 110)">
      <rect width="382" height="48" rx="16" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
      <path d="M 30 24 L 38 16 M 30 24 L 38 32" stroke="#94A3B8" stroke-width="2" fill="none" stroke-linecap="round"/>
      <text x="191" y="30" fill="#FFFFFF" font-size="14" font-weight="bold" text-anchor="middle">📅 Oktober 2026</text>
      <path d="M 352 16 L 360 24 L 352 32" stroke="#94A3B8" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>

    <!-- Filter Chips -->
    <g transform="translate(24, 172)">
      <!-- Chip 1: Semua -->
      <rect width="90" height="34" rx="17" fill="url(#tealGrad)"/>
      <text x="45" y="22" fill="#FFFFFF" font-size="11.5" font-weight="bold" text-anchor="middle">Semua (21)</text>

      <!-- Chip 2: Tepat Waktu -->
      <g transform="translate(102, 0)">
        <rect width="118" height="34" rx="17" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <text x="59" y="22" fill="#94A3B8" font-size="11.5" font-weight="500" text-anchor="middle">Tepat Waktu (20)</text>
      </g>

      <!-- Chip 3: Dispensasi -->
      <g transform="translate(232, 0)">
        <rect width="108" height="34" rx="17" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
        <text x="54" y="22" fill="#94A3B8" font-size="11.5" font-weight="500" text-anchor="middle">Dispensasi (1)</text>
      </g>
    </g>

    <!-- Attendance Card 1: Hari Ini -->
    <g transform="translate(24, 225)">
      <rect width="382" height="110" rx="20" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
      <rect x="20" y="16" width="100" height="22" rx="6" fill="#0B132B"/>
      <text x="70" y="31" fill="#38BDF8" font-size="11" font-weight="bold" text-anchor="middle">Kamis, 22 Okt 2026</text>

      <rect x="272" y="16" width="90" height="22" rx="11" fill="#10B981" fill-opacity="0.2"/>
      <text x="317" y="31" fill="#10B981" font-size="10.5" font-weight="bold" text-anchor="middle">TEPAT WAKTU</text>

      <g transform="translate(20, 52)">
        <text x="0" y="16" fill="#FFFFFF" font-size="13" font-weight="bold">Masuk: 07:54 WIB</text>
        <text x="0" y="36" fill="#94A3B8" font-size="11">QR Kiosk • 14.2m dari Titik Acuan</text>

        <text x="200" y="16" fill="#FFFFFF" font-size="13" font-weight="bold">Pulang: 17:02 WIB</text>
        <text x="200" y="36" fill="#94A3B8" font-size="11">Selfie Cloudinary • 12.8m</text>
      </g>
    </g>

    <!-- Attendance Card 2: Kemarin -->
    <g transform="translate(24, 350)">
      <rect width="382" height="110" rx="20" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
      <rect x="20" y="16" width="100" height="22" rx="6" fill="#0B132B"/>
      <text x="70" y="31" fill="#94A3B8" font-size="11" font-weight="bold" text-anchor="middle">Rabu, 21 Okt 2026</text>

      <rect x="272" y="16" width="90" height="22" rx="11" fill="#10B981" fill-opacity="0.2"/>
      <text x="317" y="31" fill="#10B981" font-size="10.5" font-weight="bold" text-anchor="middle">TEPAT WAKTU</text>

      <g transform="translate(20, 52)">
        <text x="0" y="16" fill="#FFFFFF" font-size="13" font-weight="bold">Masuk: 07:58 WIB</text>
        <text x="0" y="36" fill="#94A3B8" font-size="11">QR Kiosk • 15.1m dari Titik Acuan</text>

        <text x="200" y="16" fill="#FFFFFF" font-size="13" font-weight="bold">Pulang: 17:05 WIB</text>
        <text x="200" y="36" fill="#94A3B8" font-size="11">QR Kiosk • 16.0m</text>
      </g>
    </g>

    <!-- Attendance Card 3: Selasa (Dispensasi KRL) -->
    <g transform="translate(24, 475)">
      <rect width="382" height="110" rx="20" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
      <rect x="20" y="16" width="105" height="22" rx="6" fill="#0B132B"/>
      <text x="72" y="31" fill="#94A3B8" font-size="11" font-weight="bold" text-anchor="middle">Selasa, 20 Okt 2026</text>

      <rect x="240" y="16" width="122" height="22" rx="11" fill="#3B82F6" fill-opacity="0.2"/>
      <text x="301" y="31" fill="#60A5FA" font-size="10" font-weight="bold" text-anchor="middle">DISPENSASI DISETUJUI</text>

      <g transform="translate(20, 52)">
        <text x="0" y="16" fill="#FFFFFF" font-size="13" font-weight="bold">Masuk: 08:35 WIB</text>
        <text x="0" y="36" fill="#94A3B8" font-size="11">Selfie + Dispensasi KRL (#DSP-102)</text>

        <text x="200" y="16" fill="#FFFFFF" font-size="13" font-weight="bold">Pulang: 17:30 WIB</text>
        <text x="200" y="36" fill="#94A3B8" font-size="11">QR Kiosk • 14.0m</text>
      </g>
    </g>

    <!-- Attendance Card 4: Senin -->
    <g transform="translate(24, 600)">
      <rect width="382" height="110" rx="20" fill="#162032" stroke="#1E293B" stroke-width="1.2"/>
      <rect x="20" y="16" width="100" height="22" rx="6" fill="#0B132B"/>
      <text x="70" y="31" fill="#94A3B8" font-size="11" font-weight="bold" text-anchor="middle">Senin, 19 Okt 2026</text>

      <rect x="272" y="16" width="90" height="22" rx="11" fill="#10B981" fill-opacity="0.2"/>
      <text x="317" y="31" fill="#10B981" font-size="10.5" font-weight="bold" text-anchor="middle">TEPAT WAKTU</text>

      <g transform="translate(20, 52)">
        <text x="0" y="16" fill="#FFFFFF" font-size="13" font-weight="bold">Masuk: 07:49 WIB</text>
        <text x="0" y="36" fill="#94A3B8" font-size="11">QR Kiosk • 13.5m dari Titik Acuan</text>

        <text x="200" y="16" fill="#FFFFFF" font-size="13" font-weight="bold">Pulang: 17:01 WIB</text>
        <text x="200" y="36" fill="#94A3B8" font-size="11">QR Kiosk • 14.8m</text>
      </g>
    </g>
  `;
  return getCommonPhoneFrame(content);
}

// 7. SCREEN 13: Profil &amp; Device ID Binding
function renderProfileScreen() {
  const content = `
    <!-- Top App Bar -->
    <g transform="translate(24, 60)">
      <circle cx="16" cy="16" r="16" fill="#1E293B"/>
      <path d="M 20 10 L 14 16 L 20 22" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/>
      <text x="44" y="22" fill="#FFFFFF" font-size="17" font-weight="bold">Profil Pegawai &amp; Perangkat</text>
    </g>

    <!-- User Header Avatar Card -->
    <g transform="translate(24, 110)">
      <rect width="382" height="155" rx="24" fill="#162032" stroke="#1E293B" stroke-width="1.5" filter="url(#shadow)"/>

      <!-- Avatar -->
      <circle cx="65" cy="77" r="38" fill="url(#tealGrad)"/>
      <text x="65" y="86" fill="#FFFFFF" font-size="24" font-weight="bold" text-anchor="middle">BS</text>
      <circle cx="92" cy="102" r="10" fill="#10B981" stroke="#162032" stroke-width="2"/>
      <path d="M 88 102 L 91 105 L 96 99" stroke="#FFFFFF" stroke-width="1.8" fill="none" stroke-linecap="round"/>

      <!-- User Details -->
      <text x="120" y="55" fill="#FFFFFF" font-size="17" font-weight="bold">Budi Santoso, S.Kom</text>
      <text x="120" y="75" fill="#38BDF8" font-size="12" font-weight="600">Senior Software Engineer</text>
      <text x="120" y="94" fill="#94A3B8" font-size="11.5">NIP • 19920315002</text>
      <text x="120" y="114" fill="#64748B" font-size="11">Divisi IT &amp; Digital Transformation</text>
    </g>

    <!-- Hardware Binding Card -->
    <g transform="translate(24, 285)">
      <rect width="382" height="195" rx="24" fill="#162032" stroke="#0EA5E9" stroke-width="1.5" filter="url(#shadow)"/>

      <g transform="translate(20, 25)">
        <circle cx="16" cy="16" r="16" fill="#10B981" fill-opacity="0.2"/>
        <path d="M 10 16 L 14 20 L 22 12" stroke="#10B981" stroke-width="2.5" fill="none" stroke-linecap="round"/>

        <text x="44" y="14" fill="#10B981" font-size="11" font-weight="bold" letter-spacing="1">STATUS HARDWARE BINDING</text>
        <text x="44" y="32" fill="#FFFFFF" font-size="15" font-weight="bold">TERIKAT &amp; TERKUNCI (Sah)</text>
      </g>

      <!-- Specifications -->
      <g transform="translate(20, 80)">
        <text x="0" y="15" fill="#94A3B8" font-size="11">Model Ponsel</text>
        <text x="0" y="32" fill="#FFFFFF" font-size="12.5" font-weight="bold">Samsung Galaxy S22 Ultra (SM-S908E)</text>

        <text x="0" y="60" fill="#94A3B8" font-size="11">Hardware Fingerprint ID</text>
        <text x="0" y="77" fill="#FDE047" font-size="12" font-family="monospace" font-weight="bold">PK-SEC-8942-F7B1-4A8E</text>

        <text x="0" y="98" fill="#64748B" font-size="10.5">Waktu Verifikasi Binding: 15 Januari 2026, 09:12 WIB</text>
      </g>
    </g>

    <!-- Office Geofence Placement Card -->
    <g transform="translate(24, 500)">
      <rect width="382" height="190" rx="24" fill="#162032" stroke="#1E293B" stroke-width="1.5" filter="url(#shadow)"/>

      <g transform="translate(20, 25)">
        <circle cx="16" cy="16" r="16" fill="#0EA5E9" fill-opacity="0.2"/>
        <circle cx="16" cy="16" r="6" fill="#38BDF8"/>
        <text x="44" y="14" fill="#38BDF8" font-size="11" font-weight="bold" letter-spacing="1">PENEMPATAN KERJA &amp; GEOFENCE</text>
        <text x="44" y="32" fill="#FFFFFF" font-size="15" font-weight="bold">Kantor Pusat Cyber Tower</text>
      </g>

      <g transform="translate(20, 80)">
        <text x="0" y="15" fill="#94A3B8" font-size="11">Alamat Gedung</text>
        <text x="0" y="32" fill="#FFFFFF" font-size="12">Gedung Cyber Tower Lt. 18, Jakarta Selatan</text>

        <text x="0" y="60" fill="#94A3B8" font-size="11">Koordinat Pusat GPS</text>
        <text x="0" y="77" fill="#FFFFFF" font-size="12" font-family="monospace">0.885839, 104.578013 (Radius 30 Meter)</text>

        <text x="0" y="98" fill="#10B981" font-size="10.5" font-weight="600">✓ Formula Jarak Haversine &amp; Anti-Mock GPS Aktif</text>
      </g>
    </g>

    <!-- Logout / Switch Account -->
    <g transform="translate(24, 715)">
      <rect width="382" height="48" rx="16" fill="#1E293B" stroke="#334155" stroke-width="1"/>
      <text x="191" y="30" fill="#EF4444" font-size="13.5" font-weight="bold" text-anchor="middle">Keluar dari Akun Pegawai</text>
    </g>
  `;
  return getCommonPhoneFrame(content);
}

async function generateAll() {
  console.log('Generating clean Android Flutter projections...');

  const screens = [
    { name: '07-mobile-login.png', svg: renderLoginScreen() },
    { name: '08-mobile-home.png', svg: renderHomeScreen() },
    { name: '09-mobile-qr-scanner.png', svg: await renderQrScannerScreen() },
    { name: '10-mobile-selfie-cam.png', svg: renderSelfieScreen() },
    { name: '11-mobile-dispensasi.png', svg: renderDispensasiScreen() },
    { name: '12-mobile-riwayat.png', svg: renderRiwayatScreen() },
    { name: '13-mobile-profil.png', svg: renderProfileScreen() },
  ];

  for (const s of screens) {
    const filePath = path.join(OUT_DIR, s.name);
    // Render at 2x resolution (860 x 1840) for ultra crisp retina presentation
    await sharp(Buffer.from(s.svg), { density: 150 })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(filePath);
    console.log('Generated:', s.name);
  }

  console.log('All 7 Android mobile projections generated successfully in docs/screenshots/');
}

generateAll().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
