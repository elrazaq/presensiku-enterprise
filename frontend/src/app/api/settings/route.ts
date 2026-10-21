import { NextResponse } from "next/server";
import { db, logSystemAction } from "@/lib/db";

export async function GET() {
  try {
    const res = await db.query("SELECT key, value FROM app_settings");
    const settings: Record<string, string> = {};
    res.rows.forEach((row) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json({ success: true, data: settings });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { settings, actor_name = "Admin HRD" } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { success: false, error: "Data pengaturan tidak valid" },
        { status: 400 }
      );
    }

    for (const [k, v] of Object.entries(settings)) {
      await db.query(
        `INSERT INTO app_settings (key, value, updated_at) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (key) 
         DO UPDATE SET value = $2, updated_at = NOW()`,
        [k, String(v)]
      );
    }

    // Also update companies table if company_name or company_address changed
    if (settings.company_name || settings.company_address) {
      await db.query(
        `UPDATE companies 
         SET name = COALESCE($1, name), address = COALESCE($2, address), updated_at = NOW()
         WHERE id IN (SELECT id FROM companies LIMIT 1)`,
        [settings.company_name || null, settings.company_address || null]
      );
    }

    await logSystemAction({
      actorName: actor_name,
      action: "UPDATE",
      module: "SISTEM",
      targetId: "APP-CFG",
      targetName: settings.app_name || "Konfigurasi Sistem",
      details: `Memperbarui pengaturan dasar aplikasi: Nama App="${settings.app_name || "-"}", Instansi="${settings.company_name || "-"}"`,
    });

    return NextResponse.json({ success: true, message: "Pengaturan sistem berhasil disimpan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
