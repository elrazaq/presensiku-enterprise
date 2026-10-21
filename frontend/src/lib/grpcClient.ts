import path from "path";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

const PROTO_PATH = path.join(process.cwd(), "proto", "presensiku.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;
const presensiku = protoDescriptor.presensiku;

const GRPC_SERVER_ADDR = process.env.GRPC_SERVER_URL || "localhost:50051";

// 1. Client Instances
export const healthClient = new presensiku.HealthService(
  GRPC_SERVER_ADDR,
  grpc.credentials.createInsecure()
);

export const authClient = new presensiku.AuthService(
  GRPC_SERVER_ADDR,
  grpc.credentials.createInsecure()
);

export const attendanceClient = new presensiku.AttendanceService(
  GRPC_SERVER_ADDR,
  grpc.credentials.createInsecure()
);

export const securityClient = new presensiku.SecurityService(
  GRPC_SERVER_ADDR,
  grpc.credentials.createInsecure()
);

// 2. Helper Wrappers Promisified
export function grpcCheckHealth(): Promise<any> {
  return new Promise((resolve, reject) => {
    healthClient.Check(
      { client_version: "Next.js 15 Web Client" },
      (err: any, response: any) => {
        if (err) return reject(err);
        resolve(response);
      }
    );
  });
}

export function grpcGetStats(daysRange = 7, filterDepartment = "ALL"): Promise<any> {
  return new Promise((resolve, reject) => {
    attendanceClient.GetStats(
      { days_range: daysRange, filter_department: filterDepartment },
      (err: any, response: any) => {
        if (err) return reject(err);
        resolve(response);
      }
    );
  });
}

export function grpcGetLiveQR(departmentCode = "DEP-IT-03"): Promise<any> {
  return new Promise((resolve, reject) => {
    attendanceClient.GetLiveQR(
      { department_code: departmentCode },
      (err: any, response: any) => {
        if (err) return reject(err);
        resolve(response);
      }
    );
  });
}

export function grpcListViolations(): Promise<any> {
  return new Promise((resolve, reject) => {
    securityClient.ListViolations({}, (err: any, response: any) => {
      if (err) return reject(err);
      resolve(response);
    });
  });
}

// 3. Binary Wire Inspection Helper
export function inspectProtobufBinary(typeName: string, obj: any) {
  try {
    const protobuf = require("protobufjs");
    const root = new protobuf.Root();
    root.loadSync(PROTO_PATH, { keepCase: true });
    const type = root.lookupType(typeName);
    const msg = type.create(obj);
    const buffer = type.encode(msg).finish();


    let hexDump = "";
    for (let i = 0; i < buffer.length; i += 16) {
      const chunk = buffer.slice(i, i + 16);
      const hex = Array.from(chunk as number[])
        .map((b) => b.toString(16).padStart(2, "0"))
        .join(" ")
        .padEnd(48, " ");
      const ascii = Array.from(chunk as number[])
        .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
        .join("");
      const offset = i.toString(16).padStart(8, "0");
      hexDump += `${offset}:  ${hex}  |${ascii}|\n`;
    }

    const bitStream = Array.from(buffer.slice(0, 16) as number[])
      .map((b) => b.toString(2).padStart(8, "0"))
      .join(" ");

    return {
      byte_length: buffer.length,
      hex_dump: hexDump.trim(),
      bit_stream_first_16_bytes: bitStream,
      raw_hex: Buffer.from(buffer).toString("hex"),
      raw_base64: Buffer.from(buffer).toString("base64"),
    };
  } catch (e: any) {
    return {
      error: e.message,
    };
  }
}

