import { NextResponse } from "next/server";
import { grpcGetStats, inspectProtobufBinary } from "@/lib/grpcClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7");
  const dept = searchParams.get("dept") || "ALL";

  try {
    const data = await grpcGetStats(days, dept);
    const binaryWire = inspectProtobufBinary("presensiku.StatsResponse", data);
    return NextResponse.json({
      success: true,
      protocol: "gRPC over HTTP/2 (Binary Protobuf Wire Format)",
      transport_layer: "TCP Socket localhost:50051",
      data,
      wire_binary_inspection: binaryWire,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

