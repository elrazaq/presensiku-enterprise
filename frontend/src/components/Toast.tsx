"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string) => void;
  confirmAction: (options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const confirmAction = useCallback(
    ({
      title,
      message,
      confirmText = "Ya, Lanjutkan",
      cancelText = "Batal",
      onConfirm,
    }: {
      title: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
      onConfirm: () => void;
    }) => {
      setConfirmModal({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        onConfirm,
      });
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* Floating Toast Notification Container (Top Right) via Portal */}
      {mounted &&
        createPortal(
          <>
            <div className="fixed top-5 right-5 z-[999999] space-y-3 max-w-md w-full pointer-events-none">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex items-start gap-3 transition-all duration-300 animate-in slide-in-from-top-4 ${
                    t.type === "success"
                      ? "bg-white/95 border-emerald-300 text-slate-800 shadow-emerald-900/10"
                      : t.type === "error"
                      ? "bg-white/95 border-rose-300 text-slate-800 shadow-rose-900/10"
                      : "bg-white/95 border-sky-300 text-slate-800 shadow-sky-900/10"
                  }`}
                >
                  {t.type === "success" && (
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                  {t.type === "error" && (
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}
                  {t.type === "info" && (
                    <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <Info className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0 pt-0.5">
                    {t.title && (
                      <div className="font-bold text-xs text-slate-900 leading-tight mb-0.5">
                        {t.title}
                      </div>
                    )}
                    <div className="text-xs text-slate-600 leading-relaxed">
                      {t.message}
                    </div>
                  </div>

                  <button
                    onClick={() => removeToast(t.id)}
                    className="text-slate-400 hover:text-slate-600 p-1 shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Confirmation Modal Toast */}
            {confirmModal && confirmModal.isOpen && (
              <div className="fixed inset-0 z-[999999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
                  <h3 className="text-base font-extrabold text-slate-900 mb-2">
                    {confirmModal.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6 whitespace-pre-line">
                    {confirmModal.message}
                  </p>

                  <div className="flex justify-end gap-2.5">
                    <button
                      onClick={() => setConfirmModal(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {confirmModal.cancelText}
                    </button>
                    <button
                      onClick={() => {
                        confirmModal.onConfirm();
                        setConfirmModal(null);
                      }}
                      className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      {confirmModal.confirmText}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
