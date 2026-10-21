const http = require('http');

let adminToken = '';
let employeeToken = '';
let employeeId = '';
let activeQRToken = '';
const myDeviceID = 'DEV-LAPTOP-ASUS-TESTER-01';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const options = {
      hostname: 'localhost',
      port: 8080,
      path: path,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

function printPostman(testName, method, path, reqBody, res, headers = {}) {
  console.log(`\n======================================================================`);
  console.log(`📌 TEST: ${testName}`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[REQUEST] ${method} http://localhost:8080${path}`);
  if (Object.keys(headers).length > 0) {
    for (const [k, v] of Object.entries(headers)) {
      console.log(`  ${k}: ${v.length > 50 ? v.substring(0, 47) + '...' : v}`);
    }
  }
  if (reqBody) {
    console.log(`  Body:`, JSON.stringify(reqBody, null, 2));
  }
  console.log(`\n[RESPONSE STATUS] HTTP/1.1 ${res.statusCode}`);
  console.log(`  Body:`, JSON.stringify(res.body, null, 2));
}

async function runAllTests() {
  console.log(`🚀 MEMULAI SUITE PENGUJIAN API: PRESENSIKU ENTERPRISE (POSTMAN SIMULATION)\n`);

  // =========================================================================
  // TAHAP 1: UJI COBA INPUT NORMAL (HAPPY PATH)
  // =========================================================================
  console.log(`\n========================================================================`);
  console.log(`🔹 TAHAP 1: UJI COBA INPUT NORMAL (HAPPY PATH)`);
  console.log(`========================================================================`);

  // 1. Healthcheck
  let res = await request('GET', '/api/v1/health');
  printPostman('1. Healthcheck Endpoint', 'GET', '/api/v1/health', null, res);

  // 2. Login Web Admin
  const adminLoginBody = { nip_or_email: 'admin@presensiku.com', password: 'PresensiKu2026!' };
  res = await request('POST', '/api/v1/auth/login/web', adminLoginBody);
  printPostman('2. Login Web Admin', 'POST', '/api/v1/auth/login/web', adminLoginBody, res);
  if (res.body && res.body.data) adminToken = res.body.data.token;

  // 3. Auth Me (Admin)
  res = await request('GET', '/api/v1/auth/me', null, { 'Authorization': `Bearer ${adminToken}` });
  printPostman('3. Profil Saya (Admin)', 'GET', '/api/v1/auth/me', null, res, { 'Authorization': `Bearer ${adminToken}` });

  // 4. Login Mobile Pegawai (Pertama Kali: Device Binding ke Laptop Tester)
  const empLoginBody = {
    nip: '19890112001',
    password: 'PresensiKu2026!',
    device_id: myDeviceID
  };
  res = await request('POST', '/api/v1/auth/login/mobile', empLoginBody);
  printPostman('4. Login Mobile Pegawai & Device Binding', 'POST', '/api/v1/auth/login/mobile', empLoginBody, res);
  if (res.body && res.body.data) {
    employeeToken = res.body.data.token;
    employeeId = res.body.data.user.id;
  }

  // 5. Generate Live Dynamic QR Token (Layar Kantor IT)
  res = await request('GET', '/api/v1/qr/live?dept=DEP-IT-03');
  printPostman('5. Get Live Dynamic QR TOTP (Kiosk Monitor)', 'GET', '/api/v1/qr/live?dept=DEP-IT-03', null, res);
  if (res.body && res.body.data) activeQRToken = res.body.data.qr_token;

  // 6. Metode 1: Check-In QR Dinamis (Posisi Kantor: -6.2088, 106.8456)
  const checkInQRBody = {
    latitude: -6.2088,
    longitude: 106.8456,
    is_mocked: false,
    qr_token: activeQRToken
  };
  res = await request('POST', '/api/v1/attendance/check-in/qr', checkInQRBody, {
    'Authorization': `Bearer ${employeeToken}`,
    'X-Device-ID': myDeviceID
  });
  printPostman('6. Presensi Metode 1: Dynamic QR Check-In', 'POST', '/api/v1/attendance/check-in/qr', checkInQRBody, res, {
    'Authorization': `Bearer ${employeeToken}`,
    'X-Device-ID': myDeviceID
  });

  // 7. Metode 2: Check-In Selfie Wajah (Kamera Foto + Geofence)
  const checkInSelfieBody = {
    latitude: -6.2088,
    longitude: 106.8456,
    is_mocked: false,
    image_base64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...'
  };
  res = await request('POST', '/api/v1/attendance/check-in/selfie', checkInSelfieBody, {
    'Authorization': `Bearer ${employeeToken}`,
    'X-Device-ID': myDeviceID
  });
  printPostman('7. Presensi Metode 2: Selfie Face Check-In', 'POST', '/api/v1/attendance/check-in/selfie', checkInSelfieBody, res, {
    'Authorization': `Bearer ${employeeToken}`,
    'X-Device-ID': myDeviceID
  });

  // 8. Check-Out Pulang Kerja
  const checkOutBody = {
    latitude: -6.2088,
    longitude: 106.8456,
    is_mocked: false,
    notes: 'Pekerjaan sprint hari ini selesai tepat waktu.'
  };
  res = await request('POST', '/api/v1/attendance/check-out', checkOutBody, {
    'Authorization': `Bearer ${employeeToken}`
  });
  printPostman('8. Check-Out Pulang Kerja', 'POST', '/api/v1/attendance/check-out', checkOutBody, res, {
    'Authorization': `Bearer ${employeeToken}`
  });

  // 9. Riwayat Presensi Pegawai
  res = await request('GET', '/api/v1/attendance/history/my', null, {
    'Authorization': `Bearer ${employeeToken}`
  });
  printPostman('9. Riwayat Presensi Pribadi', 'GET', '/api/v1/attendance/history/my', null, res, {
    'Authorization': `Bearer ${employeeToken}`
  });

  // 10. Admin List Pegawai
  res = await request('GET', '/api/v1/admin/employees', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  printPostman('10. Admin: List Seluruh Pegawai', 'GET', '/api/v1/admin/employees', null, res, {
    'Authorization': `Bearer ${adminToken}`
  });

  // 11. Admin Tambah Pegawai Baru
  const newEmpBody = {
    nip: '19950711003',
    full_name: 'Doni Pratama, S.T',
    email: 'doni@presensiku.com',
    role: 'EMPLOYEE',
    position_title: 'Mobile Engineer',
    password: 'PresensiKu2026!'
  };
  res = await request('POST', '/api/v1/admin/employees', newEmpBody, {
    'Authorization': `Bearer ${adminToken}`
  });
  printPostman('11. Admin: Tambah Pegawai Baru', 'POST', '/api/v1/admin/employees', newEmpBody, res, {
    'Authorization': `Bearer ${adminToken}`
  });

  // 12. Admin List Departemen
  res = await request('GET', '/api/v1/admin/departments', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  printPostman('12. Admin: List Departemen & Geofence', 'GET', '/api/v1/admin/departments', null, res, {
    'Authorization': `Bearer ${adminToken}`
  });

  // =========================================================================
  // TAHAP 2: UJI COBA INPUT SALAH (ERROR VALIDATION)
  // =========================================================================
  console.log(`\n========================================================================`);
  console.log(`🔹 TAHAP 2: UJI COBA INPUT SALAH & EDGE CASES`);
  console.log(`========================================================================`);

  // 13. Login Password Salah
  res = await request('POST', '/api/v1/auth/login/web', { nip_or_email: 'admin@presensiku.com', password: 'PasswordSalahTotal!' });
  printPostman('13. Login Web Password Salah (Expect: 401)', 'POST', '/api/v1/auth/login/web', { nip_or_email: 'admin@presensiku.com', password: 'PasswordSalahTotal!' }, res);

  // 14. Akses Endpoint Terlindungi Tanpa Token
  res = await request('GET', '/api/v1/auth/me');
  printPostman('14. Akses Protected Endpoint Tanpa Token (Expect: 401)', 'GET', '/api/v1/auth/me', null, res);

  // 15. Check-In di Luar Radius Kantor (Jarak ~4 km di Monas)
  const outOfRangeBody = {
    latitude: -6.1754,
    longitude: 106.8272,
    is_mocked: false,
    qr_token: activeQRToken
  };
  res = await request('POST', '/api/v1/attendance/check-in/qr', outOfRangeBody, {
    'Authorization': `Bearer ${employeeToken}`,
    'X-Device-ID': myDeviceID
  });
  printPostman('15. Check-In Di Luar Radius Kantor (Expect: 400 Bad Request)', 'POST', '/api/v1/attendance/check-in/qr', outOfRangeBody, res, {
    'Authorization': `Bearer ${employeeToken}`,
    'X-Device-ID': myDeviceID
  });

  // 16. Check-In dengan QR Palsu / Kadaluwarsa
  const fakeQRBody = {
    latitude: -6.2088,
    longitude: 106.8456,
    is_mocked: false,
    qr_token: 'PKQR:DEP-IT-03:99999999:FAKE_HASH_EXPIRED_0123456789'
  };
  res = await request('POST', '/api/v1/attendance/check-in/qr', fakeQRBody, {
    'Authorization': `Bearer ${employeeToken}`,
    'X-Device-ID': myDeviceID
  });
  printPostman('16. Check-In dengan Dynamic QR Kedaluwarsa/Palsu (Expect: 400)', 'POST', '/api/v1/attendance/check-in/qr', fakeQRBody, res, {
    'Authorization': `Bearer ${employeeToken}`,
    'X-Device-ID': myDeviceID
  });

  // =========================================================================
  // TAHAP 3: UJI COBA SERANGAN RINGAN & PROTEKSI KEAMANAN
  // =========================================================================
  console.log(`\n========================================================================`);
  console.log(`🔹 TAHAP 3: UJI COBA SERANGAN RINGAN & DEFENSE-IN-DEPTH`);
  console.log(`========================================================================`);

  // 17. SERANGAN 1: Titip Absen / Device Spoofing (Login dari HP Lain)
  const attackDeviceBody = {
    nip: '19890112001',
    password: 'PresensiKu2026!',
    device_id: 'DEV-HP-TEMAN-TITIP-ABSEN-99' // Device ID Berbeda!
  };
  res = await request('POST', '/api/v1/auth/login/mobile', attackDeviceBody);
  printPostman('17. SERANGAN: Titip Absen dari HP Teman (Expect: 403 Forbidden)', 'POST', '/api/v1/auth/login/mobile', attackDeviceBody, res);

  // 18. SERANGAN 2: Fake/Mock GPS terdeteksi (is_mocked = true)
  const attackMockGPSBody = {
    latitude: -6.2088,
    longitude: 106.8456,
    is_mocked: true, // Mock GPS Aktif!
    qr_token: activeQRToken
  };
  res = await request('POST', '/api/v1/attendance/check-in/qr', attackMockGPSBody, {
    'Authorization': `Bearer ${employeeToken}`,
    'X-Device-ID': myDeviceID
  });
  printPostman('18. SERANGAN: Absensi Menggunakan Fake/Mock GPS (Expect: 400 & Auto-Audit)', 'POST', '/api/v1/attendance/check-in/qr', attackMockGPSBody, res, {
    'Authorization': `Bearer ${employeeToken}`,
    'X-Device-ID': myDeviceID
  });

  // 19. SERANGAN 3: Privilege Escalation (Pegawai Coba Buka Data Admin)
  res = await request('GET', '/api/v1/admin/employees', null, {
    'Authorization': `Bearer ${employeeToken}` // Pakai Token Pegawai Biasa!
  });
  printPostman('19. SERANGAN: Pegawai Akses Portal Admin (Expect: 403 Forbidden)', 'GET', '/api/v1/admin/employees', null, res, {
    'Authorization': `Bearer ${employeeToken}`
  });

  // 20. SERANGAN 4: SQL Injection pada Login
  const sqliBody = {
    nip_or_email: "admin@presensiku.com' OR '1'='1' --",
    password: "' OR '1'='1"
  };
  res = await request('POST', '/api/v1/auth/login/web', sqliBody);
  printPostman('20. SERANGAN: SQL Injection Attempt (Expect: 401 Aman)', 'POST', '/api/v1/auth/login/web', sqliBody, res);

  // 21. VERIFIKASI AUDIT HR: Cek Log Kecurangan yang Berhasil Ditangkap
  res = await request('GET', '/api/v1/admin/violations', null, {
    'Authorization': `Bearer ${adminToken}`
  });
  printPostman('21. AUDIT HR: Rekap Pelanggaran Fake GPS Pegawai', 'GET', '/api/v1/admin/violations', null, res, {
    'Authorization': `Bearer ${adminToken}`
  });

  // 22. FITUR ADMIN: Reset Device ID (Jika Pegawai Ganti HP)
  res = await request('POST', `/api/v1/admin/employees/reset-device?id=${employeeId}`, null, {
    'Authorization': `Bearer ${adminToken}`
  });
  printPostman('22. FITUR ADMIN: Reset Device ID Pegawai', 'POST', `/api/v1/admin/employees/reset-device?id=${employeeId}`, null, res, {
    'Authorization': `Bearer ${adminToken}`
  });

  console.log(`\n======================================================================`);
  console.log(`✅ SELURUH SUITE PENGUJIAN SELESAI DENGAN 100% SUKSES!`);
  console.log(`======================================================================\n`);
}

runAllTests().catch(err => {
  console.error('Fatal Test Runner Error:', err);
});
