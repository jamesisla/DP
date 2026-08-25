package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/jamesisla/DP/internal/config"
	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/middleware"
	"github.com/jamesisla/DP/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	cfg *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "Datos de inicio de sesión inválidos")
		return
	}

	var user models.User
	var rut, cargo, claveToken *string
	var areaID *int
	var createdAt, updatedAt string

	err := database.DB.QueryRow(`
		SELECT id, email, full_name, role, hashed_password, is_active, area_id, clave_unica_token, rut, cargo, created_at, updated_at
		FROM users WHERE email = ?
	`, req.Email).Scan(
		&user.ID, &user.Email, &user.FullName, &user.Role, &user.HashedPassword, &user.IsActive,
		&areaID, &claveToken, &rut, &cargo, &createdAt, &updatedAt,
	)

	if err != nil || !user.IsActive {
		middleware.WriteError(w, http.StatusUnauthorized, "Credenciales inválidas")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.HashedPassword), []byte(req.Password)); err != nil {
		middleware.WriteError(w, http.StatusUnauthorized, "Credenciales inválidas")
		return
	}

	tokenStr, err := middleware.CreateAccessToken(user.Email, h.cfg)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error generando token de acceso")
		return
	}

	user.AreaID = areaID
	user.Rut = rut
	user.Cargo = cargo
	user.ClaveUnicaToken = claveToken

	res := models.Token{
		AccessToken: tokenStr,
		TokenType:   "bearer",
		User: models.UserRead{
			ID:       user.ID,
			Email:    user.Email,
			FullName: user.FullName,
			Role:     user.Role,
			AreaID:   user.AreaID,
			Rut:      user.Rut,
			Cargo:    user.Cargo,
		},
	}

	middleware.WriteJSON(w, http.StatusOK, res)
}

func (h *AuthHandler) LoginClaveUnica(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "Petición inválida")
		return
	}

	var user models.User
	var rut, cargo, claveToken *string
	var areaID *int
	var createdAt, updatedAt string

	err := database.DB.QueryRow(`
		SELECT id, email, full_name, role, hashed_password, is_active, area_id, clave_unica_token, rut, cargo, created_at, updated_at
		FROM users WHERE email = ? AND is_active = 1
	`, req.Email).Scan(
		&user.ID, &user.Email, &user.FullName, &user.Role, &user.HashedPassword, &user.IsActive,
		&areaID, &claveToken, &rut, &cargo, &createdAt, &updatedAt,
	)

	if err != nil {
		middleware.WriteError(w, http.StatusNotFound, "Usuario no registrado en el sistema")
		return
	}

	tokenStr, err := middleware.CreateAccessToken(user.Email, h.cfg)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error generando token")
		return
	}

	user.AreaID = areaID
	user.Rut = rut
	user.Cargo = cargo

	res := models.Token{
		AccessToken: tokenStr,
		TokenType:   "bearer",
		User: models.UserRead{
			ID:       user.ID,
			Email:    user.Email,
			FullName: user.FullName,
			Role:     user.Role,
			AreaID:   user.AreaID,
			Rut:      user.Rut,
			Cargo:    user.Cargo,
		},
	}

	middleware.WriteJSON(w, http.StatusOK, res)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	currentUser := middleware.GetCurrentUser(r)
	if currentUser == nil {
		middleware.WriteError(w, http.StatusUnauthorized, "No autenticado")
		return
	}

	res := models.UserRead{
		ID:       currentUser.ID,
		Email:    currentUser.Email,
		FullName: currentUser.FullName,
		Role:     currentUser.Role,
		AreaID:   currentUser.AreaID,
		Rut:      currentUser.Rut,
		Cargo:    currentUser.Cargo,
	}

	middleware.WriteJSON(w, http.StatusOK, res)
}
