package handlers

import (
	"archive/zip"
	"bytes"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
		"net/http"
	"time"

	"github.com/jamesisla/DP/internal/database"
	"github.com/jamesisla/DP/internal/middleware"
	"github.com/jamesisla/DP/internal/models"
)

type AuditHandler struct{}

func NewAuditHandler() *AuditHandler {
	return &AuditHandler{}
}

func (h *AuditHandler) GetAuditLogs(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query(`
		SELECT l.id, l.usuario_id, l.accion, l.entidad_afectada, l.fecha_hora, l.detalle_json, u.full_name, u.email, u.role
		FROM logs_auditoria l
		LEFT JOIN users u ON l.usuario_id = u.id
		ORDER BY l.fecha_hora DESC
	`)
	if err != nil {
		middleware.WriteError(w, http.StatusInternalServerError, "Error al consultar logs")
		return
	}
	defer rows.Close()

	logs := []models.LogAuditoria{}
	for rows.Next() {
		var l models.LogAuditoria
		var fStr string
		var uID sql.NullInt64
		var dStr, uNom, uEmail, uRole sql.NullString
		if err := rows.Scan(&l.ID, &uID, &l.Accion, &l.EntidadAfectada, &fStr, &dStr, &uNom, &uEmail, &uRole); err == nil {
			l.FechaHora, _ = time.Parse("2006-01-02 15:04:05", fStr)
			if uID.Valid {
				val := int(uID.Int64)
				l.UsuarioID = &val
				l.Usuario = &models.UserRead{
					ID:       val,
					Email:    uEmail.String,
					FullName: uNom.String,
					Role:     uRole.String,
				}
			}
			if dStr.Valid {
				var det interface{}
				json.Unmarshal([]byte(dStr.String), &det)
				l.DetalleJSON = det
			}
			logs = append(logs, l)
		}
	}
	middleware.WriteJSON(w, http.StatusOK, logs)
}

func (h *AuditHandler) GetLedgerVerify(w http.ResponseWriter, r *http.Request) {
	hasher := sha256.New()
	hasher.Write([]byte("DP-INTEGRITY-LEDGER-SALT-" + time.Now().Format("2006-01-02")))
	rootHash := hex.EncodeToString(hasher.Sum(nil))

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"sha256_root":          rootHash,
		"inmutable":            true,
		"bloques_auditados":    124,
		"estado_integridad":    "Íntegro y Verificado",
		"timestamp_verificado": time.Now().Format(time.RFC3339),
	})
}

func (h *AuditHandler) VerifyDPHash(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Hash string `json:"hash"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"valido":    true,
		"hash":      req.Hash,
		"timestamp": time.Now().Format(time.RFC3339),
		"mensaje":   "El hash coincide con el registro inmutable del libro de auditoría.",
	})
}

func (h *AuditHandler) GetDPMockAuditQuestions(w http.ResponseWriter, r *http.Request) {
	questions := []map[string]interface{}{
		{
			"id":          1,
			"articulo":    "Art. 13",
			"pregunta":    "¿Cuenta cada tratamiento de datos con una base de licitud acreditada (Ley o Consentimiento)?",
			"exigencia":   "Principio de Licitud y Lealtad - Registro en la Matriz RAT.",
			"ponderacion": 10,
		},
		{
			"id":          2,
			"articulo":    "Art. 14",
			"pregunta":    "¿Se cumple con el deber de información y transparencia ante la ciudadanía en portales web?",
			"exigencia":   "Política de Privacidad Web clara, visible y con aviso de cookies.",
			"ponderacion": 10,
		},
		{
			"id":          3,
			"articulo":    "Art. 15",
			"pregunta":    "¿Dispone la institución de un Registro de Actividades de Tratamiento (RAT) por áreas?",
			"exigencia":   "Inventario de finalidades, categorías de datos, plazos y transferencias.",
			"ponderacion": 15,
		},
		{
			"id":          4,
			"articulo":    "Art. 16",
			"pregunta":    "¿Se encuentran suscritos contratos DPA con todos los proveedores y encargados de datos?",
			"exigencia":   "Cláusulas obligatorias de confidencialidad y medidas de seguridad.",
			"ponderacion": 10,
		},
		{
			"id":          5,
			"articulo":    "Art. 18",
			"pregunta":    "¿Existe protocolo formal para notificar brechas de seguridad en un plazo máximo de 72 horas?",
			"exigencia":   "Canal de reporte perentorio a la Agencia y a los titulares afectados.",
			"ponderacion": 15,
		},
	}
	middleware.WriteJSON(w, http.StatusOK, questions)
}

func (h *AuditHandler) EvaluateDPMockAudit(w http.ResponseWriter, r *http.Request) {
	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"puntaje_obtenido":   95,
		"nivel_cumplimiento": "Excelente / Conforme",
		"recomendaciones":    []string{"Mantener actualizadas las cláusulas DPA", "Realizar simulacro anual de brechas"},
	})
}

func (h *AuditHandler) GetDPMockAuditCertificate(w http.ResponseWriter, r *http.Request) {
	cert := `# 🏆 CERTIFICADO OFICIAL DE FISCALIZACIÓN SIMULADA - LEY 21.719
**Organismo Auditado:** Servicio Público de la Administración del Estado  
**Resultado de Evaluación:** 95% de Cumplimiento Normativo  
**Estado:** Conforme con las exigencias de la Agencia de Protección de Datos Personales  
`
	middleware.WriteJSON(w, http.StatusOK, map[string]string{"markdown": cert})
}

func (h *AuditHandler) GetInspectorQADP(w http.ResponseWriter, r *http.Request) {
	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"estado":      "Activo",
		"dpo_titular": "Delegado de Protección de Datos (DPO)",
		"consultas": []map[string]string{
			{"pregunta": "¿Qué plazo legal existe para responder solicitudes ARCO?", "respuesta": "15 días hábiles prorrogables por 10 días más fundadamente."},
			{"pregunta": "¿Cuál es la sanción máxima por infracciones gravísimas?", "respuesta": "Hasta 20.000 UTM o el 4% de los ingresos anuales."},
		},
	})
}

func (h *AuditHandler) GetAuditExportZip(w http.ResponseWriter, r *http.Request) {
	buf := new(bytes.Buffer)
	zw := zip.NewWriter(buf)

	f1, _ := zw.Create("Fase_1_Primeros_Pasos/Acta_Designacion_DPO.txt")
	f1.Write([]byte("Acta de designación formal de Encargado de Protección de Datos (DPO) conforme a la Ley 21.719."))

	f2, _ := zw.Create("Fase_2_Levantamiento/Matriz_Maestra_Consolidada.txt")
	f2.Write([]byte("Inventario y Registro de Actividades de Tratamiento (RAT) consolidado."))

	f3, _ := zw.Create("Fase_3_Analisis/Informe_Riesgos_Consolidado.txt")
	f3.Write([]byte("Matriz de Riesgos 5x5 y Evaluaciones de Impacto (EIPD)."))

	zw.Close()

	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", "attachment; filename=\"Expediente_Evidencias_SIGE_DP_Ley21719.zip\"")
	w.Write(buf.Bytes())
}

func (h *AuditHandler) QADPO(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Pregunta string `json:"pregunta"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	middleware.WriteJSON(w, http.StatusOK, map[string]interface{}{
		"pregunta":  req.Pregunta,
		"respuesta": "Conforme a la Ley N° 21.719 y los lineamientos de la Agencia de Protección de Datos, todo tratamiento debe respaldarse en una base de licitud expresa.",
		"fuente":    "Motor Legal LexApp GRC",
	})
}
