package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/elrazaq/presensiku-enterprise/backend/internal/config"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/middleware"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/models"
)

type ViolationsHandler struct {
	DB  *sql.DB
	Cfg *config.Config
}

func NewViolationsHandler(db *sql.DB, cfg *config.Config) *ViolationsHandler {
	return &ViolationsHandler{DB: db, Cfg: cfg}
}

// ReportViolation logs a security incident (e.g. Mock GPS detected on device)
func (h *ViolationsHandler) ReportViolation(w http.ResponseWriter, r *http.Request) {
	claims, _ := r.Context().Value(middleware.UserContextKey).(*middleware.JWTClaims)

	var req models.ReportViolationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Format JSON tidak valid"})
		return
	}

	var empID *string
	if claims != nil {
		empID = &claims.EmployeeID
	}

	query := `
		INSERT INTO security_violations (employee_id, violation_type, details, attempted_lat, attempted_lng, device_info)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id;
	`
	var violationID string
	err := h.DB.QueryRow(query, empID, req.ViolationType, req.Details, req.AttemptedLat, req.AttemptedLng, req.DeviceInfo).Scan(&violationID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal mencatat insiden keamanan"})
		return
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status:  "success",
		Message: "Insiden keamanan telah dicatat ke audit log HR.",
		Data: map[string]interface{}{
			"violation_id": violationID,
		},
	})
}

// ListViolations returns all detected cheating attempts for HR evaluation
func (h *ViolationsHandler) ListViolations(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT v.id, v.employee_id, e.full_name, e.nip, v.violation_type, v.details,
		       v.attempted_lat, v.attempted_lng, v.device_info, v.created_at
		FROM security_violations v
		LEFT JOIN employees e ON v.employee_id = e.id
		ORDER BY v.created_at DESC
		LIMIT 100;
	`
	rows, err := h.DB.Query(query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal memuat log pelanggaran"})
		return
	}
	defer rows.Close()

	var list []models.SecurityViolation
	for rows.Next() {
		var v models.SecurityViolation
		var empName, nip sql.NullString
		err := rows.Scan(
			&v.ID, &v.EmployeeID, &empName, &nip, &v.ViolationType, &v.Details,
			&v.AttemptedLat, &v.AttemptedLng, &v.DeviceInfo, &v.CreatedAt,
		)
		if err == nil {
			v.EmployeeName = empName.String
			v.NIP = nip.String
			list = append(list, v)
		}
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status: "success",
		Data:   list,
	})
}
