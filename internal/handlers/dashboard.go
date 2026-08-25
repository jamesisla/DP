package handlers

import (
	"database/sql"
	"fmt"
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
	currentUser := middleware.GetCurrentUser(r)
	userName := "DPO Demo"
	if currentUser != nil {
		userName = currentUser.FullName
	}

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
				var totalTasks, completedTasks int
				database.DB.QueryRow(`SELECT COUNT(*) FROM tareas WHERE fase_id = ?`, fID).Scan(&totalTasks)
				database.DB.QueryRow(`SELECT COUNT(*) FROM tareas WHERE fase_id = ? AND estado = "Completada"`, fID).Scan(&completedTasks)

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

	projProgress = int(globalProgress)
	database.DB.Exec(`UPDATE implementation_projects SET progress = ? WHERE id = ?`, projProgress, projectID)

	deadline := time.Date(2026, 12, 1, 0, 0, 0, 0, time.UTC)
	daysLeft := int(time.Until(deadline).Hours() / 24)
	if daysLeft < 0 {
		daysLeft = 0
	}

	var totalTasks, completedTasks, totalProviders, totalArco, pendingArco, urgentArco int
	database.DB.QueryRow(`SELECT COUNT(*) FROM tareas`).Scan(&totalTasks)
	database.DB.QueryRow(`SELECT COUNT(*) FROM tareas WHERE estado = "Completada"`).Scan(&completedTasks)
	database.DB.QueryRow(`SELECT COUNT(*) FROM proveedores`).Scan(&totalProviders)
	database.DB.QueryRow(`SELECT COUNT(*) FROM arco_requests`).Scan(&totalArco)
	database.DB.QueryRow(`SELECT COUNT(*) FROM arco_requests WHERE estado IN ("Ingresada", "En análisis")`).Scan(&pendingArco)
	urgentArco = pendingArco

	var totalBreaches, activeBreaches, unnotifiedBreaches int
	database.DB.QueryRow(`SELECT COUNT(*) FROM security_breaches`).Scan(&totalBreaches)
	database.DB.QueryRow(`SELECT COUNT(*) FROM security_breaches WHERE estado IN ("En contención", "En investigación")`).Scan(&activeBreaches)
	database.DB.QueryRow(`SELECT COUNT(*) FROM security_breaches WHERE notificado_agencia = 0 AND estado != "Mitigado y Cerrado"`).Scan(&unnotifiedBreaches)

	recentActivity := []map[string]interface{}{}
	logRows, err := database.DB.Query(`
		SELECT l.id, COALESCE(u.full_name, "Sistema"), l.accion, l.fecha_hora, l.detalle_json
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

	metrics := []map[string]interface{}{
		{"label": "Avance General Ley 21.719", "value": fmt.Sprintf("%d%%", projProgress), "trend": "ponderado"},
		{"label": "Días Restantes Entrada Vigencia", "value": fmt.Sprintf("%d", daysLeft), "trend": "01 Dic 2026"},
		{"label": "Solicitudes ARCO+ (15d)", "value": fmt.Sprintf("%d activas", pendingArco), "trend": fmt.Sprintf("%d urgentes", urgentArco)},
		{"label": "Brechas de Seguridad (72h)", "value": fmt.Sprintf("%d incidentes", activeBreaches), "trend": fmt.Sprintf("%d por notificar", unnotifiedBreaches)},
	}

	focus := []string{
		"Completar Wizard de Levantamiento de Información en todas las divisiones.",
		"Monitorear las solicitudes de Derechos ARCO+ en curso antes del vencimiento de 15 días hábiles.",
		"Verificar que los contratos de proveedores con vigencia menor a 6 meses cuenten con el Anexo Ley 21.719.",
	}

	res := map[string]interface{}{
		"user":                userName,
		"metrics":             metrics,
		"phases":              phasesList,
		"focus":               focus,
		"critical_path_alert": nil,
		"recent_activity":     recentActivity,
		"stats": map[string]interface{}{
			"total_tasks":         totalTasks,
			"completed_tasks":     completedTasks,
			"total_providers":     totalProviders,
			"total_arco":          totalArco,
			"pending_arco":        pendingArco,
			"urgent_arco":         urgentArco,
			"total_breaches":      totalBreaches,
			"active_breaches":     activeBreaches,
			"unnotified_breaches": unnotifiedBreaches,
		},
	}

	middleware.WriteJSON(w, http.StatusOK, res)
}

func (h *DashboardHandler) GetComplianceTimeline(w http.ResponseWriter, r *http.Request) {
	today := time.Now()
	deadline21719 := time.Date(2026, 12, 1, 0, 0, 0, 0, time.UTC)
	daysLeft21719 := max(0, int(deadline21719.Sub(today).Hours()/24))

	milestones := []map[string]interface{}{
		{
			"id":             "l21719_enactment",
			"ley":            "Ley 21.719",
			"titulo":         "Entrada en Vigor Plena Ley N° 21.719",
			"descripcion":    "Exigibilidad total de la Agencia de Protección de Datos Personales, sanciones (hasta 20.000 UTM) y derechos ARCO+.",
			"fecha":          "2026-12-01",
			"tipo":           "Hito Legal Mandatorio",
			"urgencia":       "Alta",
			"estado":         "En Cuenta Regresiva",
			"dias_restantes": daysLeft21719,
		},
		{
			"id":             "l21663_anci_enforcement",
			"ley":            "Ley 21.663",
			"titulo":         "Exigibilidad Plena Régimen Sancionatorio ANCI",
			"descripcion":    "Fiscalización de operadores RSIC/OIV y aplicación de multas de hasta 40.000 UTM por incumplimiento de notificación en 3h.",
			"fecha":          "2026-09-01",
			"tipo":           "Hito Legal Mandatorio",
			"urgencia":       "Alta",
			"estado":         "En Cuenta Regresiva",
			"dias_restantes": max(0, int(time.Date(2026, 9, 1, 0, 0, 0, 0, time.UTC).Sub(today).Hours()/24)),
		},
	}

	middleware.WriteJSON(w, http.StatusOK, milestones)
}
