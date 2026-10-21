"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Users,
  AlertCircle,
  HelpCircle,
  CalendarCheck,
  ShieldAlert,
} from "lucide-react";
import { FullscreenModal } from "./FullscreenModal";
import { useToast } from "./Toast";

interface ShiftItem {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  late_tolerance_minutes: number;
  half_day_limit_time: string;
  is_active: boolean;
  total_employees: number;
  created_at: string;
}

export function ShiftManagement() {
  const { showToast } = useToast();
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingShift, setEditingShift] = useState<ShiftItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    start_time: "08:00",
    end_time: "16:00",
    late_tolerance_minutes: 15,
    half_day_limit_time: "12:00",
    is_active: true,
  });

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/shifts");
      const json = await res.json();
      if (json.success) {
        setShifts(json.data || []);
      }
    } catch (e: any) {
      showToast("error", "Gagal memuat daftar shift: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const openAddModal = () => {
    setEditingShift(null);
    setFormData({
      name: "",
      start_time: "08:00",
      end_time: "16:00",
      late_tolerance_minutes: 15,
      half_day_limit_time: "12:00",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (shift: ShiftItem) => {
    setEditingShift(shift);
    setFormData({
      name: shift.name,
      start_time: shift.start_time.substring(0, 5),
      end_time: shift.end_time.substring(0, 5),
      late_tolerance_minutes: shift.late_tolerance_minutes,
      half_day_limit_time: shift.half_day_limit_time
        ? shift.half_day_limit_time.substring(0, 5)
        : "12:00",
      is_active: shift.is_active,
    });
    setIsModalOpen(true);
  };

  // Helper auto calculate half day limit
  const handleStartTimeChange = (start: string) => {
    setFormData((prev) => {
      const updated = { ...prev, start_time: start };
      autoCalculateHalfDay(start, prev.end_time, updated);
      return updated;
    });
  };

  const handleEndTimeChange = (end: string) => {
    setFormData((prev) => {
      const updated = { ...prev, end_time: end };
      autoCalculateHalfDay(prev.start_time, end, updated);
      return updated;
    });
  };

  const autoCalculateHalfDay = (start: string, end: string, targetObj: any) => {
    try {
      const [sH, sM] = start.split(":").map(Number);
      const [eH, eM] = end.split(":").map(Number);
      let sMinutes = sH * 60 + sM;
      let eMinutes = eH * 60 + eM;
      if (eMinutes < sMinutes) eMinutes += 24 * 60; // night shift
      const midMinutes = Math.floor(sMinutes + (eMinutes - sMinutes) / 2) % (24 * 60);
      const mH = Math.floor(midMinutes / 60);
      const mM = midMinutes % 60;
      targetObj.half_day_limit_time = `${String(mH).padStart(2, "0")}:${String(mM).padStart(2, "0")}`;
    } catch {
      // fallback
    }
  };

  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("error", "Nama shift wajib diisi.");
      return;
    }

    try {
      if (editingShift) {
        // Update
        const res = await fetch("/api/shifts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingShift.id,
            ...formData,
            start_time: `${formData.start_time}:00`,
            end_time: `${formData.end_time}:00`,
            half_day_limit_time: `${formData.half_day_limit_time}:00`,
          }),
        });
        const json = await res.json();
        if (json.success) {
          showToast("success", `Shift "${formData.name}" berhasil diperbarui.`);
          setIsModalOpen(false);
          fetchShifts();
        } else {
          showToast("error", json.error || "Gagal memperbarui shift");
        }
      } else {
        // Create
        const res = await fetch("/api/shifts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            start_time: `${formData.start_time}:00`,
            end_time: `${formData.end_time}:00`,
            half_day_limit_time: `${formData.half_day_limit_time}:00`,
          }),
        });
        const json = await res.json();
        if (json.success) {
          showToast("success", `Shift "${formData.name}" berhasil ditambahkan.`);
          setIsModalOpen(false);
          fetchShifts();
        } else {
          showToast("error", json.error || "Gagal menambah shift");
        }
      }
    } catch (e: any) {
      showToast("error", "Kesalahan koneksi: " + e.message);
    }
  };

  const handleDeleteShift = async (shift: ShiftItem) => {
    if (
      !confirm(
        `Yakin ingin menghapus shift "${shift.name}"? Pegawai yang menggunakan shift ini akan di-reset ke non-shift.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/shifts?id=${shift.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("success", `Shift "${shift.name}" berhasil dihapus.`);
        fetchShifts();
      } else {
        showToast("error", json.error || "Gagal menghapus shift");
      }
    } catch (e: any) {
      showToast("error", "Kesalahan koneksi: " + e.message);
    }
  };

  const filteredShifts = shifts.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" />
            Manajemen Shift Kerja Pegawai
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Atur jam kerja kantor, batas toleransi keterlambatan, dan limit cut-off setengah hari
            untuk presensi masuk & pulang.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Shift Baru</span>
        </button>
      </div>

      {/* Info Card Aturan Bisnis */}
      <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-start gap-3 text-xs text-sky-900">
        <HelpCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Ketentuan Enterprise Presensi Shift:</div>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            1. <strong>Toleransi Keterlambatan:</strong> Pegawai yang masuk setelah jam mulai + toleransi (misal &gt; 15 menit) akan dicatat menit keterlambatannya dan diakumulasi untuk evaluasi HRD.<br />
            2. <strong>Batas Setengah Hari (Cut-off):</strong> Jika pegawai belum absen masuk hingga batas cut-off (setengah durasi kerja, misal 12:00), pegawai <strong>tidak dapat langsung absen pulang</strong> dan otomatis berstatus <strong>Tidak Hadir (Alpa)</strong> kecuali ada pengajuan dispensasi yang disetujui.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama shift..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden"
          />
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Total: <strong className="text-slate-800">{filteredShifts.length}</strong> Shift
        </div>
      </div>

      {/* Table Shifts */}
      <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Nama Shift</th>
                <th className="py-3.5 px-4">Jam Kerja (WIB)</th>
                <th className="py-3.5 px-4">Toleransi Terlambat</th>
                <th className="py-3.5 px-4">Batas Absen Masuk (Setengah Hari)</th>
                <th className="py-3.5 px-4">Pegawai Terjadwal</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Memuat data master shift...
                  </td>
                </tr>
              ) : filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Belum ada data shift yang terdaftar.
                  </td>
                </tr>
              ) : (
                filteredShifts.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-sky-600" />
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800 whitespace-nowrap">
                      {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)} WIB
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {s.late_tolerance_minutes} Menit
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-lg text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Maks. {s.half_day_limit_time ? s.half_day_limit_time.substring(0, 5) : "12:00"} WIB
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-700">
                        <Users className="w-3 h-3 text-slate-500" />
                        {s.total_employees} Pegawai
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {s.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                          <XCircle className="w-3.5 h-3.5" />
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Shift"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteShift(s)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Shift"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Shift (Fullscreen Modal Enterprise) */}
      <FullscreenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShift ? "Edit Master Shift Kerja" : "Tambah Master Shift Kerja Baru"}
        subtitle="Konfigurasikan jam operasional, toleransi batas keterlambatan, dan jam cut-off absen masuk."
        icon={<Clock className="w-5 h-5 text-sky-600" />}
        maxWidth="4xl"
        footerActions={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              form="shift-form"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              Simpan Shift
            </button>
          </div>
        }
      >
        <form id="shift-form" onSubmit={handleSaveShift} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Shift</label>
            <input
              type="text"
              required
              placeholder="Contoh: Shift Reguler Pagi, Shift Siang IT On-Call"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Jam Masuk (Start Time)</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Jam Pulang (End Time)</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Toleransi Keterlambatan (Menit)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                required
                value={formData.late_tolerance_minutes}
                onChange={(e) =>
                  setFormData({ ...formData, late_tolerance_minutes: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Lewat dari menit ini dihitung terlambat penuh.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Batas Akhir Boleh Absen Masuk (Setengah Hari)
              </label>
              <input
                type="time"
                required
                value={formData.half_day_limit_time}
                onChange={(e) => setFormData({ ...formData, half_day_limit_time: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Lewat jam ini tidak bisa absen masuk &amp; dilarang langsung absen pulang.
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active_checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
            />
            <label htmlFor="is_active_checkbox" className="text-xs font-bold text-slate-700 cursor-pointer">
              Shift Aktif dan Siap Digunakan Pegawai
            </label>
          </div>
        </form>
      </FullscreenModal>
    </div>
  );
}
