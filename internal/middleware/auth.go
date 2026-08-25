package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jamesisla/DP/internal/config"
	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/models"
)

type contextKey string

const UserContextKey = contextKey("current_user")

type Claims struct {
	Subject string `json:"sub"`
	jwt.RegisteredClaims
}

func CreateAccessToken(email string, cfg *config.Config) (string, error) {
	expireTime := time.Now().Add(time.Duration(cfg.AccessTokenExpireMinutes) * time.Minute)
	claims := &Claims{
		Subject: email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expireTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.SecretKey))
}

func AuthMiddleware(cfg *config.Config) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				WriteError(w, http.StatusUnauthorized, "No se proporcionó token de autorización")
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				WriteError(w, http.StatusUnauthorized, "Formato de token inválido")
				return
			}

			tokenStr := parts[1]
			claims := &Claims{}
			token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
				if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("método de firma no válido")
				}
				return []byte(cfg.SecretKey), nil
			})

			if err != nil || !token.Valid {
				WriteError(w, http.StatusUnauthorized, "Token inválido o expirado")
				return
			}

			// Look up user in DB
			var user models.User
			var rut, cargo, claveToken *string
			var areaID *int
			var createdAt, updatedAt string

			err = database.DB.QueryRow(`
				SELECT id, email, full_name, role, hashed_password, is_active, area_id, clave_unica_token, rut, cargo, created_at, updated_at
				FROM users WHERE email = ? AND is_active = 1
			`, claims.Subject).Scan(
				&user.ID, &user.Email, &user.FullName, &user.Role, &user.HashedPassword, &user.IsActive,
				&areaID, &claveToken, &rut, &cargo, &createdAt, &updatedAt,
			)

			if err != nil {
				WriteError(w, http.StatusUnauthorized, "Usuario no encontrado o inactivo")
				return
			}

			user.AreaID = areaID
			user.Rut = rut
			user.Cargo = cargo
			user.ClaveUnicaToken = claveToken

			ctx := context.WithValue(r.Context(), UserContextKey, &user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetCurrentUser(r *http.Request) *models.User {
	if u, ok := r.Context().Value(UserContextKey).(*models.User); ok {
		return u
	}
	return nil
}

func WriteJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

func WriteError(w http.ResponseWriter, status int, msg string) {
	WriteJSON(w, status, map[string]string{"detail": msg})
}
