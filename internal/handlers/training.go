package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/middleware"
	"github.com/jamesisla/DP/internal/models"
)

type TrainingHandler struct{}

func NewTrainingHandler() *TrainingHandler {
	return &TrainingHandler{}
}

func (h *TrainingHandler) GetCampaigns(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT t.id, t.titulo, t.tipo, t.descripcion, t.fecha_inicio, t.fecha_fin,
		       t.total_convocados, t.total_capacitados, t.porcentaje_aprobacion, t.tasa_clic_phishing,
		       t.estado, t.instructor_o_plataforma, t.area_responsable_id, a.nombre
		FROM training_campaigns t
		LEFT JOIN areas a ON t.area_responsable_id = a.id
		ORDER BY t.id ASC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar campañas")
		return
	}
	defer rows.Close()

	campaigns := []models.TrainingCampaign{}
	for rows.Next() {
		var c models.TrainingCampaign
		var areaID sql.NullInt64
		var areaNom sql.NullString
		if err := rows.Scan(
			&c.ID, &c.Titulo, &c.Tipo, &c.Descripcion, &c.FechaInicio, &c.FechaFin,
			&c.TotalConvocados, &c.TotalCapacitados, &c.PorcentajeAprobacion, &c.TasaClicPhishing,
			&c.Estado, &c.InstructorOPlataforma, &areaID, &areaNom,
		); err == nil {
			if areaID.Valid {
				val := int(areaID.Int64)
				c.AreaResponsableID = &val
				c.AreaResponsable = &models.Area{ID: val, Nombre: areaNom.String}
			}
			campaigns = append(campaigns, c)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, campaigns)
}

func (h *TrainingHandler) CreateCampaign(w http.ResponseWriter, r *http.Request) {
	var req models.TrainingCampaign
	json.NewDecoder(r.Body).Decode(&req)

	res, err := database.DB.Exec(`
		INSERT INTO training_campaigns (titulo, tipo, descripcion, fecha_inicio, fecha_fin, total_convocados, total_capacitados, porcentaje_aprobacion, tasa_clic_phishing, estado, instructor_o_plataforma, area_responsable_id)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, req.Titulo, req.Tipo, req.Descripcion, req.FechaInicio, req.FechaFin, req.TotalConvocados, req.TotalCapacitados, req.PorcentajeAprobacion, req.TasaClicPhishing, req.Estado, req.InstructorOPlataforma, req.AreaResponsableID)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al crear campaña de capacitación")
		return
	}

	id, _ := res.LastInsertId()
	req.ID = int(id)
	middleware.WriteJSON(w, http.StatusCreated, req)
}

func (h *TrainingHandler) DeleteCampaign(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	database.DB.Exec(`DELETE FROM training_campaigns WHERE id = ?`, id)
	w.WriteHeader(http.StatusNoContent)
}

func (h *TrainingHandler) GetCampaignCertificate(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	var c models.TrainingCampaign
	err := database.DB.QueryRow(`
		SELECT id, titulo, total_convocados, total_capacitados, porcentaje_aprobacion, fecha_fin FROM training_campaigns WHERE id = ?
	`, id).Scan(&c.ID, &c.Titulo, &c.TotalConvocados, &c.TotalCapacitados, &c.PorcentajeAprobacion, &c.FechaFin)

	if err != nil && err != sql.ErrNoRows {
		middleware.WriteError(w, http.StatusNotFound, "Campaña no encontrada")
		return
	}

	certMD := fmt.Sprintf(`# 📜 ACTA Y CERTIFICADO OFICIAL DE CAPACITACIÓN INSTITUCIONAL
**Campaña:** %s  
**Fecha de Término:** %s  
**Cobertura Lograda:** %d de %d funcionarios (%d%%)  
**Aprobación de Examen:** %d%%  

---

Se certifica que la institución ha cumplido con el programa obligatorio de formación en **Protección de Datos Personales (Ley N° 21.719)** y **Cultura de Ciberseguridad (Ley N° 21.663)**.
`, c.Titulo, c.FechaFin, c.TotalCapacitados, c.TotalConvocados, (c.TotalCapacitados*100)/max(1, c.TotalConvocados), c.PorcentajeAprobacion)

	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": certMD})
}
