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
)

type ProjectsHandler struct{}

func NewProjectsHandler() *ProjectsHandler {
	return &ProjectsHandler{}
}

func (h *ProjectsHandler) GetProjects(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT id, name, stage, progress, owner, summary, fecha_inicio, fecha_fin, estado, updated_at
		FROM implementation_projects ORDER BY updated_at DESC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar proyectos")
		return
	}
	defer rows.Close()

	projects := []models.Project{}
	for rows.Next() {
		var p models.Project
		var updatedStr string
		if err := rows.Scan(&p.ID, &p.Name, &p.Stage, &p.Progress, &p.Owner, &p.Summary, &p.FechaInicio, &p.FechaFin, &p.Estado, &updatedStr); err == nil {
			projects = append(projects, p)
		}
	}

	middleware.WriteJSON(w, http.StatusOK, projects)
}

func (h *ProjectsHandler) GetFases(w http.ResponseWriter, r *http.Request) {
	projIDStr := chi.URLParam(r, "project_id")
	projID, _ := strconv.Atoi(projIDStr)

	rows, err := database.DB.Query(`
		SELECT id, nombre, orden, fecha_inicio_plan, fecha_fin_plan, ponderacion, resuelto_externamente, motivo_resuelto_externo, proyecto_id
		FROM fases WHERE proyecto_id = ? ORDER BY orden ASC
	`, projID)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar fases")
		return
	}
	defer rows.Close()

	fases := []models.Fase{}
	for rows.Next() {
		var f models.Fase
		var motivo sql.NullString
		if err := rows.Scan(&f.ID, &f.Nombre, &f.Orden, &f.FechaInicioPlan, &f.FechaFinPlan, &f.Ponderacion, &f.ResueltoExternamente, &motivo, &f.ProyectoID); err == nil {
			f.MotivoResueltoExterno = motivo.String
			f.Tareas = []models.Tarea{}

			// Fetch tasks for this phase
			tRows, tErr := database.DB.Query(`
				SELECT id, nombre, descripcion, fase_id, area_responsable_id, usuario_asignado_id, fecha_inicio, fecha_fin, estado, dependencia_de
				FROM tareas WHERE fase_id = ? ORDER BY id ASC
			`, f.ID)
			if tErr == nil {
				for tRows.Next() {
					var t models.Tarea
					var desc sql.NullString
					var areaID, userID, depID sql.NullInt64
					if err := tRows.Scan(&t.ID, &t.Nombre, &desc, &t.FaseID, &areaID, &userID, &t.FechaInicio, &t.FechaFin, &t.Estado, &depID); err == nil {
						t.Descripcion = desc.String
						if areaID.Valid {
							val := int(areaID.Int64)
							t.AreaResponsableID = &val
						}
						if userID.Valid {
							val := int(userID.Int64)
							t.UsuarioAsignadoID = &val
						}
						if depID.Valid {
							val := int(depID.Int64)
							t.DependenciaDe = &val
						}
						f.Tareas = append(f.Tareas, t)
					}
				}
				tRows.Close()
			}
			fases = append(fases, f)
		}
	}

	middleware.WriteJSON(w, http.StatusOK, fases)
}

func (h *ProjectsHandler) ToggleExternoFase(w http.ResponseWriter, r *http.Request) {
	faseIDStr := chi.URLParam(r, "fase_id")
	faseID, _ := strconv.Atoi(faseIDStr)

	var req struct {
		ResueltoExternamente bool   `json:"resuelto_externamente"`
		MotivoResueltoExterno string `json:"motivo_resuelto_externo"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	_, err := database.DB.Exec(`
		UPDATE fases SET resuelto_externamente = ?, motivo_resuelto_externo = ? WHERE id = ?
	`, req.ResueltoExternamente, req.MotivoResueltoExterno, faseID)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error actualizando fase")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{"status": "updated", "id": faseID})
}

func (h *ProjectsHandler) UpdateTarea(w http.ResponseWriter, r *http.Request) {
	tareaIDStr := chi.URLParam(r, "tarea_id")
	tareaID, _ := strconv.Atoi(tareaIDStr)

	var req models.Tarea
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.WriteError(w, http.StatusBadRequest, "Datos de tarea inválidos")
		return
	}

	_, err := database.DB.Exec(`
		UPDATE tareas SET estado = ?, usuario_asignado_id = ? WHERE id = ?
	`, req.Estado, req.UsuarioAsignadoID, tareaID)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al actualizar tarea")
		return
	}

	req.ID = tareaID
	middleware.WriteJSON(w, http.StatusOK, req)
}
