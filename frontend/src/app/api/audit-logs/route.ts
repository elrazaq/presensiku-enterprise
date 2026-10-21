import { NextResponse } from "next/server";
import { db, logSystemAction } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const actionFilter = searchParams.get("action");
    const moduleFilter = searchParams.get("module");

    let query = `
      SELECT id, actor_name, actor_role, action, module, target_id, target_name, details, ip_address, created_at
      FROM system_audit_logs
      WHERE 1=1
    `;
    const params: any[] = [];

    if (actionFilter && actionFilter !== "ALL") {
      params.push(actionFilter);
      query += ` AND action = $${params.length}`;
    }

    if (moduleFilter && moduleFilter !== "ALL") {
      params.push(moduleFilter);
      query += ` AND module = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC LIMIT 150`;

    const result = await db.query(query, params);
    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      actorName = "Admin HRD",
      actorRole = "SUPERADMIN",
      action,
      module,
      targetId,
      targetName,
      details,
    } = body;

    if (!action || !module || !details) {
      return NextResponse.json(
        { success: false, error: "action, module, dan details wajib diisi" },
        { status: 400 }
      );
    }

    await logSystemAction({
      actorName,
      actorRole,
      action,
      module,
      targetId,
      targetName,
      details,
    });

    return NextResponse.json({ success: true, message: "Log audit berhasil disimpan" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
