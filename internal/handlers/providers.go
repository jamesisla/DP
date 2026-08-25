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

type ProvidersHandler struct{}

func NewProvidersHandler() *ProvidersHandler {
	return &ProvidersHandler{}
}

func (h *ProvidersHandler) GetProviders(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT p.id, p.nombre, p.rut, p.servicio, p.fecha_contrato_inicio, p.fecha_contrato_fin,
		       p.area_id, a.nombre, p.criticidad_ciber, p.clausula_anci_firmada, p.dpa_firmado,
		       p.pais_alojamiento, p.sla_notificacion_horas, p.evaluacion_seguridad
		FROM proveedores p
		LEFT JOIN areas a ON p.area_id = a.id
		ORDER BY p.id ASC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar proveedores")
		return
	}
	defer rows.Close()

	providers := []models.Proveedor{}
	for rows.Next() {
		var p models.Proveedor
		var areaID sql.NullInt64
		var areaNom sql.NullString
		if err := rows.Scan(
			&p.ID, &p.Nombre, &p.Rut, &p.Servicio, &p.FechaContratoInicio, &p.FechaContratoFin,
			&areaID, &areaNom, &p.CriticidadCiber, &p.ClausulaANCIFirmada, &p.DPAFirmado,
			&p.PaisAlojamiento, &p.SLANotificacionHoras, &p.EvaluacionSeguridad,
		); err == nil {
			if areaID.Valid {
				val := int(areaID.Int64)
				p.AreaID = &val
				p.Area = &models.Area{ID: val, Nombre: areaNom.String}
			}
			providers = append(providers, p)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, providers)
}

func (h *ProvidersHandler) CreateProvider(w http.ResponseWriter, r *http.Request) {
	var req models.Proveedor
	json.NewDecoder(r.Body).Decode(&req)

	res, err := database.DB.Exec(`
		INSERT INTO proveedores (nombre, rut, servicio, fecha_contrato_inicio, fecha_contrato_fin, area_id, criticidad_ciber, clausula_anci_firmada, dpa_firmado, pais_alojamiento, sla_notificacion_horas, evaluacion_seguridad)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, req.Nombre, req.Rut, req.Servicio, req.FechaContratoInicio, req.FechaContratoFin, req.AreaID, req.CriticidadCiber, req.ClausulaANCIFirmada, req.DPAFirmado, req.PaisAlojamiento, req.SLANotificacionHoras, req.EvaluacionSeguridad)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al registrar proveedor")
		return
	}

	id, _ := res.LastInsertId()
	req.ID = int(id)
	middleware.WriteJSON(w, http.StatusCreated, req)
}

func (h *ProvidersHandler) DeleteProvider(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	database.DB.Exec(`DELETE FROM proveedores WHERE id = ?`, id)
	w.WriteHeader(http.StatusNoContent)
}

func (h *ProvidersHandler) GetProviderAnnex(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	var p models.Proveedor
	var areaNom sql.NullString
	err := database.DB.QueryRow(`
		SELECT p.id, p.nombre, p.rut, p.servicio, p.fecha_contrato_inicio, p.fecha_contrato_fin, a.nombre, p.pais_alojamiento, p.sla_notificacion_horas
		FROM proveedores p
		LEFT JOIN areas a ON p.area_id = a.id
		WHERE p.id = ?
	`, id).Scan(&p.ID, &p.Nombre, &p.Rut, &p.Servicio, &p.FechaContratoInicio, &p.FechaContratoFin, &areaNom, &p.PaisAlojamiento, &p.SLANotificacionHoras)

	if err != nil {
		middleware.WriteError(w, http.StatusNotFound, "Proveedor no encontrado")
		return
	}

	markdown := fmt.Sprintf(`# ANEXO DPA / ACUERDO DE TRATAMIENTO DE DATOS PERSONALES
**Proveedor Mandatario:** %s  
**RUT:** %s  
**Servicio Contratado:** %s  
**País de Alojamiento:** %s  
**SLA Notificación de Brechas:** %d Horas  

---

## 1. OBJETO DEL ENCARGO
El presente anexo formaliza el mandato legal de tratamiento de datos personales conforme al **Artículo 16 de la Ley N° 21.719** y estándares de ciberdefensa **Ley N° 21.663**.

## 2. MEDIDAS DE SEGURIDAD EXIGIDAS
* Cifrado en tránsito (TLS 1.3) y en reposo (AES-256).
* Obligación de notificación ante incidentes en un plazo perentorio no superior a %d horas.
* Compromiso de auditoría y supresión definitiva de datos al expirar el contrato.
`, p.Nombre, p.Rut, p.Servicio, p.PaisAlojamiento, p.SLANotificacionHoras, p.SLANotificacionHoras)

	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": markdown})
}
