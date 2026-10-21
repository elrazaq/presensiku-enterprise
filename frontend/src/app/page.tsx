"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Users,
  Smartphone,
  MapPin,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  QrCode,
  Building2,
  UserCheck,
} from "lucide-react";
import { Sidebar, TabType } from "@/components/Sidebar";
import { KioskQRView } from "@/components/KioskQRView";
import { GeofenceView } from "@/components/GeofenceView";
import { EmployeeManagement } from "@/components/EmployeeManagement";
import { SecurityViolationsView } from "@/components/SecurityViolationsView";
import { AttendanceAuditView } from "@/components/AttendanceAuditView";
import { ExecutiveAnalytics } from "@/components/ExecutiveAnalytics";
import { ShiftManagement } from "@/components/ShiftManagement";
import { AppSettingsView } from "@/components/AppSettingsView";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ToastProvider, useToast } from "@/components/Toast";
import {
  getAuthToken,
  clearAuthToken,
  getStoredUser,
  fetchWithAuth,
  API_BASE_URL,
} from "@/lib/api";

function DashboardContent() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [adminUser, setAdminUser] = useState<any>(null);
  const [serverStatus, setServerStatus] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Responsive Sidebar States
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Master Data States
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [lastCheckedViolations, setLastCheckedViolations] = useState<number>(0);


  const [animationKey, setAnimationKey] = useState<number>(0);

  const checkAuthAndLoad = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setIsLoading(true);

      const healthRes = await fetch(`${API_BASE_URL}/health`).catch(() => null);
      setServerStatus(healthRes ? healthRes.ok : false);

      const userRes = await fetchWithAuth<any>("/auth/me");
      if (userRes.data) {
        setAdminUser(userRes.data);
      }

      await loadMasterData();
    } catch (err: any) {
      console.error("Gagal inisialisasi dashboard:", err);
      if (err.message?.includes("401") || err.message?.includes("Akses ditolak")) {
        clearAuthToken();
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const loadMasterData = async () => {
    try {
      const [empRes, deptRes, violRes, attRes] = await Promise.all([
        fetchWithAuth<any[]>("/admin/employees").catch(() => ({ data: [] })),
        fetchWithAuth<any[]>("/admin/departments").catch(() => ({ data: [] })),
        fetchWithAuth<any[]>("/admin/violations").catch(() => ({ data: [] })),
        fetchWithAuth<any[]>("/admin/attendance").catch(() => ({ data: [] })),
      ]);

      if (empRes.data) setEmployees(empRes.data);
      if (deptRes.data) setDepartments(deptRes.data);
      if (violRes.data) setViolations(violRes.data);
      if (attRes.data) setAttendanceLogs(attRes.data);
    } catch (e) {
      console.error("Error loading master data:", e);
    }
  };

  useEffect(() => {
    const cachedUser = getStoredUser();
    if (cachedUser) setAdminUser(cachedUser);
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("presensiku_last_checked_violations");
      if (saved !== null) {
        setLastCheckedViolations(parseInt(saved, 10));
      }
    }
    checkAuthAndLoad();
  }, [checkAuthAndLoad]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setAnimationKey((prev) => prev + 1);

    // Jika admin membuka menu pelanggaran, tandai semua pelanggaran saat ini sudah dicek
    if (tab === "violations") {
      setLastCheckedViolations(violations.length);
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "presensiku_last_checked_violations",
          violations.length.toString()
        );
      }
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    showToast("info", "Anda telah keluar dari Portal Administrator.");
    router.push("/login");
  };

  const boundDevicesCount = employees.filter((e) => e.is_device_bound).length;
  // Counter hanya muncul jika ada pelanggaran baru yang belum dicek
  const unreviewedViolationsCount = Math.max(0, violations.length - lastCheckedViolations);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* 1. SIDEBAR COLLAPSIBLE DENGAN FLOATING CENTER TOGGLE */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        violationsCount={unreviewedViolationsCount}
        serverStatus={serverStatus}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      {/* 2. MAIN CONTENT WRAPPER */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          isCollapsed ? "lg:pl-18" : "lg:pl-64"
        }`}
      >
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                {activeTab === "overview" && "Dashboard"}
                {activeTab === "attendance" && "Log Presensi"}
                {activeTab === "shifts" && "Manajemen Shift"}
                {activeTab === "kiosk" && "Monitor QR"}
                {activeTab === "geofence" && "Geofence Lokasi"}
                {activeTab === "employees" && "Data Pegawai"}
                {activeTab === "violations" && "Audit Pelanggaran"}
                {activeTab === "settings" && "Pengaturan"}
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Sistem Presensi Karyawan & Geofencing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={loadMasterData}
              title="Perbarui Data Terkini"
              className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {adminUser && (
              <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-sky-400 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  {(adminUser.name || "A").charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                    {adminUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold font-mono">
                    {adminUser.role || "SUPERADMIN"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 max-w-7xl w-full mx-auto">
          {isLoading && !adminUser ? (
            <SkeletonLoader />
          ) : (
            <div key={animationKey} className="space-y-6">
              {/* TOP METRICS CARDS (Cascading Staggered Animation) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="animate-card-cascade delay-card-1 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Pegawai</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
                    {employees.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">Total terdaftar</div>
                </div>

                <div className="animate-card-cascade delay-card-2 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400">HP Terikat</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-2 font-mono">
                    {boundDevicesCount}
                  </div>
                  <div className="text-[11px] text-emerald-700/80 mt-0.5 truncate">Perangkat Terverifikasi</div>
                </div>

                <div className="animate-card-cascade delay-card-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Presensi Hari Ini</span>
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2 font-mono">
                    {attendanceLogs.length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 truncate">Total log masuk</div>
                </div>

                <div className="animate-card-cascade delay-card-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Pelanggaran</span>
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-600 mt-2 font-mono">
                    {violations.length}
                  </div>
                  <div className="text-[11px] text-rose-600 mt-0.5 truncate">Fake GPS dicegah</div>
                </div>
              </div>

              {/* MAIN CONTENT TAB (Cascade Animation) */}
              <div className="animate-card-cascade delay-card-5">
                {/* 1. RINGKASAN EKSEKUTIF & GRAFIK KUSTOM */}
                {activeTab === "overview" && (
                  <ExecutiveAnalytics
                    employeesCount={employees.length}
                    departments={departments}
                    violationsCount={violations.length}
                    attendanceLogs={attendanceLogs}
                  />
                )}

                {/* 2. LOG PRESENSI PEGAWAI & AUDIT FOTO WAJAH */}
                {activeTab === "attendance" && (
                  <AttendanceAuditView
                    logs={attendanceLogs}
                    onRefresh={loadMasterData}
                  />
                )}

                {/* 3. MANAJEMEN SHIFT KERJA */}
                {activeTab === "shifts" && <ShiftManagement />}

                {/* 4. MONITOR QR KIOSK */}
                {activeTab === "kiosk" && <KioskQRView departments={departments} />}

                {/* 4. GEOFENCE VIEW */}
                {activeTab === "geofence" && (
                  <GeofenceView
                    departments={departments}
                    onRefresh={loadMasterData}
                  />
                )}

                {/* 5. EMPLOYEE MANAGEMENT & RESET DEVICE */}
                {activeTab === "employees" && (
                  <EmployeeManagement
                    employees={employees}
                    departments={departments}
                    onRefresh={loadMasterData}
                  />
                )}

                {/* 6. AUDIT PELANGGARAN FAKE GPS */}
                {activeTab === "violations" && (
                  <SecurityViolationsView
                    violations={violations}
                    onRefresh={loadMasterData}
                  />
                )}

                {/* 7. PENGATURAN APLIKASI & PROFIL INSTANSI */}
                {activeTab === "settings" && <AppSettingsView />}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
