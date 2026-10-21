"use client";

import React from "react";
import { ShieldCheck, LogOut, Radio, Building2 } from "lucide-react";

interface NavbarProps {
  adminUser: {
    nip?: string;
    name?: string;
    role?: string;
  } | null;
  serverStatus: boolean;
  onLogout: () => void;
}

export function Navbar({ adminUser, serverStatus, onLogout }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Enterprise Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-black text-lg">
              PK
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">
                  Presensi<span className="text-sky-600">Ku</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  ENTERPRISE
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                PT PresensiKu Enterprise Indonesia
              </p>
            </div>
          </div>

          {/* Right Header Status & User */}
          <div className="flex items-center space-x-4">
            {/* Live Server Indicator */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs">
              <span className="relative flex h-2 w-2">
                {serverStatus && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    serverStatus ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                ></span>
              </span>
              <span className="text-slate-600 font-medium">
                {serverStatus ? "Server Go Online" : "Server Terputus"}
              </span>
            </div>

            {/* Admin Profile */}
            {adminUser && (
              <div className="flex items-center space-x-3 pl-2 sm:border-l sm:border-slate-200">
                <div className="text-right hidden md:block">
                  <div className="text-sm font-semibold text-slate-800 leading-tight">
                    {adminUser.name || "Administrator HR"}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    NIP: {adminUser.nip || "ADM-001"} •{" "}
                    <span className="text-emerald-600 font-semibold">
                      {adminUser.role || "SUPERADMIN"}
                    </span>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-bold text-sm">
                  {(adminUser.name || "A").charAt(0)}
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  title="Keluar dari Portal Admin"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
