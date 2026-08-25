package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/middleware"
	"github.com/jamesisla/DP/internal/models"
)

type MatrixHandler struct{}

func NewMatrixHandler() *MatrixHandler {
	return &MatrixHandler{}
}

func (h *MatrixHandler) GetMyAreaMatrix(w http.ResponseWriter, r *http.Request) {
	currentUser := middleware.GetCurrentUser(r)
	areaID := 1
	if currentUser != nil && currentUser.AreaID != nil {
		areaID = *currentUser.AreaID
	}

	var m models.MatrizLevantamiento
	var datosStr string
	err := database.DB.QueryRow(`
		SELECT id, area_id, datos_json, completada FROM matrices_levantamiento WHERE area_id = ?
	`, areaID).Scan(&m.ID, &m.AreaID, &datosStr, &m.Completada)

	if err == sql.ErrNoRows {
		// Return empty list or template
		middleware.WriteJSON(w, http.StatusOK, []models.MatrizLevantamiento{})
		return
	}

	var parsedJSON interface{}
	json.Unmarshal([]byte(datosStr), &parsedJSON)
	m.DatosJSON = parsedJSON

	middleware.WriteJSON(w, http.StatusOK, []models.MatrizLevantamiento{m})
}

func (h *MatrixHandler) CreateOrUpdateMatrix(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AreaID     int         `json:"area_id"`
		DatosJSON  interface{} `json:"datos_json"`
		Completada bool        `json:"completada"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "Datos de matriz inválidos")
		return
	}

	bytes, _ := json.Marshal(req.DatosJSON)
	var existingID int
	err := database.DB.QueryRow(`SELECT id FROM matrices_levantamiento WHERE area_id = ?`, req.AreaID).Scan(&existingID)

	if err == sql.ErrNoRows {
		res, _ := database.DB.Exec(`
			INSERT INTO matrices_levantamiento (area_id, datos_json, completada) VALUES (?, ?, ?)
		`, req.AreaID, string(bytes), req.Completada)
		id, _ := res.LastInsertId()
		middleware.WriteJSON(w, http.StatusCreated, map[string]interface{}{"id": id, "area_id": req.AreaID, "completada": req.Completada})
		return
	}

	database.DB.Exec(`
		UPDATE matrices_levantamiento SET datos_json = ?, completada = ? WHERE id = ?
	`, string(bytes), req.Completada, existingID)

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{"id": existingID, "area_id": req.AreaID, "completada": req.Completada})
}

func (h *MatrixHandler) GetMasterMatrix(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT m.id, m.area_id, a.nombre, m.datos_json, m.completada
		FROM matrices_levantamiento m
		JOIN areas a ON m.area_id = a.id
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error consultando matriz maestra")
		return
	}
	defer rows.Close()

	items := []map[string]interface{}{}
	for rows.Next() {
		var id, areaID int
		var areaNombre, datosStr string
		var comp bool
		if err := rows.Scan(&id, &areaID, &areaNombre, &datosStr, &comp); err == nil {
			var d interface{}
			json.Unmarshal([]byte(datosStr), &d)
			items = append(items, map[string]interface{}{
				"id":          id,
				"area_id":     areaID,
				"area_nombre": areaNombre,
				"datos_json":  d,
				"completada":  comp,
			})
		}
	}
	middleware.WriteJSON(w, http.StatusOK, items)
}
