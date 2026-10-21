"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Activity,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  PlusCircle,
  Edit,
  Trash2,
  Clock,
  User,
  Database,
  ArrowUpDown,
} from "lucide-react";
import { FullscreenModal } from "./FullscreenModal";

interface AuditLogItem {
  id: string;
  actor_name: string;
  actor_role: string;
  action: "INSERT" | "UPDATE" | "DELETE" | "SECURITY" | "DISPENSATION" | "AUTH";
  module: string;
  target_id: string;
  target_name: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface SystemAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemAuditLogModal({ isOpen, onClose }: SystemAuditLogModalProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedModule, setSelectedModule] = useState<string>("ALL");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      let url = "/api/audit-logs?";
      if (selectedAction !== "ALL") url += `action=${selectedAction}&`;
      if (selectedModule !== "ALL") url += `module=${selectedModule}&`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
      }
    } catch (e) {
      console.error("Gagal mengambil log sistem:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, selectedAction, selectedModule]);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      log.actor_name?.toLowerCase().includes(q) ||
      log.module?.toLowerCase().includes(q) ||
      log.target_name?.toLowerCase().includes(q) ||
      log.details?.toLowerCase().includes(q) ||
      log.action?.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case "INSERT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
            <PlusCircle className="w-3 h-3 text-emerald-600" />
            INSERT
          </span>
        );
      case "UPDATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-sky-50 text-sky-700 border border-sky-200">
            <Edit className="w-3 h-3 text-sky-600" />
            UPDATE
          </span>
        );
      case "DELETE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-rose-50 text-rose-700 border border-rose-200">
            <Trash2 className="w-3 h-3 text-rose-600" />
            DELETE
          </span>
        );
      case "SECURITY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-amber-50 text-amber-700 border border-amber-200">
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            SECURITY
          </span>
        );
      case "DISPENSATION":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
            <Clock className="w-3 h-3 text-purple-600" />
            DISPENSASI
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sistem Log & Audit Interaksi Data"
      subtitle="Perekaman menyeluruh setiap interaksi operasional, pembuatan (INSERT), perubahan (UPDATE), dan penghapusan (DELETE) di database."
      icon={<FileText className="w-5 h-5 text-sky-600" />}
      maxWidth="6xl"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Audit Logger: Active (Database Table system_audit_logs)</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Tutup Log
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari aktor, modul, target, atau detail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Filter Action */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Aksi</option>
              <option value="INSERT">INSERT (Tambah Data)</option>
              <option value="UPDATE">UPDATE (Perubahan)</option>
              <option value="DELETE">DELETE (Penghapusan)</option>
              <option value="DISPENSATION">DISPENSASI (Izin Khusus)</option>
              <option value="SECURITY">SECURITY (Pelanggaran)</option>
            </select>

            {/* Filter Modul */}
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Semua Modul</option>
              <option value="PEGAWAI">Modul Pegawai</option>
              <option value="SHIFT">Modul Shift</option>
              <option value="GEOFENCE">Modul Geofence</option>
              <option value="ABSENSI">Modul Absensi</option>
              <option value="SANKSI">Modul Sanksi</option>
              <option value="SISTEM">Modul Sistem</option>
            </select>

            <button
              onClick={fetchLogs}
              disabled={isLoading}
              title="Perbarui Log"
              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-sky-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Aktor / Pelaku</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Modul</th>
                  <th className="py-3 px-4">Target Objek</th>
                  <th className="py-3 px-4 min-w-[280px]">Rincian Transaksi</th>
                  <th className="py-3 px-4">IP Asal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {isLoading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Memuat rekaman log audit...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada catatan log sistem yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const dateFormatted = new Date(log.created_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {dateFormatted}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{log.actor_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.actor_role}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            {log.module}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-800">
                          {log.target_name || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-600 text-[11px] leading-relaxed">
                          {log.details}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {log.ip_address || "127.0.0.1"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </FullscreenModal>
  );
}
