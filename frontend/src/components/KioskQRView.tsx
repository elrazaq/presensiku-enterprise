"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QrCode, RefreshCw, Clock, ShieldCheck, MapPin, ExternalLink, Maximize } from "lucide-react";
import { RealQRCode } from "./RealQRCode";
import { CustomSelect } from "./CustomSelect";
import { fetchWithAuth } from "../lib/api";

interface KioskQRViewProps {
  departments: Array<{
    id: string;
    code: string;
    name: string;
    floor_location?: string;
  }>;
}

export function KioskQRView({ departments }: KioskQRViewProps) {
  const [selectedDept, setSelectedDept] = useState<string>("DEP-IT-03");
  const [qrToken, setQrToken] = useState<string>("PKQR:DEP-IT-03:INIT:00000000");
  const [remainingSecs, setRemainingSecs] = useState<number>(30);
  const [deptInfo, setDeptInfo] = useState<{ name: string; code: string }>({
    name: "Ruang Server & IT Engineering",
    code: "DEP-IT-03",
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchLiveQR = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth<{
        department_code: string;
        department_name: string;
        qr_token: string;
        remaining_seconds: number;
      }>(`/qr/live?dept=${selectedDept}`);

      if (res.data) {
        setQrToken(res.data.qr_token);
        setRemainingSecs(res.data.remaining_seconds || 30);
        setDeptInfo({
          name: res.data.department_name,
          code: res.data.department_code,
        });
      }
    } catch (err) {
      console.error("Gagal memuat dynamic QR:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDept]);

  useEffect(() => {
    fetchLiveQR();
  }, [fetchLiveQR]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSecs((prev) => {
        if (prev <= 1) {
          fetchLiveQR();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchLiveQR]);

  const openNewTab = () => {
    window.open(`/kiosk?dept=${selectedDept}`, "_blank");
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Kolom Kiri: Layar Kiosk QR Monitor */}
      <div className="lg:col-span-2 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        {/* Header Kiosk */}
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-100 mb-6 gap-3">
          <div className="text-left">
            <span className="text-xs font-bold text-sky-600 tracking-wider uppercase flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Kiosk Monitor Absensi
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
              {deptInfo.name}
            </h2>
          </div>

          {/* Action Buttons: New Tab, Fullscreen, Dept Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="w-56">
              <CustomSelect
                size="sm"
                value={selectedDept}
                onChange={setSelectedDept}
                options={
                  departments.length > 0
                    ? departments.map((d) => ({
                        label: `${d.code} — ${d.name}`,
                        value: d.code,
                      }))
                    : [{ label: "DEP-IT-03 — IT Engineering", value: "DEP-IT-03" }]
                }
              />
            </div>

            {/* Tombol New Tab */}
            <button
              onClick={openNewTab}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Buka Layar Kiosk di Tab Baru"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Tombol Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
              title="Layar Penuh (Fullscreen)"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real QR Code Generator (Standar ISO 18004 Resmi, 100% Terbaca Scanner HP) */}
        <div className="relative my-2 p-3 bg-gradient-to-b from-slate-50 to-white rounded-3xl border border-slate-200 shadow-md">
          <RealQRCode value={qrToken} size={250} />

          {/* Floating Live Badge */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[11px] font-mono px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 border border-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>ISO 18004 Standard QR</span>
          </div>
        </div>

        {/* Countdown Progress Bar */}
        <div className="w-full max-w-sm mt-6">
          <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              Auto-Refresh Token:
            </span>
            <span className="font-mono font-bold text-sky-600">
              {remainingSecs} Detik
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                remainingSecs <= 5
                  ? "bg-rose-500"
                  : remainingSecs <= 10
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${(remainingSecs / 30) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Token String Display & Manual Refresh */}
        <div className="mt-5 flex items-center gap-2">
          <code className="text-[11px] font-mono bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-200 select-all max-w-xs truncate">
            {qrToken}
          </code>
          <button
            onClick={fetchLiveQR}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
            title="Refresh Manual"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Kolom Kanan: Panduan Pegawai & Standar Keamanan */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Standar Keamanan Dynamic QR
          </h3>
          <ul className="space-y-3 text-xs text-slate-600">
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <strong className="text-slate-800">ISO 18004 Standard:</strong> Barcode terenkripsi valid dan langsung terbaca oleh Google Lens, kamera iOS/Android, dan scanner Flutter mobile.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <strong className="text-slate-800">Anti-Screenshot 30 Detik:</strong> Hash berubah otomatis setiap 30 detik. Foto yang diteruskan ke WhatsApp hangus seketika.
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-sky-50/60 rounded-2xl p-6 border border-sky-100">
          <h4 className="text-xs font-bold text-sky-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            Informasi Titik Absensi
          </h4>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex justify-between py-1 border-b border-sky-100">
              <span className="text-slate-500">Kode Dept:</span>
              <span className="font-mono font-semibold text-slate-800">
                {deptInfo.code}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-sky-100">
              <span className="text-slate-500">Radius Absen:</span>
              <span className="font-semibold text-emerald-600">30 Meter</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Metode Diizinkan:</span>
              <span className="font-semibold text-sky-700">QR & Foto Wajah</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
