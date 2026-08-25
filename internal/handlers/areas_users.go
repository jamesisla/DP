package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/middleware"
	"github.com/jamesisla/DP/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type AreasUsersHandler struct{}

func NewAreasUsersHandler() *AreasUsersHandler {
	return &AreasUsersHandler{}
}

// Users
func (h *AreasUsersHandler) GetUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT id, email, full_name, role, area_id, rut, cargo FROM users WHERE is_active = 1 ORDER BY id ASC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar usuarios")
		return
	}
	defer rows.Close()

	users := []models.UserRead{}
	for rows.Next() {
		var u models.UserRead
		var areaID sql.NullInt64
		var rut, cargo sql.NullString
		if err := rows.Scan(&u.ID, &u.Email, &u.FullName, &u.Role, &areaID, &rut, &cargo); err == nil {
			if areaID.Valid {
				val := int(areaID.Int64)
				u.AreaID = &val
			}
			if rut.Valid {
				u.Rut = &rut.String
			}
			if cargo.Valid {
				u.Cargo = &cargo.String
			}
			users = append(users, u)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, users)
}

func (h *AreasUsersHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req models.UserCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "Datos de usuario inválidos")
		return
	}

	pass := req.Password
	if pass == "" {
		pass = "admin123"
	}
	hashed, _ := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)

	res, err := database.DB.Exec(`
		INSERT INTO users (email, full_name, role, hashed_password, is_active, area_id, rut, cargo)
		VALUES (?, ?, ?, ?, 1, ?, ?, ?)
	`, req.Email, req.FullName, req.Role, string(hashed), req.AreaID, req.Rut, req.Cargo)

	if err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "El correo electrónico ya se encuentra registrado")
		return
	}

	id, _ := res.LastInsertId()
	created := models.UserRead{
		ID:       int(id),
		Email:    req.Email,
		FullName: req.FullName,
		Role:     req.Role,
		AreaID:   req.AreaID,
		Rut:      req.Rut,
		Cargo:    req.Cargo,
	}
	middleware.WriteJSON(w, http.StatusCreated, created)
}

func (h *AreasUsersHandler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	var req models.UserCreate
	json.NewDecoder(r.Body).Decode(&req)

	_, err := database.DB.Exec(`
		UPDATE users SET full_name = ?, role = ?, area_id = ?, rut = ?, cargo = ? WHERE id = ?
	`, req.FullName, req.Role, req.AreaID, req.Rut, req.Cargo, id)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al actualizar usuario")
		return
	}

	res := models.UserRead{
		ID:       id,
		Email:    req.Email,
		FullName: req.FullName,
		Role:     req.Role,
		AreaID:   req.AreaID,
		Rut:      req.Rut,
		Cargo:    req.Cargo,
	}
	middleware.WriteJSON(w, http.StatusOK, res)
}

func (h *AreasUsersHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	database.DB.Exec(`UPDATE users SET is_active = 0 WHERE id = ?`, id)
	w.WriteHeader(http.StatusNoContent)
}

// Areas
func (h *AreasUsersHandler) GetAreas(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT id, nombre, descripcion, responsable_id FROM areas ORDER BY id ASC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar áreas")
		return
	}
	defer rows.Close()

	areas := []models.Area{}
	for rows.Next() {
		var a models.Area
		var respID sql.NullInt64
		if err := rows.Scan(&a.ID, &a.Nombre, &a.Descripcion, &respID); err == nil {
			if respID.Valid {
				val := int(respID.Int64)
				a.ResponsableID = &val
			}
			areas = append(areas, a)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, areas)
}

func (h *AreasUsersHandler) CreateArea(w http.ResponseWriter, r *http.Request) {
	var req models.AreaCreate
	json.NewDecoder(r.Body).Decode(&req)

	res, err := database.DB.Exec(`
		INSERT INTO areas (nombre, descripcion, responsable_id) VALUES (?, ?, ?)
	`, req.Nombre, req.Descripcion, req.ResponsableID)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al crear área")
		return
	}

	id, _ := res.LastInsertId()
	created := models.Area{
		ID:            int(id),
		Nombre:        req.Nombre,
		Descripcion:   req.Descripcion,
		ResponsableID: req.ResponsableID,
	}
	middleware.WriteJSON(w, http.StatusCreated, created)
}
