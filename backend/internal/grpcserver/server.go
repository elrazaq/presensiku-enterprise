package grpcserver

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"time"

	"github.com/elrazaq/presensiku-enterprise/backend/internal/config"
	pb "github.com/elrazaq/presensiku-enterprise/backend/pkg/proto/presensiku"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

type Server struct {
	db  *sql.DB
	cfg *config.Config
	pb.UnimplementedHealthServiceServer
	pb.UnimplementedAuthServiceServer
	pb.UnimplementedAttendanceServiceServer
	pb.UnimplementedSecurityServiceServer
}

func NewServer(db *sql.DB, cfg *config.Config) *Server {
	return &Server{
		db:  db,
		cfg: cfg,
	}
}

// 1. Health RPC
func (s *Server) Check(ctx context.Context, req *pb.HealthRequest) (*pb.HealthResponse, error) {
	return &pb.HealthResponse{
		Status:     "SERVING",
		Message:    "PresensiKu Enterprise gRPC Engine is ACTIVE & HEALTHY",
		ServerTime: time.Now().Format(time.RFC3339),
		Engine:     "Golang gRPC/HTTP2 Binary Protocol (Port 50051)",
	}, nil
}

// 2. Auth RPC: LoginWeb
func (s *Server) LoginWeb(ctx context.Context, req *pb.LoginWebRequest) (*pb.LoginWebResponse, error) {
	var id, nip, name, email, role, dept string
	var isActive bool

	query := `SELECT id, nip, name, email, role, COALESCE(department, ''), is_active 
	          FROM users WHERE (email = $1 OR nip = $1) LIMIT 1`
	err := s.db.QueryRowContext(ctx, query, req.NipOrEmail).Scan(&id, &nip, &name, &email, &role, &dept, &isActive)
	if err != nil {
		return &pb.LoginWebResponse{
			Success: false,
			Message: "Kredensial login tidak ditemukan!",
		}, nil
	}

	if !isActive {
		return &pb.LoginWebResponse{
			Success: false,
			Message: "Akun ini telah dinonaktifkan!",
		}, nil
	}

	return &pb.LoginWebResponse{
		Success: true,
		Message: "Autentikasi gRPC Web Berhasil",
		Token:   fmt.Sprintf("grpc-session-%s-%d", id, time.Now().Unix()),
		User: &pb.EmployeeProfile{
			Id:         id,
			Nip:        nip,
			Name:       name,
			Email:      email,
			Role:       role,
			Department: dept,
		},
	}, nil
}

// 3. Attendance RPC: GetLiveQR
func (s *Server) GetLiveQR(ctx context.Context, req *pb.LiveQRRequest) (*pb.LiveQRResponse, error) {
	code := req.DepartmentCode
	if code == "" {
		code = "DEP-IT-03"
	}

	var name string
	err := s.db.QueryRowContext(ctx, "SELECT name FROM departments WHERE code = $1", code).Scan(&name)
	if err != nil {
		name = "Kantor Operasional"
	}

	epochSecs := time.Now().Unix()
	step := epochSecs / 30
	remaining := 30 - int32(epochSecs%30)
	token := fmt.Sprintf("PKQR:%s:%d:%x", code, step, epochSecs)

	return &pb.LiveQRResponse{
		DepartmentCode:   code,
		DepartmentName:   name,
		QrToken:          token,
		RemainingSeconds: remaining,
		Timestamp:        epochSecs,
	}, nil
}

// 4. Attendance RPC: GetStats
func (s *Server) GetStats(ctx context.Context, req *pb.StatsRequest) (*pb.StatsResponse, error) {
	var totalEmp, boundDev, totalViol int32

	_ = s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM users WHERE role = 'EMPLOYEE' AND is_active = true").Scan(&totalEmp)
	_ = s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM users WHERE is_device_bound = true").Scan(&boundDev)
	_ = s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM security_violations").Scan(&totalViol)

	var presentToday int32
	today := time.Now().Format("2006-01-02")
	_ = s.db.QueryRowContext(ctx, "SELECT COUNT(*) FROM attendance_logs WHERE date = $1", today).Scan(&presentToday)

	return &pb.StatsResponse{
		TotalEmployees:    totalEmp,
		TotalPresentToday: presentToday,
		TotalViolations:   totalViol,
		BoundDevices:      boundDev,
	}, nil
}

// 5. Security RPC: ListViolations
func (s *Server) ListViolations(ctx context.Context, req *pb.Empty) (*pb.ViolationListResponse, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT v.id, COALESCE(u.name, 'Tidak Terdaftar'), COALESCE(u.nip, '-'), 
		       v.violation_type, v.details, COALESCE(v.attempted_lat, 0), 
		       COALESCE(v.attempted_lng, 0), COALESCE(v.device_info, '-'), v.created_at
		FROM security_violations v
		LEFT JOIN users u ON v.user_id = u.id
		ORDER BY v.created_at DESC LIMIT 50
	`)
	if err != nil {
		return &pb.ViolationListResponse{Records: []*pb.ViolationRecord{}}, nil
	}
	defer rows.Close()

	var records []*pb.ViolationRecord
	for rows.Next() {
		var rec pb.ViolationRecord
		var createdAt time.Time
		if err := rows.Scan(&rec.Id, &rec.EmployeeName, &rec.Nip, &rec.ViolationType, &rec.Details, &rec.AttemptedLat, &rec.AttemptedLng, &rec.DeviceInfo, &createdAt); err == nil {
			rec.CreatedAt = createdAt.Format(time.RFC3339)
			records = append(records, &rec)
		}
	}

	return &pb.ViolationListResponse{Records: records}, nil
}

// StartGRPCServer runs the gRPC listener concurrently on cfg.GRPCPort
func StartGRPCServer(db *sql.DB, cfg *config.Config) error {
	addr := ":" + cfg.GRPCPort
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		return fmt.Errorf("failed to listen on gRPC port %s: %w", cfg.GRPCPort, err)
	}

	grpcSrv := grpc.NewServer()
	srv := NewServer(db, cfg)

	pb.RegisterHealthServiceServer(grpcSrv, srv)
	pb.RegisterAuthServiceServer(grpcSrv, srv)
	pb.RegisterAttendanceServiceServer(grpcSrv, srv)
	pb.RegisterSecurityServiceServer(grpcSrv, srv)

	// Register reflection service on gRPC server (allows grpcurl inspection)
	reflection.Register(grpcSrv)

	log.Printf("[PresensiKu gRPC Engine] Server listening on port %s (HTTP/2 Binary)", cfg.GRPCPort)
	return grpcSrv.Serve(lis)
}
