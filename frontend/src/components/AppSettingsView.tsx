"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Clock,
  Save,
  UserCheck,
  QrCode,
  Camera,
  Cloud,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { useToast } from "./Toast";

export function AppSettingsView() {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [settings, setSettings] = useState({
    app_name: "PresensiKu Enterprise",
    company_name: "PT PresensiKu Enterprise Indonesia",
    company_address:
      "Gedung Cyber Tower Lt. 18, Jl. H.R. Rasuna Said Kav. X-5 No. 13, Jakarta Selatan",
    contact_email: "hrd@presensiku.com",
    contact_phone: "(021) 555-8920",
    attendance_method: "BOTH", // BOTH, QR_ONLY, SELFIE_ONLY
    cloudinary_cloud_name: "",
    cloudinary_api_key: "",
    cloudinary_api_secret: "",
    cloudinary_upload_preset: "",
    default_tolerance_minutes: "15",
    default_dispensation_quota: "3",
    default_geofence_radius: "30",
    hr_chief_name: "Siti Rahmawati, M.Psi",
    hr_chief_nip: "19850101001",
    hr_chief_title: "Chief Human Resources Officer",
  });

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success && json.data) {
        setSettings((prev) => ({ ...prev, ...json.data }));
      }
    } catch (e: any) {
      showToast("error", "Gagal memuat pengaturan: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings,
          actor_name: "Admin HRD",
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Pengaturan aplikasi & kebijakan presensi berhasil disimpan!");
      } else {
        showToast("error", json.error || "Gagal menyimpan pengaturan");
      }
    } catch (e: any) {
      showToast("error", "Kesalahan: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200/90 shadow-2xs text-center text-slate-400">
        <Settings className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-600" />
        <p className="text-xs">Memuat pengaturan sistem...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-sky-600" />
            Pengaturan Aplikasi &amp; Kebijakan Presensi
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasikan metode absensi mobile yang diizinkan, integrasi Cloudinary, serta identitas instansi.
          </p>
        </div>

        <button
          type="submit"
          form="app-settings-form"
          disabled={isSaving}
          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
        </button>
      </div>

      <form id="app-settings-form" onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Kebijakan Metode Absensi yang Diizinkan (Fitur Baru) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <QrCode className="w-4 h-4 text-sky-600" />
            <h4 className="text-sm font-bold text-slate-900">Kebijakan Metode Presensi Pegawai (Mobile App)</h4>
          </div>

          <p className="text-xs text-slate-500">
            Tentukan metode presensi yang wajib digunakan oleh seluruh pegawai saat membuka aplikasi mobile:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Opsi 1: Keduanya / Bebas */}
            <div
              onClick={() => setSettings({ ...settings, attendance_method: "BOTH" })}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.attendance_method === "BOTH"
                  ? "border-sky-600 bg-sky-50/50 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center -ml-4">
                    <Camera className="w-4 h-4" />
                  </div>
                </div>
                {settings.attendance_method === "BOTH" && (
                  <CheckCircle2 className="w-5 h-5 text-sky-600" />
                )}
              </div>
              <div className="font-bold text-xs text-slate-800">Bebas (QR Kiosk &amp; Selfie)</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Pegawai bebas memilih melakukan absensi scan QR di lobi kantor atau foto wajah selfie di ruang kerja.
              </div>
            </div>

            {/* Opsi 2: Wajib Barcode / QR Only */}
            <div
              onClick={() => setSettings({ ...settings, attendance_method: "QR_ONLY" })}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.attendance_method === "QR_ONLY"
                  ? "border-sky-600 bg-sky-50/50 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                {settings.attendance_method === "QR_ONLY" && (
                  <CheckCircle2 className="w-5 h-5 text-sky-600" />
                )}
              </div>
              <div className="font-bold text-xs text-slate-800">Wajib Scan Barcode / QR Kiosk</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Tampilan mobile pegawai dipusatkan pada Scanner QR. Mode foto selfie dinonaktifkan oleh kebijakan admin.
              </div>
            </div>

            {/* Opsi 3: Wajib Selfie Only */}
            <div
              onClick={() => setSettings({ ...settings, attendance_method: "SELFIE_ONLY" })}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                settings.attendance_method === "SELFIE_ONLY"
                  ? "border-sky-600 bg-sky-50/50 shadow-xs"
                  : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                {settings.attendance_method === "SELFIE_ONLY" && (
                  <CheckCircle2 className="w-5 h-5 text-sky-600" />
                )}
              </div>
              <div className="font-bold text-xs text-slate-800">Wajib Foto Wajah (Selfie)</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Tampilan mobile pegawai dipusatkan pada Kamera Selfie. Mode scan QR Kiosk dinonaktifkan oleh kebijakan admin.
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Integrasi Cloudinary Storage (Foto Presensi) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-sky-600" />
              <h4 className="text-sm font-bold text-slate-900">Integrasi Cloudinary Storage (Foto Selfie Presensi)</h4>
            </div>
            {settings.cloudinary_cloud_name ? (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Terkonfigurasi
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                Penyimpanan Lokal Aktif
              </span>
            )}
          </div>

          <div className="p-3.5 bg-sky-50/60 rounded-2xl border border-sky-100 text-xs text-sky-800 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Panduan Akun Cloudinary:</span>
              <p className="text-[11px] text-sky-700 mt-0.5">
                Buka dashboard Cloudinary Anda di <strong>cloudinary.com/console</strong>. Salin <strong>Cloud Name</strong>, <strong>API Key</strong>, dan <strong>API Secret</strong> ke form di bawah ini. Foto absensi selfie pegawai akan otomatis diunggah ke cloud CDN Cloudinary yang aman dan cepat.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Cloud Name *</label>
              <input
                type="text"
                placeholder="misal: dxyz123abc"
                value={settings.cloudinary_cloud_name}
                onChange={(e) => setSettings({ ...settings, cloudinary_cloud_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">API Key</label>
              <input
                type="text"
                placeholder="misal: 123456789012345"
                value={settings.cloudinary_api_key}
                onChange={(e) => setSettings({ ...settings, cloudinary_api_key: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">API Secret</label>
              <input
                type="password"
                placeholder="misal: aBcDeFgHiJkLmNoPqRsTuVwXyZ"
                value={settings.cloudinary_api_secret}
                onChange={(e) => setSettings({ ...settings, cloudinary_api_secret: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Upload Preset (Opsional untuk Unsigned)</label>
              <input
                type="text"
                placeholder="misal: presensiku_preset"
                value={settings.cloudinary_upload_preset}
                onChange={(e) => setSettings({ ...settings, cloudinary_upload_preset: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Identitas Aplikasi & Instansi */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-sky-600" />
            <h4 className="text-sm font-bold text-slate-900">Identitas Aplikasi &amp; Perusahaan</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Aplikasi</label>
              <input
                type="text"
                required
                value={settings.app_name}
                onChange={(e) => setSettings({ ...settings, app_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Perusahaan / Instansi</label>
              <input
                type="text"
                required
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden font-semibold text-slate-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Alamat Kantor Pusat</label>
              <textarea
                rows={2}
                required
                value={settings.company_address}
                onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden text-slate-800 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Resmi HRD</label>
              <input
                type="email"
                required
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nomor Telepon Hotline</label>
              <input
                type="text"
                required
                value={settings.contact_phone}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Kebijakan Operasional Presensi */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">Kebijakan Operasional Presensi</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Toleransi Keterlambatan Standar
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="60"
                  required
                  value={settings.default_tolerance_minutes}
                  onChange={(e) =>
                    setSettings({ ...settings, default_tolerance_minutes: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden text-slate-800"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  Menit
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jatah Kuota Pengajuan Absen Masuk
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={settings.default_dispensation_quota}
                  onChange={(e) =>
                    setSettings({ ...settings, default_dispensation_quota: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden text-slate-800"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  Kali / Bulan
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Default Radius Geofence
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="500"
                  required
                  value={settings.default_geofence_radius}
                  onChange={(e) =>
                    setSettings({ ...settings, default_geofence_radius: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-hidden text-slate-800"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  Meter
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Pejabat Penandatangan Surat HRD */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Data Pejabat Penandatangan Surat Resmi HRD
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap Pejabat</label>
              <input
                type="text"
                required
                value={settings.hr_chief_name}
                onChange={(e) => setSettings({ ...settings, hr_chief_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-hidden font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Jabatan Struktural</label>
              <input
                type="text"
                required
                value={settings.hr_chief_title}
                onChange={(e) => setSettings({ ...settings, hr_chief_title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-hidden text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">NIP Pejabat</label>
              <input
                type="text"
                required
                value={settings.hr_chief_nip}
                onChange={(e) => setSettings({ ...settings, hr_chief_nip: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-hidden text-slate-800"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
