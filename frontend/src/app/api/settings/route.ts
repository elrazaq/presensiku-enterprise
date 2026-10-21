import { NextResponse } from "next/server";
import { db, logSystemAction } from "@/lib/db";

const DEFAULT_SETTINGS: Record<string, string> = {
  app_name: "PresensiKu Enterprise",
  company_name: "PT PresensiKu Enterprise Indonesia",
  company_address:
    "Gedung Cyber Tower Lt. 18, Jl. H.R. Rasuna Said Kav. X-5 No. 13, Jakarta Selatan",
  contact_email: "hrd@presensiku.com",
  contact_phone: "(021) 555-8920",
  attendance_method: "BOTH", // BOTH, QR_ONLY, SELFIE_ONLY
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY || "",
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET || "",
  cloudinary_upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || "",
  default_tolerance_minutes: "15",
  default_dispensation_quota: "3",
  default_geofence_radius: "30",
  hr_chief_name: "Siti Rahmawati, M.Psi",
  hr_chief_nip: "19850101001",
  hr_chief_title: "Chief Human Resources Officer",
};

export async function GET() {
  try {
    const res = await db.query("SELECT key, value FROM app_settings");
    const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
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
      details: `Memperbarui konfigurasi: Metode Presensi=${settings.attendance_method || "BOTH"}, Cloudinary=${settings.cloudinary_cloud_name ? "Terkonfigurasi" : "Belum diisi"}`,
    });

    return NextResponse.json({ success: true, message: "Pengaturan sistem berhasil disimpan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
