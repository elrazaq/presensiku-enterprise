package config

import (
	"bufio"
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type Config struct {
	DatabaseURL string
	Port        string
	GRPCPort    string
	JWTSecret   string
	AppEnv      string
}

// LoadEnv reads .env file line by line
func LoadEnv(filenames ...string) {
	for _, filename := range filenames {
		file, err := os.Open(filename)
		if err != nil {
			continue
		}
		defer file.Close()

		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				val := strings.TrimSpace(parts[1])
				val = strings.Trim(val, "\"'")
				if os.Getenv(key) == "" {
					os.Setenv(key, val)
				}
			}
		}
	}
}

func LoadConfig() *Config {
	LoadEnv(".env", "../.env", "../../.env")

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Println("[Config Warning] DATABASE_URL tidak ditemukan di .env!")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	grpcPort := os.Getenv("GRPC_PORT")
	if grpcPort == "" {
		grpcPort = "50051"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "presensiku-enterprise-default-secret-2026"
	}

	appEnv := os.Getenv("APP_ENV")
	if appEnv == "" {
		appEnv = "development"
	}

	return &Config{
		DatabaseURL: dbURL,
		Port:        port,
		GRPCPort:    grpcPort,
		JWTSecret:   jwtSecret,
		AppEnv:      appEnv,
	}
}

// InitDB initializes PostgreSQL connection pool
func InitDB(databaseURL string) (*sql.DB, error) {
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("gagal membuka koneksi database: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(15 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("gagal ping database: %w", err)
	}

	log.Println("[PresensiKu DB]  Koneksi ke PostgreSQL Neon.tech (presensiku_db) berhasil terhubung!")
	return db, nil
}
