"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Clock,
  ShieldCheck,
  Save,
  CheckCircle2,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  FileText,
  Sparkles,
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
        showToast("success", "Pengaturan aplikasi & profil instansi berhasil diperbarui!");
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
            Pengaturan Aplikasi &amp; Profil Instansi
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasikan identitas instansi, nama aplikasi, nomor kontak, serta parameter dasar operasional presensi.
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
        {/* Section 1: Identitas Aplikasi & Instansi */}
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
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ditampilkan di header, judul portal, dan aplikasi mobile.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Perusahaan / Instansi Resmi
              </label>
              <input
                type="text"
                required
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden font-semibold text-slate-800"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Dicetak pada kop surat peringatan resmi (PDF).
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Alamat Kantor Pusat / Instansi
            </label>
            <textarea
              rows={2}
              required
              value={settings.company_address}
              onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden leading-relaxed text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Resmi HRD
              </label>
              <input
                type="email"
                required
                value={settings.contact_email}
                onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nomor Telepon Kantor
              </label>
              <input
                type="text"
                required
                value={settings.contact_phone}
                onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden font-mono text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Kebijakan Operasional Presensi */}
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
              <span className="text-[10px] text-slate-400 mt-1 block">
                Batas sebelum menit keterlambatan dihitung.
              </span>
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
              <span className="text-[10px] text-slate-400 mt-1 block">
                Maksimal toleransi lupa absen per pegawai.
              </span>
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
              <span className="text-[10px] text-slate-400 mt-1 block">
                Jarak maksimal validasi lokasi GPS.
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Pejabat Penandatangan Surat HRD */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-purple-600" />
            <h4 className="text-sm font-bold text-slate-900">
              Data Pejabat Penandatangan Surat Resmi HRD
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap Pejabat
              </label>
              <input
                type="text"
                required
                value={settings.hr_chief_name}
                onChange={(e) => setSettings({ ...settings, hr_chief_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-hidden font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jabatan Struktural
              </label>
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
