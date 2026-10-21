"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Smartphone,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Clock,
} from "lucide-react";
import { DataTable, Column } from "./DataTable";
import { CustomSelect } from "./CustomSelect";
import { FullscreenModal } from "./FullscreenModal";
import { useToast } from "./Toast";
import { fetchWithAuth } from "../lib/api";

interface Employee {
  id: string;
  nip: string;
  name: string;
  email: string;
  role: string;
  position: string;
  department_id?: string;
  department: string;
  shift_id?: string;
  shift: string;
  bound_device: string;
  is_device_bound: boolean;
  is_active: boolean;
  dispensation_quota_remaining?: number;
}

interface EmployeeManagementProps {
  employees: Employee[];
  departments: Array<{ id: string; name: string }>;
  onRefresh: () => void;
}

export function EmployeeManagement({
  employees,
  departments,
  onRefresh,
}: EmployeeManagementProps) {
  const { showToast, confirmAction } = useToast();

  const [shiftsList, setShiftsList] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    nip: "",
    full_name: "",
    email: "",
    position_title: "",
    department_id: "",
    shift_id: "",
    role: "EMPLOYEE",
    password: "PresensiKu2026!",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    fetch("/api/shifts")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setShiftsList(json.data || []);
      })
      .catch(() => {});
  }, []);


  // Buka Modal Tambah
  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setForm({
      nip: "",
      full_name: "",
      email: "",
      position_title: "",
      department_id: departments.length > 0 ? departments[0].id : "",
      shift_id: shiftsList.length > 0 ? shiftsList[0].id : "",
      role: "EMPLOYEE",
      password: "PresensiKu2026!",
    });
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const handleOpenEdit = (emp: Employee) => {
    setModalMode("edit");
    setEditingId(emp.id);
    setForm({
      nip: emp.nip,
      full_name: emp.name,
      email: emp.email,
      position_title: emp.position || "",
      department_id: emp.department_id || "",
      shift_id: emp.shift_id || (shiftsList.length > 0 ? shiftsList[0].id : ""),
      role: emp.role || "EMPLOYEE",
      password: "",
    });
    setIsModalOpen(true);
  };

  // Hapus Pegawai dengan Custom Toast Confirmation Dialog
  const handleDeleteEmployee = (emp: Employee) => {
    confirmAction({
      title: "Konfirmasi Hapus / Nonaktifkan Pegawai",
      message: `Apakah Anda yakin ingin menonaktifkan akun pegawai "${emp.name}" (NIP: ${emp.nip})?\n\nSetelah dihapus, pegawai ini tidak dapat lagi melakukan presensi maupun login ke sistem.`,
      confirmText: "Ya, Hapus Akun",
      cancelText: "Batal",
      onConfirm: async () => {
        try {
          await fetchWithAuth(`/admin/employees?id=${emp.id}`, {
            method: "DELETE",
          });
          showToast("success", `Akun pegawai "${emp.name}" berhasil dinonaktifkan/dihapus.`);
          onRefresh();
        } catch (err: any) {
          showToast("error", err.message || "Gagal menghapus pegawai");
        }
      },
    });
  };

  // Reset Device Binding dengan Custom Toast Confirmation Dialog
  const handleResetDevice = (employeeId: string, employeeName: string) => {
    confirmAction({
      title: "Konfirmasi Reset Ikatan Perangkat HP",
      message: `Apakah Anda yakin ingin mereset ikatan perangkat HP untuk pegawai "${employeeName}"?\n\nSetelah di-reset, HP lama tidak dapat digunakan untuk presensi hingga pegawai login kembali di HP yang baru.`,
      confirmText: "Ya, Reset HP",
      cancelText: "Batal",
      onConfirm: async () => {
        try {
          setIsResetting(employeeId);
          const res = await fetchWithAuth(
            `/admin/employees/reset-device?id=${employeeId}`,
            { method: "POST" }
          );

          showToast("success", res.message || `Perangkat pegawai "${employeeName}" berhasil di-reset!`);
          onRefresh();
        } catch (err: any) {
          showToast("error", err.message || "Gagal mereset perangkat pegawai");
        } finally {
          setIsResetting(null);
        }
      },
    });
  };

  // Submit Form (Create / Edit)
  const handleSubmitEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (modalMode === "create") {
        await fetchWithAuth("/admin/employees", {
          method: "POST",
          body: JSON.stringify(form),
        });
        showToast("success", `Pegawai baru "${form.full_name}" (NIP: ${form.nip}) berhasil didaftarkan!`);
      } else {
        await fetchWithAuth(`/admin/employees?id=${editingId}`, {
          method: "PUT",
          body: JSON.stringify(form),
        });
        showToast("success", `Data pegawai "${form.full_name}" berhasil diperbarui!`);
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showToast("error", err.message || "Gagal menyimpan data pegawai");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Definisi Kolom Tabel
  const columns: Column<Employee>[] = [
    {
      key: "name",
      header: "Pegawai",
      sortable: true,
      render: (emp) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold text-xs flex items-center justify-center shrink-0">
            {emp.name.charAt(0)}
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-xs sm:text-sm">
              {emp.name}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              NIP: {emp.nip}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      header: "Divisi & Jabatan",
      sortable: true,
      render: (emp) => (
        <div>
          <div className="text-xs font-medium text-slate-800">
            {emp.department || "Semua Divisi"}
          </div>
          <div className="text-[11px] text-slate-500">
            {emp.position || "Staff"}
          </div>
        </div>
      ),
    },
    {
      key: "shift",
      header: "Shift Kerja",
      sortable: true,
      render: (emp) => (
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span className="text-xs font-semibold text-slate-800">
            {emp.shift || "Reguler (08:00 - 16:00)"}
          </span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role Akun",
      sortable: true,
      render: (emp) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            emp.role === "HR_ADMIN"
              ? "bg-purple-100 text-purple-700 border border-purple-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {emp.role === "HR_ADMIN" ? "Admin HR" : "Pegawai"}
        </span>
      ),
    },
    {
      key: "bound_device",
      header: "Perangkat HP",
      render: (emp) => (
        <div className="flex items-center space-x-2">
          {emp.is_device_bound ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[130px] font-semibold" title={emp.bound_device}>
                {emp.bound_device}
              </span>
            </div>
          ) : (
            <span className="text-xs text-slate-400 italic bg-slate-100 px-2 py-1 rounded-lg">
              Belum terikat HP
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (emp) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Tombol Edit Pegawai */}
          <button
            onClick={() => handleOpenEdit(emp)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-sky-50 hover:text-sky-700 hover:border-sky-300 transition-colors cursor-pointer"
            title="Edit Data Pegawai"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Tombol Reset Device */}
          {emp.is_device_bound && (
            <button
              onClick={() => handleResetDevice(emp.id, emp.name)}
              disabled={isResetting === emp.id}
              className="p-1.5 rounded-lg border border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
              title="Reset Ikatan HP (Ganti Perangkat)"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${
                  isResetting === emp.id ? "animate-spin" : ""
                }`}
              />
            </button>
          )}

          {/* Tombol Hapus Pegawai */}
          <button
            onClick={() => handleDeleteEmployee(emp)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors cursor-pointer"
            title="Nonaktifkan / Hapus Pegawai"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        data={employees}
        columns={columns}
        searchPlaceholder="Cari pegawai berdasarkan NIP, nama, email..."
        searchableKeys={["name", "nip", "email", "department", "position"]}
        filters={[
          {
            label: "Role",
            key: "role",
            options: [
              { label: "Pegawai Mobile", value: "EMPLOYEE" },
              { label: "Admin HR", value: "HR_ADMIN" },
            ],
          },
          {
            label: "Divisi",
            key: "department",
            options: departments.map((d) => ({ label: d.name, value: d.name })),
          },
        ]}
        actions={
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai</span>
          </button>
        }
      />

      {/* FULLSCREEN MODAL TAMBAH / EDIT PEGAWAI VIA PORTAL */}
      <FullscreenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "create" ? "Pendaftaran Pegawai Baru" : "Edit Data Pegawai"}
        subtitle={
          modalMode === "create"
            ? "Sistem enterprise akan mendaftarkan akun pegawai dan mengaktifkan proteksi Device ID binding."
            : "Perbarui informasi profil, divisi kerja, atau hak akses akun pegawai terpilih."
        }
        icon={<UserPlus className="w-5 h-5" />}
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
              onClick={(e) => handleSubmitEmployee(e as any)}
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan Data..." : "Simpan Data Pegawai"}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmitEmployee} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                NIP Pegawai (Nomor Induk) *
              </label>
              <input
                type="text"
                required
                disabled={modalMode === "edit"}
                placeholder="Contoh: 19950812004"
                value={form.nip}
                onChange={(e) => setForm({ ...form, nip: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                {modalMode === "edit"
                  ? "NIP adalah identitas unik permanen yang tidak dapat diubah."
                  : "NIP digunakan sebagai username utama login di aplikasi mobile."}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Role Hak Akses Akun *
              </label>
              <CustomSelect
                value={form.role}
                onChange={(val) => setForm({ ...form, role: val })}
                options={[
                  { label: "Pegawai (Aplikasi Mobile Presensi)", value: "EMPLOYEE" },
                  { label: "Administrator HR (Web Dashboard Portal)", value: "HR_ADMIN" },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Lengkap & Gelar *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Ahmad Fauzan, S.T."
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email Perusahaan *
              </label>
              <input
                type="email"
                required
                placeholder="fauzan@presensiku.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Departemen / Penempatan Kerja
              </label>
              <CustomSelect
                value={form.department_id}
                onChange={(val) => setForm({ ...form, department_id: val })}
                placeholder="Pilih Departemen Penempatan"
                options={[
                  { label: "-- Tanpa Departemen Khusus --", value: "" },
                  ...departments.map((d) => ({ label: d.name, value: d.id })),
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Shift Kerja Terjadwal *
              </label>
              <CustomSelect
                value={form.shift_id}
                onChange={(val) => setForm({ ...form, shift_id: val })}
                placeholder="Pilih Shift Kerja Pegawai"
                options={[
                  { label: "-- Pilih Shift Kerja --", value: "" },
                  ...shiftsList.map((s) => ({
                    label: `${s.name} (${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)})`,
                    value: s.id,
                  })),
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Jabatan / Posisi Kerja
            </label>
            <input
              type="text"
              placeholder="Contoh: Senior DevOps Engineer"
              value={form.position_title}
              onChange={(e) => setForm({ ...form, position_title: e.target.value })}
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {modalMode === "create" && (
            <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-xs text-sky-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-sky-900">
                <CheckCircle2 className="w-4 h-4 text-sky-600" />
                <span>Password Default Sistem:</span>
              </div>
              <p className="text-slate-600">
                Password default untuk akun baru adalah <code className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-sky-200 text-sky-700">PresensiKu2026!</code>. Pegawai dapat menggantinya secara mandiri di aplikasi mobile.
              </p>
            </div>
          )}
        </form>
      </FullscreenModal>
    </div>
  );
}
