package main

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/elrazaq/presensiku-enterprise/backend/internal/config"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/grpcserver"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/handlers"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/middleware"
	"github.com/elrazaq/presensiku-enterprise/backend/internal/models"
)

func main() {
	cfg := config.LoadConfig()

	// Inisialisasi Database Connection
	db, err := config.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("[PresensiKu API Fatal] Gagal terhubung ke database Neon: %v", err)
	}
	defer db.Close()

	// Inisialisasi Handlers
	authH := handlers.NewAuthHandler(db, cfg)
	attH := handlers.NewAttendanceHandler(db, cfg)
	violH := handlers.NewViolationsHandler(db, cfg)
	adminH := handlers.NewAdminHandler(db, cfg)
	qrH := handlers.NewQRHandler(db, cfg)

	mux := http.NewServeMux()

	// 1. Healthcheck
	mux.HandleFunc("GET /api/v1/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(models.ApiResponse{
			Status:  "success",
			Message: "PresensiKu Enterprise Backend API (Golang) is Online & Healthy",
			Data: map[string]interface{}{
				"version":   "1.0.0",
				"database":  "PostgreSQL 16 (Neon.tech - presensiku_db)",
				"security":  "JWT HS256 + Device ID Binding + TOTP Dynamic QR + Haversine Geofence",
				"timestamp": time.Now().Format(time.RFC3339),
			},
		})
	})

	// 2. Auth Endpoints
	mux.HandleFunc("POST /api/v1/auth/login/web", authH.LoginWeb)
	mux.HandleFunc("POST /api/v1/auth/login/mobile", authH.LoginMobile)

	// 3. Dynamic QR Endpoint (Public Display Layar Kantor)
	mux.HandleFunc("GET /api/v1/qr/live", qrH.GetLiveQR)

	// --- PROTECTED ROUTES (WAJIB JWT AUTH) ---
	authMw := middleware.AuthMiddleware(cfg.JWTSecret)

	// User Profile & Change Password
	mux.Handle("GET /api/v1/auth/me", authMw(http.HandlerFunc(authH.Me)))
	mux.Handle("POST /api/v1/auth/change-password", authMw(http.HandlerFunc(authH.ChangePassword)))

	// Attendance Routes (2 Metode: QR Dinamis & Selfie Wajah)
	mux.Handle("POST /api/v1/attendance/check-in/qr", authMw(http.HandlerFunc(attH.CheckInQR)))
	mux.Handle("POST /api/v1/attendance/check-in/selfie", authMw(http.HandlerFunc(attH.CheckInSelfie)))
	mux.Handle("POST /api/v1/attendance/check-out", authMw(http.HandlerFunc(attH.CheckOut)))
	mux.Handle("GET /api/v1/attendance/history/my", authMw(http.HandlerFunc(attH.MyHistory)))

	// Security Violations Report (Dipicu Mobile saat Deteksi Fake GPS)
	mux.Handle("POST /api/v1/violations/report", authMw(http.HandlerFunc(violH.ReportViolation)))

	// --- ADMIN ONLY ROUTES (WAJIB JWT + ROLE ADMIN) ---
	adminMw := middleware.RequireAdmin

	mux.Handle("GET /api/v1/admin/attendance", authMw(adminMw(http.HandlerFunc(attH.ListAllAttendance))))
	mux.Handle("GET /api/v1/admin/employees", authMw(adminMw(http.HandlerFunc(adminH.ListEmployees))))
	mux.Handle("POST /api/v1/admin/employees", authMw(adminMw(http.HandlerFunc(adminH.CreateEmployee))))
	mux.Handle("PUT /api/v1/admin/employees", authMw(adminMw(http.HandlerFunc(adminH.UpdateEmployee))))
	mux.Handle("DELETE /api/v1/admin/employees", authMw(adminMw(http.HandlerFunc(adminH.DeleteEmployee))))
	mux.Handle("POST /api/v1/admin/employees/reset-device", authMw(adminMw(http.HandlerFunc(adminH.ResetDeviceBinding))))

	mux.Handle("GET /api/v1/admin/departments", authMw(adminMw(http.HandlerFunc(adminH.ListDepartments))))
	mux.Handle("POST /api/v1/admin/departments", authMw(adminMw(http.HandlerFunc(adminH.CreateDepartment))))
	mux.Handle("PUT /api/v1/admin/departments", authMw(adminMw(http.HandlerFunc(adminH.UpdateDepartment))))
	mux.Handle("DELETE /api/v1/admin/departments", authMw(adminMw(http.HandlerFunc(adminH.DeleteDepartment))))

	mux.Handle("GET /api/v1/admin/violations", authMw(adminMw(http.HandlerFunc(violH.ListViolations))))

	// 4. Start Concurrent gRPC Server on port 50051 (Dual Engine Architecture)
	go func() {
		if err := grpcserver.StartGRPCServer(db, cfg); err != nil {
			log.Printf("[gRPC Error] Server gagal berjalan di port %s: %v", cfg.GRPCPort, err)
		}
	}()

	// Wrap Global Security Headers & CORS Middleware
	secureHandler := middleware.SecurityHeadersMiddleware(mux)

	log.Printf("=================================================================")
	log.Printf(" PresensiKu Enterprise API Server aktif di port %s (REST)", cfg.Port)
	log.Printf(" PresensiKu Enterprise gRPC Service aktif di port %s (HTTP/2 Binary)", cfg.GRPCPort)
	log.Printf(" Database: Neon PostgreSQL (presensiku_db)")
	log.Printf(" Mode Keamanan: Dual REST+gRPC, Device Binding, Anti-Mock GPS")
	log.Printf("=================================================================")

	if err := http.ListenAndServe(":"+cfg.Port, secureHandler); err != nil {
		log.Fatalf("Server gagal berjalan: %v", err)
	}
}
