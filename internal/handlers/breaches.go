package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/middleware"
	"github.com/jamesisla/DP/internal/models"
)

type BreachesHandler struct{}

func NewBreachesHandler() *BreachesHandler {
	return &BreachesHandler{}
}

func (h *BreachesHandler) GetBreaches(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT id, codigo_incidente, fecha_deteccion, fecha_limite_notificacion, tipo_incidente,
		       gravedad, descripcion, datos_afectados, cantidad_titulares_afectados, medidas_contencion,
		       notificado_agencia, fecha_notificacion_agencia, notificado_titulares, estado,
		       origen_ciberseguridad, incidente_anci_id, codigo_incidente_ciber, activo_rsic_afectado
		FROM security_breaches ORDER BY fecha_deteccion DESC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar brechas de seguridad")
		return
	}
	defer rows.Close()

	list := []models.SecurityBreach{}
	for rows.Next() {
		var b models.SecurityBreach
		var detStr, limStr string
		var notifAgStr sql.NullString
		var incID sql.NullInt64
		var codCiber sql.NullString
		if err := rows.Scan(
			&b.ID, &b.CodigoIncidente, &detStr, &limStr, &b.TipoIncidente,
			&b.Gravedad, &b.Descripcion, &b.DatosAfectados, &b.CantidadTitularesAfectados, &b.MedidasContencion,
			&b.NotificadoAgencia, &notifAgStr, &b.NotificadoTitulares, &b.Estado,
			&b.OrigenCiberseguridad, &incID, &codCiber, &b.ActivoRSICAfectado,
		); err == nil {
			b.FechaDeteccion, _ = time.Parse("2006-01-02 15:04:05", detStr)
			b.FechaLimiteNotificacion, _ = time.Parse("2006-01-02 15:04:05", limStr)
			if incID.Valid {
				val := int(incID.Int64)
				b.IncidenteAnciID = &val
			}
			if codCiber.Valid {
				b.CodigoIncidenteCiber = &codCiber.String
			}
			list = append(list, b)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, list)
}

func (h *BreachesHandler) CreateBreach(w http.ResponseWriter, r *http.Request) {
	var req models.SecurityBreach
	json.NewDecoder(r.Body).Decode(&req)

	now := time.Now()
	deadline := now.Add(72 * time.Hour)
	code := fmt.Sprintf("BREACH-2026-%04d", now.Unix()%10000)

	res, err := database.DB.Exec(`
		INSERT INTO security_breaches (codigo_incidente, fecha_deteccion, fecha_limite_notificacion, tipo_incidente, gravedad, descripcion, datos_afectados, cantidad_titulares_afectados, medidas_contencion, notificado_agencia, notificado_titulares, estado, origen_ciberseguridad, incidente_anci_id, codigo_incidente_ciber, activo_rsic_afectado)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'En contención', ?, ?, ?, ?)
	`, code, now.Format("2006-01-02 15:04:05"), deadline.Format("2006-01-02 15:04:05"), req.TipoIncidente, req.Gravedad, req.Descripcion, req.DatosAfectados, req.CantidadTitularesAfectados, req.MedidasContencion, req.OrigenCiberseguridad, req.IncidenteAnciID, req.CodigoIncidenteCiber, req.ActivoRSICAfectado)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error registrando brecha de seguridad")
		return
	}

	id, _ := res.LastInsertId()
	req.ID = int(id)
	req.CodigoIncidente = code
	req.FechaDeteccion = now
	req.FechaLimiteNotificacion = deadline
	req.Estado = "En contención"

	middleware.WriteJSON(w, http.StatusCreated, req)
}

func (h *BreachesHandler) UpdateBreach(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	var req models.SecurityBreach
	json.NewDecoder(r.Body).Decode(&req)

	_, err := database.DB.Exec(`
		UPDATE security_breaches SET estado = ?, medidas_contencion = ?, notificado_agencia = ?, notificado_titulares = ? WHERE id = ?
	`, req.Estado, req.MedidasContencion, req.NotificadoAgencia, req.NotificadoTitulares, id)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error actualizando brecha")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{"status": "updated", "id": id})
}
