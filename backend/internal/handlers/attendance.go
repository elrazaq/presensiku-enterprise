package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
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

// CheckInQR handles Attendance via Dynamic QR Matrix + Geofence + Anti-Mock GPS
func (h *AttendanceHandler) CheckInQR(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok || claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.ApiResponse{Status: "error", Error: "Sesi tidak valid"})
		return
	}

	var req models.CheckInQRRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Format JSON tidak valid"})
		return
	}

	deviceID := r.Header.Get("X-Device-ID")

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
			"log_id":          logID,
			"date":            today,
			"check_in_time":   now.Format("15:04:05"),
			"status":          statusKehadiran,
			"distance_meters": distanceMeters,
			"method":          "QR_CODE",
		},
	})
}

// CheckInSelfie handles Attendance via Face Photo Capture + Geofence + Anti-Mock GPS
func (h *AttendanceHandler) CheckInSelfie(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok || claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.ApiResponse{Status: "error", Error: "Sesi tidak valid"})
		return
	}

	var req models.CheckInSelfieRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Format JSON tidak valid"})
		return
	}

	deviceID := r.Header.Get("X-Device-ID")

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

	// 5. Simpan File Foto Selfie ke Storage (Local Enterprise Storage)
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
			"log_id":          logID,
			"date":            today,
			"check_in_time":   now.Format("15:04:05"),
			"status":          statusKehadiran,
			"distance_meters": distanceMeters,
			"selfie_url":      selfieURL,
			"method":          "SELFIE_FACE",
		},
	})
}

// CheckOut handles Employee Clock-Out
func (h *AttendanceHandler) CheckOut(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok || claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.ApiResponse{Status: "error", Error: "Sesi tidak valid"})
		return
	}

	var req models.CheckOutRequest
	_ = json.NewDecoder(r.Body).Decode(&req)

	today := time.Now().Format("2006-01-02")
	now := time.Now()

	res, err := h.DB.Exec(`
		UPDATE attendance_logs 
		SET check_out_time = $1, notes = COALESCE(notes, '') || ' | Pulang: ' || $2
		WHERE employee_id = $3 AND attendance_date = $4 AND check_in_time IS NOT NULL;
	`, now, req.Notes, claims.EmployeeID, today)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal mencatat jam pulang"})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{
			Status: "error",
			Error:  "Belum ada catatan presensi masuk untuk hari ini. Lakukan Check-In terlebih dahulu!",
		})
		return
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status:  "success",
		Message: "Check-Out Pulang Kerja Berhasil Dicatat. Hati-hati di jalan!",
		Data: map[string]interface{}{
			"check_out_time": now.Format("15:04:05"),
			"date":           today,
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
			"date":              date,
			"status":            status,
			"attendance_method": method,
			"distance_meters":   dist,
			"selfie_url":        selfieURL.String,
			"notes":             notes.String,
		}
		if checkIn != nil {
			item["check_in_time"] = checkIn.Format("15:04:05")
		}
		if checkOut != nil {
			item["check_out_time"] = checkOut.Format("15:04:05")
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

