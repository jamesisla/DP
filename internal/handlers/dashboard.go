package handlers

import (
	"database/sql"
		"net/http"
	"time"

	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/middleware"
)

type DashboardHandler struct{}

func NewDashboardHandler() *DashboardHandler {
	return &DashboardHandler{}
}

func (h *DashboardHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	// 1. Projects & Phases
	var projectID, projProgress int
	var projName, projStage, projOwner, projSummary, projIni, projFin, projEstado string
	var projUpdated string

	err := database.DB.QueryRow(`
		SELECT id, name, stage, progress, owner, summary, fecha_inicio, fecha_fin, estado, updated_at
		FROM implementation_projects LIMIT 1
	`).Scan(&projectID, &projName, &projStage, &projProgress, &projOwner, &projSummary, &projIni, &projFin, &projEstado, &projUpdated)

	if err != nil && err != sql.ErrNoRows {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar proyecto")
		return
	}

	phasesList := []map[string]interface{}{}
	var globalProgress float64 = 0

	rows, err := database.DB.Query(`
		SELECT id, nombre, orden, fecha_inicio_plan, fecha_fin_plan, ponderacion, resuelto_externamente
		FROM fases WHERE proyecto_id = ? ORDER BY orden ASC
	`, projectID)

	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var fID, fOrden, fPond int
			var fNom, fIni, fFin string
			var fExt bool
			if err := rows.Scan(&fID, &fNom, &fOrden, &fIni, &fFin, &fPond, &fExt); err == nil {
				// Count tasks
				var totalTasks, completedTasks int
				database.DB.QueryRow(`SELECT COUNT(*) FROM tareas WHERE fase_id = ?`, fID).Scan(&totalTasks)
				database.DB.QueryRow(`SELECT COUNT(*) FROM tareas WHERE fase_id = ? AND estado = 'Completada'`, fID).Scan(&completedTasks)

				var fProg float64 = 0
				if fExt {
					fProg = 100.0
				} else if totalTasks > 0 {
					fProg = (float64(completedTasks) / float64(totalTasks)) * 100.0
				}
				globalProgress += fProg * (float64(fPond) / 100.0)

				phasesList = append(phasesList, map[string]interface{}{
					"id":                    fID,
					"nombre":                fNom,
					"orden":                 fOrden,
					"progreso":              int(fProg),
					"ponderacion":           fPond,
					"fecha_inicio":          fIni,
					"fecha_fin":             fFin,
					"resuelto_externamente": fExt,
				})
			}
		}
	}

	// Update project progress in DB
	projProgress = int(globalProgress)
	database.DB.Exec(`UPDATE implementation_projects SET progress = ? WHERE id = ?`, projProgress, projectID)

	// Countdown to Dec 1, 2026
	deadline := time.Date(2026, 12, 1, 0, 0, 0, 0, time.UTC)
	daysLeft := int(time.Until(deadline).Hours() / 24)
	if daysLeft < 0 {
		daysLeft = 0
	}

	// ARCO+ stats
	var totalArco, pendingArco int
	database.DB.QueryRow(`SELECT COUNT(*) FROM arco_requests`).Scan(&totalArco)
	database.DB.QueryRow(`SELECT COUNT(*) FROM arco_requests WHERE estado IN ('Ingresada', 'En análisis')`).Scan(&pendingArco)

	// Breaches stats
	var totalBreaches, activeBreaches int
	database.DB.QueryRow(`SELECT COUNT(*) FROM security_breaches`).Scan(&totalBreaches)
	database.DB.QueryRow(`SELECT COUNT(*) FROM security_breaches WHERE estado IN ('En contención', 'En investigación')`).Scan(&activeBreaches)

	// Recent activity from logs
	recentActivity := []map[string]interface{}{}
	logRows, err := database.DB.Query(`
		SELECT l.id, COALESCE(u.full_name, 'Sistema'), l.accion, l.fecha_hora, l.detalle_json
		FROM logs_auditoria l
		LEFT JOIN users u ON l.usuario_id = u.id
		ORDER BY l.fecha_hora DESC LIMIT 10
	`)
	if err == nil {
		defer logRows.Close()
		for logRows.Next() {
			var logID int
			var logUser, logAccion, logFecha string
			var logDetalle sql.NullString
			if err := logRows.Scan(&logID, &logUser, &logAccion, &logFecha, &logDetalle); err == nil {
				recentActivity = append(recentActivity, map[string]interface{}{
					"id":         logID,
					"usuario":    logUser,
					"accion":     logAccion,
					"fecha_hora": logFecha,
					"detalle":    logDetalle.String,
				})
			}
		}
	}

	res := map[string]interface{}{
		"project": map[string]interface{}{
			"id":           projectID,
			"name":         projName,
			"stage":        projStage,
			"progress":     projProgress,
			"owner":        projOwner,
			"summary":      projSummary,
			"fecha_inicio": projIni,
			"fecha_fin":    projFin,
			"estado":       projEstado,
		},
		"global_progress": projProgress,
		"days_remaining":  daysLeft,
		"phases":          phasesList,
		"metrics": map[string]interface{}{
			"global_progress": projProgress,
			"days_remaining":  daysLeft,
			"total_arco":      totalArco,
			"pending_arco":    pendingArco,
			"total_breaches":  totalBreaches,
			"active_breaches": activeBreaches,
		},
		"recent_activity": recentActivity,
	}

	middleware.WriteJSON(w, http.StatusOK, res)
}

func (h *DashboardHandler) GetComplianceTimeline(w http.ResponseWriter, r *http.Request) {
	timeline := []map[string]interface{}{
		{
			"fase":        "Fase 1: Preparación",
			"fecha":       "2025-12-01",
			"hito":        "Designación de Encargado/a Responsable y Comité de Privacidad",
			"estado":      "Completado",
			"ley":         "Ley 21.719 Art. 14",
		},
		{
			"fase":        "Fase 2: Levantamiento",
			"fecha":       "2026-03-31",
			"hito":        "Matriz RAT y Registro de Tratamientos de Datos Personales",
			"estado":      "En Progreso",
			"ley":         "Ley 21.719 Art. 15",
		},
		{
			"fase":        "Fase 3: Análisis de Riesgos",
			"fecha":       "2026-06-30",
			"hito":        "Evaluaciones de Impacto (EIPD) y Matriz 5x5",
			"estado":      "Pendiente",
			"ley":         "Ley 21.719 Art. 25",
		},
		{
			"fase":        "Fase 4: Adecuación Contractual",
			"fecha":       "2026-08-31",
			"hito":        "Pliegos DPA y Cláusulas para Proveedores ChileCompra",
			"estado":      "Pendiente",
			"ley":         "Ley 21.719 Art. 16",
		},
		{
			"fase":        "Fase 5: Capacitación y Protocolos",
			"fecha":       "2026-10-31",
			"hito":        "Protocolos ARCO (15d) y Notificación de Brechas (72h)",
			"estado":      "Pendiente",
			"ley":         "Ley 21.719 Art. 27",
		},
		{
			"fase":        "Fase 6: Entrada en Vigencia Legal",
			"fecha":       "2026-12-01",
			"hito":        "Exigibilidad total ante la Agencia de Protección de Datos",
			"estado":      "Hito Legal Perentorio",
			"ley":         "Ley 21.719",
		},
	}
	middleware.WriteJSON(w, http.StatusOK, timeline)
}
