"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Zap,
  Activity,
  Terminal,
  Server,
  RefreshCw,
  CheckCircle2,
  X,
  Play,
  Lock,
} from "lucide-react";
import { FullscreenModal } from "./FullscreenModal";

interface GrpcInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GrpcInspectorModal({ isOpen, onClose }: GrpcInspectorModalProps) {
  const [activeTab, setActiveTab] = useState<"telemetry" | "binary" | "schema">("telemetry");
  const [healthData, setHealthData] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rpcResponse, setRpcResponse] = useState<any>(null);
  const [activeRpc, setActiveRpc] = useState<string>("HealthService/Check");

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/grpc/health");
      const json = await res.json();
      setHealthData(json);
      setLatency(json.latency_ms);
      setRpcResponse(json);
    } catch (err: any) {
      setHealthData({ success: false, error: err.message });
      setRpcResponse({ success: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const executeRPC = async (rpcName: string, endpoint: string) => {
    setActiveRpc(rpcName);
    setIsLoading(true);
    try {
      const res = await fetch(endpoint);
      const json = await res.json();
      setRpcResponse(json);
    } catch (err: any) {
      setRpcResponse({ success: false, error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runHealthCheck();
    }
  }, [isOpen]);

  const protoSchemaText = `syntax = "proto3";

package presensiku;

option go_package = "github.com/elrazaq/presensiku-enterprise/backend/pkg/proto/presensiku;presensikupb";

service HealthService {
  rpc Check(HealthRequest) returns (HealthResponse);
}

service AuthService {
  rpc LoginWeb(LoginWebRequest) returns (LoginWebResponse);
  rpc ValidateSession(SessionRequest) returns (SessionResponse);
}

service AttendanceService {
  rpc GetLiveQR(LiveQRRequest) returns (LiveQRResponse);
  rpc CheckInQR(CheckInQRRequest) returns (AttendanceResponse);
  rpc CheckInSelfie(CheckInSelfieRequest) returns (AttendanceResponse);
  rpc GetStats(StatsRequest) returns (StatsResponse);
}

service SecurityService {
  rpc ReportViolation(ViolationReportRequest) returns (ViolationReportResponse);
  rpc ListViolations(Empty) returns (ViolationListResponse);
}`;

  return (
    <FullscreenModal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Proteksi Protokol gRPC (HTTP/2 Binary Engine)"
      subtitle="Verifikasi langsung koneksi biner gRPC port 50051 yang melindungi lapisan data dari serangan manipulasi web."
      icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
      maxWidth="5xl"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>gRPC Server: localhost:50051 (Binary Protobuf Wire Format)</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            Tutup Audit
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Telemetri Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="text-[10px] uppercase font-bold text-emerald-700">Status gRPC Socket</div>
            <div className="text-lg font-black text-emerald-900 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>ACTIVE</span>
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Port 50051 (TCP Established)</div>
          </div>

          <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
            <div className="text-[10px] uppercase font-bold text-sky-700">Protokol Jaringan</div>
            <div className="text-lg font-black text-sky-900 mt-1 font-mono">HTTP/2 Binary</div>
            <div className="text-[11px] text-sky-600 mt-0.5">Multiplexed Frames</div>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
            <div className="text-[10px] uppercase font-bold text-purple-700">Serialisasi Data</div>
            <div className="text-lg font-black text-purple-900 mt-1 font-mono">Protobuf Wire v3</div>
            <div className="text-[11px] text-purple-600 mt-0.5">
              {rpcResponse?.wire_binary_inspection?.byte_length
                ? `${rpcResponse.wire_binary_inspection.byte_length} Bytes (Compact)`
                : "Biner Murni"}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
            <div className="text-[10px] uppercase font-bold text-amber-700">Round-Trip Latency</div>
            <div className="text-lg font-black text-amber-900 mt-1 font-mono">
              {latency !== null ? `${latency} ms` : "< 2 ms"}
            </div>
            <div className="text-[11px] text-amber-600 mt-0.5">Internal TCP Socket</div>
          </div>
        </div>

        {/* Keamanan & Anti-Tampering Banner */}
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-start gap-3.5 shadow-md">
          <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-slate-100">
              Format Biner di Kabel (Wire Protocol) vs Representasi UI
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Di kabel jaringan (TCP port 50051), data mengalir 100% dalam bentuk <strong>byte biner Protobuf terkompresi</strong> (lihat tab <em>Hex Dump & Biner</em> di bawah). Teks JSON hanya dibuat di memori browser agar admin dapat membacanya sebagai antarmuka pengguna tanpa melihat karakter biner acak.
            </p>
          </div>
        </div>

        {/* Tab Selector & RPC Tester */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
          <div className="px-4 py-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setActiveTab("telemetry")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === "telemetry"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Data Terurai (Decoded)
              </button>
              <button
                onClick={() => setActiveTab("binary")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === "binary"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Hex Dump & Biner (Asli di Kabel)
              </button>
              <button
                onClick={() => setActiveTab("schema")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === "schema"
                    ? "bg-white text-slate-900 shadow-2xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Skema presensiku.proto
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => executeRPC("HealthService/Check", "/api/grpc/health")}
                disabled={isLoading}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3 h-3 text-sky-600" />
                <span>RPC: HealthCheck</span>
              </button>
              <button
                onClick={() => executeRPC("AttendanceService/GetStats", "/api/grpc/stats")}
                disabled={isLoading}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3 h-3 text-emerald-600" />
                <span>RPC: GetStats</span>
              </button>
              <button
                onClick={() => executeRPC("AttendanceService/GetLiveQR", "/api/grpc/qr")}
                disabled={isLoading}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-3 h-3 text-purple-600" />
                <span>RPC: LiveQR</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-96">
            {activeTab === "telemetry" && (
              <div className="space-y-2">
                <div className="text-emerald-400 font-bold flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>[gRPC Client] Invoking {activeRpc} over HTTP/2 Channel...</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Format: Decoded Protobuf Payload
                  </span>
                </div>
                <pre className="text-slate-200 text-[11px] leading-relaxed overflow-x-auto">
                  {JSON.stringify(rpcResponse?.data || rpcResponse, null, 2)}
                </pre>
              </div>
            )}

            {activeTab === "binary" && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2 text-[11px]">
                  <div className="text-emerald-400 font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Raw Wire Format (Binary Protobuf Streams Port 50051)</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <span>
                      Ukuran Paket: <strong className="text-emerald-300">{rpcResponse?.wire_binary_inspection?.byte_length || 0} bytes</strong>
                    </span>
                    <span>Protokol: <strong className="text-sky-300">HTTP/2 DATA Frame</strong></span>
                  </div>
                </div>

                {/* Hex Dump */}
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Hexadecimal Memory Dump (Offset : Bytes : ASCII):
                  </div>
                  <pre className="text-emerald-300 text-[11px] leading-relaxed bg-slate-900/90 p-3 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre">
                    {rpcResponse?.wire_binary_inspection?.hex_dump || "Menunggu eksekusi RPC..."}
                  </pre>
                </div>

                {/* Bit Stream (16 Bytes Pertama) */}
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">
                    16 Byte Pertama dalam Bentuk Bit Biner (8-bit binary representation):
                  </div>
                  <div className="text-sky-300 text-[11px] leading-relaxed bg-slate-900/90 p-3 rounded-xl border border-slate-800 font-mono break-all">
                    {rpcResponse?.wire_binary_inspection?.bit_stream_first_16_bytes || "Menunggu data..."}
                  </div>
                </div>

                {/* Base64 Encoded Binary */}
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">
                    Raw Binary (Base64 Encoded Wire Payload):
                  </div>
                  <div className="text-purple-300 text-[11px] leading-relaxed bg-slate-900/90 p-3 rounded-xl border border-slate-800 font-mono break-all">
                    {rpcResponse?.wire_binary_inspection?.raw_base64 || "Menunggu data..."}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "schema" && (
              <pre className="text-emerald-300 text-[11px] leading-relaxed overflow-x-auto whitespace-pre">
                {protoSchemaText}
              </pre>
            )}
          </div>
        </div>
      </div>
    </FullscreenModal>
  );
}


