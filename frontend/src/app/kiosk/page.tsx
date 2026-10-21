"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RealQRCode } from "@/components/RealQRCode";
import { ShieldCheck, Clock, Maximize, Minimize, Building2, Radio } from "lucide-react";
import { fetchWithAuth } from "@/lib/api";

export default function KioskDisplayPage() {
  const [deptCode, setDeptCode] = useState<string>("DEP-IT-03");
  const [deptName, setDeptName] = useState<string>("Ruang Server & IT Engineering");
  const [qrToken, setQrToken] = useState<string>("PKQR:DEP-IT-03:INIT:00000000");
  const [remainingSecs, setRemainingSecs] = useState<number>(30);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Ambil query param dari window url
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const dept = params.get("dept");
      if (dept) setDeptCode(dept.toUpperCase());
    }
  }, []);

  // Update clock every second
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
    const clockTimer = setInterval(updateTime, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const fetchLiveQR = useCallback(async () => {
    try {
      const res = await fetchWithAuth<{
        department_code: string;
        department_name: string;
        qr_token: string;
        remaining_seconds: number;
      }>(`/qr/live?dept=${deptCode}`);

      if (res.data) {
        setQrToken(res.data.qr_token);
        setRemainingSecs(res.data.remaining_seconds || 30);
        setDeptName(res.data.department_name);
      }
    } catch (err) {
      console.error("Gagal load live QR:", err);
    }
  }, [deptCode]);

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/50 to-slate-100 flex flex-col justify-between p-6 sm:p-10 select-none">
      {/* Top Header Kiosk */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/25">
            PK
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                Presensi<span className="text-sky-600">Ku</span>
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                KIOSK MONITOR
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              PT PresensiKu Enterprise Indonesia
            </p>
          </div>
        </div>

        {/* Digital Clock & Fullscreen Toggle */}
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {currentTime}
            </div>
            <div className="text-xs text-slate-500 font-medium">{currentDate}</div>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-xs text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
            title="Layar Penuh (Fullscreen)"
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5" />
            ) : (
              <Maximize className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Center Area: Large Dynamic QR Display */}
      <div className="my-auto flex flex-col items-center justify-center text-center py-6">
        <div className="mb-6 space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            Dynamic QR TOTP • Scan Melalui Aplikasi Mobile
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {deptName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-mono">
            Kode Lokasi: {deptCode} • Toleransi Radius: 30 Meter
          </p>
        </div>

        {/* Real QR Code Component (Standar ISO 18004 100% Terbaca Scanner HP) */}
        <div className="p-4 bg-white rounded-3xl border-2 border-slate-200/90 shadow-2xl relative">
          <RealQRCode value={qrToken} size={320} />

          {/* Badge Keamanan */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-mono px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>HMAC-SHA256 • Refresh Otomatis</span>
          </div>
        </div>

        {/* Countdown Timer Bar */}
        <div className="w-full max-w-md mt-10">
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-4 h-4 text-sky-500" />
              Kedaluwarsa Kode QR:
            </span>
            <span className="font-mono font-black text-sky-600 text-sm">
              {remainingSecs} Detik
            </span>
          </div>

          <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden border border-slate-300/60 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                remainingSecs <= 5
                  ? "bg-rose-500"
                  : remainingSecs <= 10
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${(remainingSecs / 30) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
        <div>Anti-Screenshot & Anti-Titip Absen Aktif</div>
        <div className="font-mono text-[11px] text-slate-500 truncate max-w-sm">
          Payload: {qrToken}
        </div>
      </div>
    </div>
  );
}
