# PresensiKu Enterprise — Commercial Monorepo

Sistem Presensi Pegawai Terintegrasi (Siap Jual / Commercial Edition) dengan validasi ganda **Geofencing GPS (Haversine + Anti-Mock/Fake GPS)**, **Device ID Binding (Anti-Titip Absen)**, dan **Dynamic QR Code TOTP (HMAC-SHA256 Auto-Refresh 30 Detik)**.

## Struktur Folder Utama (`D:\presensiku-enterprise`)

```text
D:\presensiku-enterprise\
├── .github/
│   └── workflows/
│       └── build-flutter-apk.yml   # Otomatis build file APK Flutter di GitHub Actions
├── android/                        # Aplikasi Mobile Pegawai (Flutter Android)
│   ├── pubspec.yaml
│   └── lib/
│       ├── main.dart
│       ├── core/                   # Konstanta API, Haversine & Anti-Mock GPS validator
│       ├── models/                 # Data model Pegawai, Shift, Log Presensi
│       ├── services/               # HTTP Service ke Backend Go, Geolocator, Scanner
│       └── screens/                # Login, Dashboard Pegawai, Scanner QR, Riwayat & Izin
├── backend/                        # REST API Server & Engine Validasi (Golang + PostgreSQL)
│   ├── go.mod
│   ├── cmd/
│   │   └── api/
│   │       └── main.go             # Entry point server Go
│   ├── internal/
│   │   ├── config/                 # Konfigurasi ENV & koneksi PostgreSQL
│   │   ├── models/                 # Struct entitas database
│   │   ├── handlers/               # Endpoint REST API (Auth, QR, Check-In, Admin CRUD)
│   │   ├── middleware/             # JWT Auth & Role-Based Access Control
│   │   └── services/               # Engine HMAC-SHA256 TOTP QR & Kalkulasi Haversine
│   └── migrations/
│       └── 001_init_schema.sql     # Skema Tabel PostgreSQL siap pakai
└── frontend/                       # Dashboard Web Admin & Layar Monitor QR (Next.js)
    ├── package.json
    └── src/
        ├── app/                    # Halaman Next.js App Router
        ├── components/             # Komponen UI Dashboard Admin
        ├── lib/
        │   └── api.ts              # Koneksi HTTP ke Backend Golang
        └── reference-demo/         # Salinan komponen asli dari portofolio (UI Reference)
```
