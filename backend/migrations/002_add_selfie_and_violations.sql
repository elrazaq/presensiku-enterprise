-- ============================================================================
-- PRESENSIKU ENTERPRISE - MIGRATION 002: SELFIE ATTENDANCE & VIOLATIONS AUDIT
-- ============================================================================

-- 1. Tambah Kolom Metode Presensi & Selfie URL pada Tabel attendance_logs
ALTER TABLE attendance_logs 
ADD COLUMN IF NOT EXISTS attendance_method VARCHAR(30) NOT NULL DEFAULT 'QR_CODE',
ADD COLUMN IF NOT EXISTS selfie_url TEXT;

-- 2. Buat Tabel Audit Trail Pelanggaran Keamanan & Deteksi Fake GPS
CREATE TABLE IF NOT EXISTS security_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    violation_type VARCHAR(60) NOT NULL, -- MOCK_GPS_DETECTED, DEVICE_SPOOFING, QR_TAMPERING, GEOFENCE_BYPASS
    details TEXT NOT NULL,
    attempted_lat DOUBLE PRECISION,
    attempted_lng DOUBLE PRECISION,
    device_info VARCHAR(200),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index untuk percepat query laporan audit HR
CREATE INDEX IF NOT EXISTS idx_violations_employee ON security_violations(employee_id);
CREATE INDEX IF NOT EXISTS idx_violations_created_at ON security_violations(created_at);
