package handlers

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/elrazaq/presensiku-enterprise/backend/internal/config"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/models"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/services"
)

type QRHandler struct {
	DB  *sql.DB
	Cfg *config.Config
}

func NewQRHandler(db *sql.DB, cfg *config.Config) *QRHandler {
	return &QRHandler{DB: db, Cfg: cfg}
}

// GetLiveQR generates the active TOTP Dynamic QR code payload for office display
func (h *QRHandler) GetLiveQR(w http.ResponseWriter, r *http.Request) {
	deptCode := r.URL.Query().Get("dept")
	if deptCode == "" {
		deptCode = "DEP-IT-03" // default department code
	}
	deptCode = strings.ToUpper(strings.TrimSpace(deptCode))

	var name, qrSecretKey string
	err := h.DB.QueryRow("SELECT name, qr_secret_key FROM departments WHERE code = $1", deptCode).Scan(&name, &qrSecretKey)
	if err != nil {
		writeJSON(w, http.StatusNotFound, models.ApiResponse{Status: "error", Error: "Departemen tidak ditemukan"})
		return
	}

	token, remainingSecs := services.GenerateDynamicQRToken(deptCode, qrSecretKey)

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status: "success",
		Data: map[string]interface{}{
			"department_code":   deptCode,
			"department_name":   name,
			"qr_token":          token,
			"refresh_interval":  services.QRTimeStepSeconds,
			"remaining_seconds": remainingSecs,
		},
	})
}
