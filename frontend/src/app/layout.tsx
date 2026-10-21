import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "PresensiKu Enterprise — Portal Administrator",
  description: "Sistem Presensi Pegawai Terintegrasi dengan Dynamic QR TOTP, Geofencing GPS, & Device ID Binding",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900 font-sans">
        {children}
      </body>
    </html>
  );
}
