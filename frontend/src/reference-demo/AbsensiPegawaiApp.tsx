"use client";

import React, { useState, useEffect } from "react";
import {
  QrCode,
  MapPin,
  Clock,
  Calendar,
  Users,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Camera,
  Compass,
  ArrowRight,
  Sliders,
  Check,
  Search,
  Building2,
  RefreshCw,
  LogOut,
  ChevronRight,
  Radio,
  Download,
  Info,
  Maximize2,
  Flashlight,
  UserCheck,
  Filter,
  CheckSquare,
  Sparkles,
  Printer,
  X,
  Monitor,
} from "lucide-react";
import { GeofenceRealMap } from "./GeofenceRealMap";
import { AuthenticQrMatrix } from "./AuthenticQrMatrix";

interface DepartmentItem {
  id: string;
  name: string;
  floor: string;
  code: string;
  pic: string;
  radius: string;
  zone: string;
}

const DEPARTMENTS: DepartmentItem[] = [
  {
    id: "it-eng",
    name: "Ruang Server & IT Engineering",
    floor: "Lantai 3 - Gedung Sayap Timur",
    code: "DEP-IT-03",
    pic: "Abdul Razak, S.Kom",
    radius: "25 Meter",
    zone: "Zona Khusus IT / Server Data",
  },
  {
    id: "finance",
    name: "Divisi Finance & Akuntansi",
    floor: "Lantai 2 - Ruang 204",
    code: "DEP-FIN-02",
    pic: "Sri Wahyuni, S.E.",
    radius: "30 Meter",
    zone: "Zona Administrasi & Keuangan",
  },
  {
    id: "logistik",
    name: "Gudang & Logistik Distribusi",
    floor: "Area Pergudangan Blok B",
    code: "DEP-LOG-01",
    pic: "Agus Pratama",
    radius: "50 Meter",
    zone: "Zona Bongkar Muat & Gudang",
  },
  {
    id: "rnd",
    name: "Laboratorium R&D & QA",
    floor: "Lantai 1 - Sayap Barat",
    code: "DEP-RND-04",
    pic: "Dr. Hendra Kusuma",
    radius: "20 Meter",
    zone: "Zona Steril Penelitian",
  },
];

interface ShiftItem {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  tolerance: string;
  departments: string;
  status: "AKTIF" | "NONAKTIF";
}

const INITIAL_SHIFTS: ShiftItem[] = [
  {
    id: "shift-1",
    name: "Shift Pagi (General Office)",
    startTime: "08:00 WIB",
    endTime: "17:00 WIB",
    tolerance: "15 Menit",
    departments: "Software Eng, Finance, HR",
    status: "AKTIF",
  },
  {
    id: "shift-2",
    name: "Shift Siang (Customer Care)",
    startTime: "13:00 WIB",
    endTime: "21:00 WIB",
    tolerance: "10 Menit",
    departments: "Helpdesk & Support",
    status: "AKTIF",
  },
  {
    id: "shift-3",
    name: "Shift Malam (NOC Ops)",
    startTime: "21:00 WIB",
    endTime: "06:00 WIB",
    tolerance: "15 Menit",
    departments: "DevOps & Infrastructure",
    status: "AKTIF",
  },
];

interface AbsensiPegawaiAppProps {
  deviceMode?: "desktop" | "mobile";
  onSwitchMode?: (mode: "desktop" | "mobile") => void;
}

export function AbsensiPegawaiApp({
  deviceMode = "desktop",
  onSwitchMode,
}: AbsensiPegawaiAppProps) {
  const isMobile = deviceMode === "mobile";

  // State Web Admin Dashboard
  const [adminTab, setAdminTab] = useState<"qr" | "geofence" | "shifts" | "reports">("geofence");
  const [qrToken, setQrToken] = useState("QR-PRS-9841-A7X2");
  const [qrSecondsLeft, setQrSecondsLeft] = useState(30);

  // Shifts Management State
  const [shifts, setShifts] = useState<ShiftItem[]>(INITIAL_SHIFTS);
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftStart, setNewShiftStart] = useState("09:00");
  const [newShiftEnd, setNewShiftEnd] = useState("18:00");
  const [newShiftTolerance, setNewShiftTolerance] = useState("15");
  const [newShiftDept, setNewShiftDept] = useState("Operasional & Gudang");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Kiosk & Printable Department Sheet States
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState("it-eng");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  // Office & Employee Coordinates (Tanjungpinang Office Location)
  const [officeLat, setOfficeLat] = useState(0.9167);
  const [officeLng, setOfficeLng] = useState(104.4583);
  const [officeRadius, setOfficeRadius] = useState(60); // meters

  // Employee Location
  const [employeeLat, setEmployeeLat] = useState(0.9169);
  const [employeeLng, setEmployeeLng] = useState(104.4585);
  const [calculatedDistance, setCalculatedDistance] = useState(26); // meters

  // State Mobile Android App
  const [mobileNav, setMobileNav] = useState<"presensi" | "jadwal" | "riwayat">("presensi");
  const [scanType, setScanType] = useState<"MASUK" | "PULANG">("MASUK");
  const [mockGpsBlocked, setMockGpsBlocked] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>("07:54:12 WIB");
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);

  // Dynamic QR Code 30-Second Refresh Cycle
  useEffect(() => {
    const timer = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
          const randomNum = Math.floor(1000 + Math.random() * 9000);
          setQrToken(`QR-PRS-${randomNum}-${randomHex}`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to messages from real Leaflet map
  useEffect(() => {
    const handleDistanceMsg = (e: MessageEvent) => {
      if (e.data && e.data.type === "DISTANCE_UPDATE") {
        setCalculatedDistance(e.data.distance);
      }
    };
    window.addEventListener("message", handleDistanceMsg);
    return () => window.removeEventListener("message", handleDistanceMsg);
  }, []);

  // Live Real-Time Clock & Date for Kiosk & Printable Documents
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB"
      );
      setCurrentDate(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listener (Escape to close Kiosk or Print Sheet)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsKioskOpen(false);
        setIsPrintModalOpen(false);
        setIsAddShiftOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Mobile Scan Action (Presensi Masuk & Presensi Pulang)
  const handleSimulateScan = (type: "MASUK" | "PULANG") => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      if (calculatedDistance <= officeRadius && !mockGpsBlocked) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} WIB`;
        if (type === "MASUK") {
          setCheckInTime(timeStr);
          setScanType("PULANG");
        } else {
          setCheckOutTime(timeStr);
        }
      }
    }, 1200);
  };

  const handleResetAttendance = () => {
    setCheckInTime(null);
    setCheckOutTime(null);
    setScanType("MASUK");
  };

  const isWithinGeofence = calculatedDistance <= officeRadius && !mockGpsBlocked;

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-50 text-slate-800 overflow-hidden font-sans select-none">
      {/* ========================================================
          BODY KONTEN: DUAL MODE (LIGHT ENTERPRISE UI)
          ======================================================== */}
      <div className="flex-1 w-full h-full overflow-hidden relative">
        {/* ====================================================
            MODE 1: WEB ADMIN DASHBOARD (DESKTOP LIGHT MODE)
            ==================================================== */}
        {!isMobile ? (
          <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-slate-50">
            {/* Sidebar Web Admin */}
            <div className="w-full lg:w-64 shrink-0 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shadow-xs">
              <div className="space-y-5">
                {/* Brand Header */}
                <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                      PresensiKu Enterprise
                    </h3>
                    <p className="text-[11px] text-slate-500 font-mono">HR &amp; Geofence Portal</p>
                  </div>
                </div>

                {/* Nav Links */}
                <nav className="space-y-1.5 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setAdminTab("geofence")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      adminTab === "geofence"
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <MapPin className={`w-4 h-4 ${adminTab === "geofence" ? "text-blue-600" : "text-slate-400"}`} />
                    <span>Titik Kantor &amp; Geofence Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminTab("qr")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      adminTab === "qr"
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <QrCode className={`w-4 h-4 ${adminTab === "qr" ? "text-blue-600" : "text-slate-400"}`} />
                    <span>Dynamic QR Kiosk Station</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminTab("shifts")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      adminTab === "shifts"
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Clock className={`w-4 h-4 ${adminTab === "shifts" ? "text-blue-600" : "text-slate-400"}`} />
                    <span>Manajemen Shift &amp; Jadwal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminTab("reports")}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                      adminTab === "reports"
                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <FileSpreadsheet className={`w-4 h-4 ${adminTab === "reports" ? "text-blue-600" : "text-slate-400"}`} />
                    <span>Laporan Presensi &amp; Ekspor</span>
                  </button>
                </nav>
              </div>

              {/* Status Kantor Live */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-[10px] font-mono text-slate-500 uppercase font-bold">Kantor Utama:</div>
                <div className="font-bold text-slate-900 truncate">PT Teknologi Nusantara</div>
                <div className="text-emerald-600 font-mono text-[10.5px] flex items-center gap-1.5 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Geofence Online ({officeRadius}m)</span>
                </div>
              </div>
            </div>

            {/* Content Area Web Admin */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/60">
              {/* TAB 1: REAL GEOFENCE MAP */}
              {adminTab === "geofence" && (
                <div className="space-y-4 max-w-5xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        Pemetaan Geofence Interaktif (OpenStreetMap)
                      </h2>
                      <p className="text-xs text-slate-500">
                        Geser marker kantor (biru) atau marker pegawai (hijau) pada peta untuk menguji validasi jarak dan radius toleransi presensi.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                        Jarak Pegawai: <strong className={isWithinGeofence ? "text-emerald-600" : "text-rose-600"}>{calculatedDistance} meter</strong>
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase ${
                          isWithinGeofence
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {isWithinGeofence ? "Radius Aman" : "Di Luar Batas!"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Real Map Canvas (8 Cols) */}
                    <div className="lg:col-span-8 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col space-y-2">
                      <div className="h-[380px] w-full rounded-xl overflow-hidden relative">
                        <GeofenceRealMap
                          officeLat={officeLat}
                          officeLng={officeLng}
                          officeRadius={officeRadius}
                          employeeLat={employeeLat}
                          employeeLng={employeeLng}
                          onOfficeChange={(lat, lng) => {
                            setOfficeLat(Number(lat.toFixed(5)));
                            setOfficeLng(Number(lng.toFixed(5)));
                          }}
                          onEmployeeChange={(lat, lng) => {
                            setEmployeeLat(Number(lat.toFixed(5)));
                            setEmployeeLng(Number(lng.toFixed(5)));
                          }}
                        />
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between px-1">
                        <span>Peta: OpenStreetMap Leaflet Engine</span>
                        <span>Klik peta untuk menggeser posisi pegawai</span>
                      </div>
                    </div>

                    {/* Geofence Parameters Control Panel (4 Cols) */}
                    <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-xs">
                      <h4 className="font-bold text-slate-900 font-mono text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <Sliders className="w-4 h-4 text-blue-600" />
                        <span>Parameter Geofence</span>
                      </h4>

                      {/* Radius Slider */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between font-mono">
                          <label className="text-slate-600 font-bold">Batas Radius Aman:</label>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-extrabold border border-blue-200">
                            {officeRadius} Meter
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="200"
                          step="5"
                          value={officeRadius}
                          onChange={(e) => setOfficeRadius(Number(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>20m (Ketat)</span>
                          <span>100m (Standar)</span>
                          <span>200m (Luas)</span>
                        </div>
                      </div>

                      {/* Coordinates */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-mono text-slate-500 font-bold">Koordinat Latitude Kantor:</label>
                          <input
                            type="text"
                            readOnly
                            value={officeLat}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10.5px] font-mono text-slate-500 font-bold">Koordinat Longitude Kantor:</label>
                          <input
                            type="text"
                            readOnly
                            value={officeLng}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-slate-800 text-xs"
                          />
                        </div>
                      </div>

                      {/* Security Integrity Notice */}
                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 space-y-1 text-[11px]">
                        <div className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Pencegahan Fake GPS Aktif</span>
                        </div>
                        <p className="text-[10.5px] text-emerald-700 leading-relaxed">
                          Aplikasi Android menolak lokasi buatan via <code>isFromMockProvider</code> &amp; Google Play Integrity API.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DYNAMIC QR GENERATOR */}
              {adminTab === "qr" && (
                <div className="space-y-4 max-w-4xl">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                      Dynamic QR Code Station (Anti-Titip Absen)
                    </h2>
                    <p className="text-xs text-slate-500">
                      QR Code beresolusi tinggi ini otomatis me-refresh token baru setiap 30 detik untuk mencegah kecurangan foto atau forward pesan.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Authentic QR Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
                      {/* Realistic Dense Matrix QR */}
                      <AuthenticQrMatrix token={qrToken} size={230} />

                      {/* Token Details & Circular Progress */}
                      <div className="w-full max-w-xs space-y-2 pt-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500">Token HMAC SHA-256:</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {qrToken}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-1000"
                            style={{ width: `${(qrSecondsLeft / 30) * 100}%` }}
                          />
                        </div>

                        <div className="text-[11px] font-mono text-amber-600 flex items-center justify-center gap-1.5 font-bold pt-0.5">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                          <span>Token berganti otomatis dalam: {qrSecondsLeft} detik</span>
                        </div>
                      </div>
                    </div>

                    {/* QR Protocol Specs */}
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
                        <h4 className="font-bold text-slate-900 font-mono uppercase flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-blue-600" />
                          <span>3 Lapis Validasi Presensi:</span>
                        </h4>
                        <ul className="space-y-2 text-slate-600 text-xs">
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                            <span><strong>Time-Based Expiration:</strong> Token hangus dalam 30 detik. Foto QR di layar tidak akan berlaku untuk rekan kerja yang datang menyusul.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                            <span><strong>Geofence Match:</strong> Scan wajib dilakukan di dalam radius {officeRadius}m dari koordinat kantor.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                            <span><strong>Device Hardware Lock:</strong> Akun pegawai terkunci pada UUID ponsel resmi terdaftar.</span>
                          </li>
                        </ul>
                      </div>

                      {/* Action Cards: Kiosk & Print Departemen */}
                      <div className="space-y-3">
                        {/* Kiosk Card */}
                        <div className="p-4 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 rounded-2xl border border-blue-200 flex flex-col justify-between text-xs space-y-3">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                              <Monitor className="w-4 h-4 text-blue-600" />
                              <span>Mode Kiosk Lobi Utama:</span>
                            </div>
                            <div className="text-[11px] text-slate-600 leading-relaxed">
                              Tampilkan QR Code dinamis 30 detik secara fullscreen di tablet atau monitor resepsionis kantor.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsKioskOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Buka Kiosk Lobi (Fullscreen)</span>
                          </button>
                        </div>

                        {/* Print Standee Card */}
                        <div className="p-4 bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl border border-slate-200 flex flex-col justify-between text-xs space-y-3">
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                              <Printer className="w-4 h-4 text-emerald-600" />
                              <span>Cetak QR Departemen (Jauh dari Lobi):</span>
                            </div>
                            <div className="text-[11px] text-slate-600 leading-relaxed">
                              Cetak lembar standee / poster QR resmi ber-watermark untuk ruangan lantai atas atau gudang yang jauh dari lobi.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsPrintModalOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-98"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak Lembar Standee Departemen</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: SHIFT & JADWAL */}
              {adminTab === "shifts" && (
                <div className="space-y-4 max-w-5xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        Manajemen Shift &amp; Jadwal Kerja
                      </h2>
                      <p className="text-xs text-slate-500">
                        Konfigurasi jam masuk, jam keluar, dan toleransi keterlambatan per divisi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddShiftOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold cursor-pointer shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
                    >
                      <span>+ Tambah Shift Baru</span>
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
                    <table className="w-full text-left font-mono">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10.5px] border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Nama Shift</th>
                          <th className="p-3.5">Jam Masuk</th>
                          <th className="p-3.5">Jam Pulang</th>
                          <th className="p-3.5">Toleransi Keterlambatan</th>
                          <th className="p-3.5">Divisi Berlaku</th>
                          <th className="p-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {shifts.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-bold text-blue-700">{s.name}</td>
                            <td className="p-3.5 font-bold">{s.startTime}</td>
                            <td className="p-3.5 font-bold">{s.endTime}</td>
                            <td className="p-3.5 text-amber-600 font-bold">{s.tolerance}</td>
                            <td className="p-3.5 text-slate-600">{s.departments}</td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                {s.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: LAPORAN & REKAP */}
              {adminTab === "reports" && (
                <div className="space-y-4 max-w-5xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        Laporan Rekapitulasi Presensi Pegawai
                      </h2>
                      <p className="text-xs text-slate-500">
                        Audit data real-time jam check-in, check-out, jarak GPS scan, dan status verifikasi.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setExportNotice("File 'laporan_presensi_okt2026.xlsx' berhasil diekspor.");
                          setTimeout(() => setExportNotice(null), 3500);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-mono text-xs font-bold cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ekspor Excel (.xlsx)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExportNotice("File 'laporan_presensi_okt2026.pdf' berhasil diekspor.");
                          setTimeout(() => setExportNotice(null), 3500);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-mono text-xs font-bold cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5 text-rose-600" />
                        <span>Ekspor PDF</span>
                      </button>
                    </div>
                  </div>

                  {exportNotice && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-mono flex items-center justify-between animate-in fade-in">
                      <span>{exportNotice}</span>
                      <button
                        type="button"
                        onClick={() => setExportNotice(null)}
                        className="text-emerald-600 hover:text-emerald-900 font-bold"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-xs">
                    <table className="w-full text-left font-mono">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Nama Pegawai (NIP)</th>
                          <th className="p-3.5">Divisi</th>
                          <th className="p-3.5">Waktu Presensi</th>
                          <th className="p-3.5">Jarak Scan</th>
                          <th className="p-3.5">Status Kehadiran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        <tr className="hover:bg-slate-50/80">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">Abdul Razak, S.Kom</div>
                            <div className="text-[10px] text-slate-400">NIP: 19940812-202104-1-002</div>
                          </td>
                          <td className="p-3.5 text-slate-600">Software Engineering</td>
                          <td className="p-3.5 font-bold">{checkInTime || "07:54:12 WIB"}</td>
                          <td className="p-3.5 text-emerald-600 font-bold">{calculatedDistance} meter (GPS OK)</td>
                          <td className="p-3.5"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">TEPAT WAKTU</span></td>
                        </tr>
                        <tr className="hover:bg-slate-50/80">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">Siti Nurhaliza, M.M</div>
                            <div className="text-[10px] text-slate-400">NIP: 19960205-202201-2-005</div>
                          </td>
                          <td className="p-3.5 text-slate-600">Human Resources</td>
                          <td className="p-3.5 font-bold">08:08:44 WIB</td>
                          <td className="p-3.5 text-emerald-600 font-bold">34 meter (GPS OK)</td>
                          <td className="p-3.5"><span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">TOLERANSI</span></td>
                        </tr>
                        <tr className="hover:bg-slate-50/80">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">Doni Prasetyo</div>
                            <div className="text-[10px] text-slate-400">NIP: 19981119-202307-1-011</div>
                          </td>
                          <td className="p-3.5 text-slate-600">Finance &amp; Tax</td>
                          <td className="p-3.5 font-bold">08:24:10 WIB</td>
                          <td className="p-3.5 text-emerald-600 font-bold">15 meter (GPS OK)</td>
                          <td className="p-3.5"><span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">TERLAMBAT (9m)</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ====================================================
              MODE 2: APLIKASI ANDROID NATIVE PEGAWAI (HP LIGHT)
              Background Bertekstur Mesh + Icon Rapi Profesional
              ==================================================== */
          <div className="w-full h-full flex items-center justify-center p-3 sm:p-5 bg-slate-100/90 overflow-y-auto">
            {/* Textured subtle mesh background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40"
              style={{
                backgroundImage:
                  "radial-gradient(#94a3b8 1px, transparent 1px), radial-gradient(#cbd5e1 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px",
              }}
            />

            {/* Smartphone Handheld Frame Mockup */}
            <div className="w-full max-w-sm aspect-[9/18] max-h-[690px] bg-white rounded-[40px] p-3.5 shadow-2xl border-4 border-slate-800 flex flex-col justify-between overflow-hidden relative text-slate-800 z-10">
              {/* Dynamic Island / Camera Punch Hole */}
              <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-40 flex items-center justify-center shadow-xs">
                <span className="w-2 h-2 rounded-full bg-slate-800" />
              </div>

              {/* Status Bar Mobile */}
              <div className="pt-2 px-3 flex items-center justify-between text-[11px] font-mono text-slate-500 z-30 shrink-0">
                <span className="font-bold">08:15</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold">4G+</span>
                  <div className="w-4 h-2 border border-slate-400 rounded-xs p-0.2">
                    <div className="bg-emerald-500 h-full w-3/4" />
                  </div>
                </div>
              </div>

              {/* Mobile Screen Body */}
              <div className="flex-1 overflow-y-auto flex flex-col p-3 space-y-3.5 z-10">
                {/* Employee Header Profile */}
                <div className="flex items-center justify-between pt-1 pb-2 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-100 via-indigo-50 to-slate-100 border border-blue-200/80 overflow-hidden shadow-xs shrink-0 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/porto-nobg.png"
                        alt="Foto Profil Pegawai"
                        className="w-full h-full object-cover object-top scale-110"
                      />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 leading-tight">Abdul Razak, S.Kom</h4>
                      <p className="text-[10px] text-slate-500 font-mono">NIP: 199408122021041002</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    IT DEPT
                  </span>
                </div>

                {/* ====================================================
                    TAB 1: PRESENSI (CHECK-IN & CHECK-OUT)
                    ==================================================== */}
                {mobileNav === "presensi" && (
                  <div className="space-y-2.5 animate-in fade-in duration-200">
                    {/* Live Geofence Radar Status Card */}
                    <div className="p-3 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200/80 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-700 font-bold flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-600" />
                          <span>Radar Geofence GPS:</span>
                        </span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[9.5px] uppercase ${
                            isWithinGeofence
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isWithinGeofence ? "Dalam Radius" : "Luar Radius!"}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600">
                        Jarak ke Kantor Pusat: <strong className={isWithinGeofence ? "text-emerald-700" : "text-rose-700"}>{calculatedDistance} meter</strong> (Maks. {officeRadius}m)
                      </div>

                      {/* Anti Fake GPS Status */}
                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-500">Play Integrity GPS:</span>
                        <button
                          type="button"
                          onClick={() => setMockGpsBlocked((prev) => !prev)}
                          className={`px-2 py-0.5 rounded text-[9.5px] font-bold cursor-pointer transition-colors ${
                            mockGpsBlocked
                              ? "bg-rose-600 text-white"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {mockGpsBlocked ? "FAKE GPS DETECTED" : "GPS ASLI (VERIFIED)"}
                        </button>
                      </div>
                    </div>

                    {/* Status Presensi Hari Ini (Masuk & Pulang Cards) */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {/* Box Absen Masuk */}
                      <div className={`p-2.5 rounded-xl border ${checkInTime ? "bg-emerald-50/70 border-emerald-200" : "bg-slate-50 border-slate-200"}`}>
                        <div className="text-[9.5px] font-bold text-slate-500 uppercase">Presensi Masuk</div>
                        <div className="font-extrabold text-xs text-slate-900 mt-0.5">
                          {checkInTime ? checkInTime.split(" ")[0] + " WIB" : "Belum Absen"}
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block mt-1 ${checkInTime ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                          {checkInTime ? "Tepat Waktu" : "Jadwal 08:00"}
                        </span>
                      </div>

                      {/* Box Absen Pulang */}
                      <div className={`p-2.5 rounded-xl border ${checkOutTime ? "bg-blue-50/70 border-blue-200" : "bg-slate-50 border-slate-200"}`}>
                        <div className="text-[9.5px] font-bold text-slate-500 uppercase">Presensi Pulang</div>
                        <div className="font-extrabold text-xs text-slate-900 mt-0.5">
                          {checkOutTime ? checkOutTime.split(" ")[0] + " WIB" : "Belum Absen"}
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded inline-block mt-1 ${checkOutTime ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-600"}`}>
                          {checkOutTime ? "Selesai Kerja" : "Jadwal 17:00"}
                        </span>
                      </div>
                    </div>

                    {/* Segmented Selector: Absen Masuk vs Absen Pulang */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setScanType("MASUK")}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          scanType === "MASUK"
                            ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Presensi Masuk
                      </button>
                      <button
                        type="button"
                        onClick={() => setScanType("PULANG")}
                        className={`flex-1 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                          scanType === "PULANG"
                            ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
                            : "text-slate-500 hover:text-slate-900"
                        }`}
                      >
                        Presensi Pulang
                      </button>
                    </div>

                    {/* CameraX Viewfinder Scanner Simulation */}
                    <div className="relative rounded-2xl overflow-hidden border-2 border-blue-600/30 bg-slate-900 text-white p-3 flex flex-col items-center justify-center shadow-md min-h-[135px]">
                      {/* Laser Bar Animation */}
                      <div className="absolute inset-x-4 top-2 h-0.5 bg-emerald-400 shadow-[0_0_10px_#10b981] animate-bounce" />

                      {/* Viewfinder Target Brackets */}
                      <div className="w-20 h-20 border-2 border-dashed border-white/60 rounded-xl flex items-center justify-center relative my-1">
                        <Camera className="w-6 h-6 text-white/70" />
                        <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
                        <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
                        <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
                      </div>

                      <button
                        type="button"
                        disabled={isScanning || !isWithinGeofence}
                        onClick={() => handleSimulateScan(scanType)}
                        className={`mt-2 w-full py-2.5 px-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isWithinGeofence
                            ? scanType === "MASUK"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95"
                              : "bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95"
                            : "bg-slate-700 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>
                          {isScanning
                            ? "Memproses QR & GPS..."
                            : isWithinGeofence
                            ? `Scan QR ${scanType === "MASUK" ? "Masuk" : "Pulang"}`
                            : "Di Luar Jangkauan Kantor"}
                        </span>
                      </button>
                    </div>

                    {(checkInTime || checkOutTime) && (
                      <div className="flex items-center justify-between text-[10px] font-mono px-1">
                        <span className="text-emerald-700 font-bold">
                          {checkInTime && checkOutTime ? "Presensi Lengkap (9j 11m)" : "Sedang Jam Kerja"}
                        </span>
                        <button
                          type="button"
                          onClick={handleResetAttendance}
                          className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                        >
                          Reset Simulasi
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ====================================================
                    TAB 2: JADWAL SAYA (SHIFT & KALENDER BULANAN)
                    ==================================================== */}
                {mobileNav === "jadwal" && (
                  <div className="space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 font-mono uppercase">Jadwal Shift Kerja</h4>
                        <p className="text-[10px] text-slate-500 font-mono">Oktober 2026 &bull; Tim Alpha</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[9.5px] font-mono font-bold">
                        5 Hari Kerja
                      </span>
                    </div>

                    {/* Mini Calendar Widget (Oktober 2026) */}
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center font-mono">
                      <div className="text-[10.5px] font-bold text-slate-700 mb-1.5">Oktober 2026</div>
                      <div className="grid grid-cols-7 gap-1 text-[9.5px] text-slate-500 font-bold mb-1">
                        <span>Min</span><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-[10px] text-slate-700">
                        <span className="opacity-30">28</span><span className="opacity-30">29</span><span className="opacity-30">30</span>
                        <span>1</span><span>2</span><span>3</span><span className="text-slate-400">4</span>
                        <span className="text-slate-400">5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span><span className="text-slate-400">11</span>
                        <span className="text-slate-400">12</span><span>13</span><span>14</span><span>15</span><span>16</span>
                        <span className="bg-blue-600 text-white rounded-md font-bold shadow-xs">17</span>
                        <span className="text-slate-400">18</span>
                        <span className="text-slate-400">19</span><span>20</span><span>21</span><span>22</span><span>23</span><span>24</span><span className="text-slate-400">25</span>
                        <span className="text-slate-400">26</span><span>27</span><span>28</span><span>29</span><span>30</span><span>31</span><span className="opacity-30">1</span>
                      </div>
                    </div>

                    {/* Shift Mingguan Details */}
                    <div className="space-y-1.5 text-xs font-mono">
                      <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-blue-900 text-[11px]">Senin, 17 Okt (Hari Ini)</div>
                          <div className="text-[10px] text-blue-700">Shift Pagi: 08:00 - 17:00 WIB</div>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold">AKTIF</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">Selasa, 18 Okt</div>
                          <div className="text-[10px] text-slate-500">Shift Pagi: 08:00 - 17:00 WIB</div>
                        </div>
                        <span className="text-[9.5px] text-slate-400">15m Tol.</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">Rabu, 19 Okt</div>
                          <div className="text-[10px] text-slate-500">Shift Pagi: 08:00 - 17:00 WIB</div>
                        </div>
                        <span className="text-[9.5px] text-slate-400">15m Tol.</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">Kamis, 20 Okt</div>
                          <div className="text-[10px] text-slate-500">Shift Pagi: 08:00 - 17:00 WIB</div>
                        </div>
                        <span className="text-[9.5px] text-slate-400">15m Tol.</span>
                      </div>

                      <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800 text-[11px]">Jumat, 21 Okt</div>
                          <div className="text-[10px] text-slate-500">Shift Pagi: 08:00 - 17:00 WIB</div>
                        </div>
                        <span className="text-[9.5px] text-slate-400">15m Tol.</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[11px]">Sabtu, 22 Okt</div>
                          <div className="text-[10px]">Libur Akhir Pekan</div>
                        </div>
                        <span className="text-[9px] font-bold">OFF</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ====================================================
                    TAB 3: RIWAYAT PRESENSI & REKAP BULANAN
                    ==================================================== */}
                {mobileNav === "riwayat" && (
                  <div className="space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 font-mono uppercase">Riwayat Presensi</h4>
                        <p className="text-[10px] text-slate-500 font-mono">Rekap Bulan Oktober 2026</p>
                      </div>
                      <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        100% Hadir
                      </span>
                    </div>

                    {/* Attendance Metric Summary (4 Mini Boxes) */}
                    <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                      <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="text-xs font-black text-emerald-800">21</div>
                        <div className="text-[8.5px] text-emerald-600 font-bold">Hadir</div>
                      </div>
                      <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="text-xs font-black text-amber-800">1</div>
                        <div className="text-[8.5px] text-amber-600 font-bold">Toleransi</div>
                      </div>
                      <div className="p-1.5 bg-rose-50 rounded-lg border border-rose-200">
                        <div className="text-xs font-black text-rose-800">0</div>
                        <div className="text-[8.5px] text-rose-600 font-bold">Telat</div>
                      </div>
                      <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-xs font-black text-slate-700">0</div>
                        <div className="text-[8.5px] text-slate-500 font-bold">Alpha</div>
                      </div>
                    </div>

                    {/* Attendance Logs List */}
                    <div className="space-y-1.5 text-xs font-mono">
                      {/* Hari Ini */}
                      <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-200 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                          <span>Senin, 17 Okt 2026 (Hari Ini)</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            {checkInTime ? "Hadir" : "Belum Masuk"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-600 flex items-center justify-between">
                          <span>Masuk: {checkInTime || "--:--"}</span>
                          <span>Pulang: {checkOutTime || "--:--"}</span>
                        </div>
                        <div className="text-[9px] text-slate-400">Jarak Scan: {calculatedDistance}m (GPS Verified)</div>
                      </div>

                      {/* Jumat */}
                      <div className="p-2 rounded-xl bg-white border border-slate-200 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                          <span>Jumat, 16 Okt 2026</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Tepat Waktu</span>
                        </div>
                        <div className="text-[10px] text-slate-600 flex items-center justify-between">
                          <span>Masuk: 07:55:08 WIB</span>
                          <span>Pulang: 17:05:40 WIB</span>
                        </div>
                        <div className="text-[9px] text-slate-400">Jarak Scan: 18m (GPS Verified)</div>
                      </div>

                      {/* Kamis */}
                      <div className="p-2 rounded-xl bg-white border border-slate-200 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                          <span>Kamis, 15 Okt 2026</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">Tepat Waktu</span>
                        </div>
                        <div className="text-[10px] text-slate-600 flex items-center justify-between">
                          <span>Masuk: 07:58:32 WIB</span>
                          <span>Pulang: 17:02:11 WIB</span>
                        </div>
                        <div className="text-[9px] text-slate-400">Jarak Scan: 22m (GPS Verified)</div>
                      </div>

                      {/* Rabu */}
                      <div className="p-2 rounded-xl bg-white border border-slate-200 space-y-0.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                          <span>Rabu, 14 Okt 2026</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">Toleransi (+7m)</span>
                        </div>
                        <div className="text-[10px] text-slate-600 flex items-center justify-between">
                          <span>Masuk: 08:07:15 WIB</span>
                          <span>Pulang: 17:00:50 WIB</span>
                        </div>
                        <div className="text-[9px] text-slate-400">Jarak Scan: 15m (GPS Verified)</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Functional Bottom Navigation Bar */}
              <div className="py-2.5 px-6 bg-white border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-500 z-30 shrink-0">
                <button
                  type="button"
                  onClick={() => setMobileNav("presensi")}
                  className={`flex flex-col items-center cursor-pointer transition-colors ${
                    mobileNav === "presensi" ? "text-blue-600 font-bold" : "hover:text-slate-900"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Presensi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileNav("jadwal")}
                  className={`flex flex-col items-center cursor-pointer transition-colors ${
                    mobileNav === "jadwal" ? "text-blue-600 font-bold" : "hover:text-slate-900"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Jadwal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileNav("riwayat")}
                  className={`flex flex-col items-center cursor-pointer transition-colors ${
                    mobileNav === "riwayat" ? "text-blue-600 font-bold" : "hover:text-slate-900"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Riwayat</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================
          FULLSCREEN KIOSK LOBBY STATION OVERLAY (IN-WORKVIEW)
          ==================================================== */}
      {isKioskOpen && (
        <div className="absolute inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col justify-between p-3.5 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          {/* Top Bar Kiosk */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  PT MULTI SINERGI NUSANTARA
                </h2>
                <div className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                  <span>Terminal Kiosk Presensi Mandiri - Lobi Utama</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span className="text-emerald-400 font-bold">ONLINE</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{currentTime || "08:15:20 WIB"}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsKioskOpen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer border border-slate-700 active:scale-95 shadow-xs"
                title="Tutup Mode Kiosk (ESC)"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
                <span>Keluar Kiosk (ESC)</span>
              </button>
            </div>
          </div>

          {/* Kiosk Main Body */}
          <div className="my-auto py-3 max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Left Column: Greeting, Time & Live Presence Status */}
            <div className="md:col-span-6 space-y-3.5">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-blue-900/60 text-blue-300 border border-blue-700">
                  PRESENSI SHIFT PAGI TERBUKA
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
                  Selamat Pagi &amp; Selamat Bekerja
                </h1>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Buka aplikasi <strong className="text-blue-400">PresensiKu Mobile</strong> di smartphone Anda, pastikan GPS aktif di radius kantor ({officeRadius}m), lalu arahkan kamera ke kode QR di samping.
                </p>
              </div>

              {/* Digital Clock Box */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <div className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">
                  {currentDate || "Senin, 17 Oktober 2026"}
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black tracking-wider text-blue-400">
                  {currentTime || "08:15:20 WIB"}
                </div>
                <div className="text-[10.5px] text-slate-400 font-mono">
                  Batas Toleransi Shift: <span className="text-amber-400 font-bold">08:15:00 WIB</span> (15m Toleransi)
                </div>
              </div>

              {/* Live Presence Statistics */}
              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xl font-black text-emerald-400">142</div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">Sudah Hadir</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xl font-black text-amber-400">4</div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">Terlambat</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="text-xl font-black text-blue-400">0.8s</div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">Kecepatan Scan</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Anti-Titip Absen Aktif &bull; Kamera Lobi Merekam Verifikasi Fisik</span>
              </div>
            </div>

            {/* Right Column: High-Res Dynamic QR Display */}
            <div className="md:col-span-6 flex flex-col items-center">
              <div className="relative p-4 sm:p-5 bg-white rounded-2xl shadow-xl shadow-blue-500/10 border-2 border-blue-500/40 text-slate-900 text-center flex flex-col items-center w-full max-w-xs sm:max-w-sm">
                <div className="text-[10.5px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>DYNAMIC QR CODE RESMI</span>
                </div>

                {/* Authentic QR Matrix */}
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-inner">
                  <AuthenticQrMatrix size={190} token={qrToken} />
                </div>

                {/* Token String */}
                <div className="mt-3 px-3 py-1 rounded-lg bg-slate-100 font-mono text-xs sm:text-sm font-extrabold text-slate-800 tracking-wider">
                  {qrToken}
                </div>

                {/* Countdown Timer & Progress Bar */}
                <div className="w-full mt-3 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-600">
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                      <span>Token Berganti:</span>
                    </span>
                    <span>{qrSecondsLeft} Detik</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${(qrSecondsLeft / 30) * 100}%` }}
                    />
                  </div>
                </div>

                <p className="text-[9.5px] text-slate-500 font-mono mt-2">
                  Token otomatis hangus dalam 30 detik untuk mencegah titip absen.
                </p>
              </div>
            </div>
          </div>

          {/* Kiosk Bottom Bar */}
          <div className="border-t border-slate-800/80 pt-2 text-center text-[10.5px] text-slate-500 font-mono shrink-0">
            PresensiKu Enterprise Kiosk Engine v2.4 &bull; Radius Geofence: {officeRadius}m &bull; Lobi Utama Tanjungpinang
          </div>
        </div>
      )}

      {/* ====================================================
          PRINTABLE DEPARTMENT QR STANDEE MODAL (IN-WORKVIEW)
          ==================================================== */}
      {isPrintModalOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex flex-col items-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-3.5 sm:p-5 shadow-2xl border border-slate-200 m-auto space-y-3.5 my-2">
            {/* Modal Header & Close */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>Cetak Standee QR Departemen</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Untuk departemen atau divisi yang lokasinya jauh dari lobi utama kantor.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Tutup (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Department Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Pilih Departemen Target:</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {DEPARTMENTS.map((dept) => {
                  const isSelected = dept.id === selectedDeptId;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => setSelectedDeptId(dept.id)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 border-blue-500 text-blue-900 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-[10.5px] font-bold truncate">{dept.name}</div>
                      <div className="text-[9px] font-mono text-slate-500 truncate">{dept.floor}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Printable Paper Standee Preview */}
            {(() => {
              const curDept = DEPARTMENTS.find((d) => d.id === selectedDeptId) || DEPARTMENTS[0];
              return (
                <div className="p-3 sm:p-4 bg-slate-100 rounded-xl border border-slate-300 shadow-inner">
                  <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm max-w-lg mx-auto space-y-3 text-slate-900 font-sans">
                    {/* Header Surat / Standee */}
                    <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                      <div>
                        <h4 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase">
                          PT MULTI SINERGI NUSANTARA
                        </h4>
                        <p className="text-[8.5px] text-slate-500 font-mono">
                          DIVISI HUMAN CAPITAL &amp; GENERAL AFFAIRS &bull; DOKUMEN RESMI TERMINAL PRESENSI
                        </p>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[8.5px] font-mono font-bold text-slate-700">
                        {curDept.code}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="text-center space-y-0.5">
                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                        LEMBAR STANDAR PRESENSI RUANG KERJA
                      </h3>
                      <p className="text-[11px] font-mono text-blue-700 font-bold">
                        {curDept.name} &bull; {curDept.floor}
                      </p>
                    </div>

                    {/* QR Standee Center Box */}
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 text-center">
                      <AuthenticQrMatrix size={140} token={`QR-DEPT-${curDept.code}-2026`} />
                      <div className="mt-2 px-2.5 py-0.5 bg-white rounded border border-slate-200 font-mono text-[10.5px] font-bold text-slate-800">
                        KODE TERMINAL: {curDept.code}-SEC88
                      </div>
                      <p className="text-[9px] text-slate-500 font-mono mt-1">
                        Koordinat Terkunci Geofence: Radius Maks. {curDept.radius} dari Ruangan
                      </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-1.5 text-[9.5px] font-mono bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-500">PIC Ruangan:</span>
                        <div className="font-bold text-slate-800">{curDept.pic}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Zonasi:</span>
                        <div className="font-bold text-slate-800">{curDept.zone}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Toleransi Radius:</span>
                        <div className="font-bold text-emerald-700">{curDept.radius}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Masa Berlaku:</span>
                        <div className="font-bold text-slate-800">Tahun 2026/2027</div>
                      </div>
                    </div>

                    {/* Petunjuk Pemindaian */}
                    <div className="text-[9.5px] text-slate-600 space-y-0.5 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                      <div className="font-bold text-blue-900 font-mono text-[10px]">PETUNJUK PRESENSI PEGAWAI:</div>
                      <ol className="list-decimal list-inside space-y-0.5 font-mono text-[8.5px]">
                        <li>Buka aplikasi Android <strong>PresensiKu Mobile</strong> dan pastikan GPS aktif.</li>
                        <li>Arahkan pemindai ke QR Code di atas. Sistem memvalidasi radius ruangan.</li>
                        <li>Presensi sah jika berada dalam batas radius aman departemen.</li>
                      </ol>
                    </div>

                    {/* Tanda Tangan Validasi */}
                    <div className="pt-1.5 flex items-center justify-between text-[9px] font-mono text-slate-600 border-t border-slate-200">
                      <div>
                        <div>Divalidasi Oleh:</div>
                        <div className="font-bold text-slate-800 mt-2">Head of HR &amp; GA</div>
                      </div>
                      <div className="text-right">
                        <div>Diterima PIC:</div>
                        <div className="font-bold text-slate-800 mt-2">{curDept.pic}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-mono font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Dokumen (Print)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================
          MODAL TAMBAH SHIFT BARU (IN-WORKVIEW)
          ==================================================== */}
      {isAddShiftOpen && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 m-auto space-y-4 my-2">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                    Tambah Shift Kerja Baru
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Konfigurasi jam masuk, jam pulang, dan toleransi keterlambatan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddShiftOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Tutup (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shift Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newShiftName.trim()) return;
                const newShift: ShiftItem = {
                  id: `shift-${Date.now()}`,
                  name: newShiftName.trim(),
                  startTime: `${newShiftStart} WIB`,
                  endTime: `${newShiftEnd} WIB`,
                  tolerance: `${newShiftTolerance} Menit`,
                  departments: newShiftDept.trim() || "Semua Divisi",
                  status: "AKTIF",
                };
                setShifts((prev) => [newShift, ...prev]);
                setNewShiftName("");
                setIsAddShiftOpen(false);
              }}
              className="space-y-3.5 text-xs font-mono"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Shift:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Shift Khusus Gudang Pagi"
                  value={newShiftName}
                  onChange={(e) => setNewShiftName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none text-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jam Masuk:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="08:00"
                    value={newShiftStart}
                    onChange={(e) => setNewShiftStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jam Pulang:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="17:00"
                    value={newShiftEnd}
                    onChange={(e) => setNewShiftEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Toleransi Telat (Menit):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    required
                    value={newShiftTolerance}
                    onChange={(e) => setNewShiftTolerance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Divisi Berlaku:
                  </label>
                  <input
                    type="text"
                    placeholder="Gudang, Logistik, CS"
                    value={newShiftDept}
                    onChange={(e) => setNewShiftDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none text-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-[11px] text-blue-800 leading-relaxed">
                Shift baru akan otomatis muncul pada tabel shift dan diterapkan ke aturan presensi pegawai divisi terkait.
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddShiftOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95 text-xs"
                >
                  Simpan Shift Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
