"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Maximize2 } from "lucide-react";

interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footerActions?: React.ReactNode;
  maxWidth?: "full" | "6xl" | "5xl" | "4xl";
}

export function FullscreenModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footerActions,
  maxWidth = "5xl",
}: FullscreenModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const widthClass =
    maxWidth === "full"
      ? "w-screen h-screen rounded-none"
      : maxWidth === "6xl"
      ? "max-w-6xl w-full h-[94vh] rounded-3xl"
      : maxWidth === "5xl"
      ? "max-w-5xl w-full h-[92vh] rounded-3xl"
      : "max-w-4xl w-full h-[90vh] rounded-3xl";

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div
        className={`bg-white ${widthClass} shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 relative`}
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3.5 min-w-0">
            {icon && (
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 shadow-2xs">
                {icon}
              </div>
            )}
            <div className="truncate">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded-md">
              ESC untuk tutup
            </span>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-200/60 hover:bg-rose-100 hover:text-rose-700 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Tutup Modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white">
          {children}
        </div>

        {/* Bottom Footer Actions Bar */}
        {footerActions && (
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/90 flex items-center justify-end gap-3 shrink-0">
            {footerActions}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
