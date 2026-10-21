"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  Sliders,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  Camera,
  QrCode,
  ShieldCheck,
  Award,
  Lightbulb,
} from "lucide-react";
import { CustomSelect } from "./CustomSelect";

interface ExecutiveAnalyticsProps {
  employeesCount: number;
  departments: Array<{ id: string; name: string }>;
  violationsCount: number;
  attendanceLogs: any[];
}

export function ExecutiveAnalytics({
  employeesCount,
  departments,
  violationsCount,
  attendanceLogs,
}: ExecutiveAnalyticsProps) {
  // Custom Controls State
  const [selectedRange, setSelectedRange] = useState<string>("7");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("ALL");
  const [selectedMetric, setSelectedMetric] = useState<string>("rate");

  // Filter logs based on selection
  const filteredLogs = useMemo(() => {
    return attendanceLogs.filter((log) => {
      if (selectedDeptFilter !== "ALL" && log.department !== selectedDeptFilter) {
        return false;
      }
      return true;
    });
  }, [attendanceLogs, selectedDeptFilter]);

  // Hitung Data Grafik Harian Murni Real Data Database (7 / 14 / 30 Hari)
  const chartData = useMemo(() => {
    const days = parseInt(selectedRange) || 7;
    const result = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString("id-ID", {
        weekday: days <= 7 ? "short" : undefined,
        day: "numeric",
        month: days > 14 ? "short" : undefined,
      });

      // Cari presensi di tanggal ini murni dari data logs database Neon
      const dayLogs = filteredLogs.filter((l) => {
        if (!l.date) return false;
        return l.date.slice(0, 10) === dateStr;
      });
      const totalHadir = dayLogs.filter((l) => l.status === "HADIR" || l.status === "TERLAMBAT").length;
      const rate = employeesCount > 0 ? Math.min(100, Math.round((totalHadir / employeesCount) * 100)) : 0;

      result.push({
        date: dateStr,
        label: dayLabel,
        hadir: totalHadir,
        rate: rate,
      });
    }

    return result;
  }, [selectedRange, filteredLogs, employeesCount]);

  // Breakdown Metode Presensi Murni Real Data Database
  const qrCount = filteredLogs.filter((l) => l.attendance_method === "QR_CODE").length;
  const selfieCount = filteredLogs.filter((l) => l.attendance_method === "SELFIE_FACE").length;
  const totalMethod = qrCount + selfieCount;
  const qrPercent = totalMethod > 0 ? Math.round((qrCount / totalMethod) * 100) : 0;
  const selfiePercent = totalMethod > 0 ? 100 - qrPercent : 0;

  return (
    <div className="space-y-6">
      {/* 1. Control Panel Kustomisasi Grafik Admin */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Parameter Analisis Presensi
            </h3>
            <p className="text-xs text-slate-500">
              Filter rentang waktu, divisi kerja, dan metrik visualisasi secara real-time.
            </p>
          </div>
        </div>

        {/* Dropdown Filters Kustom */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Rentang Waktu */}
          <div className="w-36">
            <CustomSelect
              size="sm"
              value={selectedRange}
              onChange={setSelectedRange}
              options={[
                { label: "7 Hari Terakhir", value: "7" },
                { label: "14 Hari Terakhir", value: "14" },
                { label: "30 Hari Terakhir", value: "30" },
              ]}
            />
          </div>

          {/* Filter Divisi */}
          <div className="w-44">
            <CustomSelect
              size="sm"
              value={selectedDeptFilter}
              onChange={setSelectedDeptFilter}
              options={[
                { label: "Semua Divisi", value: "ALL" },
                ...departments.map((d) => ({ label: d.name, value: d.name })),
              ]}
            />
          </div>

          {/* Pilihan Metrik */}
          <div className="w-40">
            <CustomSelect
              size="sm"
              value={selectedMetric}
              onChange={setSelectedMetric}
              options={[
                { label: "Tingkat Kehadiran (%)", value: "rate" },
                { label: "Jumlah Check-In", value: "count" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* 2. Visual Interactive Bar Chart & Breakdown Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri (2 Kolom): Bar Chart Visual Tren Presensi */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-bold uppercase text-sky-600 tracking-wider">
                Visual Trend Grafik
              </div>
              <h4 className="text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
                Statistik Disiplin Kehadiran Pegawai
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
              <span className="text-slate-600 font-medium">Hadir Tepat Waktu</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block ml-2"></span>
              <span className="text-slate-600 font-medium">Target KPI (95%)</span>
            </div>
          </div>

          {/* Interactive CSS / SVG Bar Chart */}
          <div className="h-64 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
            {chartData.map((item, idx) => {
              const val = selectedMetric === "rate" ? item.rate : item.hadir * 25;
              const heightPercent = Math.max(15, Math.min(100, val));

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-md">
                    {item.date}: {selectedMetric === "rate" ? `${item.rate}%` : `${item.hadir} Hadir`}
                  </div>

                  {/* Value Label */}
                  <span className="text-[10px] font-bold font-mono text-slate-500 mb-1.5 group-hover:text-sky-600">
                    {selectedMetric === "rate" ? `${item.rate}%` : item.hadir}
                  </span>

                  {/* Bar Element */}
                  <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden h-full flex items-end">
                    <div
                      className="w-full bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-xl transition-all duration-700 ease-out group-hover:from-sky-500 group-hover:to-emerald-400"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>

                  {/* Date Label */}
                  <span className="text-[10px] font-medium text-slate-400 mt-2 truncate w-full text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rata-Rata Kehadiran Realtime */}
          {(() => {
            const daysWithData = chartData.filter((item) => item.hadir > 0);
            const avgRate =
              daysWithData.length > 0
                ? (daysWithData.reduce((acc, curr) => acc + curr.rate, 0) / daysWithData.length).toFixed(1)
                : "0.0";
            return (
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Rata-Rata Kehadiran Periode Ini: <strong className="text-slate-800">{avgRate}%</strong>
                </span>
                <span className="text-sky-600 font-semibold flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Berdasarkan {filteredLogs.length} data absensi tercatat
                </span>
              </div>
            );
          })()}
        </div>

        {/* Kolom Kanan: Breakdown Metode Presensi & KPI Health */}
        <div className="space-y-6">
          {/* Breakdown Metode Presensi */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs">
            <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-sky-600" />
              Komposisi Metode Absensi
            </h4>

            <div className="space-y-4">
              {/* Dynamic QR */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-sky-600" />
                    Dynamic QR Kiosk (Lobi)
                  </span>
                  <span className="font-mono font-bold text-sky-600">{qrPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${qrPercent}%` }}
                  />
                </div>
              </div>

              {/* Foto Wajah */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-600" />
                    Foto Wajah (Selfie)
                  </span>
                  <span className="font-mono font-bold text-purple-600">{selfiePercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${selfiePercent}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-[11px] text-sky-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-sky-600 shrink-0" />
              <span>
                Seluruh metode wajib memenuhi validasi <strong>Radius Geofence 30 Meter</strong> & <strong>Anti-Mock GPS</strong>.
              </span>
            </div>
          </div>

          {/* Indikator Kepatuhan Integritas (Dihitung Realtime) */}
          {(() => {
            const validLogs = filteredLogs.filter(
              (l) => !l.is_mock_location_detected && (l.status === "HADIR" || l.status === "TERLAMBAT")
            ).length;
            const computedCompliance =
              filteredLogs.length > 0
                ? ((validLogs / filteredLogs.length) * 100).toFixed(1)
                : "100.0";

            return (
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-6 shadow-md shadow-emerald-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                    Indeks Kepatuhan Kehadiran
                  </span>
                  <ShieldCheck className="w-5 h-5 text-emerald-200" />
                </div>
                <div className="text-3xl font-black font-mono tracking-tight">{computedCompliance}%</div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  {filteredLogs.length > 0
                    ? `${validLogs} dari ${filteredLogs.length} presensi terverifikasi valid tanpa kecurangan lokasi.`
                    : "Menunggu rekaman presensi pertama untuk kalkulasi indeks kepatuhan."}
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
