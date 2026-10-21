"use client";

import React, { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

interface RealQRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function RealQRCode({ value, size = 260, className = "" }: RealQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !value) return;

    // Generate real ISO/IEC 18004 QR Code with High Error Correction (Level H)
    // agar bisa disematkan logo di tengah dan tetap 100% terbaca kamera HP
    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: 2,
        errorCorrectionLevel: "H", // High: 30% damage/overlay recovery
        color: {
          dark: "#0f172a", // Slate-900 sharp
          light: "#ffffff",
        },
      },
      (err) => {
        if (err) {
          console.error("Gagal generate QR Code:", err);
          setError("Gagal menghasilkan barcode QR");
        } else {
          setError(null);
        }
      }
    );
  }, [value, size]);

  if (error) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 p-4 text-center"
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{ width: size + 20, height: size + 20 }}
      className={`bg-white p-2.5 rounded-2xl border border-slate-200 shadow-md flex items-center justify-center relative select-none ${className}`}
    >
      <canvas ref={canvasRef} className="rounded-xl" />

      {/* Central Brand Badge PK - Tetap terbaca berkat Error Correction Level H */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-10 h-10 rounded-xl bg-sky-600 border-2 border-white flex items-center justify-center shadow-md">
          <span className="text-[11px] font-mono font-black text-white">PK</span>
        </div>
      </div>
    </div>
  );
}
