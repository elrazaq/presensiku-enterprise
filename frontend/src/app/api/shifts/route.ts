import { NextResponse } from "next/server";
import { db, logSystemAction } from "@/lib/db";

export async function GET() {
  try {
    const query = `
      SELECT 
        s.id, 
        s.name, 
        s.start_time, 
        s.end_time, 
        s.late_tolerance_minutes, 
        COALESCE(s.half_day_limit_time, '12:00:00'::TIME) as half_day_limit_time,
        s.is_active, 
        s.created_at,
        COUNT(e.id)::int as total_employees
      FROM shifts s
      LEFT JOIN employees e ON e.shift_id = s.id
      GROUP BY s.id
      ORDER BY s.start_time ASC
    `;
    const res = await db.query(query);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      start_time,
      end_time,
      late_tolerance_minutes = 15,
      half_day_limit_time = "12:00:00",
      is_active = true,
      actor_name = "Admin HRD",
    } = body;

    if (!name || !start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: "Nama shift, jam mulai, dan jam selesai wajib diisi" },
        { status: 400 }
      );
    }

    // Get company ID
    const compRes = await db.query("SELECT id FROM companies LIMIT 1");
    const companyId = compRes.rows[0]?.id;

    const insertQuery = `
      INSERT INTO shifts (company_id, name, start_time, end_time, late_tolerance_minutes, half_day_limit_time, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const res = await db.query(insertQuery, [
      companyId,
      name,
      start_time,
      end_time,
      late_tolerance_minutes,
      half_day_limit_time,
      is_active,
    ]);

    const newShift = res.rows[0];

    // Log action
    await logSystemAction({
      actorName: actor_name,
      action: "INSERT",
      module: "SHIFT",
      targetId: newShift.id,
      targetName: newShift.name,
      details: `Menambahkan master shift kerja baru: "${newShift.name}" (${start_time} - ${end_time}), Toleransi: ${late_tolerance_minutes} mnt, Cut-off Absen: ${half_day_limit_time}`,
    });

    return NextResponse.json({ success: true, data: newShift });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      start_time,
      end_time,
      late_tolerance_minutes,
      half_day_limit_time,
      is_active,
      actor_name = "Admin HRD",
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID Shift wajib disertakan" }, { status: 400 });
    }

    const updateQuery = `
      UPDATE shifts
      SET name = COALESCE($2, name),
          start_time = COALESCE($3, start_time),
          end_time = COALESCE($4, end_time),
          late_tolerance_minutes = COALESCE($5, late_tolerance_minutes),
          half_day_limit_time = COALESCE($6, half_day_limit_time),
          is_active = COALESCE($7, is_active)
      WHERE id = $1
      RETURNING *
    `;
    const res = await db.query(updateQuery, [
      id,
      name,
      start_time,
      end_time,
      late_tolerance_minutes,
      half_day_limit_time,
      is_active,
    ]);

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Shift tidak ditemukan" }, { status: 404 });
    }

    const updated = res.rows[0];

    await logSystemAction({
      actorName: actor_name,
      action: "UPDATE",
      module: "SHIFT",
      targetId: updated.id,
      targetName: updated.name,
      details: `Memperbarui shift: "${updated.name}" (${updated.start_time} - ${updated.end_time}), Toleransi: ${updated.late_tolerance_minutes} mnt, Cut-off: ${updated.half_day_limit_time}`,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const actor_name = searchParams.get("actor") || "Admin HRD";

    if (!id) {
      return NextResponse.json({ success: false, error: "ID shift wajib disertakan" }, { status: 400 });
    }

    const shiftRes = await db.query("SELECT name FROM shifts WHERE id = $1", [id]);
    const shiftName = shiftRes.rows[0]?.name || "Shift";

    // Unset shift from employees first
    await db.query("UPDATE employees SET shift_id = NULL WHERE shift_id = $1", [id]);
    await db.query("DELETE FROM shifts WHERE id = $1", [id]);

    await logSystemAction({
      actorName: actor_name,
      action: "DELETE",
      module: "SHIFT",
      targetId: id,
      targetName: shiftName,
      details: `Menghapus master shift kerja: "${shiftName}". Seluruh relasi pegawai telah di-reset ke non-shift.`,
    });

    return NextResponse.json({ success: true, message: "Shift berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
