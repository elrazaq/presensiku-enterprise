import { NextResponse } from "next/server";
import { grpcCheckHealth, inspectProtobufBinary } from "@/lib/grpcClient";

export async function GET() {
  const startTime = Date.now();
  try {
    const data = await grpcCheckHealth();
    const latencyMs = Date.now() - startTime;
    const binaryWire = inspectProtobufBinary("presensiku.HealthResponse", data);

    return NextResponse.json({
      success: true,
      protocol: "gRPC over HTTP/2 (Binary Protobuf Wire Format)",
      transport_layer: "TCP Socket localhost:50051",
      latency_ms: latencyMs,
      data,
      wire_binary_inspection: binaryWire,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        protocol: "gRPC over HTTP/2 (Binary Protobuf Wire Format)",
        error: error.message || "Failed to communicate with gRPC backend",
      },
      { status: 500 }
    );
  }
}

