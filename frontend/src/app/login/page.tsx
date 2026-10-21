"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock, Mail, ArrowRight, Building2, AlertCircle } from "lucide-react";
import { API_BASE_URL, setAuthToken, setStoredUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [nipOrEmail, setNipOrEmail] = useState("admin@presensiku.com");
  const [password, setPassword] = useState("PresensiKu2026!");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login/web`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nip_or_email: nipOrEmail.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan login administrator");
      }

      // Simpan Token & Profil Admin
      if (data.data?.token) {
        setAuthToken(data.data.token);
        setStoredUser(data.data.user);
        router.push("/");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Terjadi kesalahan saat menghubungkan ke server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl shadow-sky-900/5 relative overflow-hidden">
        {/* Soft Background Accents */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-sky-100 rounded-full blur-2xl opacity-70 pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-emerald-100 rounded-full blur-2xl opacity-70 pointer-events-none"></div>

        {/* Brand Header */}
        <div className="text-center mb-8 relative">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-sky-500/25 mb-4">
            PK
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Presensi<span className="text-sky-600">Ku</span> Enterprise
          </h1>
          <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Portal Masuk Administrator & HR
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Form Login */}
        <form onSubmit={handleSubmit} className="space-y-4 relative">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              NIP / Email Administrator
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={nipOrEmail}
                onChange={(e) => setNipOrEmail(e.target.value)}
                placeholder="admin@presensiku.com atau ADM-001"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 py-3 px-4 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-sky-600/25 transition-all cursor-pointer disabled:opacity-70"
          >
            <span>{isLoading ? "Memverifikasi Kredensial..." : "Masuk ke Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security Footer Info */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Terproteksi Enkripsi JWT HS256 & Neon PostgreSQL Cloud</span>
        </div>
      </div>
    </div>
  );
}
