"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  Smartphone,
  MapPin,
  Printer,
  Sliders,
  FileText,
  X,
  ExternalLink,
  Download,
  UserCheck,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { DataTable, Column } from "./DataTable";
import { FullscreenModal } from "./FullscreenModal";
import { CustomSelect } from "./CustomSelect";
import { useToast } from "./Toast";

interface SecurityViolation {
  id: string;
  employee_id?: string;
  employee_name?: string;
  nip?: string;
  violation_type: string;
  details: string;
  attempted_lat?: number;
  attempted_lng?: number;
  device_info: string;
  created_at: string;
}

interface SecurityViolationsViewProps {
  violations: SecurityViolation[];
  onRefresh: () => void;
}

export function SecurityViolationsView({
  violations,
}: SecurityViolationsViewProps) {
  const { showToast } = useToast();

  // Pengaturan Ambang Batas Dinamis
  const [thresholdSP1, setThresholdSP1] = useState<number>(1);
  const [thresholdSP2, setThresholdSP2] = useState<number>(2);
  const [thresholdPHK, setThresholdPHK] = useState<number>(3);
  const [showThresholdConfig, setShowThresholdConfig] = useState<boolean>(false);

  // Data Pejabat Penandatangan Surat (Dapat Diganti Bebas Oleh Admin)
  const [hrChiefName, setHrChiefName] = useState<string>("Siti Rahmawati, M.Psi");
  const [hrChiefNIP, setHrChiefNIP] = useState<string>("19850101001");
  const [hrChiefTitle, setHrChiefTitle] = useState<string>("Chief Human Resources Officer");

  // Modal Surat Sanksi State
  const [selectedViolation, setSelectedViolation] = useState<SecurityViolation | null>(null);
  const [letterType, setLetterType] = useState<"SP1" | "SP2" | "PHK">("SP1");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  const violationCountsByEmployee = useMemo(() => {
    const counts: Record<string, number> = {};
    violations.forEach((v) => {
      const key = v.nip || v.employee_name || "unknown";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [violations]);

  const handleOpenPrintModal = (v: SecurityViolation) => {
    setSelectedViolation(v);
    const key = v.nip || v.employee_name || "unknown";
    const totalCount = violationCountsByEmployee[key] || 1;

    if (totalCount >= thresholdPHK) {
      setLetterType("PHK");
    } else if (totalCount >= thresholdSP2) {
      setLetterType("SP2");
    } else {
      setLetterType("SP1");
    }

    setIsPrintModalOpen(true);
  };

  // GENERATOR DOKUMEN ASLI BERBENTUK BINARY PDF (application/pdf) MENGGUNAKAN JSPDF
  const handleGenerateRealPDF = (action: "open" | "download" = "open") => {
    if (!selectedViolation) return;

    try {
      const letterTitle =
        letterType === "SP1"
          ? "SURAT PERINGATAN PERTAMA (SP-1)"
          : letterType === "SP2"
          ? "SURAT PERINGATAN KEDUA (SP-2 - PERINGATAN KERAS)"
          : "SURAT PEMUTUSAN HUBUNGAN KERJA (PHK)";

      const letterNo = `${letterType}/HRD-INTEGRITY/${new Date().getFullYear()}/${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // 1. Kop Surat Resmi Perusahaan
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text("PT PRESENSIKU ENTERPRISE INDONESIA", 105, 22, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      doc.text("DIREKTORAT SUMBER DAYA MANUSIA & INTEGRITAS KEPEGAWAIAN", 105, 27, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Gedung Menara Sudirman Lantai 18, Jl. Jend. Sudirman Kav. 60, Jakarta Selatan 12190", 105, 31, { align: "center" });
      doc.text("Telepon: (021) 555-0826 | Portal Integritas: https://presensiku.com | Email: hrd@presensiku.com", 105, 35, { align: "center" });

      // Garis Pemisah Kop Surat Resmi Ganda (Double Line)
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.8);
      doc.line(20, 38, 190, 38);
      doc.setLineWidth(0.2);
      doc.line(20, 39.5, 190, 39.5);

      // 2. Judul Dokumen Surat
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(letterTitle, 105, 50, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Nomor: ${letterNo}`, 105, 55, { align: "center" });

      // 3. Badan Surat
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("Surat keputusan kedisiplinan ini diterbitkan secara sah oleh Manajemen kepada pegawai:", 20, 66);

      // Tabel Identitas Pegawai
      let y = 74;
      const drawField = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, 25, y);
        doc.text(":", 75, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, 78, y);
        y += 6;
      };

      drawField("Nama Lengkap", selectedViolation.employee_name || "Pegawai");
      drawField("Nomor Induk Pegawai (NIP)", selectedViolation.nip || "-");
      drawField("Tanggal Pelanggaran", new Date(selectedViolation.created_at).toLocaleDateString("id-ID", { dateStyle: "full" }));
      drawField("Temuan Forensik Kernel", `Terdeteksi Mock/Fake GPS (${selectedViolation.device_info || "HP Android"})`);
      if (selectedViolation.attempted_lat && selectedViolation.attempted_lng) {
        drawField("Titik Koordinat Palsu", `${selectedViolation.attempted_lat.toFixed(6)}, ${selectedViolation.attempted_lng.toFixed(6)}`);
      }

      y += 6;
      doc.setFont("helvetica", "normal");
      const p1 =
        "Berdasarkan hasil audit telemetri sistem PresensiKu Enterprise, yang bersangkutan terbukti secara sah dan meyakinkan melakukan manipulasi koordinat lokasi kehadiran menggunakan aplikasi Fake GPS / Mock Location, yang merupakan pelanggaran berat terhadap Kode Etik Integritas Perusahaan.";
      const splitP1 = doc.splitTextToSize(p1, 170);
      doc.text(splitP1, 20, y);
      y += splitP1.length * 5 + 4;

      const sanksiText =
        letterType === "SP1"
          ? "Melalui surat peringatan pertama (SP-1) ini, Manajemen memberikan teguran keras dan mewajibkan pegawai bersangkutan untuk menghapus seluruh aplikasi manipulasi lokasi di ponsel serta tidak mengulangi perbuatannya."
          : letterType === "SP2"
          ? "Mengingat ini adalah pelanggaran berulang tingkat kedua, Manajemen memberikan peringatan keras tingkat kedua (SP-2) disertai sanksi administratif berupa penangguhan insentif kehadiran dan evaluasi integritas berkala."
          : "Mengingat pelanggaran telah melampaui batas toleransi kedisiplinan dan dikategorikan sebagai kecurangan fatal yang disengaja, terhitung sejak surat ini diterbitkan, Perusahaan memutuskan hubungan kerja (PHK) secara tidak hormat.";

      const splitSanksi = doc.splitTextToSize(sanksiText, 170);
      doc.text(splitSanksi, 20, y);
      y += splitSanksi.length * 5 + 4;

      const pClose =
        "Demikian surat keputusan sanksi kedisiplinan ini dibuat untuk dapat diperhatikan dan dipatuhi sebagaimana mestinya.";
      doc.text(pClose, 20, y);
      y += 18;

      // 4. Area Tanda Tangan
      doc.text("Penerima Sanksi,", 25, y);
      doc.text(`Jakarta, ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}`, 125, y);
      doc.text(`${hrChiefTitle},`, 125, y + 5);

      y += 28;
      doc.setFont("helvetica", "bold");
      doc.text(selectedViolation.employee_name || "-", 25, y);
      doc.setFont("helvetica", "normal");
      doc.text(`NIP: ${selectedViolation.nip || "-"}`, 25, y + 5);

      doc.setFont("helvetica", "bold");
      doc.text(hrChiefName, 125, y);
      doc.setFont("helvetica", "normal");
      doc.text(`NIP: ${hrChiefNIP}`, 125, y + 5);

      // 5. Metadata Footer Keaslian Dokumen
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Dokumen Resmi Digital PresensiKu Enterprise • Validated by Anti-Mock Telemetry Engine • Timestamp: ${new Date().toISOString()}`,
        105,
        287,
        { align: "center" }
      );

      if (action === "download") {
        doc.save(`${letterType}_${(selectedViolation.employee_name || "Pegawai").replace(/\s+/g, "_")}.pdf`);
        showToast("success", `File PDF asli (${letterType}) berhasil diunduh ke komputer.`);
      } else {
        const blob = doc.output("blob");
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        showToast("success", `File PDF asli (${letterType}) berhasil dibuka di tab baru browser.`);
      }
    } catch (err: any) {
      showToast("error", err.message || "Gagal membuat dokumen PDF");
    }
  };

  const columns: Column<SecurityViolation>[] = [
    {
      key: "created_at",
      header: "Tanggal & Waktu",
      sortable: true,
      render: (v) => {
        const d = new Date(v.created_at);
        const dateStr = d.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const timeStr = d.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        });
        return (
          <span className="font-mono text-xs text-slate-700 whitespace-nowrap">
            {dateStr} {timeStr}
          </span>
        );
      },
    },
    {
      key: "employee_name",
      header: "Nama Pegawai",
      sortable: true,
      render: (v) => (
        <span className="font-bold text-slate-900 text-xs whitespace-nowrap">
          {v.employee_name || "Tidak Terdaftar"}
        </span>
      ),
    },
    {
      key: "nip",
      header: "NIP",
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs text-slate-600 whitespace-nowrap">
          {v.nip || "-"}
        </span>
      ),
    },
    {
      key: "violation_type",
      header: "Pelanggaran",
      sortable: true,
      render: (v) => {
        const key = v.nip || v.employee_name || "unknown";
        const total = violationCountsByEmployee[key] || 1;
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
            <span>Fake GPS ({total}x)</span>
          </span>
        );
      },
    },
    {
      key: "device_info",
      header: "Perangkat",
      render: (v) => (
        <span
          className="font-mono text-xs text-slate-600 truncate max-w-[150px] block whitespace-nowrap"
          title={v.device_info}
        >
          {v.device_info || "-"}
        </span>
      ),
    },
    {
      key: "coordinates",
      header: "Koordinat",
      render: (v) => (
        <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
          {v.attempted_lat && v.attempted_lng
            ? `${v.attempted_lat.toFixed(4)}, ${v.attempted_lng.toFixed(4)}`
            : "-"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (v) => (
        <button
          onClick={() => handleOpenPrintModal(v)}
          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Cetak Sanksi</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-2xl border border-rose-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Audit Pelanggaran Lokasi (Fake GPS)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan pelanggaran manipulasi GPS dan penerbitan surat keputusan sanksi.
          </p>
        </div>

        <button
          onClick={() => setShowThresholdConfig(!showThresholdConfig)}
          className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer transition-colors shrink-0"
        >
          <Sliders className="w-4 h-4 text-slate-500" />
          <span>Pengaturan Ambang & Pejabat HR</span>
        </button>
      </div>

      {/* Pengaturan Ambang Batas Sanksi & Pejabat HR */}
      {showThresholdConfig && (
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 animate-in fade-in duration-150">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Aturan Ambang Batas Pelanggaran Otomatis
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  Surat Peringatan 1 (SP-1)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={thresholdSP1}
                    onChange={(e) => setThresholdSP1(Number(e.target.value))}
                    className="w-16 px-2.5 py-1 bg-white border border-amber-200 rounded-lg text-xs font-bold text-amber-900"
                  />
                  <span className="text-xs text-amber-800">Kali Pelanggaran</span>
                </div>
              </div>

              <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl">
                <label className="block text-xs font-bold text-orange-900 mb-1">
                  Surat Peringatan 2 (SP-2)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={thresholdSP2}
                    onChange={(e) => setThresholdSP2(Number(e.target.value))}
                    className="w-16 px-2.5 py-1 bg-white border border-orange-200 rounded-lg text-xs font-bold text-orange-900"
                  />
                  <span className="text-xs text-orange-800">Kali Pelanggaran</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                <label className="block text-xs font-bold text-rose-900 mb-1">
                  Surat Pemutusan Hubungan Kerja (PHK)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={thresholdPHK}
                    onChange={(e) => setThresholdPHK(Number(e.target.value))}
                    className="w-16 px-2.5 py-1 bg-white border border-rose-200 rounded-lg text-xs font-bold text-rose-900"
                  />
                  <span className="text-xs text-rose-800">Kali Pelanggaran</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Identitas Pejabat Penandatangan Dokumen PDF
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Nama Pejabat:
                </label>
                <input
                  type="text"
                  value={hrChiefName}
                  onChange={(e) => setHrChiefName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  NIP Pejabat:
                </label>
                <input
                  type="text"
                  value={hrChiefNIP}
                  onChange={(e) => setHrChiefNIP(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Jabatan Resmi:
                </label>
                <input
                  type="text"
                  value={hrChiefTitle}
                  onChange={(e) => setHrChiefTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DataTable Audit */}
      <DataTable
        data={violations}
        columns={columns}
        searchPlaceholder="Cari nama pegawai, NIP, koordinat..."
        searchableKeys={["employee_name", "nip", "details", "device_info", "violation_type"]}
        emptyMessage="Belum ada insiden pelanggaran yang tercatat. Seluruh presensi pegawai sah."
      />

      {/* FULLSCREEN MODAL CETAK SURAT SANKSI PDF ASLI VIA PORTAL */}
      <FullscreenModal
        isOpen={isPrintModalOpen && Boolean(selectedViolation)}
        onClose={() => setIsPrintModalOpen(false)}
        title="Penerbitan Surat Keputusan Sanksi (Format Resmi PDF)"
        subtitle="Dokumen sah bertandatangan digital yang diekspor dalam format binary PDF standar ISO."
        icon={<FileText className="w-5 h-5 text-rose-600" />}
        maxWidth="5xl"
        footerActions={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Pilih Sanksi:
              </span>
              <div className="w-64">
                <CustomSelect
                  size="sm"
                  direction="up"
                  value={letterType}
                  onChange={(val) => setLetterType(val as any)}
                  options={[
                    { label: "Surat Peringatan I (SP 1)", value: "SP1" },
                    { label: "Surat Peringatan II (SP 2 - Keras)", value: "SP2" },
                    { label: "Pemutusan Hubungan Kerja (PHK)", value: "PHK" },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handleGenerateRealPDF("download")}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File PDF (.pdf)</span>
              </button>
              <button
                type="button"
                onClick={() => handleGenerateRealPDF("open")}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Buka Dokumen PDF (New Tab)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        }
      >
        {selectedViolation && (
          <div className="space-y-6">
            {/* PRATINJAU DOKUMEN SURAT RESMI */}
            <div className="p-8 sm:p-12 border border-slate-300 rounded-2xl bg-white text-slate-900 font-serif leading-relaxed text-xs sm:text-sm shadow-sm space-y-5 max-w-3xl mx-auto">
              {/* KOP SURAT */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase font-sans">
                  PT PRESENSIKU ENTERPRISE INDONESIA
                </h2>
                <p className="text-[11px] font-sans text-slate-600 font-medium">
                  DIREKTORAT SUMBER DAYA MANUSIA & INTEGRITAS KEPEGAWAIAN
                </p>
                <p className="text-[10px] font-sans text-slate-400">
                  Menara Sudirman Lantai 18, Jakarta Selatan • Email: hrd@presensiku.com
                </p>
              </div>

              {/* JUDUL SURAT */}
              <div className="text-center pt-2">
                <h3 className="font-bold underline text-sm sm:text-base uppercase tracking-wide">
                  {letterType === "SP1"
                    ? "SURAT PERINGATAN PERTAMA (SP-1)"
                    : letterType === "SP2"
                    ? "SURAT PERINGATAN KEDUA (SP-2 - PERINGATAN KERAS)"
                    : "SURAT PEMUTUSAN HUBUNGAN KERJA (PHK)"}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Nomor: {letterType}/HRD-INTEGRITY/{new Date().getFullYear()}/0482
                </p>
              </div>

              {/* IDENTITAS */}
              <div className="space-y-1.5 pt-2 text-xs">
                <p>Surat keputusan kedisiplinan ini diterbitkan secara sah oleh Manajemen kepada pegawai:</p>
                <div className="pl-4 py-2 border-l-2 border-slate-200 space-y-1">
                  <div className="grid grid-cols-4">
                    <span className="font-semibold text-slate-600">Nama Pegawai</span>
                    <span className="col-span-3 font-bold">: {selectedViolation.employee_name}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-semibold text-slate-600">NIP Pegawai</span>
                    <span className="col-span-3 font-mono">: {selectedViolation.nip}</span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-semibold text-slate-600">Tanggal Temuan</span>
                    <span className="col-span-3">
                      : {new Date(selectedViolation.created_at).toLocaleDateString("id-ID", { dateStyle: "full" })}
                    </span>
                  </div>
                  <div className="grid grid-cols-4">
                    <span className="font-semibold text-slate-600">Temuan Forensik</span>
                    <span className="col-span-3 font-bold text-rose-700">
                      : Terdeteksi Mock/Fake GPS ({selectedViolation.device_info})
                    </span>
                  </div>
                </div>
              </div>

              {/* KONTEN KLAUSUL */}
              <div className="space-y-3 text-justify text-xs leading-relaxed text-slate-800">
                <p className="indent-6">
                  Berdasarkan hasil audit telemetri sistem PresensiKu Enterprise, yang bersangkutan terbukti secara sah dan meyakinkan melakukan manipulasi koordinat lokasi kehadiran menggunakan aplikasi <strong>Fake GPS / Mock Location</strong>, yang merupakan pelanggaran berat terhadap Kode Etik Integritas Perusahaan.
                </p>

                <p className="indent-6">
                  {letterType === "SP1" && (
                    <span>
                      Melalui surat peringatan pertama ini, pihak Manajemen memberikan teguran keras dan mewajibkan pegawai bersangkutan untuk menghapus seluruh aplikasi ilegal di ponsel serta tidak mengulangi perbuatannya.
                    </span>
                  )}
                  {letterType === "SP2" && (
                    <span>
                      Mengingat ini adalah pelanggaran berulang, Manajemen memberikan peringatan keras tingkat kedua dengan penangguhan insentif kehadiran serta pemantauan ketat oleh divisi HRD.
                    </span>
                  )}
                  {letterType === "PHK" && (
                    <span>
                      Mengingat pelanggaran telah melampaui batas toleransi kedisiplinan dan termasuk kategori kecurangan disengaja, terhitung sejak surat ini diterbitkan, Perusahaan memutuskan hubungan kerja secara tidak hormat.
                    </span>
                  )}
                </p>

                <p className="indent-6">
                  Demikian surat keputusan sanksi kedisiplinan ini dibuat untuk dapat diindahkan sebagaimana mestinya.
                </p>
              </div>

              {/* TANDA TANGAN */}
              <div className="pt-6 flex justify-between items-end text-xs">
                <div className="text-center">
                  <p className="text-slate-600">Penerima Sanksi,</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{selectedViolation.employee_name}</p>
                  <p className="text-slate-500 font-mono text-[11px]">NIP: {selectedViolation.nip}</p>
                </div>

                <div className="text-center">
                  <p className="text-slate-600">
                    Jakarta, {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}
                  </p>
                  <p className="font-semibold text-slate-700">{hrChiefTitle},</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{hrChiefName}</p>
                  <p className="text-slate-500 font-mono text-[11px]">NIP: {hrChiefNIP}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </FullscreenModal>
    </div>
  );
}
