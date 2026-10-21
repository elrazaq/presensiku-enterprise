import { NextResponse } from "next/server";
import { db, logSystemAction } from "@/lib/db";

// GET: List all dispensations
export async function GET() {
  try {
    const query = `
      SELECT 
        d.id,
        d.employee_id,
        e.full_name as employee_name,
        e.nip,
        e.position_title,
        e.dispensation_quota_remaining,
        COALESCE(s.name, 'Reguler') as shift_name,
        d.target_date,
        d.requested_check_in,
        d.reason,
        d.quota_used_number,
        d.approval_status,
        d.approved_at,
        d.notes,
        d.created_at
      FROM attendance_dispensations d
      JOIN employees e ON e.id = d.employee_id
      LEFT JOIN shifts s ON s.id = e.shift_id
      ORDER BY d.created_at DESC
    `;
    const res = await db.query(query);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Submit new dispensation request (by employee or admin on behalf of employee)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      employee_id,
      target_date,
      requested_check_in,
      reason,
      actor_name = "Pegawai",
    } = body;

    if (!employee_id || !target_date || !requested_check_in || !reason) {
      return NextResponse.json(
        { success: false, error: "Semua data wajib diisi secara lengkap" },
        { status: 400 }
      );
    }

    // Check employee quota
    const empRes = await db.query(
      "SELECT id, full_name, dispensation_quota_remaining FROM employees WHERE id = $1",
      [employee_id]
    );

    if (empRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Pegawai tidak ditemukan" }, { status: 404 });
    }

    const employee = empRes.rows[0];
    const quotaRemaining = employee.dispensation_quota_remaining;

    if (quotaRemaining <= 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Jatah pengajuan dispensasi absensi masuk telah habis (3 kali telah digunakan). Pegawai tidak dapat mengajukan lagi.",
        },
        { status: 400 }
      );
    }

    const quotaUsedNumber = 4 - quotaRemaining; // 1st, 2nd, or 3rd use

    const insertQuery = `
      INSERT INTO attendance_dispensations (employee_id, target_date, requested_check_in, reason, quota_used_number, approval_status)
      VALUES ($1, $2, $3, $4, $5, 'PENDING')
      RETURNING *
    `;
    const insRes = await db.query(insertQuery, [
      employee_id,
      target_date,
      requested_check_in,
      reason,
      quotaUsedNumber,
    ]);

    await logSystemAction({
      actorName: actor_name,
      action: "INSERT",
      module: "ABSENSI",
      targetId: insRes.rows[0].id,
      targetName: employee.full_name,
      details: `Pengajuan dispensasi absen masuk (Pemakaian jatah ke-${quotaUsedNumber}/3) untuk tanggal ${target_date} pukul ${requested_check_in}. Alasan: "${reason}"`,
    });

    return NextResponse.json({
      success: true,
      data: insRes.rows[0],
      quota_remaining: quotaRemaining,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH: Approve or Reject dispensation
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, notes = "", admin_name = "Admin HRD" } = body;

    if (!id || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Status harus APPROVED atau REJECTED" },
        { status: 400 }
      );
    }

    // Get dispensation record
    const dispRes = await db.query(
      `SELECT d.*, e.full_name, e.dispensation_quota_remaining, e.shift_id
       FROM attendance_dispensations d
       JOIN employees e ON e.id = d.employee_id
       WHERE d.id = $1`,
      [id]
    );

    if (dispRes.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Data pengajuan tidak ditemukan" }, { status: 404 });
    }

    const disp = dispRes.rows[0];

    if (disp.approval_status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: `Pengajuan sudah diproses dengan status: ${disp.approval_status}` },
        { status: 400 }
      );
    }

    if (status === "APPROVED") {
      // 1. Decrement quota on employee
      await db.query(
        "UPDATE employees SET dispensation_quota_remaining = GREATEST(dispensation_quota_remaining - 1, 0) WHERE id = $1",
        [disp.employee_id]
      );

      // 2. Insert or update attendance log for that day with the approved check-in time
      const targetTimestamp = `${disp.target_date} ${disp.requested_check_in}`;
      await db.query(
        `INSERT INTO attendance_logs (employee_id, shift_id, attendance_date, check_in_time, status, notes, is_dispensation_applied)
         VALUES ($1, $2, $3, $4::TIMESTAMPTZ, 'HADIR', $5, TRUE)
         ON CONFLICT (employee_id, attendance_date)
         DO UPDATE SET check_in_time = $4::TIMESTAMPTZ, status = 'HADIR', notes = $5, is_dispensation_applied = TRUE`,
        [
          disp.employee_id,
          disp.shift_id,
          disp.target_date,
          targetTimestamp,
          `Dispensasi Disetujui: ${notes || "Lupa absen masuk"}`,
        ]
      );
    }

    // Update dispensation status
    const updateRes = await db.query(
      `UPDATE attendance_dispensations
       SET approval_status = $1, approved_at = NOW(), notes = $2
       WHERE id = $3
       RETURNING *`,
      [status, notes, id]
    );

    await logSystemAction({
      actorName: admin_name,
      action: "DISPENSATION",
      module: "ABSENSI",
      targetId: id,
      targetName: disp.full_name,
      details: `${status === "APPROVED" ? "MENYETUJUI" : "MENOLAK"} pengajuan dispensasi absen masuk pegawai ${disp.full_name} tanggal ${disp.target_date}. Catatan: ${notes || "-"}`,
    });

    return NextResponse.json({ success: true, data: updateRes.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
