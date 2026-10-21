package middleware

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/elrazaq/presensiku-enterprise/backend/internal/models"
)

type contextKey string

const (
	UserContextKey contextKey = "currentUser"
)

// JWTClaims custom payload
type JWTClaims struct {
	EmployeeID string `json:"sub"`
	CompanyID  string `json:"company_id"`
	NIP        string `json:"nip"`
	Role       string `json:"role"`
	FullName   string `json:"full_name"`
	Exp        int64  `json:"exp"`
}

// GenerateJWT creates a secure signed JWT string without external dependency
func GenerateJWT(claims JWTClaims, secretKey string, duration time.Duration) (string, error) {
	claims.Exp = time.Now().Add(duration).Unix()

	header := map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	}

	headerJSON, _ := json.Marshal(header)
	claimsJSON, _ := json.Marshal(claims)

	headerB64 := base64.RawURLEncoding.EncodeToString(headerJSON)
	claimsB64 := base64.RawURLEncoding.EncodeToString(claimsJSON)

	unsignedToken := fmt.Sprintf("%s.%s", headerB64, claimsB64)

	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(unsignedToken))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	return fmt.Sprintf("%s.%s", unsignedToken, signature), nil
}

// ParseAndVerifyJWT validates JWT signature and expiration
func ParseAndVerifyJWT(tokenString, secretKey string) (*JWTClaims, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, errors.New("format token tidak valid")
	}

	unsignedToken := fmt.Sprintf("%s.%s", parts[0], parts[1])
	signatureB64 := parts[2]

	mac := hmac.New(sha256.New, []byte(secretKey))
	mac.Write([]byte(unsignedToken))
	expectedSignature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signatureB64), []byte(expectedSignature)) {
		return nil, errors.New("tanda tangan token tidak valid / terindikasi manipulasi")
	}

	claimsJSON, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("gagal mem-parsing payload token")
	}

	var claims JWTClaims
	if err := json.Unmarshal(claimsJSON, &claims); err != nil {
		return nil, errors.New("payload token rusak")
	}

	if time.Now().Unix() > claims.Exp {
		return nil, errors.New("token telah kedaluwarsa, silakan login kembali")
	}

	return &claims, nil
}

// AuthMiddleware validates Authorization Bearer token
func AuthMiddleware(secretKey string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
				writeJSONError(w, http.StatusUnauthorized, "Akses ditolak: Token autentikasi tidak ditemukan")
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			claims, err := ParseAndVerifyJWT(token, secretKey)
			if err != nil {
				writeJSONError(w, http.StatusUnauthorized, fmt.Sprintf("Akses ditolak: %v", err))
				return
			}

			// Simpan user claims ke request context
			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireAdmin ensures user is SUPERADMIN or HR_ADMIN
func RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		claims, ok := r.Context().Value(UserContextKey).(*JWTClaims)
		if !ok || claims == nil {
			writeJSONError(w, http.StatusUnauthorized, "Sesi tidak valid")
			return
		}

		if claims.Role != models.RoleSuperAdmin && claims.Role != models.RoleHRAdmin {
			writeJSONError(w, http.StatusForbidden, "Akses ditolak: Hak akses Administrator diperlukan")
			return
		}

		next.ServeHTTP(w, r)
	})
}

// SecurityHeadersMiddleware adds enterprise defense-in-depth headers
func SecurityHeadersMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Proteksi Browser & XSS
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")

		// CORS Enterprise
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Device-ID")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func writeJSONError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(models.ApiResponse{
		Status: "error",
		Error:  message,
	})
}
