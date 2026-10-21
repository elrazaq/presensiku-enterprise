package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/elrazaq/presensiku-enterprise/backend/internal/config"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/middleware"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/models"
)

type DispensationHandler struct {
	DB  *sql.DB
	Cfg *config.Config
}

func NewDispensationHandler(db *sql.DB, cfg *config.Config) *DispensationHandler {
	return &DispensationHandler{DB: db, Cfg: cfg}
}

// SubmitDispensation handles Employee requesting attendance correction ("Surat Sakti", max 3 times)
func (h *DispensationHandler) SubmitDispensation(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok || claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.ApiResponse{Status: "error", Error: "Sesi tidak valid"})
		return
	}

	var req struct {
		RequestDate string `json:"request_date"`
		Category    string `json:"category"`
		Reason      string `json:"reason"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Format JSON tidak valid"})
		return
	}

	req.RequestDate = strings.TrimSpace(req.RequestDate)
	req.Reason = strings.TrimSpace(req.Reason)
	req.Category = strings.TrimSpace(req.Category)

	if req.RequestDate == "" || req.Reason == "" {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Tanggal dan Alasan pengajuan wajib diisi!"})
		return
	}

	// 1. Cek Kuota Pengajuan ("Surat Sakti" maksimal 3 kali)
	var usedQuota int
	err := h.DB.QueryRow(`
		SELECT COUNT(*) FROM attendance_dispensations 
		WHERE employee_id = $1 AND approval_status != 'REJECTED';
	`, claims.EmployeeID).Scan(&usedQuota)

	if err != nil && err != sql.ErrNoRows {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal memeriksa kuota pengajuan"})
		return
	}

	if usedQuota >= 3 {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{
			Status:  "error",
			Message: "Jatah kuota pengajuan dispensasi Anda telah habis (Maksimal 3/3 kali jatah).",
			Error:   "Jatah kuota pengajuan dispensasi Anda telah habis (Maksimal 3/3 kali jatah).",
		})
		return
	}

	quotaNumber := usedQuota + 1
	now := time.Now()

	fullReason := req.Reason
	if req.Category != "" {
		fullReason = fmt.Sprintf("[%s] %s", req.Category, req.Reason)
	}

	// 2. Simpan Pengajuan ke database
	var dispID string
	err = h.DB.QueryRow(`
		INSERT INTO attendance_dispensations (
			id, employee_id, target_date, reason, notes, approval_status, quota_used_number, created_at
		) VALUES (gen_random_uuid(), $1, $2, $3, $4, 'PENDING', $5, $6)
		RETURNING id;
	`, claims.EmployeeID, req.RequestDate, fullReason, req.Category, quotaNumber, now).Scan(&dispID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: fmt.Sprintf("Gagal menyimpan pengajuan: %v", err)})
		return
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status:  "success",
		Message: fmt.Sprintf("Pengajuan dispensasi berhasil diajukan ke HRD (Pengajuan ke-%d dari 3).", quotaNumber),
		Data: map[string]interface{}{
			"id":                dispID,
			"employee_id":       claims.EmployeeID,
			"request_date":      req.RequestDate,
			"category":          req.Category,
			"reason":            req.Reason,
			"status":            "PENDING",
			"quota_used_number": quotaNumber,
			"created_at":        now.Format(time.RFC3339),
		},
	})
}

// MyDispensations returns personal dispensation requests for the employee
func (h *DispensationHandler) MyDispensations(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)
	if !ok || claims == nil {
		writeJSON(w, http.StatusUnauthorized, models.ApiResponse{Status: "error", Error: "Sesi tidak valid"})
		return
	}

	rows, err := h.DB.Query(`
		SELECT id, employee_id, target_date, reason, COALESCE(notes, '') as notes, 
		       approval_status, quota_used_number, created_at
		FROM attendance_dispensations
		WHERE employee_id = $1
		ORDER BY created_at DESC;
	`, claims.EmployeeID)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal memuat dispensasi"})
		return
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var id, empID, targetDate, reason, notes, status string
		var quotaNum int
		var createdAt time.Time

		_ = rows.Scan(&id, &empID, &targetDate, &reason, &notes, &status, &quotaNum, &createdAt)

		list = append(list, map[string]interface{}{
			"id":                id,
			"employee_id":       empID,
			"request_date":      targetDate,
			"category":          notes,
			"reason":            reason,
			"status":            status,
			"quota_used_number": quotaNum,
			"created_at":        createdAt.Format(time.RFC3339),
		})
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status: "success",
		Data:   list,
	})
}

// ListShifts returns all shifts available in the system
func (h *DispensationHandler) ListShifts(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(`
		SELECT id, name, start_time, end_time, late_tolerance_minutes
		FROM shifts
		ORDER BY start_time ASC;
	`)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal memuat data shift"})
		return
	}
	defer rows.Close()

	var list []map[string]interface{}
	for rows.Next() {
		var id, name, startTime, endTime string
		var lateTolerance int

		_ = rows.Scan(&id, &name, &startTime, &endTime, &lateTolerance)

		list = append(list, map[string]interface{}{
			"id":                     id,
			"name":                   name,
			"start_time":             startTime,
			"end_time":               endTime,
			"late_tolerance_minutes": lateTolerance,
		})
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status: "success",
		Data:   list,
	})
}
