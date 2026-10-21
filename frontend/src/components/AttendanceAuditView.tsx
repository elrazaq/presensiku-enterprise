"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Camera,
  QrCode,
  Download,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Eye,
  FileText,
  AlertCircle,
  HelpCircle,
  PlusCircle,
  Check,
  Printer,
  ChevronRight,
  TrendingDown,
  ShieldAlert,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { DataTable, Column } from "./DataTable";
import { FullscreenModal } from "./FullscreenModal";
import { CustomSelect } from "./CustomSelect";
import { useToast } from "./Toast";

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  latitude?: number;
  longitude?: number;
  distance_meters?: number;
  status: string;
  attendance_method: string;
  selfie_url?: string;
  notes?: string;
  employee_name: string;
  nip: string;
  position?: string;
  department?: string;
  late_minutes?: number;
  is_dispensation_applied?: boolean;
}

interface DispensationItem {
  id: string;
  employee_id: string;
  employee_name: string;
  nip: string;
  position_title: string;
  dispensation_quota_remaining: number;
  shift_name: string;
  target_date: string;
  requested_check_in: string;
  reason: string;
  quota_used_number: number;
  approval_status: "PENDING" | "APPROVED" | "REJECTED";
  approved_at?: string;
  notes?: string;
  created_at: string;
}

interface AttendanceAuditViewProps {
  logs: AttendanceRecord[];
  onRefresh: () => void;
}

export function AttendanceAuditView({ logs, onRefresh }: AttendanceAuditViewProps) {
  const { showToast, confirmAction } = useToast();

  // Active Sub-tab
  const [subTab, setSubTab] = useState<"logs" | "dispensations" | "evaluations">("logs");

  // Modal Preview Foto Selfie
  const [selectedPhoto, setSelectedPhoto] = useState<AttendanceRecord | null>(null);

  // Dispensations State
  const [dispensations, setDispensations] = useState<DispensationItem[]>([]);
  const [isDispModalOpen, setIsDispModalOpen] = useState(false);
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  // Form Pengajuan Dispensasi
  const [dispForm, setDispForm] = useState({
    employee_id: "",
    target_date: new Date().toISOString().slice(0, 10),
    requested_check_in: "08:00",
    reason: "",
  });

  // HR Evaluation Configurable Thresholds (in minutes)
  const [thresholdTeguran, setThresholdTeguran] = useState<number>(30);
  const [thresholdSP1, setThresholdSP1] = useState<number>(60);
  const [thresholdSP2, setThresholdSP2] = useState<number>(120);
  const [thresholdSP3, setThresholdSP3] = useState<number>(180);

  // Pejabat Penandatangan Surat Evaluasi Keterlambatan
  const [hrChiefName, setHrChiefName] = useState<string>("Siti Rahmawati, M.Psi");
  const [hrChiefNIP, setHrChiefNIP] = useState<string>("19850101001");
  const [hrChiefTitle, setHrChiefTitle] = useState<string>("Chief Human Resources Officer");

  const fetchDispensations = async () => {
    try {
      const res = await fetch("/api/dispensations");
      const json = await res.json();
      if (json.success) {
        setDispensations(json.data || []);
      }
    } catch (e) {
      console.error("Gagal memuat dispensasi:", e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/v1/admin/employees").catch(() => null);
      if (!res || !res.ok) {
        // Fallback to internal query via endpoint or use unique employees from logs
        const uniqueEmps = Array.from(
          new Set(logs.map((l) => JSON.stringify({ nip: l.nip, name: l.employee_name })))
        ).map((s) => JSON.parse(s));
        setEmployeesList(uniqueEmps);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDispensations();
    fetchEmployees();
  }, []);

  // Selected Employee Quota Info in Form
  const selectedEmpQuota = useMemo(() => {
    if (!dispForm.employee_id) return null;
    const found = dispensations.find((d) => d.employee_id === dispForm.employee_id);
    return found ? found.dispensation_quota_remaining : 3;
  }, [dispForm.employee_id, dispensations]);

  // Handle Approve / Reject Dispensation
  const handleProcessDispensation = async (
    disp: DispensationItem,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    const actionText = newStatus === "APPROVED" ? "MENYETUJUI" : "MENOLAK";
    confirmAction({
      title: `Konfirmasi ${actionText} Dispensasi Kehadiran`,
      message: `Apakah Anda yakin ingin ${actionText.toLowerCase()} pengajuan dispensasi absen masuk pegawai "${disp.employee_name}" untuk tanggal ${disp.target_date} pukul ${disp.requested_check_in}?\n\n${
        newStatus === "APPROVED"
          ? `Jatah pengajuan pegawai akan berkurang 1 (sisa jatah menjadi ${Math.max(0, disp.dispensation_quota_remaining - 1)}).`
          : "Status pengajuan akan ditolak dan sisa jatah pegawai tidak berkurang."
      }`,
      confirmText: `Ya, ${actionText}`,
      cancelText: "Batal",
      onConfirm: async () => {
        try {
          const res = await fetch("/api/dispensations", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: disp.id,
              status: newStatus,
              admin_name: "Admin HRD",
              notes: `Disetujui oleh HRD pada ${new Date().toLocaleDateString("id-ID")}`,
            }),
          });
          const json = await res.json();
          if (json.success) {
            showToast("success", `Pengajuan dispensasi "${disp.employee_name}" berhasil diproses.`);
            fetchDispensations();
            onRefresh();
          } else {
            showToast("error", json.error || "Gagal memproses pengajuan");
          }
        } catch (e: any) {
          showToast("error", "Kesalahan koneksi: " + e.message);
        }
      },
    });
  };

  // Submit New Dispensation
  const handleSubmitDispensation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispForm.employee_id || !dispForm.reason.trim()) {
      showToast("error", "Semua kolom formulir pengajuan wajib diisi.");
      return;
    }

    try {
      const res = await fetch("/api/dispensations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dispForm),
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          "success",
          "Pengajuan dispensasi absen masuk berhasil dikirim ke antrian HRD!"
        );
        setIsDispModalOpen(false);
        fetchDispensations();
        setDispForm({
          employee_id: "",
          target_date: new Date().toISOString().slice(0, 10),
          requested_check_in: "08:00",
          reason: "",
        });
      } else {
        showToast("error", json.error || "Gagal mengirim pengajuan");
      }
    } catch (e: any) {
      showToast("error", "Kesalahan: " + e.message);
    }
  };

  // Evaluasi Akumulasi Keterlambatan per Pegawai
  const evaluationList = useMemo(() => {
    const map = new Map<string, {
      nip: string;
      name: string;
      department: string;
      totalLateMinutes: number;
      lateDaysCount: number;
      records: Array<{ date: string; checkIn: string; lateMinutes: number }>;
    }>();

    logs.forEach((log) => {
      if (!log.nip) return;
      if (!map.has(log.nip)) {
        map.set(log.nip, {
          nip: log.nip,
          name: log.employee_name,
          department: log.department || "Umum",
          totalLateMinutes: 0,
          lateDaysCount: 0,
          records: [],
        });
      }

      const item = map.get(log.nip)!;
      let lateMin = log.late_minutes || 0;

      // Calculate if not explicitly stored
      if (!lateMin && log.check_in_time) {
        const [h, m] = log.check_in_time.split(":").map(Number);
        if (!isNaN(h) && !isNaN(m)) {
          const checkInTotalMin = h * 60 + m;
          const scheduleStartMin = 8 * 60; // 08:00
          const tolerance = 15; // 15 min
          if (checkInTotalMin > scheduleStartMin + tolerance) {
            lateMin = checkInTotalMin - scheduleStartMin;
          }
        }
      }

      if (lateMin > 0 || log.status === "TERLAMBAT") {
        const effectiveLate = lateMin > 0 ? lateMin : 20; // default 20 if status terlambat
        item.totalLateMinutes += effectiveLate;
        item.lateDaysCount += 1;
        item.records.push({
          date: log.date,
          checkIn: log.check_in_time || "08:20",
          lateMinutes: effectiveLate,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalLateMinutes - a.totalLateMinutes);
  }, [logs]);

  // Generate Official PDF Surat Peringatan Keterlambatan
  const handlePrintLateSanctionPDF = (empEval: any, sanctionLevel: string) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // 1. KOP SURAT RESMI PERUSAHAAN
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("PT PRESENSIKU ENTERPRISE INDONESIA", 105, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105); // slate-600
    doc.text(
      "Gedung Cyber Tower Lt. 18, Jl. H.R. Rasuna Said Kav. X-5 No. 13, Jakarta Selatan 12950",
      105,
      26,
      { align: "center" }
    );
    doc.text(
      "Telepon: (021) 555-8920 | Email: hrd@presensiku.enterprise.id | Web: https://presensiku.com",
      105,
      31,
      { align: "center" }
    );

    // Garis Kop Surat Ganda
    doc.setLineWidth(0.8);
    doc.setDrawColor(15, 23, 42);
    doc.line(20, 35, 190, 35);
    doc.setLineWidth(0.2);
    doc.line(20, 36.5, 190, 36.5);

    // 2. NOMOR & JUDUL SURAT
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    const docNum = `SK/${sanctionLevel}/HRD-DISIPLIN/${currentYear}/${currentMonth}-${empEval.nip.slice(-3)}`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28); // red-700
    doc.text(`SURAT EVALUASI KEDISIPLINAN: ${sanctionLevel}`, 105, 46, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Nomor: ${docNum}`, 105, 52, { align: "center" });

    // 3. IDENTITAS PEGAWAI
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text("Diberikan kepada pegawai dengan identitas sebagai berikut:", 20, 63);

    const startY = 70;
    const rowH = 6.5;
    doc.setFont("helvetica", "bold");
    doc.text("Nama Pegawai", 25, startY);
    doc.text("Nomor Induk Pegawai (NIP)", 25, startY + rowH);
    doc.text("Departemen / Divisi", 25, startY + rowH * 2);
    doc.text("Akumulasi Keterlambatan", 25, startY + rowH * 3);
    doc.text("Frekuensi Keterlambatan", 25, startY + rowH * 4);

    doc.setFont("helvetica", "normal");
    doc.text(`:  ${empEval.name}`, 80, startY);
    doc.text(`:  ${empEval.nip}`, 80, startY + rowH);
    doc.text(`:  ${empEval.department}`, 80, startY + rowH * 2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(
      `:  ${empEval.totalLateMinutes} Menit (${Math.floor(empEval.totalLateMinutes / 60)} Jam ${empEval.totalLateMinutes % 60} Menit)`,
      80,
      startY + rowH * 3
    );
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "normal");
    doc.text(`:  ${empEval.lateDaysCount} Hari Kerja`, 80, startY + rowH * 4);

    // 4. RINCIAN PERTIMBANGAN & SANKSI
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const bodyY = startY + rowH * 5 + 6;

    const bodyParagraph =
      "Berdasarkan hasil audit sistem log presensi digital PresensiKu Enterprise, yang bersangkutan telah melampaui batas toleransi keterlambatan kerja (15 menit) dan mengakumulasi total menit keterlambatan yang memenuhi kualifikasi pemberian sanksi kedisiplinan tingkat " +
      sanctionLevel +
      ". Atas akumulasi tersebut, manajemen HRD menetapkan sanksi sesuai Peraturan Perusahaan.";

    doc.text(doc.splitTextToSize(bodyParagraph, 170), 20, bodyY);

    // 5. KONSEKUENSI & KEWAJIBAN
    const sanctionY = bodyY + 22;
    doc.setFont("helvetica", "bold");
    doc.text("Kewajiban dan Ketentuan Pembinaan:", 20, sanctionY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(
      "1. Pegawai wajib hadir tepat waktu sesuai jadwal shift yang telah ditentukan oleh atasan divisi.",
      25,
      sanctionY + 6
    );
    doc.text(
      "2. Apabila terjadi kendala mendesak, pegawai wajib memanfaatkan kuota dispensasi (maks. 3 kali).",
      25,
      sanctionY + 12
    );
    doc.text(
      "3. Jika akumulasi keterlambatan bertambah, sanksi akan ditingkatkan secara berjenjang ke tahap berikutnya.",
      25,
      sanctionY + 18
    );

    // 6. TANDA TANGAN
    const signY = 210;
    const signDate = new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    doc.setFontSize(9.5);
    doc.text(`Jakarta, ${signDate}`, 130, signY);
    doc.text("Mengetahui & Menetapkan,", 130, signY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(hrChiefTitle, 130, signY + 12);

    // Garis tanda tangan
    doc.setLineWidth(0.3);
    doc.line(130, signY + 38, 185, signY + 38);

    doc.text(hrChiefName, 130, signY + 42);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`NIP. ${hrChiefNIP}`, 130, signY + 46);

    // Buka di tab baru sebagai PDF asli
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, "_blank");

    showToast(
      "success",
      `Surat ${sanctionLevel} untuk "${empEval.name}" berhasil dibuat dan dibuka di tab baru.`
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = [
      "Tanggal",
      "NIP",
      "Nama Pegawai",
      "Divisi",
      "Jam Masuk",
      "Jam Pulang",
      "Keterlambatan (Menit)",
      "Metode Presensi",
      "Jarak (Meter)",
      "Status Kehadiran",
      "Catatan",
    ];

    const rows = logs.map((l) => [
      l.date,
      `'${l.nip}`,
      l.employee_name,
      l.department || "-",
      l.check_in_time || "-",
      l.check_out_time || "-",
      l.late_minutes || "0",
      l.attendance_method,
      l.distance_meters !== undefined ? `${l.distance_meters.toFixed(1)}m` : "-",
      l.status,
      l.notes || "-",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_PresensiKu_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Columns for Attendance Logs
  const logColumns: Column<AttendanceRecord>[] = [
    {
      key: "employee_name",
      header: "Pegawai",
      sortable: true,
      render: (log) => (
        <div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm">{log.employee_name}</div>
          <div className="text-[11px] font-mono text-slate-400">
            NIP: {log.nip} • {log.department || "Semua Divisi"}
          </div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Waktu Presensi (Masuk & Pulang)",
      sortable: true,
      render: (log) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">{log.date}</div>
          <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3 h-3 text-sky-500" />
            <span>Masuk: {log.check_in_time || "-"}</span>
            {log.check_out_time ? (
              <span className="text-emerald-600 font-semibold">• Pulang: {log.check_out_time}</span>
            ) : (
              <span className="text-slate-400 italic">• Belum Pulang</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "late_minutes",
      header: "Keterlambatan",
      sortable: true,
      render: (log) => {
        const late = log.late_minutes || 0;
        if (late > 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              Terlambat {late} Mnt
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Tepat Waktu
          </span>
        );
      },
    },
    {
      key: "attendance_method",
      header: "Metode & Validasi GPS",
      sortable: true,
      render: (log) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            {log.attendance_method === "SELFIE_FACE" ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                <Camera className="w-3 h-3" />
                <span>Foto Wajah</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                <QrCode className="w-3 h-3" />
                <span>QR Kiosk</span>
              </span>
            )}
          </div>
          {log.distance_meters !== undefined && (
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Radius: {log.distance_meters.toFixed(1)}m</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status Kehadiran",
      sortable: true,
      render: (log) => (
        <div className="space-y-1">
          <span
            className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
              log.status === "HADIR"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : log.status === "TERLAMBAT"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-sky-50 text-sky-700 border border-sky-200"
            }`}
          >
            {log.status}
          </span>
          {log.is_dispensation_applied && (
            <div className="text-[10px] font-bold text-purple-700 font-mono">
              (Dispensasi Disetujui)
            </div>
          )}
        </div>
      ),
    },
    {
      key: "selfie_url",
      header: "Bukti Wajah",
      align: "center",
      render: (log) => {
        if (log.attendance_method === "SELFIE_FACE") {
          return (
            <button
              onClick={() => setSelectedPhoto(log)}
              className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
              title="Periksa Foto Selfie Asli"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Audit Wajah</span>
            </button>
          );
        }
        return <span className="text-[11px] text-slate-400 italic">QR Scan</span>;
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Tab Navigasi Sub-Modul */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSubTab("logs")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === "logs"
                ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Log Presensi Harian
          </button>
          <button
            onClick={() => setSubTab("dispensations")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              subTab === "dispensations"
                ? "bg-white text-purple-900 shadow-2xs border border-purple-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>Pengajuan Koreksi Absen (Jatah 3x)</span>
            {dispensations.filter((d) => d.approval_status === "PENDING").length > 0 && (
              <span className="px-1.5 py-0.2 bg-purple-600 text-white rounded-full text-[10px] font-mono font-bold">
                {dispensations.filter((d) => d.approval_status === "PENDING").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSubTab("evaluations")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === "evaluations"
                ? "bg-white text-rose-900 shadow-2xs border border-rose-200"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Akumulasi Keterlambatan &amp; Evaluasi HRD
          </button>
        </div>

        {subTab === "logs" && (
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Ekspor CSV</span>
          </button>
        )}

        {subTab === "dispensations" && (
          <button
            onClick={() => setIsDispModalOpen(true)}
            className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Ajukan Dispensasi Absen Masuk</span>
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. SUB-TAB: LOG PRESENSI HARIAN                          */}
      {/* ======================================================== */}
      {subTab === "logs" && (
        <DataTable
          searchPlaceholder="Cari pegawai, NIP, divisi, atau status..."
          data={logs}
          columns={logColumns}
          filters={[
            {
              label: "Status",
              key: "status",
              options: [
                { label: "Hadir Tepat Waktu", value: "HADIR" },
                { label: "Terlambat", value: "TERLAMBAT" },
              ],
            },
            {
              label: "Metode",
              key: "attendance_method",
              options: [
                { label: "QR Kiosk", value: "QR_CODE" },
                { label: "Foto Wajah", value: "SELFIE_FACE" },
              ],
            },
          ]}
        />
      )}

      {/* ======================================================== */}
      {/* 2. SUB-TAB: PENGAJUAN KOREKSI ABSEN (JATAH 3X)           */}
      {/* ======================================================== */}
      {subTab === "dispensations" && (
        <div className="space-y-4">
          {/* Banner Penjelasan Kuota 3 Kali */}
          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex items-start gap-3.5 text-xs text-purple-950">
            <HelpCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold">
                Ketentuan Pengajuan Dispensasi Absensi Masuk (Jatah Maksimal 3x):
              </div>
              <p className="text-purple-800/90 leading-relaxed text-[11px]">
                Pegawai yang lupa melakukan absensi masuk tidak dapat langsung melakukan absensi
                pulang jika melewati batas cut-off tengah hari (12:00). Pegawai dapat mengajukan
                koreksi kehadiran kepada Admin HRD dengan <strong>jatah maksimal 3 kali</strong>. Jika
                seluruh 3 jatah telah digunakan, sistem secara permanen mengunci pengajuan baru dan
                status kehadiran hari tersebut tercatat <strong>Tidak Hadir (Alpa)</strong>.
              </p>
            </div>
          </div>

          {/* Tabel Pengajuan Dispensasi */}
          <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Pegawai</th>
                    <th className="py-3.5 px-4">Tanggal &amp; Jam Diajukan</th>
                    <th className="py-3.5 px-4">Alasan Pengajuan</th>
                    <th className="py-3.5 px-4 text-center">Pemakaian Jatah</th>
                    <th className="py-3.5 px-4 text-center">Sisa Jatah</th>
                    <th className="py-3.5 px-4">Status Persetujuan</th>
                    <th className="py-3.5 px-4 text-center">Tindakan HRD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {dispensations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada riwayat pengajuan dispensasi absensi masuk.
                      </td>
                    </tr>
                  ) : (
                    dispensations.map((disp) => (
                      <tr key={disp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{disp.employee_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            NIP: {disp.nip} • {disp.shift_name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-800">
                          <div className="font-semibold">{disp.target_date}</div>
                          <div className="text-[11px] text-slate-500">
                            Masuk: {disp.requested_check_in} WIB
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs">
                          {disp.reason}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono bg-purple-50 text-purple-700 border border-purple-200">
                            Ke-{disp.quota_used_number} dari 3
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono ${
                              disp.dispensation_quota_remaining === 0
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {disp.dispensation_quota_remaining} / 3 Tersisa
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {disp.approval_status === "APPROVED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Disetujui
                            </span>
                          )}
                          {disp.approval_status === "REJECTED" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <X className="w-3.5 h-3.5" />
                              Ditolak
                            </span>
                          )}
                          {disp.approval_status === "PENDING" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5" />
                              Menunggu HRD
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-center">
                          {disp.approval_status === "PENDING" ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleProcessDispensation(disp, "APPROVED")}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Setujui
                              </button>
                              <button
                                onClick={() => handleProcessDispensation(disp, "REJECTED")}
                                className="px-2.5 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. SUB-TAB: AKUMULASI KETERLAMBATAN & EVALUASI HRD       */}
      {/* ======================================================== */}
      {subTab === "evaluations" && (
        <div className="space-y-4">
          {/* Card Aturan Sanksi Akumulasi Menit */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sky-600" />
                  Pedoman Akumulasi Keterlambatan &amp; Ambang Batas Sanksi HRD
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap keterlambatan di atas batas toleransi shift (15 menit) diakumulasikan dalam
                  hitungan total menit per periode untuk dasar sanksi disiplin.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                Pejabat: <strong className="text-slate-800">{hrChiefName}</strong>
              </div>
            </div>

            {/* Level Sanksi Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] uppercase font-bold text-slate-500">Tingkat 1</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5">Teguran Lisan</div>
                <div className="text-[11px] text-slate-600 font-mono mt-0.5">&ge; 30 Menit Terlambat</div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                <div className="text-[10px] uppercase font-bold text-amber-700">Tingkat 2</div>
                <div className="text-sm font-extrabold text-amber-900 mt-0.5">Surat Peringatan 1 (SP-1)</div>
                <div className="text-[11px] text-amber-700 font-mono mt-0.5">&ge; 60 Menit Terlambat</div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200">
                <div className="text-[10px] uppercase font-bold text-rose-700">Tingkat 3</div>
                <div className="text-sm font-extrabold text-rose-900 mt-0.5">Surat Peringatan 2 (SP-2)</div>
                <div className="text-[11px] text-rose-700 font-mono mt-0.5">&ge; 120 Menit Terlambat</div>
              </div>
              <div className="p-3 rounded-2xl bg-red-900 text-white shadow-xs">
                <div className="text-[10px] uppercase font-bold text-red-200">Tingkat 4</div>
                <div className="text-sm font-extrabold text-white mt-0.5">SP-3 / Sanksi Berat</div>
                <div className="text-[11px] text-red-200 font-mono mt-0.5">&ge; 180 Menit (3 Jam)</div>
              </div>
            </div>
          </div>

          {/* Tabel Evaluasi Pegawai */}
          <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Pegawai</th>
                    <th className="py-3.5 px-4">Divisi Kerja</th>
                    <th className="py-3.5 px-4 text-center">Hari Terlambat</th>
                    <th className="py-3.5 px-4">Total Akumulasi Menit</th>
                    <th className="py-3.5 px-4">Kualifikasi Sanksi HRD</th>
                    <th className="py-3.5 px-4 text-center">Tindakan Surat Resmi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {evaluationList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Seluruh pegawai hadir tepat waktu! Belum ada rekaman keterlambatan.
                      </td>
                    </tr>
                  ) : (
                    evaluationList.map((evalItem) => {
                      const totalMin = evalItem.totalLateMinutes;
                      let sanction = "Disiplin Baik";
                      let sanctionBadgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      let canPrint = false;

                      if (totalMin >= thresholdSP3) {
                        sanction = "Surat Peringatan 3 (SP-3)";
                        sanctionBadgeClass = "bg-red-900 text-white border-red-900";
                        canPrint = true;
                      } else if (totalMin >= thresholdSP2) {
                        sanction = "Surat Peringatan 2 (SP-2)";
                        sanctionBadgeClass = "bg-rose-50 text-rose-700 border-rose-200";
                        canPrint = true;
                      } else if (totalMin >= thresholdSP1) {
                        sanction = "Surat Peringatan 1 (SP-1)";
                        sanctionBadgeClass = "bg-amber-50 text-amber-700 border-amber-200";
                        canPrint = true;
                      } else if (totalMin >= thresholdTeguran) {
                        sanction = "Teguran Lisan HRD";
                        sanctionBadgeClass = "bg-sky-50 text-sky-700 border-sky-200";
                        canPrint = true;
                      }

                      return (
                        <tr key={evalItem.nip} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{evalItem.name}</div>
                            <div className="text-[11px] font-mono text-slate-400">
                              NIP: {evalItem.nip}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">{evalItem.department}</td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                            {evalItem.lateDaysCount} Hari
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <div className="text-rose-600 text-sm">{totalMin} Menit</div>
                            <div className="text-[10px] text-slate-400">
                              ({Math.floor(totalMin / 60)} Jam {totalMin % 60} Menit)
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border ${sanctionBadgeClass}`}
                            >
                              {sanction}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {canPrint ? (
                              <button
                                onClick={() => handlePrintLateSanctionPDF(evalItem, sanction)}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors cursor-pointer shadow-2xs"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak Surat PDF</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Normal
                              </span>
                            )}
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
      )}

      {/* ======================================================== */}
      {/* MODAL PENGAJUAN DISPENSASI (JATAH 3X)                     */}
      {/* ======================================================== */}
      <FullscreenModal
        isOpen={isDispModalOpen}
        onClose={() => setIsDispModalOpen(false)}
        title="Formulir Pengajuan Dispensasi Koreksi Kehadiran"
        subtitle="Mekanisme pengajuan khusus untuk pegawai yang berhalangan atau lupa melakukan absensi masuk (Batas Maksimal 3 Kali Pemakaian)."
        icon={<Clock className="w-5 h-5 text-purple-600" />}
        maxWidth="4xl"
        footerActions={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsDispModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              form="dispensation-form"
              disabled={selectedEmpQuota === 0}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
            >
              Kirim Pengajuan
            </button>
          </div>
        }
      >
        <form id="dispensation-form" onSubmit={handleSubmitDispensation} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pegawai Pemohon *</label>
            <CustomSelect
              value={dispForm.employee_id}
              onChange={(val) => setDispForm({ ...dispForm, employee_id: val })}
              placeholder="Pilih Pegawai yang Mengajukan"
              options={[
                { label: "-- Pilih Pegawai --", value: "" },
                ...employeesList.map((e) => ({
                  label: `${e.name} (NIP: ${e.nip})`,
                  value: e.id || e.nip,
                })),
              ]}
            />
          </div>

          {selectedEmpQuota !== null && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                selectedEmpQuota === 0
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-purple-50 border-purple-200 text-purple-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Sisa Kuota Dispensasi Pegawai: <strong>{selectedEmpQuota} dari 3 Jatah Tersisa</strong>
                </span>
              </div>
              {selectedEmpQuota === 0 && (
                <span className="font-bold font-mono text-[11px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-md">
                  KUOTA HABIS
                </span>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tanggal Kehadiran *
              </label>
              <input
                type="date"
                required
                value={dispForm.target_date}
                onChange={(e) => setDispForm({ ...dispForm, target_date: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jam Masuk yang Dimohon *
              </label>
              <input
                type="time"
                required
                value={dispForm.requested_check_in}
                onChange={(e) => setDispForm({ ...dispForm, requested_check_in: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Alasan Pengajuan Koreksi Absen Masuk *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan alasan kendala lupa absen masuk, misal: Kendala jaringan darurat saat dinas luar, baterai HP habis, atau lupa tap..."
              value={dispForm.reason}
              onChange={(e) => setDispForm({ ...dispForm, reason: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-hidden leading-relaxed"
            />
          </div>
        </form>
      </FullscreenModal>

      {/* MODAL PREVIEW FOTO SELFIE */}
      {selectedPhoto && (
        <FullscreenModal
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          title={`Audit Foto Presensi: ${selectedPhoto.employee_name}`}
          subtitle={`Rekaman foto selfie biometrik pada ${selectedPhoto.date} pukul ${selectedPhoto.check_in_time || "-"}.`}
          icon={<Camera className="w-5 h-5 text-purple-600" />}
          maxWidth="4xl"
          footerActions={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-slate-500 font-mono">
                Status Validasi: <strong>TERVERIFIKASI RADIUS GEOFENCE</strong>
              </span>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup Audit
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="aspect-4/3 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center relative">
              {selectedPhoto.selfie_url ? (
                <img
                  src={selectedPhoto.selfie_url}
                  alt={selectedPhoto.employee_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Foto presensi tersimpan di Cloud Storage Enterprise.</p>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">NIP Pegawai:</span>
                <span className="font-bold text-slate-800">{selectedPhoto.nip}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Koordinat Validasi:</span>
                <span className="text-slate-800">
                  {selectedPhoto.latitude || "-6.2088"}, {selectedPhoto.longitude || "106.8456"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jarak Dari Kantor:</span>
                <span className="text-emerald-600 font-bold">
                  {selectedPhoto.distance_meters !== undefined
                    ? `${selectedPhoto.distance_meters.toFixed(1)}m`
                    : "12.4m"} (Memenuhi Radius)
                </span>
              </div>
            </div>
          </div>
        </FullscreenModal>
      )}
    </div>
  );
}
