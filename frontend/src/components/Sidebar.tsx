"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  QrCode,
  MapPin,
  Users,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  X,
  UserCheck,
  Clock,
  FileText,
  Settings,
} from "lucide-react";
import { SystemAuditLogModal } from "./SystemAuditLogModal";

export type TabType =
  | "overview"
  | "attendance"
  | "shifts"
  | "kiosk"
  | "geofence"
  | "employees"
  | "violations"
  | "settings";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  violationsCount: number;
  serverStatus: boolean;
  adminUser: any;
  onLogout: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  violationsCount,
  serverStatus,
  adminUser,
  onLogout,
}: SidebarProps) {
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);

  const menuItems = [
    {
      id: "overview" as TabType,
      label: "Dashboard",
      shortLabel: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "attendance" as TabType,
      label: "Log Presensi",
      shortLabel: "Presensi",
      icon: UserCheck,
      badge: null,
    },
    {
      id: "shifts" as TabType,
      label: "Manajemen Shift",
      shortLabel: "Shift",
      icon: Clock,
      badge: null,
    },
    {
      id: "kiosk" as TabType,
      label: "Monitor QR",
      shortLabel: "QR",
      icon: QrCode,
      badge: null,
    },
    {
      id: "geofence" as TabType,
      label: "Geofence",
      shortLabel: "Geofence",
      icon: MapPin,
      badge: null,
    },
    {
      id: "employees" as TabType,
      label: "Data Pegawai",
      shortLabel: "Pegawai",
      icon: Users,
      badge: null,
    },
    {
      id: "violations" as TabType,
      label: "Audit Pelanggaran",
      shortLabel: "Pelanggaran",
      icon: ShieldAlert,
      badge: violationsCount > 0 ? violationsCount : null,
      badgeColor: "bg-rose-500 text-white",
    },
    {
      id: "settings" as TabType,
      label: "Pengaturan",
      shortLabel: "Pengaturan",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar Element (Enterprise Navy Blue Background) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#0c1f38] border-r border-[#162d50] flex flex-col justify-between transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-18" : "w-64"
        } ${
          isMobileOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header & Brand Card (White Card Protection against Blue Background) */}
        <div>
          {isCollapsed ? (
            <div className="p-3 flex justify-center border-b border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-white p-1 shadow-md border border-white/20 flex items-center justify-center">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-black text-xs">
                  PK
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 border-b border-white/10">
              <div className="p-2.5 rounded-2xl bg-white shadow-md border border-slate-200/50 flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center shadow-sm text-white font-black text-sm shrink-0">
                    PK
                  </div>
                  <div className="truncate">
                    <div className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                      <span>Presensi<span className="text-sky-600">Ku</span></span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200">
                        ENT
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <Building2 className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                      <span>PT PresensiKu ID</span>
                    </div>
                  </div>
                </div>

                {/* Close button on mobile */}
                <button
                  onClick={onCloseMobile}
                  className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Navigasi Menu */}
          <nav className="p-3 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile();
                  }}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl font-medium text-xs transition-all cursor-pointer ${
                    isCollapsed
                      ? "justify-center p-3"
                      : "justify-between px-3.5 py-2.5"
                  } ${
                    isActive
                      ? "bg-sky-500 text-white font-bold shadow-md shadow-sky-500/25"
                      : "text-blue-100/75 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? "text-white" : "text-blue-200/70"
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-white/25 text-white"
                          : item.badgeColor || "bg-rose-500 text-white"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Floating Center Edge Toggle Button (Elegan di Tengah Perbatasan Kanan) */}
        <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-50">
          <button
            onClick={onToggleCollapse}
            className="w-7 h-7 rounded-full bg-white border border-slate-300 shadow-md flex items-center justify-center text-slate-700 hover:text-sky-600 hover:border-sky-400 transition-all cursor-pointer hover:scale-105"
            title={isCollapsed ? "Buka Sidebar" : "Kecilkan Sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Bottom Section: Server Status, Sistem Log & User Profile */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {!isCollapsed && (
            <div className="space-y-1.5">
              {/* Server Status */}
              <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] flex items-center justify-between">
                <span className="text-blue-200/70 font-medium">Server :</span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    {serverStatus && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        serverStatus ? "bg-emerald-400" : "bg-rose-500"
                      }`}
                    ></span>
                  </span>
                  <span
                    className={`font-semibold ${
                      serverStatus ? "text-emerald-300" : "text-rose-400"
                    }`}
                  >
                    {serverStatus ? "Online (Go)" : "Offline"}
                  </span>
                </div>
              </div>

              {/* Sistem Log Action Button */}
              <button
                type="button"
                onClick={() => setIsAuditLogOpen(true)}
                className="w-full px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-[11px] flex items-center justify-between transition-colors cursor-pointer text-white"
                title="Buka sistem log dan riwayat audit interaksi data"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Sistem Log</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-sky-300 bg-sky-950/60 px-1.5 py-0.2 rounded border border-sky-400/30">
                  Audit
                </span>
              </button>
            </div>
          )}

          {/* Modal Audit Sistem Log */}
          <SystemAuditLogModal
            isOpen={isAuditLogOpen}
            onClose={() => setIsAuditLogOpen(false)}
          />

          {/* User Profile & Logout */}
          <div
            className={`flex items-center ${
              isCollapsed ? "justify-center" : "justify-between"
            } pt-2 border-t border-white/10`}
          >
            {!isCollapsed && adminUser && (
              <div className="truncate mr-2">
                <div className="text-xs font-bold text-white truncate">
                  {adminUser.name || "Administrator"}
                </div>
                <div className="text-[10px] text-blue-200/60 font-mono">
                  {adminUser.nip || "ADM-001"}
                </div>
              </div>
            )}

            <button
              onClick={onLogout}
              title="Keluar dari Sistem"
              className="p-2 text-blue-200/70 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
