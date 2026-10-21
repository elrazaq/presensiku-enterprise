import { NextResponse } from "next/server";
import { grpcGetLiveQR, inspectProtobufBinary } from "@/lib/grpcClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dept = searchParams.get("dept") || "DEP-IT-03";

  try {
    const data = await grpcGetLiveQR(dept);
    const binaryWire = inspectProtobufBinary("presensiku.LiveQRResponse", data);
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

