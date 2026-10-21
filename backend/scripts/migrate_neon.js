require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env!');
    process.exit(1);
  }

  console.log('[PresensiKu DB] Menghubungkan ke Neon PostgreSQL Cloud...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log(' Terhubung dengan sukses ke Neon PostgreSQL!');

    // 1. Eksekusi Skema Tabel
    const schemaPath = path.resolve(__dirname, '../migrations/001_init_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('[PresensiKu DB] Mengeksekusi 001_init_schema.sql...');
    await client.query(schemaSql);
    console.log(' Skema database berhasil dibuat!');

    // 2. Cek apakah seeder sudah pernah dijalankan
    const compCheck = await client.query("SELECT COUNT(*) FROM companies WHERE code = 'CORP-PRESENSIKU'");
    if (parseInt(compCheck.rows[0].count) === 0) {
      console.log('[PresensiKu DB] Mengisi data awal (Seeder Enterprise)...');

      // 2a. Buat Perusahaan Utama
      const compRes = await client.query(`
        INSERT INTO companies (name, code, address)
        VALUES ('PT PresensiKu Enterprise Indonesia', 'CORP-PRESENSIKU', 'Menara Sudirman Lantai 18, Jakarta Selatan')
        RETURNING id;
      `);
      const companyId = compRes.rows[0].id;

      // 2b. Buat Departemen & Titik Geofencing (Sesuai Demo Portofolio)
      const depItRes = await client.query(`
        INSERT INTO departments (company_id, code, name, floor_location, pic_name, latitude, longitude, radius_meters, qr_secret_key)
        VALUES 
        ($1, 'DEP-IT-03', 'Ruang Server & IT Engineering', 'Lantai 3 - Gedung Sayap Timur', 'Abdul Razak, S.Kom', -6.2088, 106.8456, 30, 'SECRET_KEY_IT_ENGINEERING_2026'),
        ($1, 'DEP-HR-02', 'Direktorat SDM & Kepegawaian', 'Lantai 2 - Gedung Utama', 'Siti Rahmawati, S.Psi', -6.2090, 106.8460, 25, 'SECRET_KEY_HR_2026'),
        ($1, 'DEP-FIN-04', 'Keuangan & Akuntansi', 'Lantai 4 - Gedung Sayap Barat', 'Budi Santoso, S.E', -6.2085, 106.8452, 20, 'SECRET_KEY_FINANCE_2026')
        RETURNING id, code;
      `, [companyId]);

      const itDeptId = depItRes.rows[0].id;

      // 2c. Buat Master Shift Kerja
      const shiftRes = await client.query(`
        INSERT INTO shifts (company_id, name, start_time, end_time, late_tolerance_minutes)
        VALUES 
        ($1, 'Shift Reguler Pagi (08:00 - 17:00)', '08:00:00', '17:00:00', 15),
        ($1, 'Shift Siang IT On-Call (13:00 - 21:00)', '13:00:00', '21:00:00', 15)
        RETURNING id;
      `, [companyId]);
      const defaultShiftId = shiftRes.rows[0].id;

      // 2d. Buat Akun Demo Admin & Pegawai
      // Password hash bcrypt untuk 'AdminPass123#' dan 'PegawaiPass123#'
      // Bcrypt hash untuk:
      // 'admin123' -> $2a$10$w850t49/5rS.8y.Gf3E5E.g/cWb0YwW4lZ6b7yB9qQ2w0zU7uM6.i (contoh)
      // Kita masukkan plain string atau hash standar
      await client.query(`
        INSERT INTO employees (company_id, department_id, shift_id, nip, full_name, email, password_hash, role, position_title, device_id_binding, is_active)
        VALUES 
        ($1, $2, $3, 'ADM-001', 'Super Administrator HR', 'admin@presensiku.com', '$2a$10$eO0B.N8F78xYxK/G4.3Qc.1VtwX5fP7mD2zF7q5R9G0Z3xYwVu7a2', 'SUPERADMIN', 'Chief Human Resources', NULL, TRUE),
        ($1, $2, $3, '19890112001', 'Abdul Razak, S.Kom', 'razak@presensiku.com', '$2a$10$eO0B.N8F78xYxK/G4.3Qc.1VtwX5fP7mD2zF7q5R9G0Z3xYwVu7a2', 'EMPLOYEE', 'Senior Software Engineer', NULL, TRUE),
        ($1, $2, $3, '19920315002', 'Maya Indah Lestari', 'maya@presensiku.com', '$2a$10$eO0B.N8F78xYxK/G4.3Qc.1VtwX5fP7mD2zF7q5R9G0Z3xYwVu7a2', 'EMPLOYEE', 'UI/UX Lead Designer', NULL, TRUE);
      `, [companyId, itDeptId, defaultShiftId]);

      console.log(' Data Seeder Enterprise berhasil ditambahkan!');
    } else {
      console.log('[PresensiKu DB] Data seeder sudah ada, migrasi selesai.');
    }

    // 3. Verifikasi jumlah tabel
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('[PresensiKu DB] Tabel terverifikasi aktif di Neon:');
    tablesRes.rows.forEach(r => console.log(`  - ${r.table_name}`));

  } catch (err) {
    console.error(' Terjadi kesalahan saat migrasi:', err);
  } finally {
    await client.end();
  }
}

runMigration();
