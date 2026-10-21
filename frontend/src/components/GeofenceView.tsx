"use client";

import React, { useState } from "react";
import {
  MapPin,
  Plus,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Edit2,
  Trash2,
  Crosshair,
  Loader2,
} from "lucide-react";
import { GeofenceRealMap } from "../reference-demo/GeofenceRealMap";
import { FullscreenModal } from "./FullscreenModal";
import { useToast } from "./Toast";
import { fetchWithAuth } from "../lib/api";

interface Department {
  id: string;
  code: string;
  name: string;
  floor_location?: string;
  pic_name?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

interface GeofenceViewProps {
  departments: Department[];
  onRefresh: () => void;
}

export function GeofenceView({ departments, onRefresh }: GeofenceViewProps) {
  const { showToast, confirmAction } = useToast();

  const [selectedDept, setSelectedDept] = useState<Department | null>(
    departments[0] || null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    code: "",
    name: "",
    floor_location: "",
    pic_name: "",
    latitude: -6.2088,
    longitude: 106.8456,
    radius_meters: 30,
  });

  // Search Address State (OpenStreetMap Nominatim Geocoding)
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeDept = selectedDept || departments[0] || {
    id: "def",
    code: "DEP-IT-03",
    name: "Ruang Server & IT Engineering",
    floor_location: "Lantai 3",
    pic_name: "Abdul Razak, S.Kom",
    latitude: -6.2088,
    longitude: 106.8456,
    radius_meters: 30,
  };

  // Open Modal for Create
  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setForm({
      code: "",
      name: "",
      floor_location: "",
      pic_name: "",
      latitude: activeDept.latitude || -6.2088,
      longitude: activeDept.longitude || 106.8456,
      radius_meters: 30,
    });
    setSearchQuery("");
    setSearchResults([]);
    setIsModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalMode("edit");
    setEditingId(dept.id);
    setForm({
      code: dept.code,
      name: dept.name,
      floor_location: dept.floor_location || "",
      pic_name: dept.pic_name || "",
      latitude: dept.latitude,
      longitude: dept.longitude,
      radius_meters: dept.radius_meters,
    });
    setSearchQuery("");
    setSearchResults([]);
    setIsModalOpen(true);
  };

  // Delete Department dengan Custom Toast Confirmation Dialog
  const handleDeleteDept = (dept: Department, e: React.MouseEvent) => {
    e.stopPropagation();
    confirmAction({
      title: "Konfirmasi Hapus Departemen & Zona Geofence",
      message: `Apakah Anda yakin ingin menghapus departemen & zona "${dept.name}" (${dept.code})?\n\nSemua batas radius dan titik absensi di lokasi ini akan dihapus secara permanen.`,
      confirmText: "Ya, Hapus Lokasi",
      cancelText: "Batal",
      onConfirm: async () => {
        try {
          await fetchWithAuth(`/admin/departments?id=${dept.id}`, {
            method: "DELETE",
          });
          showToast("success", `Departemen & zona "${dept.name}" berhasil dihapus.`);
          onRefresh();
        } catch (err: any) {
          showToast("error", err.message || "Gagal menghapus departemen");
        }
      },
    });
  };

  // Search Address via Nominatim OSM
  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearchingLocation(true);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery
      )}&limit=5`;
      const res = await fetch(url);
      const data = await res.json();
      setSearchResults(data);
      if (data.length === 0) {
        showToast("info", "Alamat atau lokasi tidak ditemukan. Coba gunakan nama tempat atau jalan lain.");
      }
    } catch (err) {
      showToast("error", "Gagal menghubungi layanan geocoding peta.");
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Select Search Result
  const handleSelectLocation = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setForm((prev) => ({
      ...prev,
      name: prev.name || result.display_name.split(",")[0],
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
    }));
    setSearchResults([]);
    showToast("success", `Koordinat disetel ke: ${result.display_name.split(",")[0]}`);
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const endpoint =
        modalMode === "create"
          ? "/admin/departments"
          : `/admin/departments?id=${editingId}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      await fetchWithAuth(endpoint, {
        method,
        body: JSON.stringify({
          ...form,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          radius_meters: Number(form.radius_meters),
        }),
      });

      showToast(
        "success",
        modalMode === "create"
          ? `Zona kantor "${form.name}" berhasil ditambahkan!`
          : `Perubahan zona kantor "${form.name}" berhasil disimpan!`
      );
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message || "Gagal menyimpan perubahan lokasi");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <MapPin className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Titik Lokasi & Radius Geofence
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atur koordinat kantor dan batas radius toleransi presensi pegawai.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs cursor-pointer transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Zona Baru</span>
        </button>
      </div>

      {/* Main Grid: Interactive Map + Department List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Daftar Lokasi */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Daftar Zona Absensi Terdaftar ({departments.length})
          </div>

          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {departments.map((dept) => {
              const isSelected = activeDept.id === dept.id;
              return (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDept(dept)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-sky-50/70 border-sky-300 ring-2 ring-sky-500/20 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-md">
                        {dept.code}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                        {dept.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {dept.floor_location || "Gedung Utama"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Tombol Edit */}
                      <button
                        onClick={(e) => handleOpenEdit(dept, e)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition-colors"
                        title="Edit Zona"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {/* Tombol Hapus */}
                      <button
                        onClick={(e) => handleDeleteDept(dept, e)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
                        title="Hapus Zona"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-1 font-mono text-[11px]">
                      <span>{dept.latitude.toFixed(4)},</span>
                      <span>{dept.longitude.toFixed(4)}</span>
                    </div>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] border border-emerald-200">
                      R: {dept.radius_meters}m
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kolom Kanan: Peta Interaktif & Telemetri */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Visualisasi Zona: {activeDept.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Lingkaran hijau menggambarkan batas radius presensi resmi.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Radius: {activeDept.radius_meters} Meter
                </span>
              </div>
            </div>

            {/* Embed OpenStreetMap & Radius Preview */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
              <GeofenceRealMap
                officeLat={activeDept.latitude}
                officeLng={activeDept.longitude}
                officeRadius={activeDept.radius_meters}
                employeeLat={activeDept.latitude}
                employeeLng={activeDept.longitude}
              />
            </div>

            {/* Detail Koordinat */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Latitude
                </span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  {activeDept.latitude}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Longitude
                </span>
                <span className="text-xs font-mono font-bold text-slate-800">
                  {activeDept.longitude}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Toleransi Radius
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  {activeDept.radius_meters} Meter
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Status Proteksi
                </span>
                <span className="text-xs font-bold text-sky-600">Anti-Mock Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULLSCREEN MODAL TAMBAH / EDIT ZONA DENGAN PENCARIAN TEMPAT / JALAN */}
      <FullscreenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "create" ? "Tambah Zona Geofence Baru" : "Edit Zona Geofence"}
        subtitle="Cari nama daerah, tempat, atau jalan untuk mengisi koordinat secara otomatis, lalu tentukan radius toleransi absensi."
        icon={<MapPin className="w-5 h-5" />}
        maxWidth="5xl"
        footerActions={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmitForm(e as any)}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan Data..." : "Simpan Lokasi Geofence"}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Fitur Pencarian Tempat / Jalan */}
          <div className="bg-sky-50/60 p-4 sm:p-5 rounded-2xl border border-sky-100">
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-sky-600" />
              <span>Cari Nama Lokasi, Gedung, atau Jalan</span>
            </label>
            <form onSubmit={handleSearchAddress} className="flex gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Contoh: Monas Jakarta, Sudirman Central Busines District, Gedung Sate..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingLocation}
                className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
              >
                {isSearchingLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mencari...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Cari Titik</span>
                  </>
                )}
              </button>
            </form>

            {/* Hasil Rekomendasi Alamat */}
            {searchResults.length > 0 && (
              <div className="mt-3 bg-white border border-slate-200 rounded-2xl shadow-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <div
                    key={i}
                    onClick={() => handleSelectLocation(r)}
                    className="p-3 hover:bg-sky-50 rounded-xl text-xs cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                  >
                    <div className="font-bold text-slate-900 truncate">
                      {r.display_name.split(",")[0]}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {r.display_name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmitForm} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kode Divisi / Zona *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: DEP-HQ-01"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Radius Toleransi Absensi (Meter) *
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  max={5000}
                  value={form.radius_meters}
                  onChange={(e) =>
                    setForm({ ...form, radius_meters: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Rekomendasi enterprise: 25 - 50 meter untuk area gedung kantor.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Departemen / Lokasi Kantor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kantor Pusat - Ruang Operasional IT"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lantai / Ruangan Spesifik
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Lantai 3 Sayap Timur"
                  value={form.floor_location}
                  onChange={(e) =>
                    setForm({ ...form, floor_location: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Titik Koordinat: Latitude *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={form.latitude}
                  onChange={(e) =>
                    setForm({ ...form, latitude: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Titik Koordinat: Longitude *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={form.longitude}
                  onChange={(e) =>
                    setForm({ ...form, longitude: Number(e.target.value) })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </form>
        </div>
      </FullscreenModal>
    </div>
  );
}
