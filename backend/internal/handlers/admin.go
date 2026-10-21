package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/elrazaq/presensiku-enterprise/backend/internal/config"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/models"
)

type AdminHandler struct {
	DB  *sql.DB
	Cfg *config.Config
}

func NewAdminHandler(db *sql.DB, cfg *config.Config) *AdminHandler {
	return &AdminHandler{DB: db, Cfg: cfg}
}

// --- 1. MANAJEMEN PEGAWAI & RESET DEVICE ID ---

func (h *AdminHandler) ListEmployees(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT e.id, e.company_id, e.department_id, e.shift_id, e.nip, e.full_name, e.email,
		       e.role, e.position_title, e.device_id_binding, e.is_active, e.created_at,
		       d.name AS dept_name, s.name AS shift_name
		FROM employees e
		LEFT JOIN departments d ON e.department_id = d.id
		LEFT JOIN shifts s ON e.shift_id = s.id
		WHERE e.is_active = TRUE
		ORDER BY e.created_at DESC;
	`
	rows, err := h.DB.Query(query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal memuat daftar pegawai"})
		return
	}
	defer rows.Close()

	var employees []map[string]interface{}
	for rows.Next() {
		var emp models.Employee
		var deptID, shiftID, devBinding, deptName, shiftName sql.NullString

		_ = rows.Scan(
			&emp.ID, &emp.CompanyID, &deptID, &shiftID, &emp.NIP, &emp.FullName, &emp.Email,
			&emp.Role, &emp.PositionTitle, &devBinding, &emp.IsActive, &emp.CreatedAt,
			&deptName, &shiftName,
		)

		employees = append(employees, map[string]interface{}{
			"id":              emp.ID,
			"nip":             emp.NIP,
			"name":            emp.FullName,
			"email":           emp.Email,
			"role":            emp.Role,
			"position":        emp.PositionTitle,
			"department_id":   deptID.String,
			"department":      deptName.String,
			"shift":           shiftName.String,
			"bound_device":    devBinding.String,
			"is_device_bound": devBinding.Valid && devBinding.String != "",
			"is_active":       emp.IsActive,
		})
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{Status: "success", Data: employees})
}

func (h *AdminHandler) CreateEmployee(w http.ResponseWriter, r *http.Request) {
	var req models.CreateEmployeeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Format JSON tidak valid"})
		return
	}

	req.NIP = strings.TrimSpace(req.NIP)
	req.FullName = strings.TrimSpace(req.FullName)
	req.Email = strings.TrimSpace(req.Email)

	if req.NIP == "" || req.FullName == "" || req.Email == "" {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "NIP, Nama Lengkap, dan Email wajib diisi"})
		return
	}

	defaultPassword := req.Password
	if defaultPassword == "" {
		defaultPassword = "PresensiKu2026!"
	}
	hashedPassword := HashPassword(defaultPassword)

	var companyID string
	_ = h.DB.QueryRow("SELECT id FROM companies LIMIT 1").Scan(&companyID)

	var deptIDParam, shiftIDParam interface{}
	if req.DepartmentID != "" {
		deptIDParam = req.DepartmentID
	}
	if req.ShiftID != "" {
		shiftIDParam = req.ShiftID
	}

	role := req.Role
	if role == "" {
		role = models.RoleEmployee
	}

	query := `
		INSERT INTO employees (company_id, department_id, shift_id, nip, full_name, email, password_hash, role, position_title)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id;
	`
	var newID string
	err := h.DB.QueryRow(query, companyID, deptIDParam, shiftIDParam, req.NIP, req.FullName, req.Email, hashedPassword, role, req.PositionTitle).Scan(&newID)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: fmt.Sprintf("Gagal menambah pegawai (NIP/Email mungkin sudah terdaftar): %v", err)})
		return
	}

	writeJSON(w, http.StatusCreated, models.ApiResponse{
		Status:  "success",
		Message: "Pegawai baru berhasil didaftarkan!",
		Data: map[string]interface{}{
			"id":               newID,
			"nip":              req.NIP,
			"name":             req.FullName,
			"default_password": defaultPassword,
			"role":             role,
		},
	})
}

// UpdateEmployee updates employee data
func (h *AdminHandler) UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	employeeID := r.URL.Query().Get("id")
	if employeeID == "" {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Parameter ?id wajib disertakan"})
		return
	}

	var req models.UpdateEmployeeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Format JSON tidak valid"})
		return
	}

	var deptParam interface{}
	if req.DepartmentID != "" {
		deptParam = req.DepartmentID
	}

	query := `
		UPDATE employees 
		SET full_name = $1, email = $2, role = $3, position_title = $4, department_id = $5
		WHERE id = $6;
	`
	res, err := h.DB.Exec(query, req.FullName, req.Email, req.Role, req.PositionTitle, deptParam, employeeID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal memperbarui pegawai"})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		writeJSON(w, http.StatusNotFound, models.ApiResponse{Status: "error", Error: "Pegawai tidak ditemukan"})
		return
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status:  "success",
		Message: "Data pegawai berhasil diperbarui!",
	})
}

// DeleteEmployee performs soft-delete by setting is_active = false
func (h *AdminHandler) DeleteEmployee(w http.ResponseWriter, r *http.Request) {
	employeeID := r.URL.Query().Get("id")
	if employeeID == "" {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Parameter ?id wajib disertakan"})
		return
	}

	res, err := h.DB.Exec("UPDATE employees SET is_active = FALSE WHERE id = $1", employeeID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal menghapus pegawai"})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		writeJSON(w, http.StatusNotFound, models.ApiResponse{Status: "error", Error: "Pegawai tidak ditemukan"})
		return
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status:  "success",
		Message: "Akun pegawai berhasil dinonaktifkan/dihapus!",
	})
}

// ResetDeviceBinding unbinds phone hardware ID
func (h *AdminHandler) ResetDeviceBinding(w http.ResponseWriter, r *http.Request) {
	employeeID := r.URL.Query().Get("id")
	if employeeID == "" {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Parameter ?id pegawai wajib disertakan"})
		return
	}

	res, err := h.DB.Exec("UPDATE employees SET device_id_binding = NULL WHERE id = $1", employeeID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal mereset perangkat"})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		writeJSON(w, http.StatusNotFound, models.ApiResponse{Status: "error", Error: "Pegawai tidak ditemukan"})
		return
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status:  "success",
		Message: "Perangkat pegawai berhasil di-reset! Pegawai kini dapat melakukan login dan mengikat HP barunya.",
	})
}

// --- 2. MANAJEMEN DEPARTEMEN / BAGIAN / BIDANG ---

func (h *AdminHandler) ListDepartments(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query("SELECT id, code, name, floor_location, pic_name, latitude, longitude, radius_meters FROM departments ORDER BY code ASC")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal memuat departemen"})
		return
	}
	defer rows.Close()

	var depts []models.Department
	for rows.Next() {
		var d models.Department
		_ = rows.Scan(&d.ID, &d.Code, &d.Name, &d.FloorLocation, &d.PicName, &d.Latitude, &d.Longitude, &d.RadiusMeters)
		depts = append(depts, d)
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{Status: "success", Data: depts})
}

func (h *AdminHandler) CreateDepartment(w http.ResponseWriter, r *http.Request) {
	var req models.CreateDepartmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Format JSON tidak valid"})
		return
	}

	var companyID string
	_ = h.DB.QueryRow("SELECT id FROM companies LIMIT 1").Scan(&companyID)

	qrSecret := fmt.Sprintf("SECRET_KEY_%s_2026", strings.ToUpper(req.Code))
	radius := req.RadiusMeters
	if radius <= 0 {
		radius = 30
	}

	query := `
		INSERT INTO departments (company_id, code, name, floor_location, pic_name, latitude, longitude, radius_meters, qr_secret_key)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id;
	`
	var newID string
	err := h.DB.QueryRow(query, companyID, req.Code, req.Name, req.FloorLocation, req.PicName, req.Latitude, req.Longitude, radius, qrSecret).Scan(&newID)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: fmt.Sprintf("Gagal menambah departemen: %v", err)})
		return
	}

	writeJSON(w, http.StatusCreated, models.ApiResponse{
		Status:  "success",
		Message: "Departemen & Titik Geofence baru berhasil ditambahkan!",
		Data: map[string]interface{}{
			"id":   newID,
			"code": req.Code,
			"name": req.Name,
		},
	})
}

// UpdateDepartment updates department geofence and details
func (h *AdminHandler) UpdateDepartment(w http.ResponseWriter, r *http.Request) {
	deptID := r.URL.Query().Get("id")
	if deptID == "" {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Parameter ?id departemen wajib disertakan"})
		return
	}

	var req models.CreateDepartmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Format JSON tidak valid"})
		return
	}

	radius := req.RadiusMeters
	if radius <= 0 {
		radius = 30
	}

	query := `
		UPDATE departments 
		SET name = $1, code = $2, floor_location = $3, pic_name = $4, latitude = $5, longitude = $6, radius_meters = $7
		WHERE id = $8;
	`
	res, err := h.DB.Exec(query, req.Name, req.Code, req.FloorLocation, req.PicName, req.Latitude, req.Longitude, radius, deptID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal memperbarui departemen"})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		writeJSON(w, http.StatusNotFound, models.ApiResponse{Status: "error", Error: "Departemen tidak ditemukan"})
		return
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status:  "success",
		Message: "Data departemen & radius geofencing berhasil diperbarui!",
	})
}

// DeleteDepartment removes a department
func (h *AdminHandler) DeleteDepartment(w http.ResponseWriter, r *http.Request) {
	deptID := r.URL.Query().Get("id")
	if deptID == "" {
		writeJSON(w, http.StatusBadRequest, models.ApiResponse{Status: "error", Error: "Parameter ?id departemen wajib disertakan"})
		return
	}

	res, err := h.DB.Exec("DELETE FROM departments WHERE id = $1", deptID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, models.ApiResponse{Status: "error", Error: "Gagal menghapus departemen (mungkin masih memiliki log presensi)"})
		return
	}

	rows, _ := res.RowsAffected()
	if rows == 0 {
		writeJSON(w, http.StatusNotFound, models.ApiResponse{Status: "error", Error: "Departemen tidak ditemukan"})
		return
	}

	writeJSON(w, http.StatusOK, models.ApiResponse{
		Status:  "success",
		Message: "Departemen & Titik Geofence berhasil dihapus!",
	})
}
