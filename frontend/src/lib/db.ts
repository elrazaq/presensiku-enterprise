import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === "production") {
  console.warn("DATABASE_URL is not set in environment variables.");
}

declare global {
  var _pgPool: Pool | undefined;
}

export const db =
  global._pgPool ||
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = db;
}

export async function logSystemAction({
  actorName = "Admin HRD",
  actorRole = "SUPERADMIN",
  action,
  module,
  targetId = "",
  targetName = "",
  details,
  ipAddress = "127.0.0.1",
}: {
  actorName?: string;
  actorRole?: string;
  action: "INSERT" | "UPDATE" | "DELETE" | "SECURITY" | "DISPENSATION" | "AUTH";
  module: "PEGAWAI" | "SHIFT" | "GEOFENCE" | "ABSENSI" | "SANKSI" | "SISTEM";
  targetId?: string;
  targetName?: string;
  details: string;
  ipAddress?: string;
}) {
  try {
    await db.query(
      `INSERT INTO system_audit_logs (actor_name, actor_role, action, module, target_id, target_name, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [actorName, actorRole, action, module, targetId, targetName, details, ipAddress]
    );
  } catch (err) {
    console.error("Gagal menyimpan system audit log:", err);
  }
}
