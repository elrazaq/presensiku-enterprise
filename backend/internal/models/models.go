package models

import (
	"time"
)

// User Role Constants
const (
	RoleSuperAdmin = "SUPERADMIN"
	RoleHRAdmin    = "HR_ADMIN"
	RoleEmployee   = "EMPLOYEE"
)

// Attendance Status Constants
const (
	StatusHadir     = "HADIR"
	StatusTerlambat = "TERLAMBAT"
	StatusIzin      = "IZIN"
	StatusSakit     = "SAKIT"
	StatusAlpha     = "ALPHA"
)

// Violation Type Constants
const (
	ViolationMockGPS       = "MOCK_GPS_DETECTED"
	ViolationDeviceSpoof   = "DEVICE_SPOOFING"
	ViolationQRTamper      = "QR_TAMPERING"
	ViolationGeofenceBreach = "GEOFENCE_BYPASS"
)

// Company Entity
type Company struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	Address   string    `json:"address"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Department Entity (Geofence Zone)
type Department struct {
	ID            string    `json:"id"`
	CompanyID     string    `json:"company_id"`
	Code          string    `json:"code"`
	Name          string    `json:"name"`
	FloorLocation string    `json:"floor_location"`
	PicName       string    `json:"pic_name"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	RadiusMeters  int       `json:"radius_meters"`
	QRSecretKey   string    `json:"qr_secret_key,omitempty"`
	CreatedAt     time.Time `json:"created_at"`
}

// Shift Entity
type Shift struct {
	ID                   string    `json:"id"`
	CompanyID            string    `json:"company_id"`
	Name                 string    `json:"name"`
	StartTime            string    `json:"start_time"`
	EndTime              string    `json:"end_time"`
	LateToleranceMinutes int       `json:"late_tolerance_minutes"`
	IsActive             bool      `json:"is_active"`
	CreatedAt            time.Time `json:"created_at"`
}

// Employee Entity
type Employee struct {
	ID              string     `json:"id"`
	CompanyID       string     `json:"company_id"`
	DepartmentID    *string    `json:"department_id"`
	ShiftID         *string    `json:"shift_id"`
	NIP             string     `json:"nip"`
	FullName        string     `json:"full_name"`
	Email           string     `json:"email"`
	PasswordHash    string     `json:"-"`
	Role            string     `json:"role"`
	PositionTitle   string     `json:"position_title"`
	DeviceIDBinding *string    `json:"device_id_binding"`
	IsActive        bool       `json:"is_active"`
	CreatedAt       time.Time  `json:"created_at"`
	Department      *Department `json:"department,omitempty"`
	Shift           *Shift      `json:"shift,omitempty"`
}

// AttendanceLog Entity
type AttendanceLog struct {
	ID                     string     `json:"id"`
	EmployeeID             string     `json:"employee_id"`
	DepartmentID           *string    `json:"department_id"`
	ShiftID                *string    `json:"shift_id"`
	AttendanceDate         string     `json:"attendance_date"`
	CheckInTime            *time.Time `json:"check_in_time"`
	CheckOutTime           *time.Time `json:"check_out_time"`
	CheckInLat             *float64   `json:"check_in_lat"`
	CheckInLng             *float64   `json:"check_in_lng"`
	CheckInDistanceMeters  *float64   `json:"check_in_distance_meters"`
	IsMockLocationDetected bool       `json:"is_mock_location_detected"`
	QRTokenHash            *string    `json:"qr_token_hash,omitempty"`
	Status                 string     `json:"status"`
	Notes                  *string    `json:"notes"`
	AttendanceMethod       string     `json:"attendance_method"`
	SelfieURL              *string    `json:"selfie_url"`
	CreatedAt              time.Time  `json:"created_at"`
	Employee               *Employee  `json:"employee,omitempty"`
}

// SecurityViolation Entity
type SecurityViolation struct {
	ID            string    `json:"id"`
	EmployeeID    *string   `json:"employee_id"`
	EmployeeName  string    `json:"employee_name,omitempty"`
	NIP           string    `json:"nip,omitempty"`
	ViolationType string    `json:"violation_type"`
	Details       string    `json:"details"`
	AttemptedLat  *float64  `json:"attempted_lat"`
	AttemptedLng  *float64  `json:"attempted_lng"`
	DeviceInfo    string    `json:"device_info"`
	CreatedAt     time.Time `json:"created_at"`
}

// --- DTOs (Request / Response) ---

type LoginWebRequest struct {
	NIPOrEmail string `json:"nip_or_email"`
	Password   string `json:"password"`
}

type LoginMobileRequest struct {
	NIP      string `json:"nip"`
	Password string `json:"password"`
	DeviceID string `json:"device_id"`
}

type ChangePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

type CheckInQRRequest struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	IsMocked  bool    `json:"is_mocked"`
	QRToken   string  `json:"qr_token"`
}

type CheckInSelfieRequest struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	IsMocked  bool    `json:"is_mocked"`
	ImageBase64 string `json:"image_base64"` // Foto Selfie dikirim Base64 atau via form-data
}

type CheckOutRequest struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	IsMocked  bool    `json:"is_mocked"`
	Notes     string  `json:"notes"`
}

type ReportViolationRequest struct {
	ViolationType string   `json:"violation_type"`
	Details       string   `json:"details"`
	AttemptedLat  *float64 `json:"attempted_lat"`
	AttemptedLng  *float64 `json:"attempted_lng"`
	DeviceInfo    string   `json:"device_info"`
}

type CreateEmployeeRequest struct {
	DepartmentID  string `json:"department_id"`
	ShiftID       string `json:"shift_id"`
	NIP           string `json:"nip"`
	FullName      string `json:"full_name"`
	Email         string `json:"email"`
	Password      string `json:"password"` // Default password jika diisi, jika kosong sistem buatkan
	Role          string `json:"role"`
	PositionTitle string `json:"position_title"`
}

type UpdateEmployeeRequest struct {
	DepartmentID  string `json:"department_id"`
	ShiftID       string `json:"shift_id"`
	FullName      string `json:"full_name"`
	Email         string `json:"email"`
	Role          string `json:"role"`
	PositionTitle string `json:"position_title"`
	IsActive      bool   `json:"is_active"`
}

type CreateDepartmentRequest struct {
	Code          string  `json:"code"`
	Name          string  `json:"name"`
	FloorLocation string  `json:"floor_location"`
	PicName       string  `json:"pic_name"`
	Latitude      float64 `json:"latitude"`
	Longitude     float64 `json:"longitude"`
	RadiusMeters  int     `json:"radius_meters"`
}

type ApiResponse struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
