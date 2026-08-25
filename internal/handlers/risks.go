package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/middleware"
	"github.com/jamesisla/DP/internal/models"
)

type RisksHandler struct{}

func NewRisksHandler() *RisksHandler {
	return &RisksHandler{}
}

func (h *RisksHandler) GetRisks(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT id, matriz_id, nivel, descripcion, puntuacion, probabilidad, impacto, requiere_eipd
		FROM riesgos ORDER BY puntuacion DESC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error consultando riesgos")
		return
	}
	defer rows.Close()

	risks := []models.Riesgo{}
	for rows.Next() {
		var r models.Riesgo
		var matrizID sql.NullInt64
		if err := rows.Scan(&r.ID, &matrizID, &r.Nivel, &r.Descripcion, &r.Puntuacion, &r.Probabilidad, &r.Impacto, &r.RequiereEIPD); err == nil {
			if matrizID.Valid {
				val := int(matrizID.Int64)
				r.MatrizID = &val
			}
			risks = append(risks, r)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, risks)
}

func (h *RisksHandler) GetRiskHeatmap(w http.ResponseWriter, r *http.Request) {
	matrix := make([][]int, 5)
	for i := range matrix {
		matrix[i] = make([]int, 5)
	}

	rows, err := database.DB.Query(`SELECT probabilidad, impacto FROM riesgos`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var p, i int
			if err := rows.Scan(&p, &i); err == nil {
				pIdx := p - 1
				iIdx := i - 1
				if pIdx >= 0 && pIdx < 5 && iIdx >= 0 && iIdx < 5 {
					matrix[pIdx][iIdx]++
				}
			}
		}
	}

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"heatmap": matrix,
		"legend":  "Probabilidad (Filas 1-5) x Impacto (Columnas 1-5)",
	})
}

func (h *RisksHandler) GetRiskReport(w http.ResponseWriter, r *http.Request) {
	var total, altos, criticos, eipdCount int
	database.DB.QueryRow(`SELECT COUNT(*) FROM riesgos`).Scan(&total)
	database.DB.QueryRow(`SELECT COUNT(*) FROM riesgos WHERE nivel = 'Alto'`).Scan(&altos)
	database.DB.QueryRow(`SELECT COUNT(*) FROM riesgos WHERE nivel = 'Crítico'`).Scan(&criticos)
	database.DB.QueryRow(`SELECT COUNT(*) FROM riesgos WHERE requiere_eipd = 1`).Scan(&eipdCount)

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"total_riesgos":    total,
		"riesgos_altos":    altos,
		"riesgos_criticos": criticos,
		"requieren_eipd":   eipdCount,
		"resumen":          "Diagnóstico de riesgos consolidado según matriz 5x5 Ley N° 21.719.",
	})
}

func (h *RisksHandler) GetImpactAssessments(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT i.id, i.titulo, i.area_id, a.nombre, i.proceso_relacionado, i.motivo_alto_riesgo,
		       i.analisis_necesidad, i.riesgos_derechos, i.medidas_mitigacion, i.riesgo_residual, i.opinion_dpo, i.estado
		FROM impact_assessments i
		LEFT JOIN areas a ON i.area_id = a.id
		ORDER BY i.id ASC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar EIPDs")
		return
	}
	defer rows.Close()

	eips := []models.ImpactAssessment{}
	for rows.Next() {
		var item models.ImpactAssessment
		var areaNombre sql.NullString
		if err := rows.Scan(
			&item.ID, &item.Titulo, &item.AreaID, &areaNombre, &item.ProcesoRelacionado, &item.MotivoAltoRiesgo,
			&item.AnalisisNecesidad, &item.RiesgosDerechos, &item.MedidasMitigacion, &item.RiesgoResidual, &item.OpinionDPO, &item.Estado,
		); err == nil {
			if areaNombre.Valid {
				item.Area = &models.Area{ID: item.AreaID, Nombre: areaNombre.String}
			}
			eips = append(eips, item)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, eips)
}

func (h *RisksHandler) CreateImpactAssessment(w http.ResponseWriter, r *http.Request) {
	var req models.ImpactAssessment
	json.NewDecoder(r.Body).Decode(&req)

	res, err := database.DB.Exec(`
		INSERT INTO impact_assessments (titulo, area_id, proceso_relacionado, motivo_alto_riesgo, analisis_necesidad, riesgos_derechos, medidas_mitigacion, riesgo_residual, opinion_dpo, estado)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, req.Titulo, req.AreaID, req.ProcesoRelacionado, req.MotivoAltoRiesgo, req.AnalisisNecesidad, req.RiesgosDerechos, req.MedidasMitigacion, req.RiesgoResidual, req.OpinionDPO, req.Estado)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al registrar evaluación de impacto EIPD")
		return
	}

	id, _ := res.LastInsertId()
	req.ID = int(id)
	middleware.WriteJSON(w, http.StatusCreated, req)
}

func (h *RisksHandler) GetFinesSimulator(w http.ResponseWriter, r *http.Request) {
	res := map[string]interface{}{
		"escala_sanciones": []map[string]interface{}{
			{"tipo": "Infracciones Leves", "multa_utm": "Hasta 5.000 UTM", "multa_clp_aprox": "$330.000.000 CLP", "ejemplos": "Retraso en responder solicitud ARCO+ menor a 5 días."},
			{"tipo": "Infracciones Graves", "multa_utm": "Hasta 10.000 UTM", "multa_clp_aprox": "$660.000.000 CLP", "ejemplos": "No notificar brecha de seguridad en plazo de 72 horas."},
			{"tipo": "Infracciones Gravísimas", "multa_utm": "Hasta 20.000 UTM (o hasta 4% facturación anual)", "multa_clp_aprox": "$1.320.000.000 CLP", "ejemplos": "Tratamiento ilícito masivo de datos sensibles sin consentimiento."},
		},
		"base_calculo_utm": 66000,
	}
	middleware.WriteJSON(w, http.StatusOK, res)
}
