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
		SELECT id, nombre, descripcion, tipo, total_funcionarios, completados, aprobados_evaluacion, simulacion_phishing_clicks, estado, fecha_inicio, fecha_fin
		FROM training_campaigns ORDER BY id ASC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar campañas")
		return
	}
	defer rows.Close()

	campaigns := []models.TrainingCampaign{}
	for rows.Next() {
		var c models.TrainingCampaign
		if err := rows.Scan(&c.ID, &c.Nombre, &c.Descripcion, &c.Tipo, &c.TotalFuncionarios, &c.Completados, &c.AprobadosEvaluacion, &c.SimulacionPhishingClicks, &c.Estado, &c.FechaInicio, &c.FechaFin); err == nil {
			campaigns = append(campaigns, c)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, campaigns)
}

func (h *TrainingHandler) CreateCampaign(w http.ResponseWriter, r *http.Request) {
	var req models.TrainingCampaign
	json.NewDecoder(r.Body).Decode(&req)

	res, err := database.DB.Exec(`
		INSERT INTO training_campaigns (nombre, descripcion, tipo, total_funcionarios, completados, aprobados_evaluacion, simulacion_phishing_clicks, estado, fecha_inicio, fecha_fin)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, req.Nombre, req.Descripcion, req.Tipo, req.TotalFuncionarios, req.Completados, req.AprobadosEvaluacion, req.SimulacionPhishingClicks, req.Estado, req.FechaInicio, req.FechaFin)

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
		SELECT id, nombre, total_funcionarios, completados, aprobados_evaluacion, fecha_fin FROM training_campaigns WHERE id = ?
	`, id).Scan(&c.ID, &c.Nombre, &c.TotalFuncionarios, &c.Completados, &c.AprobadosEvaluacion, &c.FechaFin)

	if err != nil && err != sql.ErrNoRows {
		middleware.WriteError(w, http.StatusNotFound, "Campaña no encontrada")
		return
	}

	certMD := fmt.Sprintf(`# 📜 ACTA Y CERTIFICADO OFICIAL DE CAPACITACIÓN INSTITUCIONAL
**Campaña:** %s  
**Fecha de Término:** %s  
**Cobertura Lograda:** %d de %d funcionarios (%d%%)  
**Aprobación de Examen:** %d funcionarios  

---

Se certifica que la institución ha cumplido con el programa obligatorio de formación en **Protección de Datos Personales (Ley N° 21.719)** y **Cultura de Ciberseguridad (Ley N° 21.663)**.
`, c.Nombre, c.FechaFin, c.Completados, c.TotalFuncionarios, (c.Completados*100)/max(1, c.TotalFuncionarios), c.AprobadosEvaluacion)

	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": certMD})
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
