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
	rows, err := database.DB.Query(`SELECT id, nombre FROM areas ORDER BY id ASC`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error consultando áreas")
		return
	}
	defer rows.Close()

	heatmap := []map[string]interface{}{}
	for rows.Next() {
		var areaID int
		var areaNom string
		if err := rows.Scan(&areaID, &areaNom); err == nil {
			var critico, alto, medio, bajo, eipd int
			database.DB.QueryRow(`
				SELECT 
					COUNT(CASE WHEN r.nivel = "Crítico" THEN 1 END),
					COUNT(CASE WHEN r.nivel = "Alto" THEN 1 END),
					COUNT(CASE WHEN r.nivel = "Medio" THEN 1 END),
					COUNT(CASE WHEN r.nivel = "Bajo" THEN 1 END),
					COUNT(CASE WHEN r.requiere_eipd = 1 THEN 1 END)
				FROM riesgos r
				JOIN matrices_levantamiento m ON r.matriz_id = m.id
				WHERE m.area_id = ?
			`, areaID).Scan(&critico, &alto, &medio, &bajo, &eipd)

			heatmap = append(heatmap, map[string]interface{}{
				"area":          areaNom,
				"Crítico":       critico,
				"Alto":          alto,
				"Medio":         medio,
				"Bajo":          bajo,
				"requiere_eipd": eipd,
			})
		}
	}
	middleware.WriteJSON(w, http.StatusOK, heatmap)
}

func (h *RisksHandler) GetRiskReport(w http.ResponseWriter, r *http.Request) {
	md := `# INFORME OFICIAL DE HALLAZGOS Y ANÁLISIS DE RIESGOS - LEY 21.719
**Fecha de Emisión:** 25/08/2026  
**Organismo Responsable:** Servicio Público de la Administración del Estado de Chile  
**Metodología:** Matriz Probabilidad (1-5) × Impacto (1-5) según Anexo Metodológico Ley 21.719  

---

## 1. Resumen Ejecutivo
El presente informe técnico consolida el diagnóstico de riesgos, brechas de cumplimiento e identificación de tratamientos que requieren una Evaluación de Impacto en Protección de Datos (EIPD).

## 2. Mapa y Detalle de Tratamientos Evaluados
- Análisis de transferencias internacionales (DPA).
- Controles de acceso lógicos y minimización de datos.
- Registro de Actividades de Tratamiento (RAT) consolidado.
`
	w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
	w.Header().Set("Content-Disposition", "attachment; filename=Informe_Hallazgos_Riesgos_Ley21719.md")
	w.Write([]byte(md))
}

func (h *RisksHandler) GetFinesSimulator(w http.ResponseWriter, r *http.Request) {
	utmVal := 66000
	scenarios := []map[string]interface{}{
		{
			"id":             "leve",
			"categoria":      "Infracción Leve",
			"articulo":       "Art. 49 Ley 21.719",
			"multa_max_utm":  5000,
			"multa_max_clp":  5000 * utmVal,
			"ejemplos": []string{
				"Deficiencias formales en el Registro de Actividades de Tratamiento (RAT)",
				"Falta de claridad en las políticas de cookies no esenciales",
				"Retrasos leves sin dolo en la respuesta a requerimientos no vinculantes",
			},
			"nivel_gravedad": "Bajo / Advertencia",
		},
		{
			"id":             "grave",
			"categoria":      "Infracción Grave",
			"articulo":       "Art. 50 Ley 21.719",
			"multa_max_utm":  10000,
			"multa_max_clp":  10000 * utmVal,
			"ejemplos": []string{
				"Tratamiento de datos personales sin base de licitud acreditada (Art. 13)",
				"No notificar una brecha de seguridad a la Agencia en el plazo de 72 horas (Art. 18)",
				"Vencimiento sistemático del plazo de 15 días hábiles para atender derechos ARCO+",
				"No contar con contratos DPA formalizados con encargados externos (Art. 16)",
			},
			"nivel_gravedad": "Alto / Sanción Financiera Significativa",
		},
		{
			"id":             "gravisima",
			"categoria":      "Infracción Gravísima",
			"articulo":       "Art. 51 Ley 21.719",
			"multa_max_utm":  20000,
			"multa_max_clp":  20000 * utmVal,
			"ejemplos": []string{
				"Tratamiento ilícito de datos sensibles (salud, biométricos, opiniones políticas)",
				"Transferencias internacionales a paraísos sin garantías mínimas de protección",
				"Reincidencia reiterada o desacato a medidas cautelares de la Agencia",
			},
			"nivel_gravedad": "Crítico / Sanción Máxima (Hasta 20.000 UTM o 4% ingresos)",
		},
	}

	atenuantes := []map[string]interface{}{
		{"id": "dpo", "nombre": "Nombramiento y operación efectiva del DPO (Art. 24)", "descuento_porcentaje": 20},
		{"id": "compliance", "nombre": "Programa de cumplimiento y RAT consolidado (LexApp GRC)", "descuento_porcentaje": 30},
		{"id": "cooperacion", "nombre": "Cooperación proactiva y notificación inmediata ante brechas", "descuento_porcentaje": 25},
		{"id": "hardening", "nombre": "Medidas de seguridad técnicas (MFA, Cifrado TLS 1.3/AES-256)", "descuento_porcentaje": 15},
	}

	res := map[string]interface{}{
		"valor_utm_clp":      utmVal,
		"escenarios":         scenarios,
		"atenuantes_legales": atenuantes,
	}

	middleware.WriteJSON(w, http.StatusOK, res)
}

func (h *RisksHandler) GetImpactAssessments(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT i.id, i.titulo, i.area_id, a.nombre, i.descripcion_tratamiento,
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

	list := []models.ImpactAssessment{}
	for rows.Next() {
		var item models.ImpactAssessment
		var areaID sql.NullInt64
		var areaNom sql.NullString
		if err := rows.Scan(
			&item.ID, &item.Titulo, &areaID, &areaNom, &item.DescripcionTratamiento,
			&item.AnalisisNecesidad, &item.RiesgosDerechos, &item.MedidasMitigacion, &item.RiesgoResidual, &item.OpinionDPO, &item.Estado,
		); err == nil {
			if areaID.Valid {
				val := int(areaID.Int64)
				item.AreaID = val
				item.Area = &models.Area{ID: val, Nombre: areaNom.String}
			}
			list = append(list, item)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, list)
}

func (h *RisksHandler) CreateImpactAssessment(w http.ResponseWriter, r *http.Request) {
	var req models.ImpactAssessment
	json.NewDecoder(r.Body).Decode(&req)

	res, err := database.DB.Exec(`
		INSERT INTO impact_assessments (titulo, area_id, descripcion_tratamiento, analisis_necesidad, riesgos_derechos, medidas_mitigacion, riesgo_residual, opinion_dpo, estado)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, req.Titulo, req.AreaID, req.DescripcionTratamiento, req.AnalisisNecesidad, req.RiesgosDerechos, req.MedidasMitigacion, req.RiesgoResidual, req.OpinionDPO, req.Estado)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error creando EIPD")
		return
	}

	id, _ := res.LastInsertId()
	req.ID = int(id)
	middleware.WriteJSON(w, http.StatusCreated, req)
}
