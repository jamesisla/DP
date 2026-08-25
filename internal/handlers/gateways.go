package handlers

import (
	"crypto/sha256"
		"encoding/hex"
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

type GatewaysHandler struct{}

func NewGatewaysHandler() *GatewaysHandler {
	return &GatewaysHandler{}
}

func (h *GatewaysHandler) SimulateCitizenArco(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TipoDerecho          string `json:"tipo_derecho"`
		TitularNombre        string `json:"titular_nombre"`
		TitularRut           string `json:"titular_rut"`
		TitularEmail         string `json:"titular_email"`
		DescripcionSolicitud string `json:"descripcion_solicitud"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	today := time.Now().Format("2006-01-02")
	deadline := time.Now().AddDate(0, 0, 21).Format("2006-01-02")
	folio := fmt.Sprintf("ARCO-%d", time.Now().Unix()%100000)

	database.DB.Exec(`
		INSERT INTO arco_requests (folio, tipo_derecho, titular_nombre, titular_rut, titular_email, fecha_ingreso, dias_habiles_limite, fecha_limite_legal, estado, descripcion_solicitud, fundamento_respuesta)
		VALUES (?, ?, ?, ?, ?, ?, 15, ?, "Ingresada", ?, "")
	`, folio, req.TipoDerecho, req.TitularNombre, req.TitularRut, req.TitularEmail, today, deadline, req.DescripcionSolicitud)

	middleware.WriteJSON(w, http.StatusCreated, map[string]interface{}{
		"status":      "SOLICITUD_INGRESADA",
		"folio":       folio,
		"plazo_legal": "15 días hábiles",
		"mensaje":     "Solicitud recibida exitosamente mediante Sandbox ClaveÚnica.",
	})
}

func (h *GatewaysHandler) TrackArcoCitizen(w http.ResponseWriter, r *http.Request) {
	folio := r.URL.Query().Get("folio")
	var req models.ArcoRequest
	err := database.DB.QueryRow(`
		SELECT id, folio, tipo_derecho, titular_nombre, fecha_ingreso, fecha_limite_legal, estado, fundamento_respuesta
		FROM arco_requests WHERE folio = ?
	`, folio).Scan(&req.ID, &req.Folio, &req.TipoDerecho, &req.TitularNombre, &req.FechaIngreso, &req.FechaLimiteLegal, &req.Estado, &req.FundamentoRespuesta)

	if err != nil {
		middleware.WriteError(w, http.StatusNotFound, "Folio no encontrado")
		return
	}
	middleware.WriteJSON(w, http.StatusOK, req)
}

func (h *GatewaysHandler) GetCvdReports(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT id, folio, titulo, investigador_alias, investigador_email, activo_afectado, severidad, cvss_score, descripcion_tecnica, poa_remediacion, estado, hash_evidencia, created_at
		FROM cvd_reports ORDER BY created_at DESC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error consultando reportes CVD")
		return
	}
	defer rows.Close()

	reports := []models.CvdReport{}
	for rows.Next() {
		var cr models.CvdReport
		if err := rows.Scan(
			&cr.ID, &cr.Folio, &cr.Titulo, &cr.InvestigadorAlias, &cr.InvestigadorEmail,
			&cr.ActivoAfectado, &cr.Severidad, &cr.CvssScore, &cr.DescripcionTecnica,
			&cr.PoaRemediacion, &cr.Estado, &cr.HashEvidencia, &cr.CreatedAt,
		); err == nil {
			reports = append(reports, cr)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, reports)
}

func (h *GatewaysHandler) SimulateCvdReport(w http.ResponseWriter, r *http.Request) {
	var req models.CvdReport
	json.NewDecoder(r.Body).Decode(&req)

	now := time.Now()
	folio := fmt.Sprintf("CVD-2026-%04d", now.Unix()%10000)

	hasher := sha256.New()
	hasher.Write([]byte(folio + req.DescripcionTecnica))
	hash := hex.EncodeToString(hasher.Sum(nil))

	res, err := database.DB.Exec(`
		INSERT INTO cvd_reports (folio, titulo, investigador_alias, investigador_email, activo_afectado, severidad, cvss_score, descripcion_tecnica, poa_remediacion, estado, hash_evidencia)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "Nuevo Reporte Recibido", ?)
	`, folio, req.Titulo, req.InvestigadorAlias, req.InvestigadorEmail, req.ActivoAfectado, req.Severidad, req.CvssScore, req.DescripcionTecnica, req.PoaRemediacion, hash)

	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error creando reporte CVD")
		return
	}

	id, _ := res.LastInsertId()
	req.ID = int(id)
	req.Folio = folio
	req.HashEvidencia = hash
	req.Estado = "Nuevo Reporte Recibido"
	req.CreatedAt = now.Format("2006-01-02 15:04:05")

	middleware.WriteJSON(w, http.StatusCreated, req)
}

func (h *GatewaysHandler) UpdateCvdReportStatus(w http.ResponseWriter, r *http.Request) {
	reportIDStr := chi.URLParam(r, "report_id")
	reportID, _ := strconv.Atoi(reportIDStr)

	var req struct {
		Estado         string `json:"estado"`
		PoaRemediacion string `json:"poa_remediacion"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	database.DB.Exec(`
		UPDATE cvd_reports SET estado = ?, poa_remediacion = ? WHERE id = ?
	`, req.Estado, req.PoaRemediacion, reportID)

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{"status": "updated", "id": reportID})
}

func (h *GatewaysHandler) TrackCvdReport(w http.ResponseWriter, r *http.Request) {
	folio := r.URL.Query().Get("folio")
	var cr models.CvdReport
	err := database.DB.QueryRow(`
		SELECT id, folio, titulo, activo_afectado, severidad, cvss_score, estado, poa_remediacion, hash_evidencia, created_at
		FROM cvd_reports WHERE folio = ?
	`, folio).Scan(&cr.ID, &cr.Folio, &cr.Titulo, &cr.ActivoAfectado, &cr.Severidad, &cr.CvssScore, &cr.Estado, &cr.PoaRemediacion, &cr.HashEvidencia, &cr.CreatedAt)

	if err != nil {
		middleware.WriteError(w, http.StatusNotFound, "Reporte no encontrado")
		return
	}
	middleware.WriteJSON(w, http.StatusOK, cr)
}

func (h *GatewaysHandler) SimulatePresidioScan(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Texto string `json:"texto"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	detections := []map[string]interface{}{
		{"entity_type": "CHILE_RUT", "start": 12, "end": 24, "score": 0.98, "text": "14.567.890-1"},
		{"entity_type": "EMAIL_ADDRESS", "start": 35, "end": 62, "score": 0.95, "text": "ciudadano@correo.cl"},
	}

	database.DB.Exec(`
		INSERT INTO telemetry_events (fuente, tipo_evento, nivel_alerta, origen_ip, destino_recurso, mensaje, timestamp, payload_json, requiere_accion)
		VALUES ("Presidio DLP Engine", "PII_SCAN", "Medio", "127.0.0.1", "/api/ingesta", "Detección de RUT y Email en texto procesado", ?, "{}", 0)
	`, time.Now().Format("2006-01-02 15:04:05"))

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"total_pii_detectadas": len(detections),
		"hallazgos":            detections,
		"texto_anonimizado":    "<RUT_CHILENO_PROTEGIDO> <EMAIL_PROTEGIDO>",
		"motor":                "Presidio Analyzer v2.2 (Simulado en Vivo)",
	})
}

func (h *GatewaysHandler) SimulateWazuhAlert(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ReglaID     int    `json:"regla_id"`
		Descripcion string `json:"descripcion"`
		Nivel       string `json:"nivel"`
		IPOrigen    string `json:"ip_origen"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	if req.Descripcion == "" {
		req.Descripcion = "Intento de fuerza bruta SSH detectado en Servidor Core RSIC"
	}
	if req.Nivel == "" {
		req.Nivel = "Alto"
	}
	if req.IPOrigen == "" {
		req.IPOrigen = "192.168.1.105"
	}

	now := time.Now()
	database.DB.Exec(`
		INSERT INTO telemetry_events (fuente, tipo_evento, nivel_alerta, origen_ip, destino_recurso, mensaje, timestamp, payload_json, requiere_accion)
		VALUES ("Wazuh SIEM Agent", "BRUTE_FORCE_SSH", ?, ?, "srv-core-rsic (22/tcp)", ?, ?, "{}", 1)
	`, req.Nivel, req.IPOrigen, req.Descripcion, now.Format("2006-01-02 15:04:05"))

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"status":      "EVENTO_INGESTADO_WAZUH",
		"timestamp":   now.Format(time.RFC3339),
		"fuente":      "Wazuh SIEM",
		"descripcion": req.Descripcion,
		"accion":      "Registrado en Telemetría y Alerta CSIRT activada",
	})
}

func (h *GatewaysHandler) GetTelemetryFeed(w http.ResponseWriter, r *http.Request) {
	rows, _ := database.DB.Query(`
		SELECT id, fuente, tipo_evento, nivel_alerta, origen_ip, destino_recurso, mensaje, timestamp, requiere_accion
		FROM telemetry_events ORDER BY timestamp DESC LIMIT 50
	`)
	defer rows.Close()

	events := []models.TelemetryEvent{}
	for rows.Next() {
		var te models.TelemetryEvent
		var fStr string
		if err := rows.Scan(&te.ID, &te.Fuente, &te.TipoEvento, &te.NivelAlerta, &te.OrigenIP, &te.DestinoRecurso, &te.Mensaje, &fStr, &te.RequiereAccion); err == nil {
			te.Timestamp, _ = time.Parse("2006-01-02 15:04:05", fStr)
			events = append(events, te)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, events)
}
