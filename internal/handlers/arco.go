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

type ArcoHandler struct{}

func NewArcoHandler() *ArcoHandler {
	return &ArcoHandler{}
}

func (h *ArcoHandler) GetArcoRequests(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT a.id, a.folio, a.tipo_derecho, a.titular_nombre, a.titular_rut, a.titular_email,
		       a.fecha_ingreso, a.dias_habiles_limite, a.fecha_limite_legal, a.estado,
		       a.descripcion_solicitud, a.fundamento_respuesta, a.area_derivada_id, ar.nombre,
		       a.responsable_asignado_id, u.full_name, u.email
		FROM arco_requests a
		LEFT JOIN areas ar ON a.area_derivada_id = ar.id
		LEFT JOIN users u ON a.responsable_asignado_id = u.id
		ORDER BY a.fecha_ingreso DESC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar solicitudes ARCO+")
		return
	}
	defer rows.Close()

	list := []models.ArcoRequest{}
	for rows.Next() {
		var req models.ArcoRequest
		var areaID, respID sql.NullInt64
		var areaNom, respName, respEmail sql.NullString
		if err := rows.Scan(
			&req.ID, &req.Folio, &req.TipoDerecho, &req.TitularNombre, &req.TitularRut, &req.TitularEmail,
			&req.FechaIngreso, &req.DiasHabilesLimite, &req.FechaLimiteLegal, &req.Estado,
			&req.DescripcionSolicitud, &req.FundamentoRespuesta, &areaID, &areaNom,
			&respID, &respName, &respEmail,
		); err == nil {
			if areaID.Valid {
				val := int(areaID.Int64)
				req.AreaDerivadaID = &val
				req.AreaDerivada = &models.Area{ID: val, Nombre: areaNom.String}
			}
			if respID.Valid {
				val := int(respID.Int64)
				req.ResponsableAsignadoID = &val
				req.ResponsableAsignado = &models.UserRead{ID: val, FullName: respName.String, Email: respEmail.String}
			}
			list = append(list, req)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, list)
}

func (h *ArcoHandler) CreateArcoRequest(w http.ResponseWriter, r *http.Request) {
	var req models.ArcoRequest
	json.NewDecoder(r.Body).Decode(&req)

	today := time.Now().Format("2006-01-02")
	deadline := time.Now().AddDate(0, 0, 21).Format("2006-01-02") // 15 días hábiles aprox
	folio := fmt.Sprintf("ARCO-2026-%04d", time.Now().Unix()%10000)

	res, err := database.DB.Exec(`
		INSERT INTO arco_requests (folio, tipo_derecho, titular_nombre, titular_rut, titular_email, fecha_ingreso, dias_habiles_limite, fecha_limite_legal, estado, descripcion_solicitud, fundamento_respuesta, area_derivada_id, responsable_asignado_id)
		VALUES (?, ?, ?, ?, ?, ?, 15, ?, 'Ingresada', ?, '', ?, ?)
	`, folio, req.TipoDerecho, req.TitularNombre, req.TitularRut, req.TitularEmail, today, deadline, req.DescripcionSolicitud, req.AreaDerivadaID, req.ResponsableAsignadoID)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error registrando solicitud ARCO+")
		return
	}

	id, _ := res.LastInsertId()
	req.ID = int(id)
	req.Folio = folio
	req.FechaIngreso = today
	req.DiasHabilesLimite = 15
	req.FechaLimiteLegal = deadline
	req.Estado = "Ingresada"

	middleware.WriteJSON(w, http.StatusCreated, req)
}

func (h *ArcoHandler) UpdateArcoRequest(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, _ := strconv.Atoi(idStr)

	var req models.ArcoRequest
	json.NewDecoder(r.Body).Decode(&req)

	_, err := database.DB.Exec(`
		UPDATE arco_requests SET estado = ?, fundamento_respuesta = ?, area_derivada_id = ?, responsable_asignado_id = ? WHERE id = ?
	`, req.Estado, req.FundamentoRespuesta, req.AreaDerivadaID, req.ResponsableAsignadoID, id)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al actualizar solicitud")
		return
	}

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{"status": "updated", "id": id})
}
