package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/elrazaq/presensiku-enterprise/backend/internal/config"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/middleware"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/models"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/services"
)

type AttendanceHandler struct {
	DB  *sql.DB
	Cfg *config.Config
}

func NewAttendanceHandler(db *sql.DB, cfg *config.Config) *AttendanceHandler {
	return &AttendanceHandler{DB: db, Cfg: cfg}
}

// CheckInUnified handles Attendance Check-In dynamically via QR or Selfie
func (h *AttendanceHandler) CheckInUnified(w http.ResponseWriter, r *http.Request) {
	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Message: "Gagal membaca body request", Error: "Gagal membaca body request"})
		return
	}

	var probe struct {
		Method       string `json:"method"`
		Type         string `json:"type"`
		QRToken      string `json:"qr_token"`
		QRPayload    string `json:"qr_payload"`
		ImageBase64  string `json:"image_base64"`
		SelfieBase64 string `json:"selfie_base64"`
	}
	_ = json.Unmarshal(bodyBytes, &probe)

	// Recreate Body for target handler
	r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	reqType := strings.ToUpper(strings.TrimSpace(probe.Type))
	method := strings.ToUpper(strings.TrimSpace(probe.Method))

	if reqType == "CHECK_OUT" || method == "CHECK_OUT" || strings.Contains(method, "OUT") {
		h.CheckOut(w, r)
		return
	}

	if method == "SELFIE" || method == "SELFIE_FACE" || ((probe.SelfieBase64 != "" || probe.ImageBase64 != "") && probe.QRToken == "" && probe.QRPayload == "") {
		h.CheckInSelfie(w, r)
		return
	}

	h.CheckInQR(w, r)
}

// CheckInQR handles Attendance via Dynamic QR Matrix + Geofence + Anti-Mock GPS
func (h *AttendanceHandler) CheckInQR(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok || claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.ApiResponse{Status: "error", Message: "Sesi tidak valid", Error: "Sesi tidak valid"})
		return
	}

	var req struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		IsMocked  bool    `json:"is_mocked"`
		QRToken   string  `json:"qr_token"`
		QRPayload string  `json:"qr_payload"`
		DeviceID  string  `json:"device_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Message: "Format JSON tidak valid", Error: "Format JSON tidak valid"})
		return
	}

	if req.QRToken == "" && req.QRPayload != "" {
		req.QRToken = req.QRPayload
	}

	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		deviceID = req.DeviceID
	}

	// 1. LAPIS KEAMANAN 1: Deteksi Fake GPS / Mock Location
	if req.IsMocked {
		// Rekam ke tabel pelanggaran keamanan
		_, _ = h.DB.Exec(`
			INSERT INTO security_violations (employee_id, violation_type, details, attempted_lat, attempted_lng, device_info)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, claims.EmployeeID, models.ViolationMockGPS, "Percobaan absensi menggunakan aplikasi Fake/Mock GPS terdeteksi oleh kernel!", req.Latitude, req.Longitude, deviceID)

		writeJSON(w, http.StatusBadRequest, models.ApiResponse{
			Status: "error",
			Error:  "Pelanggaran Keamanan: Terdeteksi penggunaan aplikasi Fake/Mock GPS! Pelanggaran ini telah dilaporkan ke audit HR.",
		})
		return
	}

	// 2. Ambil data Departemen dan Shift Pegawai
	var deptID, shiftID sql.NullString
	var deptLat, deptLng float64
	var deptRadius int
	var deptCode, qrSecretKey string
	var boundDevice sql.NullString

	queryEmp := `
		SELECT e.department_id, e.shift_id, e.device_id_binding,
		       d.latitude, d.longitude, d.radius_meters, d.code, d.qr_secret_key
		FROM employees e
		JOIN departments d ON e.department_id = d.id
		WHERE e.id = $1
	`
	err := h.DB.QueryRow(queryEmp, claims.EmployeeID).Scan(
		&deptID, &shiftID, &boundDevice,
		&deptLat, &deptLng, &deptRadius, &deptCode, &qrSecretKey,
	)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Data departemen pegawai tidak ditemukan"})
		return
	}

	// 3. LAPIS KEAMANAN 2: Validasi Device ID Binding
	if boundDevice.Valid && boundDevice.String != "" && deviceID != "" {
		if boundDevice.String != deviceID {
			writeJSON(w, http.StatusForbidden, models.ApiResponse{
				Status: "error",
				Error:  "Akses ditolak: Absensi hanya sah jika dilakukan dari HP fisik yang terdaftar!",
			})
			return
		}
	}

	// 4. LAPIS KEAMANAN 3: Validasi Radius Geofencing (Formula Haversine)
	isInside, distanceMeters := services.IsWithinGeofence(req.Latitude, req.Longitude, deptLat, deptLng, deptRadius)
	if !isInside {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{
			Status: "error",
			Error:  fmt.Sprintf("Di luar radius kantor! Anda berada %.1f meter dari zona absensi (Batas maksimal: %d meter)", distanceMeters, deptRadius),
		})
		return
	}

	// 4b. Validasi Kebijakan Metode Absensi Kantor dari Admin
	var attendanceMethod string
	_ = h.DB.QueryRow("SELECT value FROM app_settings WHERE key = 'attendance_method'").Scan(&attendanceMethod)
	if attendanceMethod == "SELFIE_ONLY" {
		writeJSON(w, http.StatusForbidden, models.ApiResponse{
			Status: "error",
			Error:  "Kebijakan Kantor: Admin menetapkan absensi wajib melalui Foto Wajah (Selfie)! Mode scan QR Kiosk sedang dinonaktifkan.",
		})
		return
	}

	// 5. LAPIS KEAMANAN 4: Validasi Dynamic QR Token HMAC-SHA256
	if !services.VerifyDynamicQRToken(req.QRToken, deptCode, qrSecretKey) {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{
			Status: "error",
			Error:  "QR Code tidak valid atau telah kedaluwarsa! Silakan scan kembali kode QR terbaru di layar kantor.",
		})
		return
	}

	// 6. Simpan Presensi ke Database (Cek apakah sudah absen hari ini)
	today := time.Now().Format("2006-01-02")
	now := time.Now()

	// Tentukan status kehadiran (Cek toleransi keterlambatan shift)
	statusKehadiran := models.StatusHadir
	var shiftStart string
	var lateTolerance int
	if shiftID.Valid {
		_ = h.DB.QueryRow("SELECT start_time, late_tolerance_minutes FROM shifts WHERE id = $1", shiftID.String).Scan(&shiftStart, &lateTolerance)
		// Evaluasi jam masuk vs jam shift
		jamMasukMenit := now.Hour()*60 + now.Minute()
		parts := strings.Split(shiftStart, ":")
		if len(parts) >= 2 {
			var hShift, mShift int
			fmt.Sscanf(parts[0], "%d", &hShift)
			fmt.Sscanf(parts[1], "%d", &mShift)
			shiftMenit := hShift*60 + mShift
			if jamMasukMenit > (shiftMenit + lateTolerance) {
				statusKehadiran = models.StatusTerlambat
			}
		}
	}

	queryInsert := `
		INSERT INTO attendance_logs (
			employee_id, department_id, shift_id, attendance_date,
			check_in_time, check_in_lat, check_in_lng, check_in_distance_meters,
			is_mock_location_detected, qr_token_hash, status, attendance_method, notes
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'QR_CODE', 'Presensi QR Dinamis Sah')
		ON CONFLICT (employee_id, attendance_date) 
		DO UPDATE SET
			check_in_time = EXCLUDED.check_in_time,
			check_in_lat = EXCLUDED.check_in_lat,
			check_in_lng = EXCLUDED.check_in_lng,
			check_in_distance_meters = EXCLUDED.check_in_distance_meters,
			status = EXCLUDED.status,
			attendance_method = 'QR_CODE'
		RETURNING id;
	`

	var logID string
	err = h.DB.QueryRow(queryInsert,
		claims.EmployeeID, deptID.String, shiftID.String, today,
		now, req.Latitude, req.Longitude, distanceMeters,
		false, req.QRToken, statusKehadiran,
	).Scan(&logID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: fmt.Sprintf("Gagal menyimpan presensi: %v", err)})
		return
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status:  "success",
		Message: fmt.Sprintf("Presensi Masuk Berhasil! Status: %s (Jarak: %.1f meter)", statusKehadiran, distanceMeters),
		Data: map[string]interface{}{
			"id":                logID,
			"log_id":            logID,
			"employee_id":       claims.EmployeeID,
			"date":              today,
			"check_in_time":     now.Format(time.RFC3339),
			"check_in_time_str": now.Format("15:04:05"),
			"status":            statusKehadiran,
			"check_in_distance": distanceMeters,
			"distance_meters":   distanceMeters,
			"check_in_method":   "QR_CODE",
			"attendance_method": "QR_CODE",
			"notes":             "Presensi QR Dinamis Sah",
		},
	})
}

// CheckInSelfie handles Attendance via Face Photo Capture + Geofence + Anti-Mock GPS
func (h *AttendanceHandler) CheckInSelfie(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok || claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.ApiResponse{Status: "error", Message: "Sesi tidak valid", Error: "Sesi tidak valid"})
		return
	}

	var req struct {
		Latitude     float64 `json:"latitude"`
		Longitude    float64 `json:"longitude"`
		IsMocked     bool    `json:"is_mocked"`
		ImageBase64  string  `json:"image_base64"`
		SelfieBase64 string  `json:"selfie_base64"`
		DeviceID     string  `json:"device_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Message: "Format JSON tidak valid", Error: "Format JSON tidak valid"})
		return
	}

	if req.ImageBase64 == "" && req.SelfieBase64 != "" {
		req.ImageBase64 = req.SelfieBase64
	}

	deviceID := r.Header.Get("X-Device-ID")
	if deviceID == "" {
		deviceID = req.DeviceID
	}

	// 1. LAPIS KEAMANAN 1: Deteksi Fake GPS
	if req.IsMocked {
		_, _ = h.DB.Exec(`
			INSERT INTO security_violations (employee_id, violation_type, details, attempted_lat, attempted_lng, device_info)
			VALUES ($1, $2, $3, $4, $5, $6)
		`, claims.EmployeeID, models.ViolationMockGPS, "Percobaan absensi selfie menggunakan Fake/Mock GPS!", req.Latitude, req.Longitude, deviceID)

		writeJSON(w, http.StatusBadRequest, models.ApiResponse{
			Status: "error",
			Error:  "Pelanggaran Keamanan: Terdeteksi Fake/Mock GPS pada ponsel! Percobaan tercatat pada riwayat audit.",
		})
		return
	}

	// 2. Ambil data Departemen dan Shift Pegawai
	var deptID, shiftID sql.NullString
	var deptLat, deptLng float64
	var deptRadius int
	var boundDevice sql.NullString

	queryEmp := `
		SELECT e.department_id, e.shift_id, e.device_id_binding,
		       d.latitude, d.longitude, d.radius_meters
		FROM employees e
		JOIN departments d ON e.department_id = d.id
		WHERE e.id = $1
	`
	err := h.DB.QueryRow(queryEmp, claims.EmployeeID).Scan(
		&deptID, &shiftID, &boundDevice,
		&deptLat, &deptLng, &deptRadius,
	)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Data departemen pegawai tidak ditemukan"})
		return
	}

	// 3. Validasi Device ID Binding
	if boundDevice.Valid && boundDevice.String != "" && deviceID != "" {
		if boundDevice.String != deviceID {
			writeJSON(w, http.StatusForbidden, models.ApiResponse{
				Status: "error",
				Error:  "Akses ditolak: Absensi hanya sah dari HP fisik yang terdaftar!",
			})
			return
		}
	}

	// 4. Validasi Radius Geofencing (Formula Haversine)
	isInside, distanceMeters := services.IsWithinGeofence(req.Latitude, req.Longitude, deptLat, deptLng, deptRadius)
	if !isInside {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{
			Status: "error",
			Error:  fmt.Sprintf("Di luar radius kantor! Jarak Anda %.1f meter dari zona absensi (Maks: %d meter)", distanceMeters, deptRadius),
		})
		return
	}

	// 4b. Validasi Kebijakan Metode Absensi Kantor dari Admin
	var attendanceMethod string
	_ = h.DB.QueryRow("SELECT value FROM app_settings WHERE key = 'attendance_method'").Scan(&attendanceMethod)
	if attendanceMethod == "QR_ONLY" {
		writeJSON(w, http.StatusForbidden, models.ApiResponse{
			Status: "error",
			Error:  "Kebijakan Kantor: Admin menetapkan absensi wajib melalui Scan Barcode / Dynamic QR Kiosk! Mode foto selfie sedang dinonaktifkan.",
		})
		return
	}

	// 5. Simpan File Foto Selfie ke Storage (Cloudinary CDN atau Local Storage)
	today := time.Now().Format("2006-01-02")
	now := time.Now()

	uploadDir := "./uploads/selfies"
	_ = os.MkdirAll(uploadDir, 0755)
	filename := fmt.Sprintf("%s_%s_%d.jpg", claims.NIP, today, now.Unix())
	filePath := filepath.Join(uploadDir, filename)
	selfieURL := fmt.Sprintf("/uploads/selfies/%s", filename)

	// Simpan gambar jika payload image base64 tersedia
	if req.ImageBase64 != "" {
		_ = os.WriteFile(filePath, []byte(req.ImageBase64), 0644)

		// Unggah ke Cloudinary jika dikonfigurasi
		var cloudName, apiKey, apiSecret, uploadPreset string
		_ = h.DB.QueryRow("SELECT value FROM app_settings WHERE key = 'cloudinary_cloud_name'").Scan(&cloudName)
		_ = h.DB.QueryRow("SELECT value FROM app_settings WHERE key = 'cloudinary_api_key'").Scan(&apiKey)
		_ = h.DB.QueryRow("SELECT value FROM app_settings WHERE key = 'cloudinary_api_secret'").Scan(&apiSecret)
		_ = h.DB.QueryRow("SELECT value FROM app_settings WHERE key = 'cloudinary_upload_preset'").Scan(&uploadPreset)

		if cloudName != "" {
			cURL, err := services.UploadSelfieToCloudinary(req.ImageBase64, cloudName, apiKey, apiSecret, uploadPreset)
			if err == nil && cURL != "" {
				selfieURL = cURL
			}
		}
	}

	// 6. Simpan Log Presensi
	statusKehadiran := models.StatusHadir
	queryInsert := `
		INSERT INTO attendance_logs (
			employee_id, department_id, shift_id, attendance_date,
			check_in_time, check_in_lat, check_in_lng, check_in_distance_meters,
			is_mock_location_detected, status, attendance_method, selfie_url, notes
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'SELFIE_FACE', $11, 'Presensi Foto Wajah Sah')
		ON CONFLICT (employee_id, attendance_date) 
		DO UPDATE SET
			check_in_time = EXCLUDED.check_in_time,
			check_in_lat = EXCLUDED.check_in_lat,
			check_in_lng = EXCLUDED.check_in_lng,
			check_in_distance_meters = EXCLUDED.check_in_distance_meters,
			status = EXCLUDED.status,
			attendance_method = 'SELFIE_FACE',
			selfie_url = EXCLUDED.selfie_url
		RETURNING id;
	`

	var logID string
	err = h.DB.QueryRow(queryInsert,
		claims.EmployeeID, deptID.String, shiftID.String, today,
		now, req.Latitude, req.Longitude, distanceMeters,
		false, statusKehadiran, selfieURL,
	).Scan(&logID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: fmt.Sprintf("Gagal menyimpan presensi: %v", err)})
		return
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status:  "success",
		Message: fmt.Sprintf("Presensi Foto Wajah Berhasil! Status: %s (Jarak: %.1f meter)", statusKehadiran, distanceMeters),
		Data: map[string]interface{}{
			"id":                logID,
			"log_id":            logID,
			"employee_id":       claims.EmployeeID,
			"date":              today,
			"check_in_time":     now.Format(time.RFC3339),
			"check_in_time_str": now.Format("15:04:05"),
			"status":            statusKehadiran,
			"check_in_distance": distanceMeters,
			"distance_meters":   distanceMeters,
			"selfie_url":        selfieURL,
			"check_in_method":   "SELFIE_FACE",
			"attendance_method": "SELFIE_FACE",
			"method":            "SELFIE_FACE",
			"notes":             "Presensi Foto Wajah Sah",
		},
	})
}

// CheckOut handles Employee Clock-Out
func (h *AttendanceHandler) CheckOut(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok || claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.ApiResponse{Status: "error", Message: "Sesi tidak valid", Error: "Sesi tidak valid"})
		return
	}

	var req struct {
		Latitude     float64 `json:"latitude"`
		Longitude    float64 `json:"longitude"`
		IsMocked     bool    `json:"is_mocked"`
		Notes        string  `json:"notes"`
		ImageBase64  string  `json:"image_base64"`
		SelfieBase64 string  `json:"selfie_base64"`
		DeviceID     string  `json:"device_id"`
		QRPayload    string  `json:"qr_payload"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	if req.ImageBase64 == "" && req.SelfieBase64 != "" {
		req.ImageBase64 = req.SelfieBase64
	}

	today := time.Now().Format("2006-01-02")
	now := time.Now()

	// Upload foto selfie kepulangan ke Cloudinary jika dilampirkan
	var selfieURL string
	if req.ImageBase64 != "" {
		var cloudName, apiKey, apiSecret, uploadPreset string
		_ = h.DB.QueryRow("SELECT value FROM app_settings WHERE key = 'cloudinary_cloud_name'").Scan(&cloudName)
		_ = h.DB.QueryRow("SELECT value FROM app_settings WHERE key = 'cloudinary_api_key'").Scan(&apiKey)
		_ = h.DB.QueryRow("SELECT value FROM app_settings WHERE key = 'cloudinary_api_secret'").Scan(&apiSecret)
		_ = h.DB.QueryRow("SELECT value FROM app_settings WHERE key = 'cloudinary_upload_preset'").Scan(&uploadPreset)

		if cloudName != "" {
			cURL, err := services.UploadSelfieToCloudinary(req.ImageBase64, cloudName, apiKey, apiSecret, uploadPreset)
			if err == nil && cURL != "" {
				selfieURL = cURL
			}
		}
	}

	notes := req.Notes
	if notes == "" {
		notes = "Presensi Pulang Sah"
	}
	if selfieURL != "" {
		notes = fmt.Sprintf("%s (Foto: %s)", notes, selfieURL)
	}

	// 1. Coba update log hari ini yang belum check-out
	res, err := h.DB.Exec(`
		UPDATE attendance_logs 
		SET check_out_time = $1, notes = COALESCE(notes, '') || ' | Pulang: ' || $2
		WHERE employee_id = $3 AND attendance_date = $4 AND check_in_time IS NOT NULL AND check_out_time IS NULL;
	`, now, notes, claims.EmployeeID, today)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Message: "Gagal mencatat jam pulang", Error: "Gagal mencatat jam pulang"})
		return
	}

	rows, _ := res.RowsAffected()

	// 2. Jika tidak ada log hari ini (misal absensi masuk sebelum tengah malam, dan pulang lewat tengah malam / shift malam),
	// update log terbuka paling mutakhir dalam rentang 24 jam terakhir
	if rows == 0 {
		res, err = h.DB.Exec(`
			UPDATE attendance_logs 
			SET check_out_time = $1, notes = COALESCE(notes, '') || ' | Pulang Shift Malam: ' || $2
			WHERE id = (
				SELECT id FROM attendance_logs 
				WHERE employee_id = $3 AND check_in_time IS NOT NULL AND check_out_time IS NULL
				ORDER BY check_in_time DESC LIMIT 1
			);
		`, now, notes, claims.EmployeeID)
		if err == nil {
			rows, _ = res.RowsAffected()
		}
	}

	// 3. Fallback: update log hari ini meskipun sudah pernah checkout (koreksi jam pulang)
	if rows == 0 {
		res, err = h.DB.Exec(`
			UPDATE attendance_logs 
			SET check_out_time = $1, notes = COALESCE(notes, '') || ' | Update Pulang: ' || $2
			WHERE employee_id = $3 AND attendance_date = $4 AND check_in_time IS NOT NULL;
		`, now, notes, claims.EmployeeID, today)
		if err == nil {
			rows, _ = res.RowsAffected()
		}
	}

	if rows == 0 {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{
			Status:  "error",
			Message: "Belum ada catatan presensi masuk yang aktif. Silakan lakukan Presensi Masuk terlebih dahulu!",
			Error:   "Belum ada catatan presensi masuk yang aktif. Silakan lakukan Presensi Masuk terlebih dahulu!",
		})
		return
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status:  "success",
		Message: "Presensi Pulang Kerja Berhasil Dicatat. Hati-hati di jalan!",
		Data: map[string]interface{}{
			"id":                today,
			"employee_id":       claims.EmployeeID,
			"date":              today,
			"check_out_time":    now.Format(time.RFC3339),
			"check_out_time_str": now.Format("15:04:05"),
			"status":            "HADIR",
			"attendance_method": "SELFIE_FACE",
			"selfie_url":        selfieURL,
			"notes":             notes,
		},
	})
}

// MyHistory returns personal attendance logs for active employee
func (h *AttendanceHandler) MyHistory(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok || claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.ApiResponse{Status: "error", Error: "Sesi tidak valid"})
		return
	}

	query := `
		SELECT id, attendance_date, check_in_time, check_out_time, check_in_distance_meters, status, attendance_method, selfie_url, notes
		FROM attendance_logs
		WHERE employee_id = $1
		ORDER BY attendance_date DESC
		LIMIT 30;
	`
	rows, err := h.DB.Query(query, claims.EmployeeID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal memuat riwayat presensi"})
		return
	}
	defer rows.Close()

	var logs []map[string]interface{}
	for rows.Next() {
		var id, date, status, method string
		var checkIn, checkOut *time.Time
		var dist *float64
		var selfieURL, notes sql.NullString

		_ = rows.Scan(&id, &date, &checkIn, &checkOut, &dist, &status, &method, &selfieURL, &notes)

		item := map[string]interface{}{
			"id":                id,
			"employee_id":       claims.EmployeeID,
			"date":              date,
			"status":            status,
			"attendance_method": method,
			"check_in_method":   method,
			"check_in_distance": dist,
			"distance_meters":   dist,
			"selfie_url":        selfieURL.String,
			"notes":             notes.String,
		}
		if checkIn != nil {
			item["check_in_time"] = checkIn.Format(time.RFC3339)
			item["check_in_time_str"] = checkIn.Format("15:04:05")
		}
		if checkOut != nil {
			item["check_out_time"] = checkOut.Format(time.RFC3339)
			item["check_out_time_str"] = checkOut.Format("15:04:05")
		}

		logs = append(logs, item)
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status: "success",
		Data:   logs,
	})
}

// ListAllAttendance returns all employee attendance logs for admin tracking & audit
func (h *AttendanceHandler) ListAllAttendance(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT a.id, a.attendance_date, a.check_in_time, a.check_out_time, 
		       a.check_in_lat, a.check_in_lng, a.check_in_distance_meters, 
		       a.status, a.attendance_method, a.selfie_url, a.notes,
		       e.full_name, e.nip, e.position_title, d.name AS dept_name
		FROM attendance_logs a
		JOIN employees e ON a.employee_id = e.id
		LEFT JOIN departments d ON a.department_id = d.id
		ORDER BY a.attendance_date DESC, a.check_in_time DESC NULLS LAST
		LIMIT 200;
	`
	rows, err := h.DB.Query(query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: fmt.Sprintf("Gagal memuat log presensi: %v", err)})
		return
	}
	defer rows.Close()

	var logs []map[string]interface{}
	for rows.Next() {
		var id, date, status, method, empName, nip string
		var checkIn, checkOut *time.Time
		var lat, lng, dist *float64
		var selfieURL, notes, posTitle, deptName sql.NullString

		err := rows.Scan(
			&id, &date, &checkIn, &checkOut, &lat, &lng, &dist,
			&status, &method, &selfieURL, &notes,
			&empName, &nip, &posTitle, &deptName,
		)
		if err == nil {
			item := map[string]interface{}{
				"id":                id,
				"date":              date,
				"status":            status,
				"attendance_method": method,
				"latitude":          lat,
				"longitude":         lng,
				"distance_meters":   dist,
				"selfie_url":        selfieURL.String,
				"notes":             notes.String,
				"employee_name":     empName,
				"nip":               nip,
				"position":          posTitle.String,
				"department":        deptName.String,
			}
			if checkIn != nil {
				item["check_in_time"] = checkIn.Format("15:04:05")
			}
			if checkOut != nil {
				item["check_out_time"] = checkOut.Format("15:04:05")
			}
			logs = append(logs, item)
		}
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status: "success",
		Data:   logs,
	})
}

// GetSettings mengembalikan pengaturan sistem publik (metode presensi & profil instansi)
func (h *AttendanceHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT key, value FROM app_settings")
	settings := map[string]string{
		"attendance_method": "BOTH",
		"app_name":          "PresensiKu Enterprise",
		"company_name":      "PT PresensiKu Enterprise Indonesia",
	}
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var k, v string
			if err := rows.Scan(&k, &v); err == nil {
				settings[k] = v
			}
		}
	}
	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status: "success",
		Data:   settings,
	})
}

